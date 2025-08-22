// app/routes/webhooks.orders.jsx
import { authenticate } from "../shopify.server";
import { broadcastToClients } from "./webhook-stream";
import { saveOrder } from "../models/order.server";
import { sendVoucherEmailIfFirstOrder } from "../utils/sendVoucherEmailIfFirstOrder";
import { saveCustomer } from "../models/customer.server";

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
        const { order: savedOrder, voucher } = await saveOrderToDatabase(payload, 'CREATE');
        // Send voucher email in background, only if order and voucher were saved
        if (savedOrder && voucher) {
          sendVoucherEmailIfFirstOrder(savedOrder, voucher).catch((err) => {
            console.error('❌ Error sending voucher email from webhook:', err);
          });
        }
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

    const { order: savedOrder, voucher } = await saveOrder(orderData);
    if (savedOrder) {
      console.log(`💾 Order ${action} saved to database via webhook: ${savedOrder.shopifyOrderId}`);
    }
    return { order: savedOrder, voucher };
  } catch (error) {
    console.error(`❌ Failed to save order to database via webhook:`, error.message);
    return null;
  }
}
