// Imports.
import SidebarLayout from "../components/SidebarLayout";
import styles from "../styles/voucher.js";
import { sendEmail } from "../utils/mail.server.js";


// Frontend.
export default function VoucherPage() {
  return (
    <SidebarLayout>
      <div style={styles.wrapper}>
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
