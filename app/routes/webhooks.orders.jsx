// app/routes/webhooks.orders.jsx
import { authenticate } from "../shopify.server";
import { broadcastToClients } from "./webhook-stream";
import { saveOrder } from "../models/order.server";
import { saveCustomer } from "../models/customer.server";
import shopify from "../shopify.server";

export const action = async ({ request }) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`📦 Received ${topic} webhook for ${shop}`);

  // ✅ Immediately send 200 OK so Shopify doesn't retry or timeout
  setTimeout(() => {
    processWebhook({ shop, session, topic, payload });
  }, 0);

  return new Response("OK", { status: 200 });
};

// Separate function to handle processing & broadcasting
async function processWebhook({ shop, session, topic, payload }) {
  if (!session) {
    console.log("⚠️ No session found for shop:", shop);
    return;
  }

  try {
    let dataToSend = null;

    switch (topic) {
      case "ORDERS_CREATE":
        console.log(`✅ New order created: ${payload.name} (ID: ${payload.id})`);
        dataToSend = transformOrderPayload(payload);
        // Save order to database
        await saveOrderToDatabase(payload, 'CREATE');
        break;
   
      case "ORDERS_EDITED":
        console.log(`🔄 Order edited: ${payload.name} (ID: ${payload.id})`);
        dataToSend = transformOrderPayload(payload);
        // Update order in database
        await saveOrderToDatabase(payload, 'UPDATE');
        break; 

      case "ORDERS_DELETE":
        console.log(`🗑️ Order deleted: ID ${payload.id}`);
        dataToSend = { id: `gid://shopify/Order/${payload.id}` };
        // Note: Delete operations might need special handling
        break;

      case "ORDERS_PAID":
        console.log(`💰 Order paid: ${payload.name} (ID: ${payload.id})`);
        dataToSend = transformOrderPayload(payload);
        // Update order payment status in database
        await saveOrderToDatabase(payload, 'PAID');
        break;

      default:
        console.log(`🤷‍♂️ Unknown order topic: ${topic}`);
        return;
    }

      if (dataToSend?.lineItems?.edges?.length) {
    dataToSend = await hydrateLineItemMetafields(session, dataToSend);
  } 

    // 🔹 Broadcast to all SSE clients
    broadcastToClients({
      type: 'webhook',
      topic,
      payload: dataToSend,
      shop,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Finished processing ${topic} webhook for shop: ${shop}`);
  } catch (error) {
    console.error(`❌ Error processing ${topic} webhook:`, error);
  }




}

// Helper to match Shopify GraphQL style
function transformOrderPayload(payload) {
  return {
    id: `gid://shopify/Order/${payload.id}`,
    name: payload.name,
    processedAt: payload.processed_at || payload.created_at,
    displayFinancialStatus: payload.financial_status?.toUpperCase() || 'PENDING',
    displayFulfillmentStatus: payload.fulfillment_status?.toUpperCase() || 'UNFULFILLED',
    totalPriceSet: {
      shopMoney: {
        amount: payload.total_price,
        currencyCode: payload.currency
      }
    },
    customer: payload.customer ? {
      id: `gid://shopify/Customer/${payload.customer.id}`,
      firstName: payload.customer.first_name,
      lastName: payload.customer.last_name,
      email: payload.customer.email,
      createdAt: payload.customer.created_at
    } : null,
    lineItems: {
      edges: payload.line_items?.map(item => ({
        node: {
          title: item.title,
          quantity: item.quantity,
          originalUnitPriceSet: {
            shopMoney: {
              amount: item.price,
              currencyCode: payload.currency
            }
          },
          variant: item.variant_id ? {
            id: `gid://shopify/ProductVariant/${item.variant_id}`,
            product: {
              id: `gid://shopify/Product/${item.product_id}`
            }
          } : null
        }
      })) || []
    }
  };
}


async function hydrateLineItemMetafields(session, orderLike) {
  const edges = orderLike?.lineItems?.edges || [];
  const productIds = [...new Set(edges.map(e => e?.node?.variant?.product?.id).filter(Boolean))];

  console.log('🟢 hydrateLineItemMetafields: productIds', productIds);
  if (productIds.length === 0) return orderLike;

  const gql = new shopify.api.clients.Graphql({ session });
  const query = `
    query($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          metafield(namespace: "custom", key: "product_type") { value }
          metafield_expiry: metafield(namespace: "custom", key: "expiry_date") { value }
        }
      }
    }
  `;
  const resp = await gql.query({ data: { query, variables: { ids: productIds } } });
  console.log('🟢 Shopify API nodes response:', JSON.stringify(resp.body?.data?.nodes, null, 2));
  const nodes = resp.body?.data?.nodes || [];
  const byId = Object.fromEntries(nodes.map(p => [p.id, p]));
  console.log('🟢 byId mapping:', byId);

  orderLike.lineItems.edges = edges.map(edge => {
    const pid = edge?.node?.variant?.product?.id;
    if (pid && byId[pid]) {
      edge.node.variant.product.metafield = byId[pid].metafield || null;
      edge.node.variant.product.metafield_expiry = byId[pid].metafield_expiry || null;
    }
    return edge;
  });

  return orderLike;
}

// Helper function to save order to database
async function saveOrderToDatabase(payload, action) {
  try {
    const numericId = payload.id.toString();
    
    // Save customer first if exists
    let savedCustomer = null;
    if (payload.customer && payload.customer.id) {
      try {
        const customerData = {
          shopifyId: payload.customer.id.toString(),
          firstName: payload.customer.first_name,
          lastName: payload.customer.last_name,
          email: payload.customer.email,
        };
        savedCustomer = await saveCustomer(customerData);
        console.log(`👤 Customer saved via webhook: ${savedCustomer.email}`);
      } catch (customerError) {
        console.error('❌ Failed to save customer via webhook:', customerError.message);
      }
    }

    // Prepare line items data
    const lineItems = {
      edges: payload.line_items?.map((item) => ({
        node: {
          title: item.title,
          quantity: item.quantity,
          originalUnitPriceSet: {
            shopMoney: {
              amount: item.price,
              currencyCode: payload.currency
            }
          },
          variant: item.variant_id ? {
            id: `gid://shopify/ProductVariant/${item.variant_id}`,
            product: {
              id: `gid://shopify/Product/${item.product_id}`
            }
          } : null
        }
      })) || []
    };

    // Create order data for database
    const orderData = {
      id: numericId,
      shopifyOrderId: numericId,
      customer: payload.customer,
      customerId: savedCustomer?.id || null,
      displayFinancialStatus: payload.financial_status?.toUpperCase() || 'PENDING',
      displayFulfillmentStatus: payload.fulfillment_status?.toUpperCase() || 'UNFULFILLED',
      totalPriceSet: {
        shopMoney: {
          amount: payload.total_price,
          currencyCode: payload.currency
        }
      },
      processedAt: payload.processed_at || payload.created_at,
      lineItems: lineItems
    };

    const savedOrder = await saveOrder(orderData);
    console.log(`💾 Order ${action} saved to database via webhook: ${savedOrder.shopifyOrderId}`);
    
  } catch (error) {
    console.error(`❌ Failed to save order to database via webhook:`, error.message);
  }
}
