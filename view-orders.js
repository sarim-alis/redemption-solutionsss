import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function viewAllOrders() {
  try {
    console.log('🔍 Checking all orders in database...\n');
    
    await prisma.$connect();
    
    // Get total count
    const totalOrders = await prisma.order.count();
    console.log(`📊 Total orders in database: ${totalOrders}\n`);
    
    if (totalOrders === 0) {
      console.log('❌ No orders found in database');
      console.log('💡 This could mean:');
      console.log('   1. Webhooks haven\'t been triggered yet');
      console.log('   2. There might be an issue with webhook processing');
      console.log('   3. No test orders have been created in Shopify store');
      return;
    }
    
    // Get all orders
    const orders = await prisma.order.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    console.log('📋 All orders:');
    console.log('═'.repeat(80));
    
    orders.forEach((order, index) => {
      console.log(`${index + 1}. Order ID: ${order.shopifyOrderId}`);
      console.log(`   Database ID: ${order.id}`);
      console.log(`   Customer: ${order.customerName || 'N/A'} (${order.customerEmail || 'N/A'})`);
      console.log(`   Total: ${order.totalPrice} ${order.currency}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Items: ${order.itemQuantity}`);
      console.log(`   Created: ${order.createdAt}`);
      console.log(`   Processed: ${order.processedAt}`);
      if (order.lineItems) {
        console.log(`   Line Items: ${JSON.stringify(order.lineItems)}`);
      }
      console.log('─'.repeat(80));
    });
    
  } catch (error) {
    console.error('❌ Error viewing orders:', error.message);
    console.error('Full error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

viewAllOrders();
