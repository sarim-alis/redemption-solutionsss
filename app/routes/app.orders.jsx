// Imports.
import React, { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
import { saveOrder } from "../models/order.server";
import prisma from "../db.server";
import { saveCustomer } from "../models/customer.server";
// import { sendEmail } from "../utils/mail.server";
// import { hasCustomerOrderedBefore } from "../models/order.server";


// Frontend.
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  console.log('🔄 Starting to fetch orders...');
  const url = new URL(request.url);
  const cursor = url.searchParams.get('cursor') || null;
  const direction = url.searchParams.get('direction') || 'next';
  const query = `
    query ($cursor: String) {
      orders(first: 250, after: $cursor, reverse: true) {
        edges {
          cursor
          node {
            id
            name
            processedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              id
              firstName
              lastName
              email
              createdAt
            }
            lineItems(first: 250) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  variant {
                    id
                    product {
                      id
                      title
                      metafield(namespace: "custom", key: "product_type") {
                        value
                      }
                      metafield_expiry: metafield(namespace: "custom", key: "expiry_date") {
                        value
                      }
                    }
                  }
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          hasPreviousPage
          endCursor
          startCursor
        }
      }
    }
  `;
  const variables = cursor ? { cursor } : {};
  let orderJson;
  try {
    const orderResponse = await admin.graphql(query, variables);
    orderJson = await orderResponse.json();
  } catch (err) {
    console.error('❌ Shopify GraphQL network error:', err);
    throw new Response('Shopify GraphQL network error', { status: 500 });
  }
  if (orderJson.errors || orderJson.errors?.length) {
    console.error('❌ Shopify GraphQL errors:', orderJson.errors);
    throw new Response('Shopify GraphQL error', { status: 500 });
  }
  if (orderJson.data?.orders == null) {
    console.error('❌ Shopify GraphQL missing orders:', orderJson);
    throw new Response('Shopify GraphQL missing orders', { status: 500 });
  }
  if (orderJson.data.orders.edges == null) {
    console.error('❌ Shopify GraphQL missing order edges:', orderJson);
    throw new Response('Shopify GraphQL missing order edges', { status: 500 });
  }
  const orders = orderJson.data.orders.edges.map((edge) => ({ ...edge.node, _cursor: edge.cursor }));
  const pageInfo = orderJson.data.orders.pageInfo;
  // Get total count from Shopify (separate query)
  let totalOrders = 0;
  try {
    const countQuery = `query { ordersCount { count } }`;
    const countRes = await admin.graphql(countQuery);
    const countJson = await countRes.json();
    totalOrders = countJson.data.ordersCount?.count ?? 0;
  } catch (err) {
    console.error('❌ Shopify ordersCount error:', err);
    totalOrders = 0;
  }
  
  // Save order to database.
  let savedCount = 0;
  let skippedCount = 0;
  let customersSaved = 0;
  let customersSkipped = 0;
  
  for (const order of orders) {
    try {
      const numericId = order.id.split('/').pop();
      
      // Save customer.
      let savedCustomer = null;
      if (order.customer && order.customer.id) {
        try {
          const customerShopifyId = order.customer.id.split('/').pop();

          // Prepare customer data.
          const customerData = {
            shopifyId: customerShopifyId,
            firstName: order.customer.firstName,
            lastName: order.customer.lastName,
            email: order.customer.email,
          };

          savedCustomer = await saveCustomer(customerData);
          customersSaved++;
        } catch (customerError) {
          console.error('❌ Failed to save customer:', {
            customerId: order.customer.id,
            email: order.customer.email,
            error: customerError.message
          });
          customersSkipped++;
        }
      } else {
        console.log('⚠️ Order has no customer data:', numericId);
      }

      // Line items data.
      const lineItems = {
        edges: order.lineItems.edges.map((edge) => ({
          node: {
            title: edge.node.title,
            quantity: edge.node.quantity,
            originalUnitPriceSet: {
              shopMoney: {
                amount: edge.node.originalUnitPriceSet.shopMoney.amount,
                currencyCode: edge.node.originalUnitPriceSet.shopMoney.currencyCode
              }
            },
            variant: {
              id: edge.node.variant?.id,
              product: {
                id: edge.node.variant?.product?.id,
                metafield: {value: edge.node.variant?.product?.metafield?.value ?? null},
                metafield_expiry: { value: edge.node.variant?.product?.metafield_expiry?.value ?? null },
              }
            }
          }
        }))
      };

      // Order data.
      const orderData = {
        id: numericId,
        shopifyOrderId: numericId,
        customer: order.customer,
        customerId: savedCustomer?.id || null,
        displayFinancialStatus: order.displayFinancialStatus,
        displayFulfillmentStatus: order.displayFulfillmentStatus,
        totalPriceSet: order.totalPriceSet,
        processedAt: order.processedAt,
        lineItems: lineItems
      };

      try {
        console.log('💾 Attempting to save order:', numericId);
        const savedOrder = await saveOrder(orderData);

        const voucher = await prisma.voucher.findFirst({
          where: {
            shopifyOrderId: numericId,
          },
        });

        savedCount++;
      } catch (error) {
        console.error('❌ Failed to save order:', {
          orderId: numericId,
          error: error.message
        });
        skippedCount++;
      }
    } catch (error) {
      console.error('❌ Error processing order:', {
        name: order.name,
        id: order.id,
        error: error.message
      });
      skippedCount++;
    }
  }
  
  console.log(`💾 Orders saved: ${savedCount}, skipped: ${skippedCount}`);
  console.log(`👤 Customers saved: ${customersSaved}, skipped: ${customersSkipped}`);
  
  // Fetch any existing vouchers for these orders.
  // Ab sirf orders fetch kar rahe hain, save karna webhook pe hota hai
  const orderIdsList = orders.map(o => o.name.split('/').pop() || o.name);
  const { getVouchersByOrderIds } = await import('../models/voucher.server');
  const vouchers = await getVouchersByOrderIds(orderIdsList);
  const voucherMap = vouchers.reduce((map, v) => ({ ...map, [v.shopifyOrderId]: v.code }), {});

  return {
    orders,
    hasNextPage: pageInfo.hasNextPage,
    hasPreviousPage: pageInfo.hasPreviousPage,
    endCursor: pageInfo.endCursor,
    startCursor: pageInfo.startCursor,
    totalOrders,
    voucherMap
  };
};

export default function OrdersPage() {
  const {
    orders,
    hasNextPage,
    hasPreviousPage,
    endCursor,
    startCursor,
    totalOrders,
    voucherMap
  } = useLoaderData();
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  // SSE connection for real-time updates.
  useEffect(() => {
    const eventSource = new EventSource('/webhook-stream');
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('✅ Real-time connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'webhook' && data.topic?.startsWith('ORDERS_')) {
          console.log('🔄 Received order webhook:', data.topic);
          setLastUpdate(new Date());
          
          setOrders(currentOrders => {
            switch (data.topic) {
              case 'ORDERS_CREATE':
              case 'ORDERS_EDITED':
              case 'ORDERS_PAID':
                // Transform webhook payload to match GraphQL structure.
                const updatedOrder = transformWebhookToOrder(data.payload);
                
                // Update existing order or add new one.
                const existingIndex = currentOrders.findIndex(o => o.id === updatedOrder.id);
                if (existingIndex >= 0) {
                  const updated = [...currentOrders];
                  updated[existingIndex] = updatedOrder;
                  return updated;
                } else {
                  return [updatedOrder, ...currentOrders];
                }
                
              case 'ORDERS_DELETE':
                return currentOrders.filter(o => o.id !== data.payload.id);
                
              default:
                return currentOrders;
            }
          });
        }
      } catch (error) {
        console.error('❌ Error processing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      setConnectionStatus('disconnected');
      console.error('❌ SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Transform webhook payload to match orders GraphQL structure.
  const transformWebhookToOrder = (webhookPayload) => {
    return {
      id: webhookPayload.id,
      name: webhookPayload.name,
      processedAt: webhookPayload.processedAt,
      displayFinancialStatus: webhookPayload.displayFinancialStatus,
      displayFulfillmentStatus: webhookPayload.displayFulfillmentStatus,
      totalPriceSet: webhookPayload.totalPriceSet,
      customer: webhookPayload.customer,
      lineItems: webhookPayload.lineItems
    };
  };

  return (
    <SidebarLayout>
      <Page fullWidth title={`Orders (${totalOrders} total)`}>
        <BlockStack gap="400">
          {/* Connection Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444' 
              }}></div>
              <Text variant="bodyMd" as="span" tone={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'critical'}>
                Real-time: {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </Text>
            </div>
            {lastUpdate && (
              <Text variant="bodySm" as="span" tone="subdued">
                Last update: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </div>

          {orders.length > 0 ? (
            <DataTable
              columnContentTypes={[
                "text","text","text","text","numeric","text","text","text","text","text"
              ]}
              headings={[
                "Order ID","Customer","Email","Date","Price","Items","Payment Status","Fulfillment Status","Voucher","Download"
              ]}
              rows={orders.map((order) => {
                const id = order.name;
                const shopId = id.split('/').pop();
                const code = voucherMap[shopId] || '—';
                return [
                 <Text variant="bodyMd" fontWeight="bold" tone="success">{order.name}</Text>,
                 <Text variant="bodyMd" tone="emphasis">{`${order.customer?.firstName || "Guest"} ${order.customer?.lastName || ""}`}</Text>,
                 <Text variant="bodyMd" tone="subdued">{order.customer?.email || '—'}</Text>,
                 <Text variant="bodyMd">{new Date(order.processedAt).toLocaleString()}</Text>,
                 <Text variant="bodyMd">{
                   order.totalPriceSet.shopMoney.currencyCode === 'USD'
                     ? Number(order.totalPriceSet.shopMoney.amount).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
                     : `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`
                 }</Text>,
                 <Text variant="bodyMd">{order.lineItems.edges.length}</Text>,
                 <Badge status={order.displayFinancialStatus === 'PAID' ? 'success' : 'attention'}>{order.displayFinancialStatus}</Badge>,
                 <Badge>{order.displayFulfillmentStatus}</Badge>,
                <Text variant="bodyMd">{code}</Text>,
                code !== '—'
                  ? <Button url={`/vouchers/${shopId}/download`} external>Download PDF</Button>
                  : <Text variant="bodyMd" as="span" tone="subdued">N/A</Text>
              ];
              })}
            />
          ) : (
            <Text variant="bodyMd" as="p">
              No orders found.
            </Text>
          )}

          {/* Cursor-based Pagination Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24, gap: 8 }}>
            <Button disabled={!hasPreviousPage} onClick={() => {
              const params = new URLSearchParams();
              if (startCursor) params.set('cursor', startCursor);
              params.set('direction', 'prev');
              window.location.href = `/app/orders?${params.toString()}`;
            }}>Previous</Button>
            <Text variant="bodyMd" as="span" tone="subdued">
              Showing {orders.length} of {totalOrders} orders
            </Text>
            <Button disabled={!hasNextPage} onClick={() => {
              const params = new URLSearchParams();
              if (endCursor) params.set('cursor', endCursor);
              params.set('direction', 'next');
              window.location.href = `/app/orders?${params.toString()}`;
            }}>Next</Button>
          </div>
        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}
