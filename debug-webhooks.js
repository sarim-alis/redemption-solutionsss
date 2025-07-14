import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create a simple webhook log table if it doesn't exist
async function createWebhookLogTable() {
  try {
    // Try to create a simple log entry to test if we can capture webhook attempts
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        webhook_type VARCHAR(50),
        received_at TIMESTAMP DEFAULT NOW(),
        payload TEXT,
        success BOOLEAN DEFAULT FALSE,
        error_message TEXT
      );
    `;
    console.log('✅ Webhook log table ready');
  } catch (error) {
    console.log('ℹ️ Webhook log table might already exist or there was an issue:', error.message);
  }
}

// Add a simple logging function to your webhook handlers
async function logWebhookAttempt(type, payload, success = true, error = null) {
  try {
    await prisma.$executeRaw`
      INSERT INTO webhook_logs (webhook_type, payload, success, error_message)
      VALUES (${type}, ${JSON.stringify(payload)}, ${success}, ${error || null});
    `;
  } catch (err) {
    console.error('Failed to log webhook attempt:', err.message);
  }
}

// Check recent webhook attempts
async function checkRecentWebhooks() {
  try {
    await createWebhookLogTable();
    
    const logs = await prisma.$queryRaw`
      SELECT * FROM webhook_logs 
      ORDER BY received_at DESC 
      LIMIT 10;
    `;
    
    console.log('\n🔍 Recent webhook attempts:');
    if (logs.length === 0) {
      console.log('❌ No webhook attempts logged yet');
      console.log('💡 This suggests webhooks from Shopify are not reaching your app');
    } else {
      logs.forEach((log, index) => {
        console.log(`${index + 1}. ${log.webhook_type} at ${log.received_at} - ${log.success ? 'SUCCESS' : 'FAILED'}`);
        if (log.error_message) {
          console.log(`   Error: ${log.error_message}`);
        }
      });
    }
    
  } catch (error) {
    console.error('Error checking webhook logs:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRecentWebhooks();
