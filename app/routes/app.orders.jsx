import React, { useState } from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
import { saveOrder } from "../models/order.server";
import prisma from "../db.server";
import { sendEmail } from "../utils/mail.server";
// import { hasCustomerOrderedBefore } from "../models/order.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  
  // ✅ TEST EMAIL FIRST - This will run when the page loads
  console.log('🧪 Testing email functionality...');
  try {
    await sendEmail({
      to: "sarimslayerali786@gmail.com",
      subject: "🧪 Nodemailer Test - " + new Date().toLocaleString(),
      text: "This is a test email to check if nodemailer is working properly. If you receive this, the email configuration is correct!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4CAF50;">✅ Nodemailer Test Successful!</h2>
          <p>This is a test email sent at: <strong>${new Date().toLocaleString()}</strong></p>
          <p>If you received this email, your nodemailer configuration is working correctly.</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>Test Details:</h3>
            <ul>
              <li>✅ SMTP connection established</li>
              <li>✅ Email sent successfully</li>
              <li>✅ HTML formatting working</li>
            </ul>
          </div>
          <p style="color: #666;">This email was sent from your Shopify orders page loader.</p>
        </div>
      `,
    });
    console.log('✅ Test email sent successfully to sarimslayerali786@gmail.com');
  } catch (emailError) {
    console.error('❌ Test email failed:', emailError.message);
    console.error('Full error:', emailError);
  }
  
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

        // ✅ Find Voucher by shopifyOrderId - Fixed to use numericId
        const voucher = await prisma.voucher.findFirst({
          where: {
            shopifyOrderId: numericId, // Use numericId instead of full GraphQL ID
          },
        });

        // ✅ Send Email (keeping your original logic but with better error handling)
        // if (order.customer.email && voucher) {
        //   try {
        //     await sendEmail({
        //       // to: "sarimslayerali786@gmail.com",
        //       to: order.customer.email,
        //       subject: `🎟️ Your Voucher Code for Order ${order.name}`,
        //       text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
        //       html: `
        //         <p>Hello <strong>${order.customer.firstName}</strong>,</p>
        //         <p>Thank you for your order <strong>${order.name}</strong>.</p>
        //         <p>🎁 Here is your voucher code: <strong style="font-size: 18px;">${voucher.code}</strong></p>
        //       `,
        //     });
        //     console.log('📧 Voucher email sent to customer for order:', order.name);
        //   } catch (emailErr) {
        //     console.error('❌ Failed to send voucher email:', emailErr.message);
        //     console.error('Full email error:', emailErr);
        //   }
        // } else {
        //   console.log('⚠️ No email or voucher found for customer/order:', {
        //     orderId: numericId,
        //     hasCustomerEmail: !!order.customer?.email,
        //     hasVoucher: !!voucher,
        //     voucherCode: voucher?.code
        //   });
        // }

// Move this function to top-level scope, outside of loader
// async function hasCustomerOrderedBefore(customerEmail) {
//   const existingOrders = await prisma.order.findMany({
//     where: {
//       customerEmail: customerEmail,
//     },
//   });
//   return existingOrders.length > 1; // More than one means this isn't their first order
// }

//         const previousOrders = await asCustomerOrderedBefore(order.customer.id); // You must implement this

// if (order.customer.email && voucher) {
//   const isNewCustomer = previousOrders.length === 0; // 🔥 New customer check

//   if (isNewCustomer) {
//     try {
//       await sendEmail({
//         to: order.customer.email,
//         subject: `🎟️ Your Voucher Code for Order ${order.name}`,
//         text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
//         html: `
//           <p>Hello <strong>${order.customer.firstName}</strong>,</p>
//           <p>Thank you for your order <strong>${order.name}</strong>.</p>
//           <p>🎁 Here is your voucher code: <strong style="font-size: 18px;">${voucher.code}</strong></p>
//         `,
//       });
//       console.log('📧 Voucher email sent to NEW customer for order:', order.name);
//     } catch (emailErr) {
//       console.error('❌ Failed to send voucher email:', emailErr.message);
//     }
//   } else {
//     console.log('⚠️ Existing customer – no email sent for order:', order.name);
//   }
// }

// if (order.customer?.email && voucher) {
//   const isReturningCustomer = await hasCustomerOrderedBefore(order.customer.email);

//   if (!isReturningCustomer) {
//     try {
//       await sendEmail({
//         to: order.customer.email,
//         subject: `🎟️ Your Voucher Code for Order ${order.name}`,
//         text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
//         html: `
//           <p>Hello <strong>${order.customer.firstName}</strong>,</p>
//           <p>Thank you for your order <strong>${order.name}</strong>.</p>
//           <p>🎁 Here is your voucher code: <strong style="font-size: 18px;">${voucher.code}</strong></p>
//         `,
//       });
//       console.log('📧 Voucher email sent to NEW customer for order:', order.name);
//     } catch (err) {
//       console.error("❌ Failed to send email:", err.message);
//     }
//   } else {
//     console.log("⚠️ Existing customer – no email sent for order:", order.name);
//   }
// }

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
