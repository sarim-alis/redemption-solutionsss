import fs from 'fs';
import path from 'path';

// Simple webhook monitoring middleware
function logWebhookAttempt(topic, payload, success = true, error = null) {
  const logDir = path.join(process.cwd(), 'webhook-logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
  }
  
  const logFile = path.join(logDir, 'webhook-activity.log');
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${topic} - ${success ? 'SUCCESS' : 'FAILED'} - ${error || 'OK'}\n`;
  
  fs.appendFileSync(logFile, logEntry);
  console.log(`📝 Logged: ${logEntry.trim()}`);
}

export { logWebhookAttempt };
