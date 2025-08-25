// Imports.
import SidebarLayout from "../components/SidebarLayout";
import styles from "../styles/gift.js";
import { json } from "@remix-run/node";
import { Form, useActionData } from "@remix-run/react";


// Action.
export async function action({ request }) {
  const formData = await request.formData();
  const email = formData.get("email");

  if (!email) {
    return json({ success: false, error: "No email provided" }, { status: 400 });
  }

  // Import inside server-only function.
  const { sendEmail, getGiftHTML } = await import("../utils/mail.server.js");

  await sendEmail({
    to: email,
    subject: "Your Gift Voucher",
    html: await getGiftHTML(),
  });

  return json({ success: true });
}


// Frontend.
export default function GiftPage() {
  const actionData = useActionData();

  return (
    <SidebarLayout>
      <div style={styles.wrapper}>
        <Form method="post">
          <div style={{display: "flex", flexDirection: "column", marginTop: "15px", marginBottom: "15px" }}>
            <input type="email" name="email" placeholder="Enter your email" required style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginRight: "10px", marginTop: "6px"}} /><br></br>
            <button type="submit" style={{ padding: "10px 20px", border: "none", borderRadius: "8px", backgroundColor: "rgba(0, 0, 0, 0.45)", color: "white", fontWeight: "bold", cursor: "pointer"}}>
              Send Gift
            </button>
          </div>
        </Form>
        
        {actionData?.success && (
          <p style={{ color: "white", marginTop: "15px" }}>
            ✅ Gift sent successfully!
          </p>
        )}
        
        {actionData?.error && (
          <p style={{ color: "red", marginTop: "15px" }}>
            ❌ {actionData.error}
          </p>
        )}


        <div style={styles.card}>
          {/* Logo + Code */}
          <div style={styles.topRow}>
            <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" style={styles.logo} />
            <span style={styles.voucherId}>#293A-29CB</span>
          </div>

          {/* Balance */}
          <div style={styles.balanceRow}>
            <span style={styles.label}>Current Balance:</span>
            <span style={styles.amount}>$50.00</span>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}
