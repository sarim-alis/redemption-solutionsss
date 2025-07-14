import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { handleOrderPaid } from "../services/shopify-webhook.server";
import { saveOrder } from "../models/order.server";
import fs from 'fs';
import path from 'path';

// Create a logging function with error logging
const logToFile = (message, isError = false) => {
  const logDir = path.join(process.cwd(), 'logs');
  if (!fs.existsSync(logDir)){
    fs.mkdirSync(logDir);
  }
  const logFile = path.join(logDir, 'webhook-logs.txt');
  const timestamp = new Date().toISOString();
  const logPrefix = isError ? '🚨 ERROR' : '✅ INFO';
  const logMessage = `${timestamp} - ${logPrefix} - ${typeof message === 'object' ? JSON.stringify(message, null, 2) : message}\n`;
  fs.appendFileSync(logFile, logMessage);
  // Also log to console for immediate feedback
  if (isError) {
    console.error(logMessage);
  } else {
    console.log(logMessage);
  }
};

export const action = async ({ request }) => {
  try {
    const timestamp = new Date().toISOString();
    logToFile(`🔔 Webhook received at: ${timestamp}`);
    
    // Log request details
    logToFile({
      message: 'Request details',
      method: request.method,
      url: request.url,
      headers: Object.fromEntries(request.headers)
    });

    // Authenticate and parse the webhook
    const { payload, topic, shop } = await authenticate.webhook(request);

    logToFile({
      message: '🔑 Webhook authenticated',
      topic,
      shop,
      orderId: payload?.id,
      timestamp
    });

    // Log the full payload for debugging
    logToFile({
      message: '📦 Order payload received',
      payload: payload
    });

    // Save the order to database
    logToFile('⏳ Attempting to save order to database...');
    logToFile({
      message: '📋 Order data structure check',
      hasId: !!payload?.id,
      hasCustomer: !!payload?.customer,
      hasEmail: !!payload?.email,
      customerEmail: payload?.customer?.email,
      email: payload?.email,
      keys: Object.keys(payload || {})
    });
    
    const savedOrder = await saveOrder({
      ...payload,
      processed_at: timestamp
    });
    
    if (!savedOrder) {
      logToFile(`Failed to save order ${payload?.id}`, true);
      throw new Error("Failed to save order to database");
    }

    logToFile({
      message: '💾 Order saved successfully',
      orderId: savedOrder.shopifyOrderId,
      status: savedOrder.status,
      total: `${savedOrder.totalPrice} ${savedOrder.currency}`,
      timestamp
    });

    // Additional webhook handling
    try {
      logToFile('🔄 Starting additional order processing...');
      await handleOrderPaid(payload);
      logToFile(`✨ Successfully processed order ${payload.id}`);
    } catch (handleError) {
      logToFile({
        message: '❌ Error in additional order processing',
        error: handleError.message,
        orderId: payload?.id,
        timestamp
      }, true);
    }

    return json({ success: true });
  } catch (error) {
    logToFile({
      message: '💥 Webhook Error',
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    }, true);
    
    return json({ 
      success: false, 
      error: error.message 
    }, { status: 200 });
  }
};

export default function WebhookOrderPaid() {
  return null; // This route is action-only
}
