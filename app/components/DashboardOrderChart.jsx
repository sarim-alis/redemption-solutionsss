
// import React from "react";
// import { Doughnut } from "react-chartjs-2";
// import { Chart, ArcElement, Tooltip, Legend, Title } from "chart.js";

// Chart.register(ArcElement, Tooltip, Legend, Title);

// export default function DashboardOrderChart({ paidOrders, unpaidOrders }) {
//   const data = {
//     labels: ["Paid Orders", "Unpaid Orders"],
//     datasets: [
//       {
//         data: [paidOrders, unpaidOrders],
//         backgroundColor: ["#36a2eb", "#ff6384"],
//         borderWidth: 2,
//       },
//     ],
//   };
//   const options = {
//     plugins: {
//       legend: { display: true, position: "bottom" },
//       title: { display: true, text: "Order Payment Status" },
//     },
//     cutout: "70%",
//     responsive: true,
//     maintainAspectRatio: false,
//   };

// Imports.
import { useState } from "react"


// Frontend.
export default function DashboardOrderChart() {
  // Filters.
  const [filters, setFilters] = useState({
    date: "Today",
    products: "All Products",
    locations: "All Locations",
  })

  // Sales data.
  const salesData = [
    { product: "Oil Change", sales: "$260.00", revenue: "$4,120.00" },
    { product: "50 Gift Card", sales: "$50.00", revenue: "$2,500.00" },
    { product: "100 Gift Card", sales: "$10.00", revenue: "$1,000.00" },
    { product: "2 Oil Changes", sales: "$10.00", revenue: "$700.00" },
  ]

  // Voucher redemptions.
  const voucherRedemptions = [
    { product: "Oil Change", date: "01-06", location: "Pomona" },
    { product: "2 Oil Changes", date: "01-06", location: "Ventura" },
    { product: "2 Oil Changes", date: "30-05", location: "Century City" },
    { product: "3 Oil Changes", date: "30-05", location: "Santa Monica" },
    { product: "Oil Change", date: "30-05", location: "Woodland Hills" },
  ]

  // giftCardRedemptions.
  const giftCardRedemptions = [
    { product: "$50.00", date: "01-06", location: "Ventura" },
    { product: "$100.00", date: "01-06", location: "Woodland Hills" },
    { product: "$100.00", date: "01-06", location: "Woodland Hills" },
    { product: "$150.00", date: "30-05", location: "Santa Monica" },
    { product: "$50.00", date: "30-05", location: "Pomona" },
  ]


  // STYLES.
  const styles = {
    container: {
      backgroundColor: "#666666",
      color: "white",
      fontFamily: "Arial, sans-serif",
      padding: "20px",
      minHeight: "100vh",
    },
    header: {
      display: "flex",
      alignItems: "center",
      marginBottom: "20px",
      border: "2px solid white",
      padding: "15px",
    },
    hamburger: {
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      marginRight: "20px",
      cursor: "pointer",
    },
    hamburgerLine: {
      width: "25px",
      height: "3px",
      backgroundColor: "white",
    },
    title: {
      fontSize: "32px",
      fontWeight: "bold",
      margin: 0,
      flex: 1,
      textAlign: "center",
    },
filterSection: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between", // distribute across width
  flexWrap: "wrap", // wraps on smaller screens
  width: "100%", // full width
  padding: "10px 0",
  marginBottom: "20px",
  gap: "10px",
},
    filterLabel: {
      fontSize: "16px",
      fontWeight: "bold",
    },
    select: {
      backgroundColor: "#666666",
      color: "white",
      border: "2px solid white",
      padding: "8px 28px",
      fontSize: "14px",
      width: "250px",
    },
   button: {
  backgroundColor: "#4a7c59",
  color: "white",
  border: "2px solid white",
  padding: "10px 24px",           // slightly taller and wider
  cursor: "pointer",
  fontSize: "14px",
  width: "200px",              // ✅ wider button
  textAlign: "center",
  flex: "0 0 auto",
},

resetButton: {
  backgroundColor: "#8b2e2e",     // slightly more red tone
  color: "white",
  border: "2px solid white",
  padding: "10px 24px",           // same padding as Apply
  cursor: "pointer",
  fontSize: "14px",
  width: "200px",              // ✅ wider button
  textAlign: "center",
  flex: "0 0 auto",
},

    metricsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4, 1fr)",
      gap: "15px",
      marginBottom: "20px",
    },
    metricCard: {
      border: "2px solid white",
      padding: "15px",
      textAlign: "center",
    },
    metricLabel: {
      fontSize: "12px",
      marginBottom: "8px",
      fontWeight: "bold",
    },
    metricValue: {
      fontSize: "20px",
      fontWeight: "bold",
    },
    chartsGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr 1fr",
      gap: "15px",
      marginBottom: "20px",
    },
    chartContainer: {
      border: "2px solid white",
      padding: "15px",
      minHeight: "200px",
    },
    chartTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "15px",
      textAlign: "center",
    },
    lineChart: {
      width: "100%",
      height: "120px",
      position: "relative",
    },
    chartLine: {
      stroke: "white",
      strokeWidth: "2",
      fill: "none",
    },
    pieChart: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "120px",
    },
    pieContainer: {
      position: "relative",
      width: "100px",
      height: "100px",
    },
    pieLegend: {
      marginTop: "10px",
      fontSize: "12px",
    },
    legendItem: {
      display: "flex",
      alignItems: "center",
      gap: "5px",
      marginBottom: "5px",
    },
    legendColor: {
      width: "12px",
      height: "12px",
      borderRadius: "50%",
    },
    table: {
      width: "100%",
      borderCollapse: "collapse",
    },
    tableHeader: {
      backgroundColor: "#555555",
      padding: "8px",
      border: "1px solid white",
      fontSize: "12px",
      fontWeight: "bold",
    },
    tableCell: {
      padding: "8px",
      border: "1px solid white",
      fontSize: "12px",
    },
    tablesGrid: {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "15px",
      marginBottom: "20px",
    },
    tableContainer: {
      border: "2px solid white",
      padding: "15px",
    },
    tableTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "10px",
      textAlign: "center",
    },
    exportButton: {
      backgroundColor: "#4a7c59",
      color: "white",
      border: "2px solid white",
      padding: "12px 24px",
      cursor: "pointer",
      fontSize: "16px",
      fontWeight: "bold",
      float: "right",
    },
  }


  // Return.
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.hamburger}>
          <div style={styles.hamburgerLine}></div>
          <div style={styles.hamburgerLine}></div>
          <div style={styles.hamburgerLine}></div>
        </div>
        <h1 style={styles.title}>Sales & Vouchers Report</h1>
      </div>

      {/* Filters */}
      <div style={styles.filterSection}>
        <span style={styles.filterLabel}>Filter by:</span>
        <select
          style={styles.select}
          value={filters.date}
          onChange={(e) => setFilters({ ...filters, date: e.target.value })}
        >
          <option>Today</option>
          <option>Yesterday</option>
          <option>This Week</option>
        </select>
        <select
          style={styles.select}
          value={filters.products}
          onChange={(e) => setFilters({ ...filters, products: e.target.value })}
        >
          <option>All Products</option>
          <option>Oil Change</option>
          <option>Gift Cards</option>
        </select>
        <select
          style={styles.select}
          value={filters.locations}
          onChange={(e) => setFilters({ ...filters, locations: e.target.value })}
        >
          <option>All Locations</option>
          <option>Pomona</option>
          <option>Ventura</option>
        </select>
        <button style={styles.button}>Apply</button>
        <button style={styles.resetButton}>Reset</button>
      </div>

      {/* Metrics Cards */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Product Sales</div>
          <div style={styles.metricValue}>$13,320.00</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Gift Card Balances</div>
          <div style={styles.metricValue}>$2,298.45</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Total Vouchers Redeemed</div>
          <div style={styles.metricValue}>850</div>
        </div>
        <div style={styles.metricCard}>
          <div style={styles.metricLabel}>Active Vouchers</div>
          <div style={styles.metricValue}>320</div>
        </div>
      </div>

      {/* Charts and Table */}
      <div style={styles.chartsGrid}>
        {/* Product Sales Chart */}
        <div style={styles.chartContainer}>
          <div style={styles.chartTitle}>Product Sales Chart</div>
          <div style={styles.lineChart}>
            <svg width="100%" height="100%" viewBox="0 0 300 120">
              <polyline points="20,80 60,60 100,70 140,50 180,45 220,40 260,35" style={styles.chartLine} />
            </svg>
          </div>
        </div>

        {/* Pie Chart */}
        <div style={styles.chartContainer}>
          <div style={styles.chartTitle}>Expired vs. Active Vouchers</div>
          <div style={styles.pieChart}>
            <div style={styles.pieContainer}>
              <svg width="100" height="100" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="#dc3545" stroke="white" strokeWidth="2" />
                <path d="M 50 10 A 40 40 0 1 1 20 70 L 50 50 Z" fill="#28a745" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          </div>
          <div style={styles.pieLegend}>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: "#dc3545" }}></div>
              <span>40% Expired</span>
            </div>
            <div style={styles.legendItem}>
              <div style={{ ...styles.legendColor, backgroundColor: "#28a745" }}></div>
              <span>60% Active</span>
            </div>
          </div>
        </div>

        {/* Group Product Sales Table */}
        <div style={styles.chartContainer}>
          <div style={styles.chartTitle}>Group Product Sales</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Product</th>
                <th style={styles.tableHeader}>Sales</th>
                <th style={styles.tableHeader}>Revenue</th>
              </tr>
            </thead>
            <tbody>
              {salesData.map((item, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{item.product}</td>
                  <td style={styles.tableCell}>{item.sales}</td>
                  <td style={styles.tableCell}>{item.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Tables */}
      <div style={styles.tablesGrid}>
        {/* Voucher Redemptions */}
        <div style={styles.tableContainer}>
          <div style={styles.tableTitle}>Voucher Redemptions</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Product</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Location</th>
              </tr>
            </thead>
            <tbody>
              {voucherRedemptions.map((item, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{item.product}</td>
                  <td style={styles.tableCell}>{item.date}</td>
                  <td style={styles.tableCell}>{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gift Card Redemption */}
        <div style={styles.tableContainer}>
          <div style={styles.tableTitle}>Gift Card Redemption</div>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.tableHeader}>Product</th>
                <th style={styles.tableHeader}>Date</th>
                <th style={styles.tableHeader}>Location</th>
              </tr>
            </thead>
            <tbody>
              {giftCardRedemptions.map((item, index) => (
                <tr key={index}>
                  <td style={styles.tableCell}>{item.product}</td>
                  <td style={styles.tableCell}>{item.date}</td>
                  <td style={styles.tableCell}>{item.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Button */}
      <button style={styles.exportButton}>Export</button>
    </div>
  )
}
