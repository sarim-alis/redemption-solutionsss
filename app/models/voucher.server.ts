import prisma from "../db.server";
import { v4 as uuidv4 } from "uuid";

export async function createVoucher({ shopifyOrderId, customerEmail }: { shopifyOrderId: string, customerEmail: string }) {
  // Generate a unique code for the voucher
  const code = uuidv4();
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
