// Imports.
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
import { saveOrder } from "../models/order.server";
import prisma from "../db.server";
import { sendEmail } from "../utils/mail.server";
import { hasCustomerOrderedBefore } from "../models/order.server";
// import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplate";


// Format date.
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Add months to date.
function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

// Format customer name.
function formatCustomerName(email) {
  if (!email) return "Customer";
  const namePart = email.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

// Template
function generateVoucherEmailHTML(voucher) {
  const validThrough = voucher?.createdAt
    ? formatDate(addMonths(voucher.createdAt, 3))
    : "N/A";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "N/A";
  const name = formatCustomerName(voucher.customerEmail);

  return `
    <div style="max-width:600px;margin:20px auto;font-family:Arial,sans-serif;margin-bottom:40px;">
      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:left;margin-bottom:20px;">
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Hey ${name},</p>
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Thank you for your purchase of the Oil Change Vouchers/ Gift Cards. Use the Vouchers below to redeem at participating locations. See below for terms and details.</p>
      </div>

      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:center;margin-bottom:20px;">
        <h1 style="font-size:28px;font-weight:bold;color:#2d3748;margin-bottom:16px;letter-spacing:0.5px;">Jiffy Lube Oil Change Voucher</h1>
        <p style="font-size:16px;color:#718096;margin-bottom:40px;line-height:1.5;">
          Present this at participating locations<br />to redeem.
        </p>
        <div style="width: 100%; display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Valid through:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">${validThrough}</span>
        </div>
        <div style="width: 100%; display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Issued on:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">${issuedOn}</span>
        </div>
        <div style="width: 100%; display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Used on:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">---</span>
        </div>
        <div style="width: 100%; border:3px solid #2d3748;border-radius:8px;padding:20px;margin:30px 0;background:#edf2f7;display:flex;justify-content:space-around;">
          <div style="font-size:24px;color:#2d3748;font-weight:600;margin-bottom:8px;">Voucher Code</div>
          <div style="font-size:24px;font-weight:bold;color:#2d3748;letter-spacing:2px;">${voucher.code}</div>
        </div>
        <div style="font-size:14px;color:#4299e1;line-height:1.4;text-align:left;margin-top:20px;">
          * Must be used at participating locations<br />
          ** Term 2<br />
          *** Term 3
        </div>
      </div>

      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:left;margin-bottom:20px;">
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Terms and Conditions</p>
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Details of Terms. Locations available to redeem. How to redeem.</p>
      </div>

      <div style="padding:40px;border-radius:8px;max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#fff;border:2px solid black;border-radius:10px;padding:24px;display:flex;flex-direction:column;gap:32px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <img src="/logo.svg" alt="Logo" style="width:40px;height:40px;" />
            <span style="font-weight:500;color:#2d3748;font-size:16px;">${voucher.code}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:18px;color:#2d3748;font-weight:500;">Balance:</span>
            <span style="font-size:28px;color:#2d3748;font-weight:700;">$50.00</span>
          </div>
        </div>
      </div>
    </div>
  `;
}


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
                      metafield(namespace: "custom", key: "product_type") {
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
                id: edge.node.variant?.product?.id,
                metafield: { value: edge.node.variant?.product?.metafield?.value ?? null }
              }
            },
            type: edge.node.variant?.product?.metafield?.value ?? null
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

      let savedOrder;
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

      if (isFirstOrder && !voucher.emailSent) {
        try {
          await sendEmail({
           to: order.customer.email,
           subject: `Here are your Oil Change Vouchers! Where to Redeem... 🎟️`,
           text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
           html: generateVoucherEmailHTML(voucher),
        });


        if (!voucher.emailSent) {
        // Send email logic
    await prisma.voucher.update({
      where: { code: voucher.code },
      data: { emailSent: true },
    });
        }
      } catch (emailErr) {
      console.error('❌ Failed to send voucher email:', emailErr.message);
      console.error('Full email error:', emailErr);
      }
    }
    }
        savedCount++;
      } catch (error) {
        console.error('❌ Failed to save order:', {
          orderId: numericId,
          error: error.message
        });
        skippedCount++;
        continue;
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
export default function EmailsPage() {
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