import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkForRealOrders() {
  try {
    const realOrders = await prisma.order.findMany({
      where: {
        shopifyOrderId: {
          not: {
            startsWith: 'test-'
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`🎯 Real Shopify orders in database: ${realOrders.length}`);
    
    if (realOrders.length > 0) {
      console.log('🎉 SUCCESS! Webhooks are working!');
      console.log('\n📋 Recent orders:');
      realOrders.forEach((order, i) => {
        console.log(`${i+1}. Order ${order.shopifyOrderId}`);
        console.log(`   Customer: ${order.customerEmail}`);
        console.log(`   Status: ${order.status}`);
        console.log(`   Total: ${order.totalPrice} ${order.currency}`);
        console.log(`   Created: ${order.createdAt}`);
        console.log('---');
      });
    } else {
      console.log('⏳ No real orders yet. Create a test order in your Shopify store!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkForRealOrders();
