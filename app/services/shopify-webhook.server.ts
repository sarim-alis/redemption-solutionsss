import { createVoucher } from "../models/voucher.server";

// This file has been cleared as per user request. All voucher-related code removed.

export async function handleOrderPaid(order: any) {
  console.log('🔄 Processing order paid webhook:', {
    orderId: order?.id,
    hasOrder: !!order,
    orderKeys: Object.keys(order || {}),
    orderType: typeof order
  });

  // Extract order details
  const shopifyOrderId = order?.id?.toString() || order?.order_id?.toString();
  const customerEmail = order?.email || order?.customer?.email;

  console.log('📊 Extracted order details:', {
    shopifyOrderId,
    customerEmail,
    hasCustomer: !!order?.customer
  });

  if (!shopifyOrderId || !customerEmail) {
    console.error('❌ Missing required order data:', {
      shopifyOrderId,
      customerEmail,
      orderData: JSON.stringify(order, null, 2)
    });
    throw new Error("Missing order ID or customer email");
  }

  // Create a voucher for this order
  console.log('🎟️ Creating voucher for order:', { shopifyOrderId, customerEmail });
  await createVoucher({ shopifyOrderId, customerEmail });
  console.log('✅ Voucher created successfully');
}
