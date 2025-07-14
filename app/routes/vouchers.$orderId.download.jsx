import { getVoucherByOrderId } from '../models/voucher.server';
import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

export const loader = async ({ params }) => {
  const orderId = params.orderId;
  if (!orderId) {
    throw new Response('Order ID is required', { status: 400 });
  }

  const voucher = await getVoucherByOrderId(orderId);
  if (!voucher) {
    throw new Response('Voucher not found', { status: 404 });
  }

  // Create PDF document
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const stream = new PassThrough();
  doc.pipe(stream);

  // Document title
  doc.fontSize(20).text('Your Voucher', { align: 'center' });
  doc.moveDown(2);

  // Order Info
  doc.fontSize(14).text(`Order ID: ${voucher.shopifyOrderId}`);
  doc.text(`Voucher Code: ${voucher.code}`);
  doc.text(`Issued At: ${voucher.createdAt.toISOString()}`);

  doc.moveDown(2);
  doc.text('Thank you for your purchase!', { align: 'center' });

  doc.end();

  return new Response(stream, {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="voucher-${voucher.code}.pdf"`,
    },
  });
};

export default function DownloadVoucher() {
  return null; // action-only route
}
