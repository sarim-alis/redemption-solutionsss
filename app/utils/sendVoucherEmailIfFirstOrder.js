import { sendEmail } from "../utils/mail.server";
import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplateShared";
import prisma from "../db.server";
import { hasCustomerOrderedBefore } from "../models/order.server";

/**
 * Send voucher email to customer if first order and not already sent.
 * @param {object} order - Order object (must have customer.email, name, etc)
 * @returns {Promise<void>}
 */
export async function sendVoucherEmailIfFirstOrder(order) {
  if (!order?.customer?.email) return;
  const numericId = order.shopifyOrderId || order.id;
  const voucher = await prisma.voucher.findFirst({
    where: { shopifyOrderId: numericId }
  });
  if (!voucher) return;
  const isFirstOrder = await hasCustomerOrderedBefore(order.customer.email);
  if (isFirstOrder && !voucher.emailSent) {
    try {
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
    } catch (emailErr) {
      console.error('❌ Failed to send voucher email:', emailErr.message);
      console.error('Full email error:', emailErr);
    }
  }
}
