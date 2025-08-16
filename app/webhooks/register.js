import shopify from "../shopify.server";

export async function registerWebhooks(session) {
  const webhooks = [
    { topic: "products/create", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
    { topic: "products/update", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
    { topic: "products/delete", address: `${process.env.APP_URL}/webhooks/products`, format: "json" },
  ];

  for (const webhook of webhooks) {
    const response = await shopify.webhooks.register({ session, ...webhook });
    console.log(`🔗 Webhook ${webhook.topic} registered → ${webhook.address}`, response);
  }
}
