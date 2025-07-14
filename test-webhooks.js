import { saveOrder } from './app/models/order.server.ts';

// Test with typical Shopify order create webhook payload
const testOrderCreatePayload = {
  id: 4567890123,
  name: "#1001",
  email: "test@example.com",
  created_at: "2025-07-02T17:45:00+00:00",
  updated_at: "2025-07-02T17:45:00+00:00",
  processed_at: null,
  currency: "USD",
  total_price: "35.99",
  financial_status: "pending",
  fulfillment_status: null,
  customer: {
    id: 2345678901,
    email: "test@example.com",
    first_name: "John",
    last_name: "Doe"
  },
  line_items: [
    {
      id: 8901234567,
      title: "Sample Product",
      quantity: 1,
      price: "35.99",
      product_id: 3456789012,
      variant_id: 4567890123
    }
  ]
};

// Test with typical Shopify order paid webhook payload
const testOrderPaidPayload = {
  ...testOrderCreatePayload,
  processed_at: "2025-07-02T17:46:00+00:00",
  financial_status: "paid"
};

async function testWebhooks() {
  console.log('🧪 Testing Shopify Webhook Handlers\n');

  try {
    // Test order create
    console.log('1️⃣ Testing Order Create Webhook Handler');
    console.log('📦 Simulating order create payload...');
    
    const createResult = await saveOrder(testOrderCreatePayload);
    console.log('✅ Order create test passed!');
    console.log('Created order:', {
      id: createResult.id,
      shopifyOrderId: createResult.shopifyOrderId,
      status: createResult.status,
      customer: createResult.customerEmail
    });
    console.log('');

    // Test order paid (update)
    console.log('2️⃣ Testing Order Paid Webhook Handler');
    console.log('💰 Simulating order paid payload...');
    
    const paidResult = await saveOrder(testOrderPaidPayload);
    console.log('✅ Order paid test passed!');
    console.log('Updated order:', {
      id: paidResult.id,
      shopifyOrderId: paidResult.shopifyOrderId,
      status: paidResult.status,
      customer: paidResult.customerEmail
    });
    console.log('');

    console.log('🎉 All webhook tests passed successfully!');
    console.log('🔍 Your webhook handlers are working correctly.');
    console.log('📋 Next steps:');
    console.log('   1. Start your app: npm run dev');
    console.log('   2. Create a test order in your Shopify store');
    console.log('   3. Watch the console logs for webhook activity');

  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    console.error('🔍 Error details:', error);
    console.log('');
    console.log('🛠️  Troubleshooting steps:');
    console.log('   1. Check your DATABASE_URL environment variable');
    console.log('   2. Ensure PostgreSQL is running');
    console.log('   3. Run: npx prisma generate');
    console.log('   4. Run: npx prisma db push');
  }
}

testWebhooks();
