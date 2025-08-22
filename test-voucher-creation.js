// Test script to verify voucher creation and email sending
import { createVoucher } from './app/models/voucher.server.js';
import { sendVoucherEmailIfFirstOrder } from './app/utils/sendVoucherEmailIfFirstOrder.js';

async function testVoucherCreation() {
  try {
    console.log('🧪 Testing voucher creation and email sending...');
    
    // Test data
    const testOrder = {
      shopifyOrderId: 'TEST_ORDER_' + Date.now(),
      customerEmail: 'test@example.com',
      customerName: 'Test Customer'
    };
    
    const testVoucher = {
      code: 'TEST1234',
      shopifyOrderId: testOrder.shopifyOrderId,
      customerEmail: testOrder.customerEmail,
      emailSent: false
    };
    
    console.log('📧 Testing email sending...');
    await sendVoucherEmailIfFirstOrder(testOrder, testVoucher);
    
    console.log('✅ Test completed successfully!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testVoucherCreation();
