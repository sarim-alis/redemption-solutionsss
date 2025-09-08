import { sendEmail } from "../utils/mail.server";
import { generateVoucherEmailHTML } from "../utils/voucherEmailTemplateShared";
import { generateGiftCardEmailHTML } from "./giftCardEmailTemplate";
import { generateUnifiedEmailHTML, generateUnifiedPDFHTML } from "./unifiedEmailTemplate";
import { generateIndividualVoucherJPEGs } from "./generateVoucherJPEG";
import { htmlToPdf } from "./htmlToPdf";
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
    
    // Determine if this is a gift card order - check voucher type first, then order type
    const isGift = voucher.type === 'gift' || order.type === 'gift' || (order.lineItems?.some(item => 
      item.title?.toLowerCase().includes('gift') || 
      item.type?.toLowerCase() === 'gift'
    ));
    
    console.log(`[VoucherEmail] 👤 Customer name: ${customerName}`);
    console.log(`[VoucherEmail] 🛒 Order name: ${orderName}`);
    console.log(`[VoucherEmail] 🎁 Order type: ${isGift ? 'Gift' : 'Voucher'}`);
    
    // Prepare email content based on order type
    let emailSubject, emailText, emailHtml, attachments = [];
    
    if (isGift) {
      // Gift card email
      const giftCardAmount = order.totalPrice || 0;
      const productTitle = voucher.productTitle || 'Gift Card';
      emailSubject = `Your Jiffy Lube ${productTitle} - Thank You!`;
      emailText = `Hello ${customerName},\n\nThank you for your gift purchase!\n\nProduct: ${productTitle}\nGift Amount: $${giftCardAmount.toFixed(2)}\nGift Code: ${voucherCode}\n\nYou can use this gift at any Jiffy Lube location or online at checkout.\n\nThank you for choosing Jiffy Lube!`;
      emailHtml = generateGiftCardEmailHTML({ 
        code: voucherCode, 
        customerEmail,
        amount: giftCardAmount,
        productTitle: productTitle
      });
      
      // Generate PDF attachment for gift card
      try {
        console.log('[GiftCardEmail] 📄 Generating PDF attachment...');
        const pdfBuffer = await htmlToPdf(emailHtml);
        attachments.push({
          filename: `gift-card-${voucherCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
        console.log('[GiftCardEmail] ✅ PDF generated successfully');
      } catch (pdfError) {
        console.error('[GiftCardEmail] ❌ Error generating PDF:', pdfError);
        // Continue without PDF if generation fails
      }
    } else {
      // Voucher email (default)
      const productTitle = voucher.productTitle || 'Oil Change Voucher';
      emailSubject = `Here are your ${productTitle}! Where to Redeem... 🎟️`;
      emailText = `Hello ${customerName},\n\nThank you for your order ${orderName}.\n\nProduct: ${productTitle}\nVoucher Code: ${voucherCode}`;
      emailHtml = generateVoucherEmailHTML({ ...voucher, customerEmail, productTitle });
      
      // Generate PDF attachment for voucher
      try {
        console.log('[VoucherEmail] 📄 Generating PDF attachment...');
        const pdfBuffer = await htmlToPdf(emailHtml);
        attachments.push({
          filename: `voucher-${voucherCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf'
        });
        console.log('[VoucherEmail] ✅ PDF generated successfully');
      } catch (pdfError) {
        console.error('[VoucherEmail] ❌ Error generating PDF:', pdfError);
        // Continue without PDF if generation fails
      }
    }
    
    console.log('[VoucherEmail] 📧 Sending email with subject:', emailSubject);
    console.log('[VoucherEmail] 📧 Email HTML length:', emailHtml?.length);
    console.log('[VoucherEmail] 📧 Attachments:', attachments.length);

    const emailData = {
      to: customerEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments
    };

    const emailResult = await sendEmail(emailData);
    
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
 * Send unified email for multiple vouchers in a single email
 * @param {object} order - Order object
 * @param {Array} vouchers - Array of voucher objects
 * @returns {Promise<{success: boolean, message: string}>}
 */
export async function sendUnifiedVoucherEmail(order, vouchers) {
  const customerEmail = order?.customerEmail || 'NO_EMAIL';
  const voucherCodes = vouchers.map(v => v.code).join(', ');
  
  console.log(`[UnifiedEmail] 🚀 Starting unified email send for ${vouchers.length} vouchers`);
  console.log(`[UnifiedEmail] 📧 Customer email: ${customerEmail}`);
  console.log(`[UnifiedEmail] 🎫 Voucher codes: ${voucherCodes}`);
  
  // Validation checks
  if (!order?.customerEmail) {
    const errorMsg = `[UnifiedEmail] ❌ Missing customer email for vouchers: ${voucherCodes}`;
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }
  
  if (!vouchers || vouchers.length === 0) {
    const errorMsg = `[UnifiedEmail] ❌ No vouchers provided for order: ${order.shopifyOrderId}`;
    console.error(errorMsg);
    return { success: false, message: errorMsg };
  }
  
  // Check if any voucher already has email sent
  const alreadySentVouchers = vouchers.filter(v => v.emailSent);
  if (alreadySentVouchers.length > 0) {
    const msg = `[UnifiedEmail] ⏭️ Some vouchers already have emails sent: ${alreadySentVouchers.map(v => v.code).join(', ')}`;
    console.log(msg);
    // Continue with remaining vouchers
  }
  
  try {
    console.log(`[UnifiedEmail] 📤 Generating unified email content...`);
    
    // Get customer name from order or use email as fallback
    const customerName = order.customerName || order.customer?.firstName || customerEmail.split('@')[0];
    
    // Generate unified email HTML
    const emailHtml = generateUnifiedEmailHTML({ order, vouchers });
    
    // Generate unified PDF HTML
    const pdfHtml = generateUnifiedPDFHTML({ order, vouchers });
    
    // Prepare email content
    const emailSubject = `Your Jiffy Lube Order - ${vouchers.length} Item${vouchers.length > 1 ? 's' : ''} Ready!`;
    const emailText = `Hello ${customerName},\n\nThank you for your order ${order.shopifyOrderId}.\n\nYou have ${vouchers.length} item${vouchers.length > 1 ? 's' : ''} ready to use:\n${vouchers.map(v => `- ${v.productTitle || 'Voucher'}: ${v.code}`).join('\n')}\n\nPlease see the email for full details and redemption instructions.`;
    
    console.log('[UnifiedEmail] 📧 Sending unified email with subject:', emailSubject);
    console.log('[UnifiedEmail] 📧 Email HTML length:', emailHtml?.length);

    // Generate PDF attachment
    let attachments = [];
    try {
      console.log('[UnifiedEmail] 📄 Generating unified PDF attachment...');
      const pdfBuffer = await htmlToPdf(pdfHtml);
      attachments.push({
        filename: `jiffy-lube-order-${order.shopifyOrderId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf'
      });
      console.log('[UnifiedEmail] ✅ Unified PDF generated successfully');
    } catch (pdfError) {
      console.error('[UnifiedEmail] ❌ Error generating unified PDF:', pdfError);
      // Continue without PDF if generation fails
    }

    // Generate individual voucher JPEG attachments
    try {
      console.log('[UnifiedEmail] 🖼️ Generating individual voucher JPEGs...');
      const jpegAttachments = await generateIndividualVoucherJPEGs(vouchers, order);
      attachments.push(...jpegAttachments);
      console.log(`[UnifiedEmail] ✅ Generated ${jpegAttachments.length} individual JPEG attachments`);
    } catch (jpegError) {
      console.error('[UnifiedEmail] ❌ Error generating individual JPEGs:', jpegError);
      // Continue without individual JPEGs if generation fails
    }

    const emailData = {
      to: customerEmail,
      subject: emailSubject,
      html: emailHtml,
      text: emailText,
      attachments
    };

    const emailResult = await sendEmail(emailData);
    
    console.log(`[UnifiedEmail] ✅ Unified email sent successfully! Message ID: ${emailResult.messageId}`);
    
    // Update all vouchers status in database with transaction safety
    try {
      await prisma.$transaction(async (tx) => {
        for (const voucher of vouchers) {
          // Double-check voucher still exists and email not sent
          const currentVoucher = await tx.voucher.findUnique({
            where: { code: voucher.code }
          });
          
          if (!currentVoucher) {
            console.log(`[UnifiedEmail] ⚠️ Voucher ${voucher.code} not found in database`);
            continue;
          }
          
          if (currentVoucher.emailSent) {
            console.log(`[UnifiedEmail] ⚠️ Voucher ${voucher.code} already marked as sent, skipping update`);
            continue;
          }
          
          // Update voucher status
          await tx.voucher.update({
            where: { code: voucher.code },
            data: { 
              emailSent: true
            },
          });
          
          console.log(`[UnifiedEmail] 💾 Database updated: voucher ${voucher.code} marked as email sent`);
        }
      });
      
      const successMsg = `[UnifiedEmail] 🎉 SUCCESS: Unified email sent and ${vouchers.length} vouchers updated for ${customerEmail}`;
      console.log(successMsg);
      
      return { success: true, message: successMsg };
      
    } catch (dbError) {
      console.error(`[UnifiedEmail] ❌ Database update failed:`, dbError.message);
      
      // Email was sent but database update failed - this is critical
      const criticalMsg = `[UnifiedEmail] 🚨 CRITICAL: Email sent but database update failed`;
      console.error(criticalMsg);
      
      return { success: false, message: criticalMsg };
    }
    
  } catch (emailError) {
    console.error(`[UnifiedEmail] ❌ Unified email sending failed:`, emailError.message);
    console.error(`[UnifiedEmail] ❌ Full email error:`, emailError);
    
    const failureMsg = `[UnifiedEmail] 💥 FAILED: Unified email sending failed`;
    console.error(failureMsg);
    
    return { success: false, message: failureMsg };
  }
}

/**
 * Batch email sending for multiple vouchers (legacy function)
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
