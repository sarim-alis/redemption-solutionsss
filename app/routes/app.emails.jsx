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

    
        <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #4A5568; background:#862633; padding:30px; border-radius:0 8px 8px 8px;">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <h1 style="font-size:32px; font-weight:bold; color:#ffffff; margin:0;">Oil Change Voucher</h1>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-bottom:30px;">
                    <p style="font-size:18px; color:#ffffff; margin:0; line-height:1.6;">
                      Present this at participating locations to redeem.
                    </p>
                  </td>
                </tr>
                <!-- Valid through -->
                <tr>
                  <td style="border-bottom:1px solid #E2E8F0; padding:20px 0;">
                    <table width="100%">
                      <tr>
                        <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Valid through:</td>
                        <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">${validThrough}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Issued on -->
                <tr>
                  <td style="border-bottom:1px solid #E2E8F0; padding:20px 0;">
                    <table width="100%">
                      <tr>
                        <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Issued on:</td>
                        <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">${issuedOn}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <!-- Used on -->
                <tr>
                  <td style="border-bottom:1px solid #E2E8F0; padding:20px 0;">
                    <table width="100%">
                      <tr>
                        <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Used on:</td>
                        <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">— — —</td>
                      </tr>
                    </table>
                  </td>
                </tr>
      <!-- Voucher Code -->
      <tr>
      <td height="30" style="line-height:30px; font-size:0;">&nbsp;</td>
      </tr>
      <tr>
        <td align="center" style="background:#edf2f7; border-radius:12px; padding:20px; margin:30px 0;">
          <table width="100%">
            <tr>
              <td align="left" style="font-size:24px; color:#862633; font-weight:bold; padding-right:10px;">
                Voucher Code:
              </td>
              <td align="right" style="font-size:32px; font-weight:bold; color:#000000; letter-spacing:2px;">
                ${voucher.code}
              </td>
            </tr>
          </table>
        </td>
      </tr>
                <!-- Terms -->
                <tr>
                  <td style="font-size:16px; color:#ffffff; line-height:1.8; text-align:left; padding-top:20px;">
                    *Only valid at participating ACE Jiffy Lube Locations. <br />
                    ** Term 2 <br />
                    <table width="100%" style="margin-top:10px;">
                      <tr>
                        <td style="font-size:16px; color:#ffffff;">*** Term 3</td>
                        <td align="right">
                          <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" width="60" height="60" style="display:block;" />
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
  </table>

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
