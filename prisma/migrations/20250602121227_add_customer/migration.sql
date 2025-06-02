-- CreateTable
CREATE TABLE "Customer" (
    "id" SERIAL NOT NULL,
    "shopifyId" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "state" TEXT,
    "totalOrders" INTEGER NOT NULL,
    "amountSpent" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "address1" TEXT,
    "city" TEXT,
    "province" TEXT,
    "country" TEXT,
    "zip" TEXT,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Customer_shopifyId_key" ON "Customer"("shopifyId");
