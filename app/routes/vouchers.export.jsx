// /app/routes/vouchers.export.jsx
import puppeteer from "puppeteer";
// import { Parser } from "json2csv"; // moved to dynamic import
import { getAllVouchers } from "../models/voucher.server";
import prisma from "../db.server";
import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplateShareds.js";

// 🔥 Shared function to build PDF
async function buildPdf(vouchers, singleId = null) {
// 🔥 Shared function to build CSV
async function buildCsv(vouchers) {
  const { Parser } = await import("json2csv");
  const fields = [
    { label: "Voucher Code", value: "code" },
    { label: "Order ID", value: "shopifyOrderId" },
    { label: "Customer Email", value: "customerEmail" },
    { label: "Used", value: row => row.used ? "Yes" : "No" },
    { label: "Created At", value: row => new Date(row.createdAt).toLocaleString() },
  ];
  const parser = new Parser({ fields });
  const csv = parser.parse(vouchers);
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename=vouchers.csv`,
    },
  });
}
  let html;

  if (singleId) {
    // ✅ Single voucher → use fancy template
    const voucher = vouchers[0];
    html = generateVoucherEmailHTML(voucher);
  } else {
    // ✅ Multiple vouchers → keep the table report
    html = `
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
              ${vouchers
                .map(
                  (v) => `
                <tr>
                  <td>${v.code}</td>
                  <td>${v.shopifyOrderId}</td>
                  <td>${v.customerEmail}</td>
                  <td>${v.used ? "Yes" : "No"}</td>
                  <td>${new Date(v.createdAt).toLocaleString()}</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });
  const pdfBuffer = await page.pdf({
    format: "A4",
    printBackground: true,
  });
  await browser.close();

  return new Response(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=${
        singleId ? `voucher-${singleId}.pdf` : "vouchers.pdf"
      }`,
    },
  });
}

// 🔹 Loader handles GET requests
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const format = url.searchParams.get("format");

  if (id) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: String(id) },
    });
    if (!voucher) throw new Response("Not Found", { status: 404 });
    if (format === "csv") {
      return await buildCsv([voucher]);
    }
    return buildPdf([voucher], id);
  }

  // No ID → export all
  const vouchers = await getAllVouchers();
  if (format === "csv") {
    return await buildCsv(vouchers);
  }
  return buildPdf(vouchers);
};

// 🔹 Action handles POST requests (export all)
export const action = async ({ request }) => {
  const url = new URL(request.url);
  const format = url.searchParams.get("format");
  const vouchers = await getAllVouchers();
  if (format === "csv") {
    return await buildCsv(vouchers);
  }
  return buildPdf(vouchers);
};
