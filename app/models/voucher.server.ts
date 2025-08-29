import prisma from "../db.server";
import { v4 as uuidv4 } from "uuid";

function generateVoucherCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export async function createVoucher({ shopifyOrderId, customerEmail }: { shopifyOrderId: string, customerEmail: string }) {
  // Generate a unique code for the voucher
  // const code = uuidv4();
  const code = generateVoucherCode();
  return prisma.voucher.create({
    data: {
      code,
      shopifyOrderId,
      customerEmail,
    },
  });
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
