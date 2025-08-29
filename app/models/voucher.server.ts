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
  return prisma.voucher.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      order: {
        select: {
          statusUse: true
        }
      }
    }
  });
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
