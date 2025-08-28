// Utility to generate a PDF from the voucher email HTML template
// Uses puppeteer for headless Chrome rendering
// Usage: await generateVoucherPDF(voucher)

import puppeteer from 'puppeteer';
import { generateVoucherEmailHTML } from './voucherEmailTemplateShared';

export async function generateVoucherPDF(voucher) {
  const html = generateVoucherEmailHTML(voucher);
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 }
  });
  await browser.close();
  return pdfBuffer;
}
