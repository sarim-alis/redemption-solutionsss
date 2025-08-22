// Imports.
import SidebarLayout from "../components/SidebarLayout";
import styles from "../styles/gift.js";


// Frontend.
export default function GiftPage() {
  return (
    <SidebarLayout>
      <div style={styles.wrapper}>
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
