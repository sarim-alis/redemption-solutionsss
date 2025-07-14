import { authenticate } from "../shopify.server";
import db from "../db.server";
import { json } from "@remix-run/node";
import { handleOrderPaid } from "../services/shopify-webhook.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log("Webhook payload:", payload);

  const current = payload.current;

  if (session) {
    await db.session.update({
      where: {
        id: session.id,
      },
      data: {
        scope: current.toString(),
      },
    });
  }

  try {
    await handleOrderPaid(payload);
    console.log("handleOrderPaid executed successfully");
  } catch (err) {
    console.error("Error in handleOrderPaid:", err);
  }

  return json({ success: true });
};
