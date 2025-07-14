import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkOrders() {
  const orders = await prisma.order.findMany({
    where: {
      shopifyOrderId: {
        not: {
          startsWith: 'test-'
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`📊 Real Shopify orders in database: ${orders.length}`);
  
  if (orders.length > 0) {
    console.log('✅ Webhooks are working! Latest orders:');
    orders.slice(0, 3).forEach((order, i) => {
      console.log(`${i+1}. Order ${order.shopifyOrderId} - ${order.status} - ${order.customerEmail}`);
    });
  } else {
    console.log('❌ No real Shopify orders found.');
    console.log('💡 This means webhooks from your Shopify store aren\'t working yet.');
  }
  
  await prisma.$disconnect();
}

checkOrders();
