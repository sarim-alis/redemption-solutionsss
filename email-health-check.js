// Email Health Check and Monitoring Script
import { checkMailServerHealth, sendTestEmail } from './app/utils/mail.server.js';
import { sendVoucherEmailIfFirstOrder } from './app/utils/sendVoucherEmailIfFirstOrder.js';

async function runEmailHealthCheck() {
  console.log('🏥 Starting Email System Health Check...\n');
  
  try {
    // 1. Check SMTP connection
    console.log('🔍 Step 1: Checking SMTP connection...');
    const healthStatus = await checkMailServerHealth();
    console.log('📊 Health Status:', healthStatus);
    
    if (!healthStatus.connected) {
      console.error('❌ SMTP connection failed. Please check your configuration.');
      return;
    }
    
    console.log('✅ SMTP connection is healthy!\n');
    
    // 2. Send test email
    console.log('🔍 Step 2: Sending test email...');
    const testResult = await sendTestEmail();
    console.log('📧 Test email result:', testResult);
    console.log('✅ Test email sent successfully!\n');
    
    // 3. Test voucher email functionality
    console.log('🔍 Step 3: Testing voucher email functionality...');
    
    const testOrder = {
      shopifyOrderId: 'TEST_ORDER_' + Date.now(),
      customerEmail: 'test@example.com',
      customerName: 'Test Customer'
    };
    
    const testVoucher = {
      code: 'TEST' + Date.now().toString().slice(-6),
      shopifyOrderId: testOrder.shopifyOrderId,
      customerEmail: testOrder.customerEmail,
      emailSent: false
    };
    
    console.log('📦 Test order:', testOrder);
    console.log('🎟️ Test voucher:', testVoucher);
    
    const emailResult = await sendVoucherEmailIfFirstOrder(testOrder, testVoucher);
    console.log('📧 Voucher email result:', emailResult);
    
    if (emailResult.success) {
      console.log('✅ Voucher email functionality is working correctly!');
    } else {
      console.error('❌ Voucher email functionality failed:', emailResult.message);
    }
    
    console.log('\n🎉 Email Health Check Completed!');
    
  } catch (error) {
    console.error('💥 Health check failed:', error);
    console.error('Stack trace:', error.stack);
  }
}

// Run health check
runEmailHealthCheck();
