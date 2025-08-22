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
    : "08/16/2026";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "03/16/2025";
  const name = formatCustomerName(voucher.customerEmail);

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jiffy Lube Voucher</title>
      <style>
        body { 
          margin: 0; 
          padding: 0; 
          font-family: Arial, sans-serif; 
          background-color: #f5f5f5;
        }
        .email-container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
        }
        .header {
          background-color: #862633;
          padding: 20px;
          text-align: center;
        }
        .logo {
          color: white;
          font-size: 24px;
          font-weight: bold;
        }
        .logo-circle {
          display: inline-block;
          width: 30px;
          height: 30px;
          background-color: white;
          color: #862633;
          border-radius: 50%;
          text-align: center;
          line-height: 30px;
          font-weight: bold;
          margin-right: 10px;
        }
        .main-content {
          padding: 40px 30px;
          background-color: white;
        }
        .thank-you {
          color: #862633;
          font-size: 28px;
          font-weight: bold;
          text-align: center;
          margin-bottom: 20px;
        }
        .subtitle {
          color: #333333;
          font-size: 18px;
          text-align: center;
          margin-bottom: 30px;
        }
        .instructions {
          color: #666666;
          font-size: 16px;
          text-align: center;
          margin-bottom: 40px;
          line-height: 1.5;
        }
        .voucher-container {
          background-color: #862633;
          border: 2px dashed white;
          border-radius: 8px;
          padding: 30px;
          margin: 30px 0;
          text-align: center;
          position: relative;
        }
        .voucher-title {
          color: white;
          font-size: 22px;
          font-weight: bold;
          margin-bottom: 20px;
        }
        .voucher-subtitle {
          color: white;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .voucher-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 30px;
          color: white;
          font-size: 16px;
        }
        .voucher-detail {
          text-align: center;
        }
        .voucher-detail-label {
          font-size: 14px;
          opacity: 0.9;
        }
        .voucher-detail-value {
          font-weight: bold;
          font-size: 18px;
        }
        .voucher-code-container {
          background-color: white;
          border-radius: 8px;
          padding: 20px;
          margin: 30px 0;
          display: inline-block;
          min-width: 300px;
        }
        .voucher-code-label {
          color: #333333;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .voucher-code {
          color: #333333;
          font-size: 28px;
          font-weight: bold;
          letter-spacing: 2px;
        }
        .terms {
          color: white;
          font-size: 14px;
          text-align: left;
          margin-top: 20px;
          line-height: 1.4;
        }
        .small-logo {
          position: absolute;
          bottom: 15px;
          right: 15px;
          color: white;
          font-size: 16px;
          font-weight: bold;
        }
        .footer {
          background-color: #f8f8f8;
          padding: 30px;
          text-align: center;
          border-top: 1px solid #e0e0e0;
        }
        .footer-logo {
          color: #862633;
          font-size: 20px;
          font-weight: bold;
          margin-bottom: 15px;
        }
        .disclaimer {
          color: #666666;
          font-size: 12px;
          line-height: 1.4;
          max-width: 500px;
          margin: 0 auto;
        }
        @media only screen and (max-width: 600px) {
          .main-content { padding: 20px 15px; }
          .voucher-container { padding: 20px; }
          .voucher-details { flex-direction: column; gap: 15px; }
          .voucher-code { font-size: 24px; }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <div class="logo">
            <span class="logo-circle">J</span>
            jiffy lube
          </div>
        </div>

        <!-- Main Content -->
        <div class="main-content">
          <div class="thank-you">Thank you for your purchase!</div>
          <div class="subtitle">Your Jiffy Lube® Oil Change Pack is ready to use.</div>
          <div class="instructions">
            You'll find your voucher(s) below—just bring a voucher number with you on your next visit to a participating location.
          </div>

          <!-- Voucher Section -->
          <div class="voucher-container">
            <div class="voucher-title">Jiffy Lube Synthetic Blend Oil Change Voucher</div>
            <div class="voucher-subtitle">Present this at participating locations to redeem.</div>
            
            <div class="voucher-details">
              <div class="voucher-detail">
                <div class="voucher-detail-label">Valid through:</div>
                <div class="voucher-detail-value">${validThrough}</div>
              </div>
              <div class="voucher-detail">
                <div class="voucher-detail-label">Issued on:</div>
                <div class="voucher-detail-value">${issuedOn}</div>
              </div>
              <div class="voucher-detail">
                <div class="voucher-detail-label">Used on:</div>
                <div class="voucher-detail-value">---</div>
              </div>
            </div>

            <div class="voucher-code-container">
              <div class="voucher-code-label">Voucher Code:</div>
              <div class="voucher-code">${voucher.code}</div>
            </div>

            <div class="terms">
              *Only valid at participating ACE Jiffy Lube locations.<br>
              **Term 2<br>
              ***Term 3
            </div>

            <div class="small-logo">
              <span style="background: white; color: #862633; padding: 5px 8px; border-radius: 50%; font-weight: bold;">J</span>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <div class="footer-logo">
            <span style="background: #862633; color: white; padding: 5px 8px; border-radius: 50%; margin-right: 10px;">J</span>
            jiffy lube
          </div>
          <div class="disclaimer">
            *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
          </div>
        </div>
      </div>
    </body>
    </html>
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
