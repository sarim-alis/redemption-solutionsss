import { sendEmail } from "../utils/mail.server";
import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplateShared";
import { generateVoucherPDF } from "../utils/generateVoucherPDF";
import { generateGiftCardEmailHTML } from "./giftCardEmailTemplate";
import prisma from "../db.server";

/**
 * Enhanced voucher email sending with retry logic and comprehensive logging
 * @param {object} order - Order object (must have customerEmail, shopifyOrderId, etc)
 * @param {object} voucher - Voucher object (must have code, emailSent, etc)
 * @param {number} retryCount - Current retry attempt (default: 0)
 * @returns {Promise<{success: boolean, message: string, voucherCode: string}>}
 */
export async function sendVoucherEmailIfFirstOrder(order, voucher, retryCount = 0) {
  const maxRetries = 3;
  const voucherCode = voucher?.code || 'UNKNOWN';
  const customerEmail = order?.customerEmail || 'NO_EMAIL';
  
  console.log(`[VoucherEmail] 🚀 Starting email send process for voucher: ${voucherCode}`);
  console.log(`[VoucherEmail] 📧 Customer email: ${customerEmail}`);
  console.log(`[VoucherEmail] 🎫 Voucher code: ${voucherCode}`);
  console.log(`[VoucherEmail] 📦 Order ID: ${order?.shopifyOrderId || 'UNKNOWN'}`);
  
  // Validation checks
  if (!order?.customerEmail) {
    const errorMsg = `[VoucherEmail] ❌ Missing customer email for voucher: ${voucherCode}`;
    console.error(errorMsg);
    return { success: false, message: errorMsg, voucherCode };
  }
  
  if (!voucher) {
    const errorMsg = `[VoucherEmail] ❌ Missing voucher data for order: ${order.shopifyOrderId}`;
    console.error(errorMsg);
    return { success: false, message: errorMsg, voucherCode };
  }
  
  if (!voucher.code) {
    const errorMsg = `[VoucherEmail] ❌ Missing voucher code for order: ${order.shopifyOrderId}`;
    console.error(errorMsg);
    return { success: false, message: errorMsg, voucherCode };
  }
  
  // Check if email already sent
  if (voucher.emailSent) {
    const msg = `[VoucherEmail] ⏭️ Email already sent for voucher: ${voucherCode}`;
    console.log(msg);
    return { success: true, message: msg, voucherCode };
  }
  
  try {
    console.log(`[VoucherEmail] 📤 Attempting to send email (attempt ${retryCount + 1}/${maxRetries + 1})`);
    
    // Get customer name from order or use email as fallback
    const customerName = order.customerName || order.customer?.firstName || customerEmail.split('@')[0];
    const orderName = order.shopifyOrderId || 'your order';
    
    // Determine if this is a gift card order
    const isGift = order.type === 'gift' || (order.lineItems?.some(item => 
      item.title?.toLowerCase().includes('gift') || 
      item.type?.toLowerCase() === 'gift'
    ));
    
    console.log(`[VoucherEmail] 👤 Customer name: ${customerName}`);
    console.log(`[VoucherEmail] 🛒 Order name: ${orderName}`);
    console.log(`[VoucherEmail] 🎁 Order type: ${isGift ? 'Gift' : 'Voucher'}`);
    
    // Prepare email content based on order type
    let emailSubject, emailText, emailHtml;
    

    let attachments = [];
    if (!isGift) {
      // Generate PDF for voucher and attach
      try {
        const pdfBuffer = await generateVoucherPDF({ ...voucher, customerEmail });
        attachments.push({
          filename: `voucher-${voucherCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        });
      } catch (pdfErr) {
        console.error(`[VoucherEmail] ⚠️ Failed to generate PDF for voucher ${voucherCode}:`, pdfErr);
      }
    }

    const emailResult = await sendEmail({
      to: customerEmail,
      subject: emailSubject,
      text: emailText,
      html: emailHtml,
      ...(attachments.length > 0 ? { attachments } : {}),
    });
    
    console.log(`[VoucherEmail] ✅ Email sent successfully! Message ID: ${emailResult.messageId}`);
    
    // Update voucher status in database with transaction safety
    try {
      await prisma.$transaction(async (tx) => {
        // Double-check voucher still exists and email not sent
        const currentVoucher = await tx.voucher.findUnique({
          where: { code: voucherCode }
        });
        
        if (!currentVoucher) {
          throw new Error(`Voucher ${voucherCode} not found in database`);
        }
        
        if (currentVoucher.emailSent) {
          console.log(`[VoucherEmail] ⚠️ Voucher ${voucherCode} already marked as sent, skipping update`);
          return;
        }
        
        // Update voucher status
        await tx.voucher.update({
          where: { code: voucherCode },
          data: { 
            emailSent: true
          },
        });
        
        console.log(`[VoucherEmail] 💾 Database updated: voucher ${voucherCode} marked as email sent`);
      });
      
      const successMsg = `[VoucherEmail] 🎉 SUCCESS: Email sent and voucher ${voucherCode} updated for ${customerEmail}`;
      console.log(successMsg);
      
      // Log success metrics
      console.log(`[VoucherEmail] 📊 Email delivery successful for voucher: ${voucherCode}`);
      console.log(`[VoucherEmail] 📊 Customer: ${customerEmail}`);
      console.log(`[VoucherEmail] 📊 Order: ${order.shopifyOrderId}`);
      console.log(`[VoucherEmail] 📊 Timestamp: ${new Date().toISOString()}`);
      
      return { success: true, message: successMsg, voucherCode };
      
    } catch (dbError) {
      console.error(`[VoucherEmail] ❌ Database update failed for voucher ${voucherCode}:`, dbError.message);
      console.error(`[VoucherEmail] ❌ Full database error:`, dbError);
      
      // Email was sent but database update failed - this is critical
      const criticalMsg = `[VoucherEmail] 🚨 CRITICAL: Email sent but database update failed for voucher ${voucherCode}`;
      console.error(criticalMsg);
      
      return { success: false, message: criticalMsg, voucherCode };
    }
    
  } catch (emailError) {
    console.error(`[VoucherEmail] ❌ Email sending failed for voucher ${voucherCode}:`, emailError.message);
    console.error(`[VoucherEmail] ❌ Full email error:`, emailError);
    console.error(`[VoucherEmail] ❌ Error stack:`, emailError.stack);
    
    // Retry logic for transient failures
    if (retryCount < maxRetries) {
      const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
      console.log(`[VoucherEmail] 🔄 Retrying in ${retryDelay}ms... (attempt ${retryCount + 1}/${maxRetries})`);
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, retryDelay));
      
      // Recursive retry
      return await sendVoucherEmailIfFirstOrder(order, voucher, retryCount + 1);
    }
    
    // Max retries exceeded
    const failureMsg = `[VoucherEmail] 💥 FAILED: Email sending failed after ${maxRetries + 1} attempts for voucher ${voucherCode}`;
    console.error(failureMsg);
    console.error(`[VoucherEmail] 💥 Final failure details:`, {
      voucherCode,
      customerEmail,
      orderId: order?.shopifyOrderId,
      error: emailError.message,
      timestamp: new Date().toISOString()
    });
    
    return { success: false, message: failureMsg, voucherCode };
  }
}

/**
 * Batch email sending for multiple vouchers
 * @param {Array} voucherOrders - Array of {order, voucher} objects
 * @returns {Promise<Array>} - Results for each email attempt
 */
export async function sendBatchVoucherEmails(voucherOrders) {
  console.log(`[BatchEmail] 🚀 Starting batch email send for ${voucherOrders.length} vouchers`);
  
  const results = [];
  
  for (let i = 0; i < voucherOrders.length; i++) {
    const { order, voucher } = voucherOrders[i];
    console.log(`[BatchEmail] 📧 Processing ${i + 1}/${voucherOrders.length}: voucher ${voucher?.code}`);
    
    try {
      const result = await sendVoucherEmailIfFirstOrder(order, voucher);
      results.push(result);
      
      // Small delay between emails to avoid rate limiting
      if (i < voucherOrders.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`[BatchEmail] ❌ Error processing voucher ${voucher?.code}:`, error);
      results.push({ 
        success: false, 
        message: `Error: ${error.message}`, 
        voucherCode: voucher?.code || 'UNKNOWN' 
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.length - successCount;
  
  console.log(`[BatchEmail] 📊 Batch completed: ${successCount} successful, ${failureCount} failed`);
  
  return results;
}
