import prisma from "../db.server";
import { v4 as uuidv4 } from "uuid";
import type { LineItem } from "./order.server";

function generateVoucherCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function createVoucher({ 
  shopifyOrderId, 
  customerEmail, 
  productTitle = null, 
  type = null 
}: { 
  shopifyOrderId: string, 
  customerEmail: string, 
  productTitle?: string | null, 
  type?: string | null 
}) {
  // Generate a unique code for the voucher
  const code = generateVoucherCode();
  return prisma.voucher.create({
    data: {
      code,
      shopifyOrderId,
      customerEmail,
      productTitle,
      type,
    },
  });
}

// New function to create multiple vouchers for an order (one per product)
export async function createVouchersForOrder({ 
  shopifyOrderId, 
  customerEmail, 
  lineItems 
}: { 
  shopifyOrderId: string, 
  customerEmail: string, 
  lineItems: LineItem[] 
}) {
  const vouchers = [];
  
  for (const item of lineItems) {
    // For gift cards, use quantity as is, don't apply pack count
    const isGiftCard = item.type === 'gift' || item.title.toLowerCase().includes('gift card');
    
    let totalVouchers;
    if (isGiftCard) {
      totalVouchers = item.quantity || 1;
      console.log(`🎁 Creating gift card: ${item.quantity} × $${item.price} (${item.title})`);
    } else {
      // For regular products, apply pack count
      const packCount = item.packCount || 1;
      totalVouchers = packCount * (item.quantity || 1);
      console.log(`📦 Creating ${totalVouchers} vouchers for ${item.title} (${packCount} pack × ${item.quantity} qty)`);
    }
    
    // Create all vouchers at once
    const voucherPromises = Array.from({ length: totalVouchers }, async (_, index) => {
      try {
        const voucher = await createVoucher({
          shopifyOrderId,
          customerEmail,
          productTitle: isGiftCard ? `${item.title} - $${item.price}` : item.title,
          type: isGiftCard ? 'gift' : (item.type || 'voucher'),
        });
        console.log(`🎟️ Created voucher ${voucher.code} for product: ${item.title}`);
        return voucher;
      } catch (error) {
        console.error(`❌ Failed to create voucher for product ${item.title}:`, error);
        return null;
      }
    });
    
    // Wait for all vouchers to be created
    const createdVouchers = await Promise.all(voucherPromises);
    vouchers.push(...createdVouchers.filter(Boolean));
  }
  
  return vouchers;
}

export async function getAllVouchers() {
  const vouchers = await prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          id: true,
          shopifyOrderId: true,
          statusUse: true,
          lineItems: true,
          createdAt: true,
          updatedAt: true
        }
      }
    }
  });

  // Log a sample of the data for debugging
  if (vouchers.length > 0) {
    console.log('Sample voucher data:', {
      id: vouchers[0].id,
      orderId: vouchers[0].order?.shopifyOrderId,
      lineItems: vouchers[0].order?.lineItems,
      lineItemsType: typeof vouchers[0].order?.lineItems
    });
  }

  return vouchers;
}

// Fetch a voucher by Shopify order ID
export async function getVoucherByOrderId(shopifyOrderId: string) {
  return prisma.voucher.findFirst({ where: { shopifyOrderId } });
}

// Fetch voucher by its code
export async function getVoucherByCode(code: string) {
  return prisma.voucher.findUnique({ where: { code } });
}

// Fetch vouchers for multiple shopifyOrderIds
export async function getVouchersByOrderIds(orderIds: string[]) {
  return prisma.voucher.findMany({ where: { shopifyOrderId: { in: orderIds } } });
}

// Fetch vouchers by customer email
export async function getVouchersByCustomerEmail(customerEmail: string) {
  return prisma.voucher.findMany({ 
    where: { customerEmail },
    orderBy: { createdAt: "desc" }
  });
}
