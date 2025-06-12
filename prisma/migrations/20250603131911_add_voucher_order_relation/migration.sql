-- AddForeignKey
ALTER TABLE "Voucher" ADD CONSTRAINT "Voucher_shopifyOrderId_fkey" FOREIGN KEY ("shopifyOrderId") REFERENCES "Order"("shopifyId") ON DELETE RESTRICT ON UPDATE CASCADE;
