import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkDatabaseState() {
  try {
    console.log('🔄 Checking database state...');
    
    // Count orders
    const orderCount = await prisma.order.count();
    console.log(`📊 Total orders in database: ${orderCount}`);
    
    // Count vouchers
    const voucherCount = await prisma.voucher.count();
    console.log(`🎟️ Total vouchers in database: ${voucherCount}`);
    
    // Check for orphaned vouchers (vouchers that reference non-existent orders)
    const vouchers = await prisma.voucher.findMany({
      select: {
        id: true,
        shopifyOrderId: true,
        customerEmail: true
      }
    });
    
    console.log(`🔍 Found ${vouchers.length} vouchers, checking for orphaned records...`);
    
    for (const voucher of vouchers) {
      const orderExists = await prisma.order.findUnique({
        where: {
          shopifyOrderId: voucher.shopifyOrderId
        }
      });
      
      if (!orderExists) {
        console.log(`❌ ORPHANED VOUCHER FOUND: ${voucher.id} references missing order ${voucher.shopifyOrderId}`);
      }
    }
    
    // Get some sample orders
    const sampleOrders = await prisma.order.findMany({
      take: 5,
      select: {
        id: true,
        shopifyOrderId: true,
        customerEmail: true,
        status: true
      }
    });
    
    console.log('📋 Sample orders in database:');
    sampleOrders.forEach(order => {
      console.log(`  - ${order.shopifyOrderId}: ${order.customerEmail} (${order.status})`);
    });
    
    console.log('✅ Database state check completed');
    
  } catch (error) {
    console.error('❌ Error checking database state:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabaseState();
