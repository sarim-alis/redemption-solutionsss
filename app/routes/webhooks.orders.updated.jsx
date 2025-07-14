import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { saveOrder } from "../models/order.server";
import { logWebhookAttempt } from "../utils/webhook-logger.js";

export const action = async ({ request }) => {
  // Log that webhook endpoint was hit
  console.log("🔔 WEBHOOK ENDPOINT HIT - Order Updated at:", new Date().toISOString());
  console.log("📡 Request URL:", request.url);
  console.log("🏷️ Request Method:", request.method);
  console.log("📋 Request Headers:", Object.fromEntries(request.headers));
  
  try {
    // Authenticate and parse the webhook
    const { payload, topic, shop } = await authenticate.webhook(request);

    console.log(`✅ Webhook authenticated - ${topic} from ${shop}`);
    console.log("📦 Order Updated Payload:", JSON.stringify(payload, null, 2));
    
    // Log webhook attempt
    logWebhookAttempt('orders/updated', payload, true);
    
    // Save/update order to DB
    console.log("💾 Attempting to save updated order to database...");
    const savedOrder = await saveOrder(payload);

    console.log("🎉 Updated order saved successfully:", {
      orderId: savedOrder.shopifyOrderId,
      status: savedOrder.status,
      total: `${savedOrder.totalPrice} ${savedOrder.currency}`,
      dbId: savedOrder.id
    });

    return json({ success: true, orderId: savedOrder.shopifyOrderId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : "";
    
    console.error("❌ Error in order updated webhook:", errorMessage);
    console.error("📋 Error stack:", errorStack);
    
    // Log failed webhook attempt
    logWebhookAttempt('orders/updated', {}, false, errorMessage);
    
    // Return 200 status to prevent Shopify from retrying
    return json({ 
      success: false, 
      error: errorMessage 
    }, { status: 200 });
  }
};
