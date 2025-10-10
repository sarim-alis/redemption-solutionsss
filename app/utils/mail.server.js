import nodemailer from "nodemailer";

// Environment variables
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpHost = process.env.SMTP_HOST || "email-smtp.us-east-1.amazonaws.com";
const smtpPort = process.env.SMTP_PORT || 587;
const smtpSecure = false;
const smtpFrom = process.env.SMTP_FROM || "info@jiffylubespecials.com";

console.log("📧 [MailServer] Loading SMTP configuration...");
console.log(`📧 [MailServer] Host: ${smtpHost}:${smtpPort}`);
console.log(`📧 [MailServer] Secure: ${smtpSecure}`);
console.log(`📧 [MailServer] User: ${smtpUser ? '✅ Set' : '❌ Missing'}`);
console.log(`📧 [MailServer] Pass: ${smtpPass ? '✅ Set' : '❌ Missing'}`);

// Validate environment variables
if (!smtpUser || !smtpPass) {
    const error = "❌ [MailServer] SMTP credentials are missing from environment variables";
    console.error(error);
    console.error("📧 [MailServer] Please set SMTP_USER and SMTP_PASS environment variables");
    throw new Error(error);
}

// Create transporter with enhanced configuration
const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
        user: smtpUser,
        pass: smtpPass,
    },
    // Connection timeout settings
    connectionTimeout: 30000, // 30 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
    // Rate limiting
    rateLimit: 5,             // Max 5 emails per second
    rateDelta: 1000,          // Per second
});

// Verify connection on startup
async function verifyConnection() {
    try {
        console.log("📧 [MailServer] Verifying SMTP connection...");
        await transporter.verify();
        console.log("✅ [MailServer] SMTP connection verified successfully");
        return true;
    } catch (error) {
        console.error("❌ [MailServer] SMTP connection verification failed:", error.message);
        console.error("📧 [MailServer] Please check your SMTP credentials and network connection");
        return false;
    }
}

/**
 * Enhanced email sending function with attachment support
 * @param {string|string[]} to - Recipient email address(es)
 * @param {string} subject - Email subject
 * @param {string} [text] - Plain text version
 * @param {string} [html] - HTML version
 * @param {string} [priority] - Email priority (high, normal, low)
 * @param {Array} [attachments] - Array of attachment objects
 * @returns {Promise<{success: boolean, messageId: string}>}
 */
export async function sendEmail({ to, subject, text, html, priority = 'normal', attachments = [] }) {
    const emailId = `EMAIL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const timestamp = new Date().toISOString();
    
    console.log(`📧 [MailServer] 🚀 Starting email send process: ${emailId}`);
    console.log(`📧 [MailServer] 📮 To: ${to}`);
    console.log(`📧 [MailServer] 📝 Subject: ${subject}`);
    console.log(`📧 [MailServer] ⏰ Timestamp: ${timestamp}`);
    console.log(`📧 [MailServer] 🎯 Priority: ${priority}`);
    
    // Validate email parameters
    if (!to || !subject || (!text && !html)) {
        const error = `❌ [MailServer] Invalid email parameters: to=${!!to}, subject=${!!subject}, content=${!!(text || html)}`;
        console.error(error);
        throw new Error(error);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
        const error = `❌ [MailServer] Invalid email format: ${to}`;
        console.error(error);
        throw new Error(error);
    }
    
    try {
        // Prepare email options
        const mailOptions = {
            from: `"Jiffy Lube Specials" <${smtpFrom}>`,
            to: Array.isArray(to) ? to.join(', ') : to,
            subject: subject || 'No Subject',
            priority: ['high', 'low'].includes(priority) ? priority : 'normal',
            // Only include text/html if they have content
            ...(text && { text }),
            ...(html && { html }),
            headers: {
                'X-Email-ID': emailId,
                'X-Priority': priority,
                'X-Sent-From': 'Shopify-Voucher-App'
            },
        };

        // Handle attachments if any
        if (attachments && attachments.length > 0) {
            mailOptions.attachments = attachments.map(attachment => ({
                filename: attachment.filename || 'attachment.pdf',
                content: attachment.content,
                contentType: attachment.contentType || 'application/octet-stream',
                ...(attachment.encoding && { encoding: attachment.encoding }),
                ...(attachment.cid && { cid: attachment.cid })
            }));
        }

        console.log(` [MailServer]  Sending email via SMTP...`);
        
        console.log(`📧 [MailServer] 📤 Sending email via SMTP...`);
        
        // Send email with timeout
        const sendPromise = transporter.sendMail(mailOptions);
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('SMTP timeout after 30 seconds')), 30000)
        );
        
        const info = await Promise.race([sendPromise, timeoutPromise]);
        
        // Log success
        console.log(`✅ [MailServer] Email sent successfully: ${emailId}`);
        console.log(`📧 [MailServer] 📨 Message ID: ${info.messageId}`);
        console.log(`📧 [MailServer] 📮 To: ${to}`);
        console.log(`📧 [MailServer] 📝 Subject: ${subject}`);
        console.log(`📧 [MailServer] ⏰ Sent at: ${new Date().toISOString()}`);
        console.log(`📧 [MailServer] 📊 Response: ${info.response}`);
        
        // Return enhanced info
        return {
            ...info,
            emailId,
            timestamp,
            success: true
        };
        
    } catch (error) {
        console.error(`❌ [MailServer] Email sending failed: ${emailId}`);
        console.error(`📧 [MailServer] Error details:`, {
            emailId,
            to,
            subject,
            error: error.message,
            stack: error.stack,
            timestamp
        });
        
        // Enhanced error classification
        let errorType = 'UNKNOWN';
        if (error.code === 'EAUTH') {
            errorType = 'AUTHENTICATION_FAILED';
            console.error(`📧 [MailServer] 🔐 Authentication failed - check SMTP credentials`);
        } else if (error.code === 'ECONNECTION') {
            errorType = 'CONNECTION_FAILED';
            console.error(`📧 [MailServer] 🌐 Connection failed - check network/SMTP server`);
        } else if (error.code === 'ETIMEDOUT') {
            errorType = 'TIMEOUT';
            console.error(`📧 [MailServer] ⏰ SMTP timeout - server may be slow`);
        } else if (error.message.includes('timeout')) {
            errorType = 'TIMEOUT';
            console.error(`📧 [MailServer] ⏰ SMTP timeout - server may be slow`);
        }
        
        // Throw enhanced error
        const enhancedError = new Error(`Email sending failed: ${error.message}`);
        enhancedError.emailId = emailId;
        enhancedError.errorType = errorType;
        enhancedError.originalError = error;
        enhancedError.timestamp = timestamp;
        
        throw enhancedError;
    }
}

// Test email function for debugging
export async function sendTestEmail(to = smtpUser) {
    console.log("🧪 [MailServer] Sending test email...");
    
    try {
        const result = await sendEmail({
            to,
            subject: "🧪 Test Email - Voucher System",
            text: "This is a test email to verify SMTP configuration.",
            html: "<h1>🧪 Test Email</h1><p>This is a test email to verify SMTP configuration.</p>",
            priority: 'high'
        });
        
        console.log("✅ [MailServer] Test email sent successfully!");
        return result;
    } catch (error) {
        console.error("❌ [MailServer] Test email failed:", error.message);
        throw error;
    }
}

// Health check function
export async function checkMailServerHealth() {
    try {
        const isConnected = await verifyConnection();
        if (isConnected) {
            console.log("✅ [MailServer] Health check passed");
            return { status: 'healthy', connected: true };
        } else {
            console.log("❌ [MailServer] Health check failed");
            return { status: 'unhealthy', connected: false };
        }
    } catch (error) {
        console.error("❌ [MailServer] Health check error:", error.message);
        return { status: 'error', connected: false, error: error.message };
    }
}

// Initialize connection verification on module load
verifyConnection().catch(error => {
    console.error("❌ [MailServer] Initial connection verification failed:", error.message);
});

export default {
    sendEmail,
    sendTestEmail,
    checkMailServerHealth,
    verifyConnection
};
