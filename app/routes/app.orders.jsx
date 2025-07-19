// Imports.
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
import { saveOrder } from "../models/order.server";
import prisma from "../db.server";
import { sendEmail } from "../utils/mail.server";
import { hasCustomerOrderedBefore } from "../models/order.server";


// Loader.
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  console.log('🔄 Starting to fetch orders...');

  // Order data.
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
              firstName
              lastName
              email
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
  
  // Save each order to database
  let savedCount = 0;
  let skippedCount = 0;
  
  for (const order of orders) {
    try {
      // Convert Shopify order to our database format
      const numericId = order.id.split('/').pop();
      
      console.log('🔄 Processing order:', {
        orderId: numericId,
        originalId: order.id,
        hasCustomer: !!order.customer,
        customerKeys: Object.keys(order.customer || {}),
        customerEmail: order.customer?.email
      });

      // Prepare line items data with proper structure
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
                id: edge.node.variant?.product?.id
              }
            }
          }
        }))
      };

      // Create order data matching ShopifyOrder interface
      const orderData = {
        id: numericId,
        shopifyOrderId: numericId,
        customer: order.customer,
        displayFinancialStatus: order.displayFinancialStatus,
        displayFulfillmentStatus: order.displayFulfillmentStatus,
        totalPriceSet: order.totalPriceSet,
        processedAt: order.processedAt,
        lineItems: lineItems
      };

      console.log('📦 Prepared order data:', {
        orderId: numericId,
        customerEmail: order.customer?.email,
        status: order.displayFinancialStatus,
        lineItems: lineItems.edges.length
      });

      try {
        console.log('💾 Attempting to save order:', numericId);
        const savedOrder = await saveOrder(orderData);
        console.log('✅ Order saved successfully:', {
          id: savedOrder.id,
          shopifyOrderId: savedOrder.shopifyOrderId,
          status: savedOrder.status
        });

        // Find Voucher by shopifyOrderId.
        const voucher = await prisma.voucher.findFirst({
          where: {
            shopifyOrderId: numericId
          },
        });

      if (order.customer.email && voucher) {
        const isFirstOrder = await hasCustomerOrderedBefore(order.customer.email);

      if (isFirstOrder) {
        try {
          await sendEmail({
           to: order.customer.email,
          subject: `🎟️ Your Voucher Code for Order ${order.name}`,
          text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
          html: `
          <p>Hello <strong>${order.customer.firstName}</strong>,</p>
          <p>Thank you for your order <strong>${order.name}</strong>.</p>
          <p>🎁 Here is your voucher code: <strong style="font-size: 18px;">${voucher.code}</strong></p>
        `,
        });
        console.log('📧 Voucher email sent to first-time customer for order:', order.name);
      } catch (emailErr) {
      console.error('❌ Failed to send voucher email:', emailErr.message);
      console.error('Full email error:', emailErr);
      }
    } else {
    console.log('ℹ️ Customer has ordered before, skipping voucher email:', {
      email: order.customer.email,
      orderId: numericId,
    });
   }
    } else {
    console.log('⚠️ No email or voucher found for customer/order:', {
    orderId: numericId,
    hasCustomerEmail: !!order.customer?.email,
    hasVoucher: !!voucher,
    voucherCode: voucher?.code
  });
  }
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
  
  // Fetch any existing vouchers for these orders
  const orderIdsList = orders.map(o => o.name.split('/').pop() || o.name);
  const { getVouchersByOrderIds } = await import('../models/voucher.server');
  const vouchers = await getVouchersByOrderIds(orderIdsList);
  const voucherMap = vouchers.reduce((map, v) => ({ ...map, [v.shopifyOrderId]: v.code }), {});

  return { orders, hasNextPage, totalOrders, savedCount, skippedCount, voucherMap };
};


// Frontend.
export default function OrdersPage() {
  const { orders, hasNextPage, totalOrders, savedCount, skippedCount, voucherMap } = useLoaderData();

  return (
    <SidebarLayout>
      <Page fullWidth title={`Orders (${totalOrders} showing${hasNextPage ? ', more available' : ''})`}>
        <BlockStack gap="400">
          <Text variant="bodyMd" tone="success" alignment="center">
            🔄 Orders are automatically saved to database via webhooks and when viewing this page
          </Text>
          {savedCount !== undefined && savedCount > 0 && (
            <Text variant="bodyMd" tone="success" alignment="center">
              💾 Just saved {savedCount} orders to database{skippedCount > 0 ? `, skipped ${skippedCount} existing` : ''}
            </Text>
          )}
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
