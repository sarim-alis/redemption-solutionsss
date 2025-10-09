// Imports.
import React, { useState, useEffect } from "react";
import { useLoaderData, useNavigation, useNavigate } from "@remix-run/react";
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
  console.log("🔄 Starting to fetch orders (paginated)...");

  const url = new URL(request.url);
  const perPage = Number(url.searchParams.get("perPage") || "25");
  const cursor = url.searchParams.get("cursor");
  const direction = url.searchParams.get("direction") || "next"; // next or prev

  let args = `first: ${perPage}, reverse: true`;
  if (cursor && direction !== "prev") {
    args = `first: ${perPage}, after: "${cursor}", reverse: true`;
  } else if (cursor && direction === "prev") {
    args = `last: ${perPage}, before: "${cursor}", reverse: true`;
  }

  const query = `
    query {
      orders(${args}) {
        edges {
          node {
            id
            name
            processedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney { amount currencyCode }
            }
            customer { id firstName lastName email createdAt }
            lineItems(first: 250) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet { shopMoney { amount currencyCode } }
                  variant {
                    id
                    product {
                      id
                      title
                      metafield(namespace: "custom", key: "product_type") { value }
                      metafield_expiry: metafield(namespace: "custom", key: "expiry_date") { value }
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
          startCursor
          endCursor
        }
      }
    }
  `;

  const orderResponse = await admin.graphql(query);
  const orderJson = await orderResponse.json();
  const orders = orderJson.data.orders.edges.map((edge) => edge.node);
  const pageInfo = orderJson.data.orders.pageInfo || {};
  const totalOrders = orders.length;

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
          where: { shopifyOrderId: numericId }
        });

        savedCount++;
      } catch (error) {
        console.error('❌ Failed to save order:', { orderId: numericId, error: error.message });
        skippedCount++;
      }
    } catch (error) {
      console.error('❌ Error processing order:', { name: order.name, id: order.id, error: error.message });
      skippedCount++;
    }
  }

  console.log(`💾 Orders saved: ${savedCount}, skipped: ${skippedCount}`);
  console.log(`👤 Customers saved: ${customersSaved}, skipped: ${customersSkipped}`);

  const orderIdsList = orders.map(o => o.name.split('/').pop() || o.name);
  const { getVouchersByOrderIds } = await import('../models/voucher.server');
  const vouchers = await getVouchersByOrderIds(orderIdsList);
  const voucherMap = vouchers.reduce((map, v) => ({ ...map, [v.shopifyOrderId]: v.code }), {});

  return {
    orders,
    pageInfo,
    perPage,
    totalOrders,
    voucherMap
  };
};

export default function OrdersPage() {
  const {
    orders: initialOrders,
    pageInfo,
    perPage,
    totalOrders,
    voucherMap
  } = useLoaderData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [orders, setOrders] = useState(initialOrders);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);
  const isLoading = navigation.state !== 'idle';

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
      <Page fullWidth title={`Orders (${totalOrders} showing${hasNextPage ? ', more available' : ''})`}>
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
  
          
          {/* Pagination controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                disabled={isLoading || !pageInfo?.hasPreviousPage}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('cursor', pageInfo.startCursor);
                  url.searchParams.set('direction', 'prev');
                  url.searchParams.set('perPage', String(perPage));
                  navigate(url.pathname + url.search);
                }}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
              >
                Prev
              </button>

              <div style={{ color: '#374151' }}>
                Showing {initialOrders.length} orders
              </div>

              <button
                disabled={isLoading || !pageInfo?.hasNextPage}
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('cursor', pageInfo.endCursor);
                  url.searchParams.set('direction', 'next');
                  url.searchParams.set('perPage', String(perPage));
                  navigate(url.pathname + url.search);
                }}
                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}
              >
                Next
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ color: '#6b7280' }}>Per page</label>
              <select
                disabled={isLoading}
                value={perPage}
                onChange={(e) => {
                  const url = new URL(window.location.href);
                  url.searchParams.set('perPage', String(e.target.value));
                  url.searchParams.delete('cursor');
                  url.searchParams.delete('direction');
                  navigate(url.pathname + url.search);
                }}
                style={{ padding: '6px', borderRadius: 6 }}
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          {orders.length > 0 ? (
            <DataTable
              columnContentTypes={[
                "text","text","text","text","numeric","text","text","text","text","text"
              ]}
              headings={[
                "Order ID","Customer","Email","Date","Price","Items","Payment Status"
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
              ];
              })}
            />
          ) : (
            <Text variant="bodyMd" as="p">
              No orders found.
            </Text>
          )}
        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}