import { authenticate } from "../shopify.server";
import { registerWebhooks } from "../register-webhooks.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  await registerWebhooks(session);
  return null;
};
