import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testOrderSave() {
  const testOrderData = {
    id: '5903626043488',
    email: 'hamiking412@gmail.com',
    customer: { 
      firstName: null, 
      lastName: null, 
      email: 'hamiking412@gmail.com' 
    },
    total_price: '100.00',
    currency: 'USD',
    financial_status: 'paid',
    fulfillment_status: null,
    processed_at: new Date().toISOString(),
    line_items: [
      {
        title: 'Test Product',
        quantity: 1,
        price: '100.00',
        product_id: '123',
        variant_id: '456'
      }
    ]
  };

  console.log('🧪 Testing order save with exact data structure...');
  
  try {
    // Test the exact same data structure that's causing the error
    const orderInfo = {
      shopifyOrderId: testOrderData.id.toString(),
      customerEmail: testOrderData.email || testOrderData.customer?.email || null,
      customerName: testOrderData.customer 
        ? `${testOrderData.customer.firstName || ''} ${testOrderData.customer.lastName || ''}`.trim() 
        : null,
      totalPrice: parseFloat(testOrderData.total_price) || 0,
      currency: testOrderData.currency || 'USD',
      status: testOrderData.financial_status?.toUpperCase() || 'PENDING',
      fulfillmentStatus: testOrderData.fulfillment_status || null,
      itemQuantity: testOrderData.line_items?.reduce((sum, item) => sum + parseInt(item.quantity), 0) || 0,
      processedAt: new Date(testOrderData.processed_at),
      lineItems: testOrderData.line_items || [],
    };

    console.log('📋 Order info prepared:', JSON.stringify(orderInfo, null, 2));

    console.log('💾 Attempting upsert...');
    const result = await prisma.order.upsert({
      where: {
        shopifyOrderId: orderInfo.shopifyOrderId,
      },
      update: orderInfo,
      create: orderInfo,
    });

    console.log('✅ Upsert successful:', result);
    
  } catch (error) {
    console.error('❌ Error during test:', error);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderSave();
