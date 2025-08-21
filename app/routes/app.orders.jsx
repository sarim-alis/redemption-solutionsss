import React, { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
// import { sendEmail } from "../utils/mail.server";
// import { hasCustomerOrderedBefore } from "../models/order.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  console.log('🔄 Starting to fetch orders...');
  const orderResponse = await admin.graphql(`
    query {
      orders(first: 250, reverse: true) {
        edges {
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
            lineItems(first: 10) {
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
          endCursor
        }
      }
    }
  `);
  const orderJson = await orderResponse.json();
  const orders = orderJson.data.orders.edges.map((edge) => edge.node);
  const hasNextPage = orderJson.data.orders.pageInfo.hasNextPage;
  const totalOrders = orders.length;
  
  // Ab sirf orders fetch kar rahe hain, save karna webhook pe hota hai
  const orderIdsList = orders.map(o => o.name.split('/').pop() || o.name);
  const { getVouchersByOrderIds } = await import('../models/voucher.server');
  const vouchers = await getVouchersByOrderIds(orderIdsList);
  const voucherMap = vouchers.reduce((map, v) => ({ ...map, [v.shopifyOrderId]: v.code }), {});

  return {
    orders,
    hasNextPage,
    totalOrders,
    voucherMap
  };
};

export default function OrdersPage() {
  const {
    orders: initialOrders,
    hasNextPage,
    totalOrders,
    voucherMap
  } = useLoaderData();
  const [orders, setOrders] = useState(initialOrders);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  // SSE connection for real-time updates
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
                // Transform webhook payload to match GraphQL structure
                const updatedOrder = transformWebhookToOrder(data.payload);
                
                // Update existing order or add new one
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

  // Transform webhook payload to match orders GraphQL structure
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
  
          {/* Loader ab save nahi karta, isliye yeh messages hata diye */}
          {hasNextPage && (
            <Text variant="bodyMd" tone="subdued" alignment="center">
              Showing first 250 orders. Total orders may be more.
            </Text>
          )}
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
                 <Text variant="bodyMd">{order.totalPriceSet.shopMoney.amount} {order.totalPriceSet.shopMoney.currencyCode}</Text>,
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
        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}
