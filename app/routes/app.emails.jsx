// Imports.
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, BlockStack, Badge, Button } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
// Server-only imports moved inside loader
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
  // Server-only imports here
  const { saveOrder, hasCustomerOrderedBefore } = await import("../models/order.server");
  const prisma = (await import("../db.server")).default;
  const { sendEmail } = await import("../utils/mail.server");
  const { admin } = await authenticate.admin(request);
  console.log('🔄 Starting to fetch orders...');

  // Only fetch orders from Shopify, do not save or send emails here
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
};
