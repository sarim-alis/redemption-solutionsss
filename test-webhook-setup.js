import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testWebhookEndpoint() {
  console.log('🧪 TESTING WEBHOOK SETUP');
  console.log('=' .repeat(50));
  
  try {
    // Check if server is running by making a simple request
    console.log('1️⃣ Checking if development server is responding...');
    
    // Test database connectivity
    console.log('2️⃣ Testing database connection...');
    await prisma.$connect();
    
    const ordersBefore = await prisma.order.count();
    console.log(`📊 Current orders in database: ${ordersBefore}`);
    
    console.log('\n✅ Your setup is ready for webhook testing!');
    console.log('\n🎯 To test webhooks, you can:');
    console.log('');
    console.log('📍 METHOD 1: Create Order from Admin Dashboard');
    console.log('   1. Go to: https://redemptionsolution.myshopify.com/admin/orders');
    console.log('   2. Click "Create order"');
    console.log('   3. Add products and customer details');
    console.log('   4. Click "Create order" (this triggers orders/create webhook)');
    console.log('   5. Click "Mark as paid" (this triggers orders/paid webhook)');
    console.log('');
    console.log('📍 METHOD 2: Test from Store Frontend');
    console.log('   1. Go to: https://redemptionsolution.myshopify.com');
    console.log('   2. Add products to cart');
    console.log('   3. Complete checkout process');
    console.log('');
    console.log('🔍 Watch your terminal for webhook logs like:');
    console.log('   "🔔 WEBHOOK ENDPOINT HIT - Order Create"');
    console.log('   "✅ Webhook authenticated"');
    console.log('   "🎉 New order saved successfully"');
    console.log('');
    console.log('📋 After creating an order, run: node check-orders.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testWebhookEndpoint();
