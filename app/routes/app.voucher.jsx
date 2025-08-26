// Imports.
import SidebarLayout from "../components/SidebarLayout";
import styles from "../styles/voucher.js";
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
  const { sendEmail, getVoucherHTML } = await import("../utils/mails.server");

  await sendEmail({
    to: email,
    subject: "Your Oil Change Voucher",
    html: await getVoucherHTML(),
  });

  return json({ success: true });
}


// Frontend.
export default function VoucherPage() {
  const actionData = useActionData();

  return (
    <SidebarLayout>
      <div style={styles.wrapper}>
        <Form method="post">
          <div style={{display: "flex", flexDirection: "column", marginTop: "15px", marginBottom: "15px" }}>
          <input type="email" name="email" placeholder="Enter your email" required style={{ padding: "10px", border: "1px solid #ccc", borderRadius: "6px", marginRight: "10px", marginTop: "6px"}} /><br></br>
          <button type="submit" style={{ padding: "10px 20px", border: "none", borderRadius: "8px", backgroundColor: "rgba(0, 0, 0, 0.45)", color: "white", fontWeight: "bold", cursor: "pointer"}}>
            Send Voucher
          </button>
          </div>
        </Form>

        {actionData?.success && (
          <p style={{ color: "white", marginTop: "15px" }}>
            ✅ Voucher sent successfully!
          </p>
        )}

        {actionData?.error && (
          <p style={{ color: "red", marginTop: "15px" }}>
            ❌ {actionData.error}
          </p>
        )}


          <div style={styles.card}>
            <h1 style={styles.title}>Oil Change Voucher</h1>
            <p style={styles.subTitle}>
              Present this at participating locations to redeem.     
            </p>

            <div style={styles.row}>
              <span style={styles.label}>Valid through:</span>
              <span style={styles.value}>
                08/16/2026
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Issued on:</span>
              <span style={styles.value}>
                03/16/2026
              </span>
            </div>
            <div style={styles.row}>
              <span style={styles.label}>Used on:</span>
              <span style={styles.value}>
                  —  —  —
              </span>
            </div>

            <div style={styles.codeBox}>
              <div style={styles.codeLabel}>Voucher Code:</div>
              <div style={styles.codeValue}>
                32A9-TV09
              </div>
            </div>

            <div style={styles.terms}>
              *Only valid at participating ACE Jiffy Lube Locations. <br />
              ** Term 2 <br />
              <div style={styles.termRow}>
              *** Term 3
              <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" style={styles.logo} />
              </div>
            </div>
          </div>
      </div>
    </SidebarLayout>
  );
}
