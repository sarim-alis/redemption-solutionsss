import prisma from "../db.server";
import { createVoucher, createVouchersForOrder } from "./voucher.server";

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
  type?: string;
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

    // Determine order type based on line items
    let orderType = 'voucher'; // Default to voucher
    const lineItems = orderData.line_items || [];
    
    // Check if any line item indicates a gift card
    const isGift = lineItems.some(item => 
      item.title?.toLowerCase().includes('gift') || 
      item.type?.toLowerCase() === 'gift'
    );
    
    if (isGift) {
      orderType = 'gift';
    }

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
      shopifyOrderId: orderData.shopifyOrderId || orderData.id || 'unknown',
      customerEmail: orderData.customerEmail || orderData.email || orderData.customer?.email || null,
      customerName: orderData.customerName || 
                  (orderData.customer?.firstName ? 
                    `${orderData.customer.firstName} ${orderData.customer.lastName || ''}`.trim() : 
                    (orderData.customer?.first_name ? 
                      `${orderData.customer.first_name} ${orderData.customer.last_name || ''}`.trim() : 
                      null)
                  ),
      totalPrice: safeParseFloat(
        orderData.total_price || 
        orderData.totalPrice || 
        orderData.totalPriceSet?.shopMoney?.amount || 0
      ),
      currency: orderData.currency || orderData.totalPriceSet?.shopMoney?.currencyCode || 'USD',
      status: (orderData.financial_status || orderData.displayFinancialStatus || 'pending')?.toLowerCase(),
      fulfillmentStatus: (orderData.displayFulfillmentStatus || orderData.fulfillment_status || 'unfulfilled')?.toLowerCase(),
      itemQuantity: parseInt(itemQuantity.toString()) || 0,
      processedAt: new Date(orderData.processedAt || orderData.processed_at || orderData.created_at || new Date()),
      // @ts-ignore
      lineItems: JSON.stringify(processedLineItems),
      type: orderType, // Include the determined order type
    };

    return { success: true, orderInfo };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export interface LineItem {
  title: string;
  quantity: number;
  price: number;
  productId: string | null;
  variantId: string | null;
  type: string;
  variantTitle: string;
  variant: any;
  packCount: number;
}

interface LineItemInput {
  title: string;
  quantity: number;
  price: number;
  productId: string | null;
  variantId: string | null;
  type?: string;
  variantTitle?: string;
  variant?: any;
  packCount?: number;
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
    
    // If order is now PAID and no voucher exists, create multiple vouchers
    if (info.status === 'PAID' && !voucher) {
      try {
        // Parse line items from the order with proper type safety
        const parseLineItems = (itemsData: unknown): LineItem[] => {
          if (!itemsData) return [];
          
          let parsedItems: any;
          try {
            // If it's a string, try to parse it as JSON
            parsedItems = typeof itemsData === 'string' 
              ? JSON.parse(itemsData) 
              : itemsData;
          } catch (e) {
            console.error('Failed to parse line items:', e);
            return [];
          }

          // Handle both array and edges format
          const items = parsedItems?.edges?.map((edge: any) => edge?.node) || 
                       (Array.isArray(parsedItems) ? parsedItems : []);
          
          return items.map((item: any): LineItem => {
            const title = item.title || 'Untitled Product';
            const variantTitle = item.variantTitle || item.variant?.title || title;
            const packMatch = typeof variantTitle === 'string' ? variantTitle.match(/(\d+)\s*Pack/i) : null;
            const packCount = item.packCount || (packMatch ? parseInt(packMatch[1], 10) : 1);
            const quantity = item.quantity ? Number(item.quantity) : 1;
            const price = item.price ? Number(item.price) : 
                         (item.originalUnitPriceSet?.shopMoney?.amount ? 
                          Number(item.originalUnitPriceSet.shopMoney.amount) : 0);
            const type = item.type || 'voucher';
            const variant = item.variant || {};
            
            // Preserve variant metafield information if available
            if (item.variant?.metafield_voucher_count) {
              variant.metafield_voucher_count = item.variant.metafield_voucher_count;
            }
            
            const productId = item.productId || item.variant?.product?.id?.split('/').pop() || null;
            const variantId = item.variantId || item.variant?.id?.split('/').pop() || null;
            
            return {
              title,
              variantTitle,
              quantity,
              price,
              type,
              variant,
              packCount,
              productId,
              variantId
            };
          });
        };

        const lineItems = parseLineItems(updated.lineItems);
        console.log(`📦 Processing ${lineItems.length} line items for voucher creation`);
        console.log('🔍 Line items data:', JSON.stringify(lineItems, null, 2));
        
        // Create vouchers for each product
        const newVouchers = await createVouchersForOrder({
          shopifyOrderId: updated.shopifyOrderId,
          customerEmail: updated.customerEmail || '',
          lineItems
        });
        
        console.log(`✅ Created ${newVouchers.length} vouchers for paid order`);
        voucher = newVouchers[0]; // Set first voucher for backward compatibility
      } catch (voucherError: any) {
        console.error('❌ Failed to create vouchers for paid order:', voucherError);
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
          // Parse line items from the order
          let lineItems: any[] = [];
          
          // Helper function to parse line items
          const parseLineItems = (itemsData: any): any[] => {
            if (!itemsData) return [];
            
            // If it's a string, try to parse it as JSON
            const parsedItems = typeof itemsData === 'string' 
              ? JSON.parse(itemsData) 
              : itemsData;

            // Handle both array and edges format
            const items = parsedItems.edges?.map((edge: any) => edge.node) || 
                         (Array.isArray(parsedItems) ? parsedItems : []);
            
            return items.map((item: any) => ({
              title: item.title || 'Untitled Product',
              quantity: item.quantity || 1,
              price: item.price || item.originalUnitPriceSet?.shopMoney?.amount || 0,
              type: item.type || 'voucher',
              variantTitle: item.variantTitle || item.variant?.title || item.title || 'Standard',
              packCount: item.packCount || (() => {
                const title = item.variantTitle || item.variant?.title || '';
                const match = typeof title === 'string' ? title.match(/(\d+)\s*Pack/i) : null;
                return match ? parseInt(match[1], 10) : 1;
              })(),
              variant: item.variant || {}
            }));
          };

          try {
            lineItems = parseLineItems(updated.lineItems);
            console.log(`📦 Processing ${lineItems.length} line items for voucher creation`);
            console.log('🔍 Line items data:', JSON.stringify(lineItems, null, 2));
            
            // Create vouchers for each product
            const newVouchers = await createVouchersForOrder({
              shopifyOrderId,
              customerEmail: updated.customerEmail || '',
              lineItems
            });
            
            console.log(`✅ Created ${newVouchers.length} vouchers for paid order`);
            voucher = newVouchers[0]; // Set first voucher for backward compatibility
          } catch (parseError) {
            console.error('❌ Failed to parse line items:', parseError);
            throw new Error('Failed to process order line items');
          }
        } catch (voucherError: any) {
          console.error('❌ Failed to create vouchers for paid order:', voucherError);
          throw voucherError; // Re-throw to be handled by the outer catch
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
