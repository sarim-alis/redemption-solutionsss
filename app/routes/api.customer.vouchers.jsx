import { json } from "@remix-run/node";
import { getVouchersByCustomerEmail } from "../models/voucher.server";

export const loader = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const customerEmail = url.searchParams.get('customerEmail');

    if (!customerEmail) {
      return json({ error: 'Customer email is required' }, { status: 400 });
    }

    console.log('🔍 Fetching vouchers for customer:', customerEmail);

    // Fetch vouchers by customer email using the voucher.server function
    const vouchers = await getVouchersByCustomerEmail(customerEmail);

    console.log('✅ Found vouchers:', vouchers.length);

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
