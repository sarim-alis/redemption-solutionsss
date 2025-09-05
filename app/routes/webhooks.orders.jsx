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
            
            console.log('🔍 [DEBUG] Line items structure:', JSON.stringify(paidOrder.lineItems, null, 2));
            
            let lineItems = [];
            if (paidOrder.lineItems?.edges) {
              lineItems = paidOrder.lineItems.edges.map(edge => {
                const variantTitle = edge.node.variant_title || edge.node.variant?.title || edge.node.title || 'Standard';
                const baseQuantity = edge.node.quantity || 1;
                
                // Get voucher_count from variant metafield (new approach)
                let voucherCount = 1; // Default fallback
                const voucherCountMetafield = edge.node.variant?.metafield_voucher_count;
                
                if (voucherCountMetafield?.value) {
                  try {
                    const parsed = parseInt(voucherCountMetafield.value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      voucherCount = parsed;
                      console.log(`🎟️ Found voucher_count metafield: ${voucherCount} for variant: ${variantTitle}`);
                    }
                  } catch (e) {
                    console.log('⚠️ Error parsing voucher_count metafield, using fallback');
                  }
                } else {
                  // Fallback: Try to extract from variant title (old method)
                  const packMatch = variantTitle.match(/(\d+)\s*Pack/i);
                  if (packMatch) {
                    voucherCount = parseInt(packMatch[1], 10);
                    console.log(`🔍 Extracted from variant title: ${voucherCount} (${variantTitle})`);
                  }
                }
                
                // Calculate total vouchers needed
                const totalVouchers = baseQuantity * voucherCount;
                console.log(`🧮 Voucher calculation: ${baseQuantity} (qty) × ${voucherCount} (voucher_count) = ${totalVouchers} total vouchers`);
                
                // Get the type from metafield or default to 'voucher'
                let type = 'voucher';
                const metafield = edge.node.variant?.product?.metafield;
                const metafieldValue = metafield?.value;
                
                console.log('🔍 Raw metafield:', JSON.stringify(metafield, null, 2));
                console.log('🔍 Raw metafield value:', metafieldValue);
                
                if (metafieldValue) {
                  try {
                    // First try to parse as JSON (handles both string and array)
                    const parsed = JSON.parse(metafieldValue);
                    console.log('🔍 Parsed metafield value:', parsed);
                    
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      type = parsed[0]; // Take first item if it's an array
                    } else if (typeof parsed === 'string') {
                      type = parsed;
                    }
                  } catch (e) {
                    console.log('⚠️ JSON parse error, using raw value');
                    // If parsing fails, check if it's a simple string
                    if (typeof metafieldValue === 'string') {
                      type = metafieldValue.trim();
                    }
                  }
                }
                
                console.log('🔍 Final type:', type);

                // Check if this is a voucher item
                const isVoucher = type && type.toLowerCase().trim() === 'voucher';
                const isGiftCard = edge.node.title.toLowerCase().includes('gift card');
                
                if (!isVoucher || isGiftCard) {
                  console.log(`⏭️ Skipping item - isVoucher: ${isVoucher}, isGiftCard: ${isGiftCard}, Title: ${edge.node.title}`);
                  return null;
                }
                
                console.log(`📦 Processing voucher item: ${edge.node.title} (Total Vouchers: ${totalVouchers}) - Type: ${type}`);
                
                return {
                  title: edge.node.title,
                  quantity: totalVouchers, // This now contains the final calculated vouchers
                  price: edge.node.originalUnitPriceSet?.shopMoney?.amount || 0,
                  variantTitle: variantTitle,
                  variant: edge.node.variant || {},
                  voucherCount: voucherCount, // Store for reference
                  baseQuantity: baseQuantity, // Store original quantity
                  type: type,
                  productId: edge.node.variant?.product?.id?.replace('gid://shopify/Product/', '') || null,
                  variantId: edge.node.variant?.id?.replace('gid://shopify/ProductVariant/', '') || null
                };
              });
            } else if (paidOrder.lineItems?.length > 0) {
              lineItems = paidOrder.lineItems.map(item => {
                const node = item.node || item;
                const variantTitle = node.variant_title || node.variant?.title || node.title || 'Standard';
                const baseQuantity = node.quantity || 1;
                
                // Get voucher_count from variant metafield (new approach)
                let voucherCount = 1; // Default fallback
                const voucherCountMetafield = node.variant?.metafield_voucher_count;
                
                if (voucherCountMetafield?.value) {
                  try {
                    const parsed = parseInt(voucherCountMetafield.value, 10);
                    if (!isNaN(parsed) && parsed > 0) {
                      voucherCount = parsed;
                      console.log(`🎟️ Found voucher_count metafield: ${voucherCount} for variant: ${variantTitle}`);
                    }
                  } catch (e) {
                    console.log('⚠️ Error parsing voucher_count metafield, using fallback');
                  }
                } else {
                  // Fallback: Try to extract from variant title (old method)
                  const packMatch = variantTitle.match(/(\d+)\s*Pack/i);
                  if (packMatch) {
                    voucherCount = parseInt(packMatch[1], 10);
                    console.log(`🔍 Extracted from variant title: ${voucherCount} (${variantTitle})`);
                  }
                }
                
                // Calculate total vouchers needed
                const totalVouchers = baseQuantity * voucherCount;
                console.log(`🧮 Voucher calculation: ${baseQuantity} (qty) × ${voucherCount} (voucher_count) = ${totalVouchers} total vouchers`);
                
                // Get the type from metafield or default to 'voucher'
                let type = 'voucher';
                const metafield = node.variant?.product?.metafield;
                const metafieldValue = metafield?.value || node.type;
                
                console.log('🔍 Raw metafield:', JSON.stringify(metafield, null, 2));
                console.log('🔍 Raw metafield value:', metafieldValue);
                
                if (metafieldValue) {
                  try {
                    // First try to parse as JSON (handles both string and array)
                    const parsed = JSON.parse(metafieldValue);
                    console.log('🔍 Parsed metafield value:', parsed);
                    
                    if (Array.isArray(parsed) && parsed.length > 0) {
                      type = parsed[0]; // Take first item if it's an array
                    } else if (typeof parsed === 'string') {
                      type = parsed;
                    }
                  } catch (e) {
                    console.log('⚠️ JSON parse error, using raw value');
                    // If parsing fails, check if it's a simple string
                    if (typeof metafieldValue === 'string') {
                      type = metafieldValue.trim();
                    }
                  }
                }
                
                console.log('🔍 Final type:', type);

                // Check if this is a voucher item
                const isVoucher = type && type.toLowerCase().trim() === 'voucher';
                const isGiftCard = (node.title || '').toLowerCase().includes('gift card');
                
                if (!isVoucher || isGiftCard) {
                  console.log(`⏭️ Skipping item - isVoucher: ${isVoucher}, isGiftCard: ${isGiftCard}, Title: ${node.title}`);
                  return null;
                }
                
                console.log(`📦 Processing voucher item: ${node.title} (Total Vouchers: ${totalVouchers}) - Type: ${type}`);
                
                return {
                  title: node.title,
                  quantity: totalVouchers, // This now contains the final calculated vouchers
                  price: node.price || node.originalUnitPriceSet?.shopMoney?.amount || 0,
                  variantTitle: variantTitle,
                  variant: node.variant || {},
                  voucherCount: voucherCount, // Store for reference
                  baseQuantity: baseQuantity, // Store original quantity
                  type: type,
                  productId: node.variant?.product?.id?.replace('gid://shopify/Product/', '') || null,
                  variantId: node.variant?.id?.replace('gid://shopify/ProductVariant/', '') || null
                };
              });
            }
            
            // Filter out any null items (skipped non-voucher items)
            lineItems = lineItems.filter(item => item !== null);
            console.log(`📦 [Webhook] Processing ${lineItems.length} voucher items for creation`);
            console.log('🔍 [DEBUG] Parsed voucher items:', JSON.stringify(lineItems, null, 2));
            
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
          // Voucher already exists, no need to send email again
          console.log(`⏭️ [Webhook] Voucher already exists: ${paidVoucher.code}, email already sent`);
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
  // Extract product IDs and variant IDs for metafield fetching
  const productIds = payload.line_items?.map(item => item.product_id).filter(Boolean) || [];
  const variantIds = payload.line_items?.map(item => item.variant_id).filter(Boolean) || [];
  
  // Fetch metafields if session is available
  let metafieldsMap = {};
  let variantMetafieldsMap = {};
  if (session && productIds.length > 0) {
    metafieldsMap = await fetchProductMetafields(session.shop, session, productIds);
  }
  if (session && variantIds.length > 0) {
    variantMetafieldsMap = await fetchVariantMetafields(session.shop, session, variantIds);
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
            metafield_voucher_count: variantMetafieldsMap[item.variant_id] ? {
              value: variantMetafieldsMap[item.variant_id].voucher_count
            } : null,
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
            expire: metafields.find(m => m.namespace === 'custom' && m.key === 'expiry_date')?.value || null,
            voucher_count: metafields.find(m => m.namespace === 'custom' && m.key === 'voucher_count')?.value || null
          };
        } else {
          console.log(`⚠️ Failed to fetch metafields for product ${productId}: ${response.status}`);
          metafieldsMap[productId] = { type: null, expire: null, voucher_count: null };
        }
      } catch (productError) {
        console.error(`❌ Error fetching metafields for product ${productId}:`, productError.message);
        metafieldsMap[productId] = { type: null, expire: null, voucher_count: null };
      }
    }
    
    console.log(`📋 Fetched metafields for ${Object.keys(metafieldsMap).length} products`);
    console.log('🔍 [DEBUG] Metafields map:', JSON.stringify(metafieldsMap, null, 2));
    return metafieldsMap;
  } catch (error) {
    console.error('❌ Failed to fetch product metafields:', error);
    return {};
  }
}

// Helper function to fetch variant metafields using REST API
async function fetchVariantMetafields(shop, session, variantIds) {
  if (!variantIds || variantIds.length === 0) return {};
  
  try {
    const variantMetafieldsMap = {};
    
    // Fetch metafields for each variant using REST API
    for (const variantId of variantIds) {
      try {
        const url = `https://${shop}/admin/api/2023-10/variants/${variantId}/metafields.json`;
        const response = await fetch(url, {
          headers: {
            'X-Shopify-Access-Token': session.accessToken,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          const metafields = data.metafields || [];
          
          variantMetafieldsMap[variantId] = {
            voucher_count: metafields.find(m => m.namespace === 'custom' && m.key === 'voucher_count')?.value || null
          };
          
          console.log(`🎟️ Variant ${variantId} metafields:`, variantMetafieldsMap[variantId]);
        } else {
          console.log(`⚠️ Failed to fetch variant metafields for ${variantId}: ${response.status}`);
          variantMetafieldsMap[variantId] = { voucher_count: null };
        }
      } catch (variantError) {
        console.error(`❌ Error fetching variant metafields for ${variantId}:`, variantError.message);
        variantMetafieldsMap[variantId] = { voucher_count: null };
      }
    }
    
    console.log(`📋 Fetched variant metafields for ${Object.keys(variantMetafieldsMap).length} variants`);
    console.log('🔍 [DEBUG] Variant metafields map:', JSON.stringify(variantMetafieldsMap, null, 2));
    return variantMetafieldsMap;
  } catch (error) {
    console.error('❌ Failed to fetch variant metafields:', error);
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

    // Extract product IDs and variant IDs for metafield fetching
    const productIds = payload.line_items?.map(item => item.product_id).filter(Boolean) || [];
    const variantIds = payload.line_items?.map(item => item.variant_id).filter(Boolean) || [];
    
    // Fetch metafields if session is available
    let metafieldsMap = {};
    let variantMetafieldsMap = {};
    if (session && productIds.length > 0) {
      metafieldsMap = await fetchProductMetafields(session.shop, session, productIds);
    }
    if (session && variantIds.length > 0) {
      variantMetafieldsMap = await fetchVariantMetafields(session.shop, session, variantIds);
    }

    // Prepare line items data with metafields and variant info
    const lineItems = {
      edges: payload.line_items?.map((item) => {
        // For products without variants, use product title as variant title
        const variantTitle = item.variant_title || item.title || 'Standard';
        console.log(`📦 Processing item: ${item.title} - Variant: ${variantTitle}`);
        
        return {
          node: {
            title: item.title,
            quantity: item.quantity,
            variant_title: variantTitle, // Add variant title explicitly
            originalUnitPriceSet: {
              shopMoney: {
                amount: item.price,
                currencyCode: payload.currency
              }
            },
            variant: item.variant_id ? {
              id: `gid://shopify/ProductVariant/${item.variant_id}`,
              title: variantTitle, // Add variant title to variant object
              metafield_voucher_count: variantMetafieldsMap[item.variant_id] ? {
                value: variantMetafieldsMap[item.variant_id].voucher_count
              } : null,
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
        };
      }) || []
    };
    
    console.log('🔍 Prepared line items with variant info:', JSON.stringify(lineItems, null, 2));

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
          console.log('🔍 [DEBUG] Line items structure:', JSON.stringify(savedOrder.lineItems, null, 2));
          
          let lineItems = [];
          if (savedOrder.lineItems?.edges) {
            lineItems = savedOrder.lineItems.edges.flatMap(edge => {
              // Handle both products with and without variants
              const variantTitle = edge.node.variant_title || edge.node.variant?.title || edge.node.title || 'Standard';
              const variantId = edge.node.variant?.id?.replace('gid://shopify/ProductVariant/', '') || '';
              
              // Extract pack count from variant title (e.g., '3 Pack' -> 3)
              const packMatch = variantTitle.match(/(\d+)\s*Pack/i);
              const packCount = packMatch ? parseInt(packMatch[1], 10) : 1;
              const totalVouchers = packCount * edge.node.quantity;
              
              console.log(`📦 Processing saved item: ${edge.node.title} - Variant: ${variantTitle}`);
              console.log(`🔢 Quantity Calculation: ${packCount} (pack) × ${edge.node.quantity} (qty) = ${totalVouchers} vouchers`);
              
              // Debug log variant information
              console.log('🔍 Variant Info:', {
                variantTitle,
                variantId,
                packCount,
                quantity: edge.node.quantity,
                totalVouchers,
              });
              
              // Manual type assignment based on product title
              let type = edge.node.variant?.product?.metafield?.value || 'voucher';
              if (edge.node.title.toLowerCase().includes('gift card')) {
                type = 'gift';
              }
              
              // Create array of line items with correct quantity
              // Create one voucher entry with total quantity
              return {
                title: edge.node.title,
                quantity: totalVouchers, // Use total calculated vouchers
                type: type,
                price: edge.node.originalUnitPriceSet?.shopMoney?.amount || 0,
                productId: edge.node.variant?.product?.id?.replace('gid://shopify/Product/', '') || '',
                variantId: variantId,
                expire: edge.node.variant?.product?.metafield_expiry?.value || null,
                productType: edge.node.variant?.product?.metafield?.value || 'voucher',
                variantTitle: variantTitle,
                packCount: packCount,
                originalQuantity: edge.node.quantity
              };
            }).flat();
          } else if (savedOrder.lineItems?.length > 0) {
            // Fallback: direct array structure
            lineItems = savedOrder.lineItems.flatMap(item => {
              const title = item.title || item.node?.title || '';
              const variantTitle = item.variant?.title || item.node?.variant?.title || title;
              const quantity = item.quantity || item.node?.quantity || 1;
              
              // Extract pack number from variant title (e.g., '3 Pack' -> 3, '5 Pack' -> 5)
              const packMatch = variantTitle.match(/(\d+)\s*Pack/i);
              const packCount = packMatch ? parseInt(packMatch[1], 10) : 1;
              
              // Calculate total vouchers needed (pack count * quantity)
              const totalVouchers = packCount * quantity;
              
              let type = item.type || item.node?.variant?.product?.metafield?.value || 'voucher';
              if (title.toLowerCase().includes('gift card')) {
                type = 'gift';
              }
              
              // Return single line item with total quantity
              return {
                title: title,
                quantity: totalVouchers, // Total vouchers needed (pack count * quantity)
                type: type,
                price: item.price || item.node?.originalUnitPriceSet?.shopMoney?.amount || 0,
                productId: item.productId || item.node?.variant?.product?.id?.replace('gid://shopify/Product/', '') || '',
                variantId: item.variantId || item.node?.variant?.id?.replace('gid://shopify/ProductVariant/', '') || '',
                expire: item.expire || item.node?.variant?.product?.metafield_expiry?.value || null,
                productType: item.type || item.node?.variant?.product?.metafield?.value || 'voucher',
                variantTitle: variantTitle,
                packCount: packCount,
                originalQuantity: quantity
              };
            }).flat();
          }
          
          console.log(`📦 Processing ${lineItems.length} line items for voucher creation`);
          console.log('🔍 [DEBUG] Parsed line items:', JSON.stringify(lineItems, null, 2));
          
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
