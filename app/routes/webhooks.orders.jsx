// app/routes/webhooks.orders.jsx
import { authenticate } from "../shopify.server";
import { broadcastToClients } from "./webhook-stream";

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
  // Import server-only modules inside the function
  const { saveOrder } = await import("../models/order.server");
  const { sendVoucherEmailIfFirstOrder, sendUnifiedVoucherEmail } = await import("../utils/sendVoucherEmailIfFirstOrder");
  const { saveCustomer } = await import("../models/customer.server");
  const { createVoucher, createVouchersForOrder } = await import("../models/voucher.server");
  if (!session) {
    console.log("⚠️ No session found for shop:", shop);
    return;
  }

  try {
    let dataToSend = null;

    switch (topic) {
      case "ORDERS_CREATE":
        console.log(`✅ New order created: ${payload.name} (ID: ${payload.id})`);
        dataToSend = await transformOrderPayload(payload, session);
        // Save order to database but DON'T create voucher or send email yet
        const { order: savedOrder } = await saveOrderToDatabase(payload, 'CREATE', session);
        console.log(`📦 Order saved for future payment processing: ${savedOrder?.shopifyOrderId}`);
        break;
   
      case "ORDERS_EDITED":
        console.log(`🔄 Order edited: ${payload.name} (ID: ${payload.id})`);
        dataToSend = await transformOrderPayload(payload, session);
        // Update order in database
        await saveOrderToDatabase(payload, 'UPDATE', session);
        break; 

      case "ORDERS_DELETE":
        console.log(`🗑️ Order deleted: ID ${payload.id}`);
        dataToSend = { id: `gid://shopify/Order/${payload.id}` };
        // Note: Delete operations might need special handling
        break;

      case "ORDERS_PAID":
        console.log(`💰 Order paid: ${payload.name} (ID: ${payload.id})`);
        dataToSend = await transformOrderPayload(payload, session);
        // Update order payment status in database and create voucher if not exists
        const { order: paidOrder, voucher: paidVoucher } = await saveOrderToDatabase(payload, 'PAID', session);
        
        // If order was paid but no voucher exists, create multiple vouchers (one per product) and send unified email
        if (paidOrder && !paidVoucher) {
          try {
            console.log('🎟️ [Webhook] Creating multiple vouchers for paid order:', paidOrder.shopifyOrderId);
            
            // Parse line items from the order and extract type from metafields
            const lineItems = paidOrder.lineItems?.edges?.map(edge => ({
              title: edge.node.title,
              quantity: edge.node.quantity,
              type: edge.node.variant?.product?.metafield?.value || 'voucher' // Extract type from metafield
            })) || [];
            console.log(`📦 [Webhook] Processing ${lineItems.length} line items for voucher creation`);
            
            // Create vouchers for each product
            const newVouchers = await createVouchersForOrder({
              shopifyOrderId: paidOrder.shopifyOrderId,
              customerEmail: paidOrder.customerEmail || '',
              lineItems: lineItems
            });
            
            console.log(`✅ [Webhook] Created ${newVouchers.length} vouchers for paid order`);
            
            // Send unified email for all vouchers
            console.log(`📧 [Webhook] Sending unified email for ${newVouchers.length} vouchers`);
            sendUnifiedVoucherEmail(paidOrder, newVouchers)
              .then((result) => {
                if (result.success) {
                  console.log(`✅ [Webhook] Unified email sent successfully for ${newVouchers.length} vouchers`);
                } else {
                  console.error(`❌ [Webhook] Unified email failed: ${result.message}`);
                }
              })
              .catch((err) => {
                console.error(`❌ [Webhook] Error sending unified email:`, err);
              });
          } catch (voucherError) {
            console.error('❌ [Webhook] Failed to create vouchers for paid order:', voucherError);
          }
        } else if (paidOrder && paidVoucher) {
          // Voucher already exists, send email if not sent before
          if (!paidVoucher.emailSent) {
            console.log(`📧 [Webhook] Sending voucher email for existing voucher: ${paidVoucher.code}`);
            sendVoucherEmailIfFirstOrder(paidOrder, paidVoucher)
              .then((result) => {
                if (result.success) {
                  console.log(`✅ [Webhook] Email sent successfully for existing voucher: ${result.voucherCode}`);
                } else {
                  console.error(`❌ [Webhook] Email failed for existing voucher: ${result.voucherCode}: ${result.message}`);
                }
              })
              .catch((err) => {
                console.error('❌ [Webhook] Error sending voucher email for existing voucher:', err);
              });
          } else {
            console.log(`⏭️ [Webhook] Email already sent for voucher: ${paidVoucher.code}`);
          }
        }
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
async function transformOrderPayload(payload, session = null) {
  // Extract product IDs for metafield fetching
  const productIds = payload.line_items?.map(item => item.product_id).filter(Boolean) || [];
  
  // Fetch metafields if session is available and we have product IDs
  let metafieldsMap = {};
  if (session && productIds.length > 0) {
    metafieldsMap = await fetchProductMetafields(session.shop, session, productIds);
  }

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
              id: `gid://shopify/Product/${item.product_id}`,
              metafield: metafieldsMap[item.product_id] ? {
                value: metafieldsMap[item.product_id].type
              } : null,
              metafield_expiry: metafieldsMap[item.product_id] ? {
                value: metafieldsMap[item.product_id].expire
              } : null
            }
          } : null
        }
      })) || []
    }
  };
}

// Helper function to fetch product metafields using REST API
async function fetchProductMetafields(shop, session, productIds) {
  if (!productIds || productIds.length === 0) return {};
  
  try {
    const metafieldsMap = {};
    
    // Fetch metafields for each product using REST API
    for (const productId of productIds) {
      try {
        const url = `https://${shop}/admin/api/2023-10/products/${productId}/metafields.json`;
        const response = await fetch(url, {
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const metafields = data.metafields || [];
          
          metafieldsMap[productId] = {
            type: metafields.find(m => m.namespace === 'custom' && m.key === 'product_type')?.value || null,
            expire: metafields.find(m => m.namespace === 'custom' && m.key === 'expiry_date')?.value || null
          };
        } else {
          console.log(`⚠️ Failed to fetch metafields for product ${productId}: ${response.status}`);
          metafieldsMap[productId] = { type: null, expire: null };
        }
      } catch (productError) {
        console.error(`❌ Error fetching metafields for product ${productId}:`, productError.message);
        metafieldsMap[productId] = { type: null, expire: null };
      }
    }
    
    console.log(`📋 Fetched metafields for ${Object.keys(metafieldsMap).length} products`);
    return metafieldsMap;
  } catch (error) {
    console.error('❌ Failed to fetch product metafields:', error);
    return {};
  }
}

// Helper function to save order to database
async function saveOrderToDatabase(payload, action, session = null) {
  // Import server-only modules inside the function
  const { saveOrder } = await import("../models/order.server");
  const { saveCustomer } = await import("../models/customer.server");
  const { createVouchersForOrder } = await import("../models/voucher.server");
  const { sendUnifiedVoucherEmail } = await import("../utils/sendVoucherEmailIfFirstOrder");
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

    // Extract product IDs for metafield fetching
    const productIds = payload.line_items?.map(item => item.product_id).filter(Boolean) || [];
    
    // Fetch metafields if session is available and we have product IDs
    let metafieldsMap = {};
    if (session && productIds.length > 0) {
      metafieldsMap = await fetchProductMetafields(session.shop, session, productIds);
    }

    // Prepare line items data with metafields
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
              id: `gid://shopify/Product/${item.product_id}`,
              metafield: metafieldsMap[item.product_id] ? {
                value: metafieldsMap[item.product_id].type
              } : null,
              metafield_expiry: metafieldsMap[item.product_id] ? {
                value: metafieldsMap[item.product_id].expire
              } : null
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
      
      // For PAID action, if no voucher exists, create multiple vouchers
      if (action === 'PAID' && !voucher) {
        try {
          console.log('🎟️ Creating multiple vouchers for paid order via saveOrderToDatabase:', savedOrder.shopifyOrderId);
          
          // Parse line items from the order and extract type from metafields
          const lineItems = savedOrder.lineItems?.edges?.map(edge => ({
            title: edge.node.title,
            quantity: edge.node.quantity,
            type: edge.node.variant?.product?.metafield?.value || 'voucher' // Extract type from metafield
          })) || [];
          console.log(`📦 Processing ${lineItems.length} line items for voucher creation`);
          
          // Create vouchers for each product
          const newVouchers = await createVouchersForOrder({
            shopifyOrderId: savedOrder.shopifyOrderId,
            customerEmail: savedOrder.customerEmail || '',
            lineItems: lineItems
          });
          
          console.log(`✅ Created ${newVouchers.length} vouchers for paid order`);
          
          // Send unified email for all vouchers
          console.log(`📧 Sending unified email for ${newVouchers.length} vouchers`);
          sendUnifiedVoucherEmail(savedOrder, newVouchers)
            .then((result) => {
              if (result.success) {
                console.log(`✅ Unified email sent successfully for ${newVouchers.length} vouchers`);
              } else {
                console.error(`❌ Unified email failed: ${result.message}`);
              }
            })
            .catch((err) => {
              console.error(`❌ Error sending unified email:`, err);
            });
          
          return { order: savedOrder, voucher: newVouchers[0] }; // Return first voucher for backward compatibility
        } catch (voucherError) {
          console.error('❌ Failed to create vouchers for paid order:', voucherError);
        }
      }
      
      // For CREATE action, return order without voucher
      if (action === 'CREATE') {
        return { order: savedOrder, voucher: null };
      }
    }
    return { order: savedOrder, voucher };
  } catch (error) {
    console.error(`❌ Failed to save order to database via webhook:`, error.message);
    return { order: null, voucher: null };
  }
}
