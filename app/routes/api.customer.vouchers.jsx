
import { json } from "@remix-run/node";
import { getVouchersByCustomerEmail, getVoucherByOrderId } from "../models/voucher.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const customerEmail = url.searchParams.get('customerEmail');
    const orderId = url.searchParams.get('orderId');

    let vouchers = [];
    if (orderId) {
      // Fetch voucher by orderId
      const voucher = await getVoucherByOrderId(orderId);
      if (voucher) vouchers = [voucher];
    } else if (customerEmail) {
      vouchers = await getVouchersByCustomerEmail(customerEmail);
    } else {
      return json({ error: 'orderId or customerEmail is required' }, { status: 400 });
    }

    // Transform the data for the frontend
    const transformedVouchers = vouchers.map(voucher => ({
      id: voucher.id,
      code: voucher.code,
      used: voucher.used,
      createdAt: voucher.createdAt,
      orderName: voucher.shopifyOrderId,
      customerEmail: voucher.customerEmail,
      emailSent: voucher.emailSent,
      usedAt: voucher.used ? voucher.createdAt : null
    }));

    return json({
      success: true,
      vouchers: transformedVouchers,
      count: transformedVouchers.length
    });

  } catch (error) {
    console.error('❌ Error fetching customer vouchers:', error);
    return json({ 
      error: 'Failed to fetch vouchers',
      details: error.message 
    }, { status: 500 });
  }
};
