//@ts-nocheck
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
  type = null,
  expireDays = null,
  totalPrice = null
}: { 
  shopifyOrderId: string, 
  customerEmail: string, 
  productTitle?: string | null, 
  type?: string | null,
  expireDays?: number | string | null,
  totalPrice?: number | null
}) {
  // Generate a unique code for the voucher
  const code = generateVoucherCode();
  
  // Calculate expire date from expireDays
  let expireDate = null;
  if (expireDays) {
    try {
      const days = parseInt(expireDays.toString());
      if (!isNaN(days)) {
        const currentDate = new Date();
        currentDate.setDate(currentDate.getDate() + days);
        expireDate = currentDate;
        console.log(`🗓️ Calculated expire date: ${expireDate.toISOString()} (${days} days from now)`);
      }
    } catch (err) {
      console.log(`⚠️ Error calculating expire date from ${expireDays}:`, (err as Error).message);
    }
  }
  
  return prisma.voucher.create({
    data: {
      code,
      shopifyOrderId,
      customerEmail,
      productTitle,
      type,
      expire: expireDate,
      totalPrice: totalPrice ?? undefined,
    },
  });
}

// New function to create multiple vouchers for an order (one per product)
export async function createVouchersForOrder({ 
  shopifyOrderId, 
  customerEmail, 
  lineItems, 
  totalPrice = null
}: { 
  shopifyOrderId: string, 
  customerEmail: string, 
  lineItems: LineItem[],
  totalPrice?: number | null
}) {
  const vouchers = [];
  
  for (const item of lineItems) {
    // For gift cards, use quantity as is
    const isGiftCard = item.type === 'gift' || item.title.toLowerCase().includes('gift card');
    
    // Use the actual quantity from line item (already includes pack count calculations)
    const totalVouchers = item.quantity || 1;
    if (isGiftCard) {
      console.log(`🎁 Creating ${totalVouchers} gift card(s): ${item.quantity} × $${item.price} (${item.title})`);
    } else {
      console.log(`📦 Creating ${totalVouchers} voucher(s) for: ${item.title}`);
    }
    
    // Create all vouchers at once
    const voucherPromises = Array.from({ length: totalVouchers }, async (_, index) => {
      try {
        const voucher = await createVoucher({
          shopifyOrderId,
          customerEmail,
          productTitle: isGiftCard ? `${item.title} - $${item.price}` : item.title,
          type: isGiftCard ? 'gift' : (item.type || 'voucher'),
          expireDays: item.expire || null, // Pass expire days from lineItem
          totalPrice: totalPrice ?? null,
        });
        console.log(`🎟️ Created voucher ${voucher.code} for product: ${item.title} (expires in ${item.expire || 'no'} days)`);
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
