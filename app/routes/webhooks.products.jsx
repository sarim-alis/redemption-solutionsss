// app/routes/webhooks.products.jsx
import { authenticate } from "../shopify.server";
import { broadcastToClients } from "./webhook-stream";

export const action = async ({ request }) => {
  const { shop, session, topic, payload } = await authenticate.webhook(request);

  console.log(`🛍️ Received ${topic} webhook for ${shop}`);

  // ✅ Immediately send 200 OK so Shopify doesn't retry or timeout
  setTimeout(() => {
    processWebhook({ shop, session, topic, payload });
  }, 0);

  return new Response("OK", { status: 200 });
};

// Separate function to handle processing & broadcasting
async function processWebhook({ shop, session, topic, payload }) {
  if (!session) {
    console.log("⚠️ No session found for shop:", shop);
    return;
  }

  try {
    let dataToSend = null;

    switch (topic) {
      case "PRODUCTS_CREATE":
        console.log(`✅ New product created: ${payload.title} (ID: ${payload.id})`);
        dataToSend = transformProductPayload(payload);
        break;
   
      case "PRODUCTS_UPDATE":
        console.log(`🔄 Product updated: ${payload.title} (ID: ${payload.id})`);
        dataToSend = transformProductPayload(payload);
        break; 

      case "PRODUCTS_DELETE":
        console.log(`🗑️ Product deleted: ID ${payload.id}`);
        dataToSend = { id: `gid://shopify/Product/${payload.id}` };
        break;

      default:
        console.log(`🤷‍♂️ Unknown product topic: ${topic}`);
        return;
    }

    // 🔹 Broadcast to all SSE clients
    broadcastToClients({
      type: 'webhook',
      topic,
      payload: dataToSend,
      shop,
      timestamp: new Date().toISOString()
    });

    console.log(`✅ Finished processing ${topic} webhook for shop: ${shop}`);
  } catch (error) {
    console.error(`❌ Error processing ${topic} webhook:`, error);
  }
}

// Helper to match Shopify GraphQL style
function transformProductPayload(payload) {
  return {
    id: `gid://shopify/Product/${payload.id}`,
    title: payload.title,
    handle: payload.handle,
    status: payload.status?.toUpperCase() || 'ACTIVE',
    createdAt: payload.created_at,
    updatedAt: payload.updated_at,
    totalInventory: payload.variants?.reduce((sum, variant) =>
      sum + (variant.inventory_quantity || 0), 0) || 0,
    media: {
      nodes: payload.images?.map(image => ({
        image: {
          url: image.src,
          altText: image.alt
        }
      })) || []
    },
    variants: {
      nodes: payload.variants?.slice(0, 1)?.map(variant => ({
        id: `gid://shopify/ProductVariant/${variant.id}`,
        price: variant.price,
        compareAtPrice: variant.compare_at_price,
        inventoryQuantity: variant.inventory_quantity || 0
      })) || []
    }
  };
}
