import prisma from "../db.server";
import { createVoucher } from "./voucher.server";

interface ShopifyCustomer {
  email?: string;
  firstName?: string;
  lastName?: string;
  first_name?: string;
  last_name?: string;
}

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price?: string | number;
  product_id?: string;
  variant_id?: string;
  originalUnitPriceSet?: {
    shopMoney?: {
      amount: string;
      currencyCode?: string;
    };
  };
  variant?: {
    id?: string;
    product?: {
      id?: string;
    };
  };
}

interface ShopifyOrder {
  id?: string;
  shopifyOrderId?: string;
  name?: string;
  customer?: ShopifyCustomer;
  customerEmail?: string;
  customerName?: string;
  email?: string;
  line_items?: ShopifyLineItem[];
  lineItems?: {
    edges: Array<{
      node: ShopifyLineItem;
    }>;
  };
  financial_status?: string;
  fulfillment_status?: string;
  displayFinancialStatus?: string;
  displayFulfillmentStatus?: string;
  total_price?: string;
  totalPrice?: string | number;
  totalPriceSet?: {
    shopMoney?: {
      amount: string;
      currencyCode: string;
    };
  };
  currency?: string;
  processed_at?: string;
  processedAt?: string;
  created_at?: string;
}

interface OrderData {
  shopifyOrderId: string;
  customerEmail: string | null;
  customerName: string | null;
  totalPrice: number;
  currency: string;
  status: string;
  fulfillmentStatus: string | null;
  itemQuantity: number;
  processedAt: Date;
  lineItems: string;
  type?: string;
}

interface ProcessResult {
  success: boolean;
  error?: string;
  orderInfo?: OrderData;
}

async function processOrderData(orderData: ShopifyOrder): Promise<ProcessResult> {
  try {
    const safeParseFloat = (value: any): number => {
      if (!value) return 0;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    const safeParseInt = (value: any): number => {
      if (!value) return 0;
      const parsed = parseInt(value);
      return isNaN(parsed) ? 0 : parsed;
    };

    // @ts-ignore
    let processedLineItems = [];
    if (orderData.line_items) {
      processedLineItems = orderData.line_items.map(item => ({
        title: item.title || 'Untitled Product',
        quantity: safeParseInt(item.quantity),
        price: safeParseFloat(item.price),
        productId: item.product_id?.toString() || null,
        variantId: item.variant_id?.toString() || null
      }));
    } else if (orderData.lineItems?.edges) {
      processedLineItems = orderData.lineItems.edges
        .filter(edge => edge && edge.node)
        .map(edge => ({
          title: edge.node.title || 'Untitled Product',
          quantity: safeParseInt(edge.node.quantity),
          price: safeParseFloat(edge.node.originalUnitPriceSet?.shopMoney?.amount),
          productId: edge.node.variant?.product?.id?.split('/').pop() || null,
          variantId: edge.node.variant?.id?.split('/').pop() || null,
          //@ts-ignore
          type: edge.node.variant?.product?.metafield?.value || null,
          //@ts-ignore
          expire: edge.node.variant?.product?.metafield_expiry?.value || null
        }));
    }

    // @ts-ignore
    const itemQuantity = processedLineItems.reduce((sum, item) => sum + item.quantity, 0);

    const customerName = orderData.customer 
      ? `${orderData.customer.firstName || orderData.customer.first_name || ''} ${orderData.customer.lastName || orderData.customer.last_name || ''}`.trim() 
      : null;

    let totalPrice = 0;
    if (orderData.totalPrice) {
      totalPrice = safeParseFloat(orderData.totalPrice);
    } else if (orderData.total_price) {
      totalPrice = safeParseFloat(orderData.total_price);
    } else if (orderData.totalPriceSet?.shopMoney?.amount) {
      totalPrice = safeParseFloat(orderData.totalPriceSet.shopMoney.amount);
    }

    const orderId = orderData.shopifyOrderId?.toString() || orderData.id?.toString();
    if (!orderId) {
      return { success: false, error: 'No valid order ID found in data' };
    }

    const orderInfo: OrderData = {
      shopifyOrderId: orderId,
      customerEmail: orderData.customerEmail || orderData.email || orderData.customer?.email || null,
      customerName: orderData.customerName || customerName || null,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
      currency: orderData.currency || orderData.totalPriceSet?.shopMoney?.currencyCode || 'USD',
      status: (orderData.displayFinancialStatus || orderData.financial_status || 'PENDING').toUpperCase(),
      fulfillmentStatus: (orderData.displayFulfillmentStatus || orderData.fulfillment_status || 'unfulfilled')?.toLowerCase(),
      itemQuantity: parseInt(itemQuantity.toString()) || 0,
      processedAt: new Date(orderData.processedAt || orderData.processed_at || orderData.created_at || new Date()),
      // @ts-ignore
      lineItems: JSON.stringify(processedLineItems),
    };

    return { success: true, orderInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

interface LineItem {
  title: string;
  quantity: number;
  price: number;
  productId: string | null;
  variantId: string | null;
}

export async function saveOrder(orderData: ShopifyOrder) {
  console.log('🔄 Starting saveOrder with ShopifyOrder data');
  if (!orderData?.shopifyOrderId && !orderData?.id) {
    console.error('Invalid order data, missing ID');
    throw new Error('Invalid order data: missing ID');
  }

  const result = await processOrderData(orderData);
  if (!result.success || !result.orderInfo) {
    console.error('Order processing failed:', result.error);
    throw new Error(result.error || 'Failed to process order data');
  }
  const info = result.orderInfo;

  // Prepare data for DB
  const dbData = {
    shopifyOrderId: info.shopifyOrderId,
    customerEmail: info.customerEmail,
    customerName: info.customerName,
    totalPrice: info.totalPrice,
    currency: info.currency,
    status: info.status,
    fulfillmentStatus: info.fulfillmentStatus,
    itemQuantity: info.itemQuantity,
    processedAt: info.processedAt,
    lineItems: JSON.parse(info.lineItems),
  };

  // Check if order already exists
  const existing = await prisma.order.findUnique({ where: { shopifyOrderId: info.shopifyOrderId } });
  if (existing) {
    console.log('⏭️ Order already exists, updating:', info.shopifyOrderId);
    
    // Update the existing order
    const updated = await prisma.order.update({
      where: { shopifyOrderId: info.shopifyOrderId },
      data: dbData
    });
    
    // Check if voucher exists
    let voucher = await prisma.voucher.findFirst({ where: { shopifyOrderId: info.shopifyOrderId } });
    
    // If order is now PAID and no voucher exists, create one
    if (info.status === 'PAID' && !voucher) {
      try {
        voucher = await createVoucher({
          shopifyOrderId: updated.shopifyOrderId,
          customerEmail: updated.customerEmail || ''
        });
        console.log('🎟️ Voucher created for paid order:', voucher.code);
      } catch (voucherError: any) {
        console.error('❌ Failed to create voucher for paid order:', voucherError);
      }
    }
    
    return { order: updated, voucher };
  }

  try {
    const saved = await prisma.order.create({ data: dbData });
    console.log('✅ Order created in DB:', saved.shopifyOrderId);
    // Don't create voucher yet - wait for payment
    console.log('⏳ Voucher will be created when order is paid');
    return { order: saved, voucher: null };
  } catch (dbError: any) {
    console.error('❌ DB create failed:', dbError);
    throw new Error(`Failed to save order ${info.shopifyOrderId}: ${dbError.message}`);
  }
}

// New function to update order status and handle voucher creation
export async function updateOrderStatus(shopifyOrderId: string, newStatus: string) {
  try {
    console.log(`🔄 Updating order status: ${shopifyOrderId} to ${newStatus}`);
    
    const updated = await prisma.order.update({
      where: { shopifyOrderId },
      data: { status: newStatus }
    });
    
    // If order is now PAID, check if voucher exists and create if needed
    if (newStatus === 'PAID') {
      let voucher = await prisma.voucher.findFirst({ where: { shopifyOrderId } });
      
      if (!voucher) {
        try {
          voucher = await createVoucher({
            shopifyOrderId,
            customerEmail: updated.customerEmail || ''
          });
          console.log('🎟️ Voucher created for paid order:', voucher.code);
        } catch (voucherError: any) {
          console.error('❌ Failed to create voucher for paid order:', voucherError);
        }
      }
      
      return { order: updated, voucher };
    }
    
    return { order: updated, voucher: null };
  } catch (error: any) {
    console.error('❌ Failed to update order status:', error);
    throw error;
  }
}

export async function hasCustomerOrderedBefore(customerEmail: string): Promise<boolean> {
  const existingOrders = await prisma.order.findMany({
    where: {
      customerEmail: customerEmail,
    },
  });
  return existingOrders.length === 1;
}
