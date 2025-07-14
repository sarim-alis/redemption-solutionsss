import { saveOrder } from './app/models/order.server.ts';

// Sample order data that matches Shopify's webhook payload
const sampleOrderData = {
  id: 'gid://shopify/Order/123456789',
  name: '#1001',
  email: 'customer@example.com',
  created_at: '2025-07-02T17:00:00Z',
  updated_at: '2025-07-02T17:00:00Z',
  processed_at: '2025-07-02T17:00:00Z',
  currency: 'USD',
  total_price: '29.99',
  financial_status: 'paid',
  fulfillment_status: null,
  customer: {
    id: 'gid://shopify/Customer/987654321',
    email: 'customer@example.com',
    first_name: 'John',
    last_name: 'Doe'
  },
  line_items: [
    {
      id: 'gid://shopify/LineItem/111111111',
      title: 'Sample Product',
      quantity: 2,
      price: '14.99',
      product_id: 'gid://shopify/Product/222222222',
      variant_id: 'gid://shopify/ProductVariant/333333333'
    }
  ]
};

async function testWebhookHandler() {
  try {
    console.log('🧪 Testing webhook handler with sample data...');
    console.log('Sample order data:', JSON.stringify(sampleOrderData, null, 2));
    
    const result = await saveOrder(sampleOrderData);
    
    console.log('✅ Webhook handler test successful!');
    console.log('Saved order:', result);
    
  } catch (error) {
    console.error('❌ Webhook handler test failed:', error.message);
    console.error('Full error:', error);
  }
}

testWebhookHandler();
