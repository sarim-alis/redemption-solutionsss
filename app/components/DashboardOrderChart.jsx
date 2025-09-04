// Imports
import { useState } from "react"
import { useLoaderData } from "@remix-run/react";
import { getAllVouchers } from "../models/voucher.server"

// Frontend
export default function DashboardOrderChart({ analytics }) {
  const [filters, setFilters] = useState({
    date: "All",
    products: "All Products",
    locations: "All Locations",
  });

  const isFilterActive =
    filters.date !== "All" ||
    filters.products !== "All Products" ||
    filters.locations !== "All Locations";

  const { productSales: allProductSales, voucherRedemptions: allVoucherRedemptions } = useLoaderData();

  // Helper functions (date, product, location filters)
  function isDateMatch(dateString, filter) {
    if (filter === "All") return true;
    if (!dateString) return false;
    let norm = dateString;
    if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) norm = dateString.slice(0, 10);
    else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
      const [d, m, y] = dateString.split('-'); norm = `${y}-${m}-${d}`;
    } else if (/^\d{2}-\d{2}$/.test(dateString)) {
      const [m, d] = dateString.split('-');
      norm = `${new Date().getFullYear()}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
    const date = new Date(norm);
    if (isNaN(date.getTime())) return false;
    const today = new Date(); today.setHours(0,0,0,0);
    if (filter === "Today") return date.toDateString() === today.toDateString();
    if (filter === "Yesterday") {
      const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    if (filter === "This Week") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7));
      firstDayOfWeek.setHours(0,0,0,0);
      const lastDayOfWeek = new Date(firstDayOfWeek); lastDayOfWeek.setDate(firstDayOfWeek.getDate() + 6);
      lastDayOfWeek.setHours(23,59,59,999);
      return date >= firstDayOfWeek && date <= lastDayOfWeek;
    }
    if (filter === "This Month") return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    return true;
  }

  function isProductMatch(product, filter) {
    return filter === "All Products" ? true : product === filter;
  }

  function isLocationMatch(location, filter) {
    return filter === "All Locations" ? true : location === filter;
  }

  const productSales = (allProductSales || []).filter(item =>
    isDateMatch(item.date, filters.date) &&
    isProductMatch(item.product, filters.products) &&
    isLocationMatch(item.location, filters.locations)
  );

  const voucherRedemptions = (allVoucherRedemptions || []).filter(item =>
    isDateMatch(item.date, filters.date) &&
    isProductMatch(item.product, filters.products) &&
    isLocationMatch(item.location, filters.locations)
  );

  const giftCardRedemptions = [
    { product: "$50.00", date: "01-06", location: "Ventura" },
    { product: "$100.00", date: "01-06", location: "Woodland Hills" },
    { product: "$100.00", date: "01-06", location: "Woodland Hills" },
    { product: "$150.00", date: "30-05", location: "Santa Monica" },
    { product: "$50.00", date: "30-05", location: "Pomona" },
  ];

  // STYLES
  const styles = {
    container: { backgroundColor: "white", color: "black", fontFamily: "Arial, sans-serif", padding: "20px", minHeight: "100vh", position: "relative" },
    header: { display: "flex", alignItems: "center", marginBottom: "20px", border: "2px solid black", borderRadius: "10px", padding: "15px" },
    title: { fontSize: "32px", fontWeight: "bold", margin: 0, flex: 1, textAlign: "center" },
    filterSection: { display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", width: "100%", padding: "10px 0", marginBottom: "20px", gap: "10px" },
    filterLabel: { fontSize: "16px", fontWeight: "bold" },
    select: { backgroundColor: "white", color: "black", border: "2px solid black", borderRadius: "10px", padding: "8px 28px", fontSize: "14px", width: "250px" },
    button: { backgroundColor: "#4a7c59", color: "white", border: "2px solid black", borderRadius: "10px", padding: "10px 24px", cursor: "pointer", fontSize: "14px", width: "200px", textAlign: "center", flex: "0 0 auto" },
    resetButton: { backgroundColor: "#8b2e2e", color: "white", border: "2px solid black", borderRadius: "10px", padding: "10px 24px", cursor: "pointer", fontSize: "14px", width: "200px", textAlign: "center", flex: "0 0 auto" },
    metricsGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "15px", marginBottom: "20px" },
    metricCard: { border: "2px solid black", borderRadius: "10px", padding: "15px", textAlign: "center" },
    metricLabel: { fontSize: "12px", marginBottom: "8px", fontWeight: "bold" },
    metricValue: { fontSize: "20px", fontWeight: "bold" },
    chartsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "20px" },
    chartColumn: { display: "flex", flexDirection: "column", gap: "15px" },
    chartContainer: { border: "2px solid black", borderRadius: "10px", padding: "15px", minHeight: "250px", overflowY: "auto" },
    chartContainers: { border: "2px solid black", borderRadius: "10px", padding: "15px", minHeight: "250px", overflowY: "auto" },
    chartContainerss: { border: "2px solid black", borderRadius: "10px", padding: "15px", maxHeight: "550px", overflowY: "auto" },
    chartTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "15px", textAlign: "center" },
    lineChart: { width: "100%", height: "120px", position: "relative" },
    chartLine: { stroke: "black", strokeWidth: "2", fill: "none" },
    pieChart: { display: "flex", justifyContent: "center", alignItems: "center", height: "120px" },
    pieContainer: { position: "relative", width: "100px", height: "100px" },
    pieLegend: { marginTop: "10px", fontSize: "12px" },
    legendItem: { display: "flex", alignItems: "center", gap: "5px", marginBottom: "5px" },
    legendColor: { width: "12px", height: "12px", borderRadius: "50%" },
    table: { width: "100%", borderCollapse: "collapse", minHeight: "220px" },
    tables: { width: "100%", borderCollapse: "collapse", minHeight: "150px" },
    tableHeader: { backgroundColor: "#f0f0f0", padding: "8px", border: "1px solid black", fontSize: "12px", fontWeight: "bold" },
    tableCell: { padding: "8px", border: "1px solid black", fontSize: "12px" },
    tableContainer: { border: "2px solid black", borderRadius: "10px", padding: "15px", minHeight: "200px", flex: 1, overflowY: "auto" },
    tableTitle: { fontSize: "16px", fontWeight: "bold", marginBottom: "10px", textAlign: "center" },
    tablesGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "20px" },
    exportButton: { backgroundColor: "#862633", color: "white", border: "2px solid black", borderRadius: "10px", padding: "12px 24px", cursor: "pointer", fontSize: "16px", fontWeight: "bold", alignSelf: "flex-end", maxWidth: "none",
  }
}

  return (
    <div style={styles.container}>
      <div style={styles.header}><h1 style={styles.title}>Sales & Vouchers Report</h1></div>

      <div style={styles.filterSection}>
        <span style={styles.filterLabel}>Filter by:</span>
        <select style={styles.select} value={filters.date} onChange={e => setFilters(f => ({ ...f, date: e.target.value }))}>
          <option>All</option><option>Today</option><option>Yesterday</option><option>This Week</option><option>This Month</option>
        </select>
        <select style={styles.select} value={filters.products} onChange={e => setFilters(f => ({ ...f, products: e.target.value }))}>
          <option>All Products</option><option>Oil Change</option><option>Gift Cards</option>
        </select>
        <select style={styles.select} value={filters.locations} onChange={e => setFilters(f => ({ ...f, locations: e.target.value }))}>
          <option>All Locations</option><option>Pomona</option><option>Ventura</option>
        </select>
        {isFilterActive && <button style={styles.resetButton} onClick={() => setFilters({ date: "All", products: "All Products", locations: "All Locations" })}>Reset</button>}
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Product Sales</div><div style={styles.metricValue}>{productSales.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Gift Card Balances</div><div style={styles.metricValue}>${analytics?.totalGiftCardBalance?.toFixed(2) || '0.00'}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Vouchers</div><div style={styles.metricValue}>{analytics?.totalVouchers || 0}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Active Vouchers</div><div style={styles.metricValue}>{analytics?.activeVouchers || 0}</div></div>
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        {/* Column 1: Product Sales + Voucher Redemptions */}
        <div style={styles.chartColumn}>
          <div style={styles.chartContainer}>
            <div style={styles.chartTitle}>Product Sales Chart</div>
            <div style={styles.lineChart}><svg width="100%" height="100%" viewBox="0 0 300 120"><polyline points="20,80 60,60 100,70 140,50 180,45 220,40 260,35" style={styles.chartLine} /></svg></div>
          </div>
          <div style={styles.tableContainer}>
            <div style={styles.tableTitle}>Voucher Redemptions</div>
            <table style={styles.table}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Date</th><th style={styles.tableHeader}>Location</th></tr></thead>
            <tbody>
              {voucherRedemptions && voucherRedemptions.length > 0 ? (
                voucherRedemptions.map((item, index) => (
                  <tr key={index}>
                    <td style={styles.tableCell}>{item.product}</td>
                    <td style={styles.tableCell}>{item.date}</td>
                    <td style={styles.tableCell}>{item.location}</td>
                  </tr>
                ))
              ) : (
                <tr><td style={styles.tableCell} colSpan={3}>No voucher redemptions</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </div>

        {/* Column 2: Active vs Total Vouchers + Gift Card Redemption */}
        <div style={styles.chartColumn}>
          <div style={styles.chartContainerss}>
            <div style={styles.chartTitle}>Active vs. Total Vouchers</div>
            <div style={styles.pieChart}><div style={styles.pieContainer}>
                <svg width="100" height="100" viewBox="0 0 100 100">
                {/* Agar totalVouchers 0 hai to gray circle dikhaye */}
                {(!analytics?.totalVouchers || analytics.totalVouchers === 0) && (
                  <circle cx="50" cy="50" r="40" fill="#888" stroke="white" strokeWidth="2" />
                )}
                {/* Agar 100% active hai to green circle dikhaye */}
                {analytics?.totalVouchers > 0 && analytics.activeVouchers === analytics.totalVouchers && (
                  <circle cx="50" cy="50" r="40" fill="#28a745" stroke="white" strokeWidth="2" />
                )}
                {/* Agar 0% active hai to red circle dikhaye */}
                {analytics?.totalVouchers > 0 && analytics.activeVouchers === 0 && (
                  <circle cx="50" cy="50" r="40" fill="#dc3545" stroke="white" strokeWidth="2" />
                )}
                {/* Agar kuch active hain kuch inactive hain to proportion dikhaye */}
                {analytics?.totalVouchers > 0 && analytics.activeVouchers > 0 && analytics.activeVouchers < analytics.totalVouchers && (
                  <>
                    <circle cx="50" cy="50" r="40" fill="#dc3545" stroke="white" strokeWidth="2" />
                    <path 
                      d={`M 50 10 A 40 40 0 ${analytics.activeVouchers / analytics.totalVouchers > 0.5 ? 1 : 0} 1 ${50 + 40 * Math.sin(2 * Math.PI * analytics.activeVouchers / analytics.totalVouchers)} ${50 - 40 * Math.cos(2 * Math.PI * analytics.activeVouchers / analytics.totalVouchers)} L 50 50 Z`} 
                      fill="#28a745" 
                      stroke="white" 
                      strokeWidth="2" 
                    />
                  </>
                )}
              </svg>
              </div>
                  

              </div>
              <div style={styles.pieLegend}>
      <div style={styles.legendItem}>
        <div style={{ ...styles.legendColor, backgroundColor: "#dc3545" }}></div>
        <span>{analytics?.totalVouchers > 0 ? Math.round(((analytics.totalVouchers - analytics.activeVouchers) / analytics.totalVouchers) * 100) : 0}% Inactive</span>
      </div>
      <div style={styles.legendItem}>
        <div style={{ ...styles.legendColor, backgroundColor: "#28a745" }}></div>
        <span>{analytics?.totalVouchers > 0 ? Math.round((analytics.activeVouchers / analytics.totalVouchers) * 100) : 0}% Active</span>
      </div>
    </div>
          </div>
          <div style={styles.tableContainer}>
            <div style={styles.tableTitle}>Gift Card Redemption</div>
            <table style={styles.tables}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Date</th><th style={styles.tableHeader}>Location</th></tr></thead>
            <tbody>{giftCardRedemptions.map((item, i) => <tr key={i}><td style={styles.tableCell}>{item.product}</td><td style={styles.tableCell}>{item.date}</td><td style={styles.tableCell}>{item.location}</td></tr>)}</tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Group Product Sales */}
        <div style={styles.chartColumn}>
          <div style={styles.chartContainerss}>
            <div style={styles.chartTitle}>Group Product Sales</div>
            <table style={styles.table}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Sales</th><th style={styles.tableHeader}>Revenue</th></tr></thead>
            <tbody>{productSales.map((item, i) => <tr key={i}><td style={styles.tableCell}>{item.product}</td><td style={styles.tableCell}>{item.sales}</td><td style={styles.tableCell}>${item.revenue.toFixed(2)}</td></tr>)}</tbody>
            </table>
          </div>
          <button style={styles.exportButton}>Export</button>
        </div>
      </div>
    </div>
  )
}
