import puppeteer from "puppeteer";
import { json } from "@remix-run/node";
import { getAllVouchers } from "../models/voucher.server";

export const action = async () => {
  const vouchers = await getAllVouchers();

  // Generate HTML for PDF
  const html = `
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #ccc; padding: 8px; text-align: left; }
          th { background: #f3f4f6; }
        </style>
      </head>
      <body>
        <h2>Voucher Report</h2>
        <table>
          <thead>
            <tr>
              <th>Voucher Code</th>
              <th>Order ID</th>
              <th>Customer Email</th>
              <th>Used</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            ${vouchers.map(v => `
              <tr>
                <td>${v.code}</td>
                <td>${v.shopifyOrderId}</td>
                <td>${v.customerEmail}</td>
                <td>${v.used ? "Yes" : "No"}</td>
                <td>${new Date(v.createdAt).toLocaleString()}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </body>
    </html>
  `;

  // Puppeteer render
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({ format: "A4" });
  await browser.close();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=vouchers.pdf"
    }
  });
};
