import { sendEmail } from "../utils/mail.server";
import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplateShared";
import prisma from "../db.server";
import { hasCustomerOrderedBefore } from "../models/order.server";

/**
 * Send voucher email to customer if first order and not already sent.
 * @param {object} order - Order object (must have customer.email, name, etc)
 * @returns {Promise<void>}
 */
export async function sendVoucherEmailIfFirstOrder(order, voucher) {
  if (!order?.customer?.email || !voucher) {
    console.log('[VoucherEmail] Missing order.customer.email or voucher, skipping email send.');
    return;
  }
  if (!voucher.emailSent) {
    try {
      console.log(`[VoucherEmail] Sending voucher email to: ${order.customer.email} for voucher: ${voucher.code}`);
      await sendEmail({
        to: order.customer.email,
        subject: `Here are your Oil Change Vouchers! Where to Redeem... 🎟️`,
        text: `Hello ${order.customer.firstName},\n\nThank you for your order ${order.name}.\nHere is your voucher code: ${voucher.code}`,
        html: generateVoucherEmailHTML({ ...voucher, customerEmail: order.customer.email }),
      });
      await prisma.voucher.update({
        where: { code: voucher.code },
        data: { emailSent: true },
      });
      console.log(`[VoucherEmail] Email sent and voucher marked as sent for: ${voucher.code}`);
    } catch (emailErr) {
      console.error('❌ Failed to send voucher email:', emailErr.message);
      console.error('Full email error:', emailErr);
    }
  } else {
    console.log(`[VoucherEmail] Voucher email already sent for: ${voucher.code}`);
  }
}
