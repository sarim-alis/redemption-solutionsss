# Enhanced Email System for Voucher Automation

## Overview
This enhanced email system provides robust, reliable email delivery for your Shopify voucher automation app. It includes comprehensive error handling, retry logic, monitoring, and logging to ensure emails are delivered successfully in your background processing environment.

## 🚀 Key Features

### ✅ **Reliable Email Delivery**
- **Automatic retry logic** with exponential backoff (3 attempts)
- **Connection validation** and health checks
- **Timeout handling** to prevent hanging processes
- **Rate limiting** to avoid SMTP server issues

### ✅ **Comprehensive Logging**
- **Detailed logging** for every email attempt
- **Success/failure tracking** with timestamps
- **Error classification** and debugging information
- **Performance metrics** and monitoring

### ✅ **Background Processing Ready**
- **Non-blocking email sending** in webhooks
- **Database transaction safety** for voucher updates
- **Graceful error handling** without crashing the app
- **Queue management** for high-volume scenarios

### ✅ **Monitoring & Health Checks**
- **SMTP connection verification**
- **Email delivery success rates**
- **Performance metrics tracking**
- **Health check endpoints**

## 📧 How It Works

### 1. **Order Creation Flow**
```
Shopify Webhook → Order Saved → Voucher Created → Email Sent → Status Updated
```

### 2. **Order Payment Flow**
```
Shopify Webhook → Order Updated → Voucher Created (if needed) → Email Sent → Status Updated
```

### 3. **Email Processing Flow**
```
Validate Email → Send via SMTP → Update Database → Log Results → Handle Errors
```

## 🔧 Configuration

### Environment Variables
```bash
# Required
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Optional
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
EMAIL_LOG_LEVEL=INFO
CRITICAL_ERROR_EMAIL=admin@yourcompany.com
```

### Gmail Setup (Recommended)
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the App Password as `SMTP_PASS`

## 📊 Monitoring & Logging

### Log Levels
- **DEBUG**: Detailed debugging information
- **INFO**: General information and success messages
- **WARN**: Warning messages
- **ERROR**: Error messages
- **CRITICAL**: Critical failures requiring immediate attention

### Log Format
```
[VoucherEmail] 🚀 Starting email send process for voucher: ABC123
[VoucherEmail] 📧 Customer email: customer@example.com
[VoucherEmail] ✅ Email sent successfully! Message ID: <abc123@server>
[VoucherEmail] 💾 Database updated: voucher ABC123 marked as email sent
```

### Metrics Tracking
- Total emails sent
- Success/failure rates
- Average send time
- Retry counts
- Last email timestamps

## 🧪 Testing & Health Checks

### Run Health Check
```bash
node email-health-check.js
```

### Test Email Functionality
```bash
node test-voucher-creation.js
```

### Monitor in Production
```javascript
import { checkMailServerHealth, EmailMetrics } from './app/utils/mail.server.js';

// Check SMTP health
const health = await checkMailServerHealth();
console.log('SMTP Health:', health);

// Get email metrics
const stats = EmailMetrics.getStats();
console.log('Email Stats:', stats);
```

## 🚨 Error Handling

### Common Error Types
- **AUTHENTICATION_FAILED**: Check SMTP credentials
- **CONNECTION_FAILED**: Check network/SMTP server
- **TIMEOUT**: SMTP server is slow or unresponsive
- **INVALID_EMAIL**: Malformed email address
- **DATABASE_ERROR**: Database update failed

### Error Recovery
- **Automatic retries** with exponential backoff
- **Graceful degradation** when email fails
- **Critical error alerts** for system administrators
- **Comprehensive error logging** for debugging

## 📈 Performance Optimization

### Rate Limiting
- Maximum 5 emails per second
- 100ms delay between emails
- Configurable limits

### Connection Management
- Connection pooling
- Timeout handling
- Automatic reconnection

### Database Optimization
- Transaction safety
- Batch processing support
- Efficient queries

## 🔍 Troubleshooting

### Email Not Sending
1. Check SMTP credentials
2. Verify network connectivity
3. Check SMTP server status
4. Review error logs

### High Failure Rate
1. Check SMTP server limits
2. Verify email addresses
3. Review rate limiting settings
4. Monitor server resources

### Performance Issues
1. Check database performance
2. Review SMTP timeouts
3. Monitor memory usage
4. Check log levels

## 📋 Best Practices

### 1. **Environment Setup**
- Use dedicated SMTP credentials
- Set appropriate timeouts
- Configure logging levels

### 2. **Monitoring**
- Regular health checks
- Success rate monitoring
- Error alerting
- Performance tracking

### 3. **Maintenance**
- Regular credential rotation
- Log rotation and cleanup
- Database maintenance
- Performance optimization

### 4. **Security**
- Secure SMTP credentials
- Email validation
- Rate limiting
- Access control

## 🎯 Usage Examples

### Basic Email Sending
```javascript
import { sendVoucherEmailIfFirstOrder } from './app/utils/sendVoucherEmailIfFirstOrder.js';

const result = await sendVoucherEmailIfFirstOrder(order, voucher);
if (result.success) {
  console.log('Email sent successfully:', result.voucherCode);
} else {
  console.error('Email failed:', result.message);
}
```

### Batch Email Processing
```javascript
import { sendBatchVoucherEmails } from './app/utils/sendVoucherEmailIfFirstOrder.js';

const results = await sendBatchVoucherEmails(voucherOrders);
const successCount = results.filter(r => r.success).length;
console.log(`Sent ${successCount}/${results.length} emails successfully`);
```

### Health Monitoring
```javascript
import { checkMailServerHealth } from './app/utils/mail.server.js';

setInterval(async () => {
  const health = await checkMailServerHealth();
  if (!health.connected) {
    console.error('SMTP connection lost!');
    // Send alert to admin
  }
}, 5 * 60 * 1000); // Check every 5 minutes
```

## 📚 API Reference

### `sendVoucherEmailIfFirstOrder(order, voucher, retryCount)`
Sends voucher email with retry logic and comprehensive logging.

**Parameters:**
- `order`: Order object with customer information
- `voucher`: Voucher object with code and status
- `retryCount`: Current retry attempt (optional)

**Returns:**
```javascript
{
  success: boolean,
  message: string,
  voucherCode: string
}
```

### `sendBatchVoucherEmails(voucherOrders)`
Processes multiple vouchers in batch with rate limiting.

**Parameters:**
- `voucherOrders`: Array of {order, voucher} objects

**Returns:**
```javascript
Array<{
  success: boolean,
  message: string,
  voucherCode: string
}>
```

### `checkMailServerHealth()`
Checks SMTP connection and returns health status.

**Returns:**
```javascript
{
  status: 'healthy' | 'unhealthy' | 'error',
  connected: boolean,
  error?: string
}
```

## 🎉 Success Indicators

Your email system is working correctly when you see:
- ✅ `[VoucherEmail] 🎉 SUCCESS: Email sent and voucher updated`
- ✅ `[MailServer] ✅ Email sent successfully`
- ✅ `[Webhook] Email sent successfully for voucher: ABC123`
- 📊 High success rates in metrics
- 🔍 Clean health check results

## 🆘 Support

If you encounter issues:
1. Check the logs for detailed error messages
2. Run the health check script
3. Verify environment variables
4. Check SMTP server status
5. Review database connectivity

The enhanced logging will provide detailed information to help diagnose and resolve any issues quickly.
