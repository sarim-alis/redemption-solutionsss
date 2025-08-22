// Email Monitoring and Logging Configuration
export const EMAIL_CONFIG = {
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAYS: [1000, 2000, 4000], // Exponential backoff in milliseconds
  
  // Timeout settings
  SMTP_TIMEOUT: 30000, // 30 seconds
  EMAIL_PROCESSING_TIMEOUT: 60000, // 60 seconds
  
  // Rate limiting
  MAX_EMAILS_PER_SECOND: 5,
  DELAY_BETWEEN_EMAILS: 100, // milliseconds
  
  // Logging levels
  LOG_LEVEL: process.env.EMAIL_LOG_LEVEL || 'INFO', // DEBUG, INFO, WARN, ERROR
  
  // Email templates
  SUBJECT_TEMPLATE: 'Here are your Oil Change Vouchers! Where to Redeem... 🎟️',
  FROM_NAME: 'Redemption Solutions 🎟️',
  
  // Monitoring
  ENABLE_METRICS: true,
  ENABLE_HEALTH_CHECKS: true,
  HEALTH_CHECK_INTERVAL: 300000, // 5 minutes
  
  // Error handling
  ENABLE_CRITICAL_ERROR_ALERTS: true,
  CRITICAL_ERROR_EMAIL: process.env.CRITICAL_ERROR_EMAIL || null,
  
  // Database
  ENABLE_EMAIL_LOGGING: true,
  LOG_EMAIL_ATTEMPTS: true,
  LOG_EMAIL_SUCCESS: true,
  LOG_EMAIL_FAILURES: true
};

// Logging utility functions
export const EmailLogger = {
  debug: (message, data = {}) => {
    if (EMAIL_CONFIG.LOG_LEVEL === 'DEBUG') {
      console.log(`🔍 [EmailDebug] ${message}`, data);
    }
  },
  
  info: (message, data = {}) => {
    console.log(`📧 [EmailInfo] ${message}`, data);
  },
  
  warn: (message, data = {}) => {
    console.warn(`⚠️ [EmailWarn] ${message}`, data);
  },
  
  error: (message, data = {}) => {
    console.error(`❌ [EmailError] ${message}`, data);
  },
  
  success: (message, data = {}) => {
    console.log(`✅ [EmailSuccess] ${message}`, data);
  },
  
  critical: (message, data = {}) => {
    console.error(`🚨 [EmailCritical] ${message}`, data);
    
    // Send critical error alert if configured
    if (EMAIL_CONFIG.ENABLE_CRITICAL_ERROR_ALERTS && EMAIL_CONFIG.CRITICAL_ERROR_EMAIL) {
      // This would integrate with your alerting system
      console.error(`🚨 [EmailCritical] Sending critical error alert to: ${EMAIL_CONFIG.CRITICAL_ERROR_EMAIL}`);
    }
  }
};

// Metrics tracking
export const EmailMetrics = {
  emailsSent: 0,
  emailsFailed: 0,
  emailsRetried: 0,
  averageSendTime: 0,
  lastEmailSent: null,
  lastEmailFailed: null,
  
  recordSuccess: (sendTime) => {
    EmailMetrics.emailsSent++;
    EmailMetrics.lastEmailSent = new Date();
    
    // Update average send time
    if (EmailMetrics.averageSendTime === 0) {
      EmailMetrics.averageSendTime = sendTime;
    } else {
      EmailMetrics.averageSendTime = (EmailMetrics.averageSendTime + sendTime) / 2;
    }
  },
  
  recordFailure: () => {
    EmailMetrics.emailsFailed++;
    EmailMetrics.lastEmailFailed = new Date();
  },
  
  recordRetry: () => {
    EmailMetrics.emailsRetried++;
  },
  
  getStats: () => {
    return {
      totalEmails: EmailMetrics.emailsSent + EmailMetrics.emailsFailed,
      successRate: EmailMetrics.emailsSent / (EmailMetrics.emailsSent + EmailMetrics.emailsFailed) * 100,
      averageSendTime: EmailMetrics.averageSendTime,
      lastEmailSent: EmailMetrics.lastEmailSent,
      lastEmailFailed: EmailMetrics.lastEmailFailed,
      retryCount: EmailMetrics.emailsRetried
    };
  },
  
  reset: () => {
    EmailMetrics.emailsSent = 0;
    EmailMetrics.emailsFailed = 0;
    EmailMetrics.emailsRetried = 0;
    EmailMetrics.averageSendTime = 0;
    EmailMetrics.lastEmailSent = null;
    EmailMetrics.lastEmailFailed = null;
  }
};

// Health check configuration
export const HEALTH_CHECK_CONFIG = {
  // SMTP health check
  smtp: {
    enabled: true,
    interval: 300000, // 5 minutes
    timeout: 10000,   // 10 seconds
    maxFailures: 3    // Alert after 3 consecutive failures
  },
  
  // Email processing health check
  processing: {
    enabled: true,
    interval: 60000,  // 1 minute
    maxQueueSize: 100,
    maxProcessingTime: 300000 // 5 minutes
  },
  
  // Database health check
  database: {
    enabled: true,
    interval: 300000, // 5 minutes
    timeout: 5000     // 5 seconds
  }
};

// Export configuration
export default {
  EMAIL_CONFIG,
  EmailLogger,
  EmailMetrics,
  HEALTH_CHECK_CONFIG
};
