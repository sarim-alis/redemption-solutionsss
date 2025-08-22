// scripts/sendPendingVoucherEmails.js
// Run this with: node scripts/sendPendingVoucherEmails.js

import prisma from '../app/db.server';
import { sendVoucherEmailIfFirstOrder } from '../app/utils/sendVoucherEmailIfFirstOrder';

async function main() {
  const pendingVouchers = await prisma.voucher.findMany({
    where: { emailSent: false },
    include: { order: true },
  });
  if (!pendingVouchers.length) {
    console.log('No pending vouchers found.');
    return;
  }
  for (const voucher of pendingVouchers) {
    if (!voucher.order) {
      console.log(`[SKIP] No order found for voucher: ${voucher.code}`);
      continue;
    }
    try {
      await sendVoucherEmailIfFirstOrder({ customer: { email: voucher.order.customerEmail, firstName: voucher.order.customerName }, name: voucher.order.shopifyOrderId }, voucher);
    } catch (err) {
      console.error(`[ERROR] Failed to send email for voucher: ${voucher.code}`, err);
    }
  }
}

main().then(() => process.exit(0)).catch((err) => { console.error(err); process.exit(1); });
