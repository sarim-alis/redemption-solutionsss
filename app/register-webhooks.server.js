// app/register-webhooks.server.js
import shopify from "./shopify.server";


export async function registerWebhooks(session) {
  const webhooks = [
    { topic: "products/create", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
    { topic: "products/update", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
    { topic: "products/delete", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
    { topic: "orders/create", address: `${process.env.APP_URL}/webhooks/orders`, format: "json" },
    { topic: "orders/edited", address: `${process.env.APP_URL}/webhooks/orders`, format: "json" },
    { topic: "orders/delete", address: `${process.env.APP_URL}/webhooks/orders`, format: "json" },
    { topic: "orders/paid", address: `${process.env.APP_URL}/webhooks/orders`, format: "json" },
    { topic: "app/uninstalled", address: `${process.env.APP_URL}/webhooks/app/uninstalled`, format: "json" }
  ];

  for (const webhook of webhooks) {
    const response = await shopify.webhooks.register({ session, ...webhook });
    console.log(`Webhook register status for ${webhook.topic}:`, response);
  }
}
