// Utility to generate a PDF from voucher data using pdfkit (no Chrome needed)

import PDFDocument from 'pdfkit';
import getStream from 'get-stream';
import { PassThrough } from 'stream';

export async function generateVoucherPDF(voucher) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });
  const passthrough = new PassThrough();
  doc.pipe(passthrough);

  // Branding
  doc
    .fillColor('#862633')
    .fontSize(28)
    .font('Helvetica-Bold')
    .text('Jiffy Lube', { align: 'center' })
    .moveDown(0.5);

  // Title
  doc
    .fontSize(22)
    .fillColor('#000')
    .font('Helvetica-Bold')
    .text('Oil Change Voucher', { align: 'center' })
    .moveDown(1);

  // Voucher details
  doc
    .fontSize(16)
    .font('Helvetica')
    .fillColor('#333')
    .text(`Voucher Code: `, { continued: true })
    .font('Helvetica-Bold')
    .text(voucher.code)
    .moveDown(0.5);

  doc
    .font('Helvetica')
    .text(`Customer: `, { continued: true })
    .font('Helvetica-Bold')
    .text(voucher.customerEmail || '—')
    .moveDown(0.5);

  doc
    .font('Helvetica')
    .text(`Issued On: `, { continued: true })
    .font('Helvetica-Bold')
    .text(voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString() : '—')
    .moveDown(0.5);

  doc
    .font('Helvetica')
    .text(`Valid Through: `, { continued: true })
    .font('Helvetica-Bold')
    .text(voucher.createdAt ? new Date(new Date(voucher.createdAt).setMonth(new Date(voucher.createdAt).getMonth() + 3)).toLocaleDateString() : '—')
    .moveDown(1);

  // Terms
  doc
    .fontSize(12)
    .fillColor('#862633')
    .font('Helvetica-Bold')
    .text('Terms & Conditions', { align: 'left' })
    .moveDown(0.2)
    .font('Helvetica')
    .fillColor('#333')
    .text('* Only valid at participating ACE Jiffy Lube Locations.')
    .text('** Valid for up to 5 quarts of oil, extra fee for additional quarts.')
    .text('** Not valid with any other offer for same service.')
    .text('** Shop supply fees and applicable taxes are not included and must be paid at time of service.')
    .moveDown(1);

  // Footer
  doc
    .fontSize(10)
    .fillColor('#666')
    .text('Thank you for your purchase!', { align: 'center' });

  doc.end();
  return await getStream.buffer(passthrough);
}
