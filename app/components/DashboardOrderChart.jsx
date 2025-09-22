// Imports.
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { useLoaderData } from "@remix-run/react";
import styles from "../styles/dash.js";
import dayjs from "dayjs";
import { DatePicker } from "antd";
import * as XLSX from "xlsx";


function exportToExcel(productSales, voucherRedemptions, giftCardRedemptions) {
  const productSalesSheet = productSales.map(p => ({ Type: "Product Sale", Product: p.product, Sales: p.sales, Revenue: p.revenue?.toFixed(2) ?? "0.00", Date: p.date || "", Location: p.location || ""}));
  const voucherRedemptionsSheet = voucherRedemptions.map(v => ({ Type: "Voucher Redemption", Product: v.product, Date: v.date, Location: v.locationUsed, Revenue: "", Sales: ""}));
  const giftCardRedemptionsSheet = giftCardRedemptions.map(g => ({ Type: "Gift Card Redemption", Product: g.product, Date: g.date, Location: g.locationUsed, Balance: g.balance?.toFixed(2) ?? "0.00"}));

  // Create sheets.
  const wb = XLSX.utils.book_new();
  const ws1 = XLSX.utils.json_to_sheet(productSalesSheet);
  const ws2 = XLSX.utils.json_to_sheet(voucherRedemptionsSheet);
  const ws3 = XLSX.utils.json_to_sheet(giftCardRedemptionsSheet);

  // Append sheets to workbook.
  XLSX.utils.book_append_sheet(wb, ws1, "Product Sales");
  XLSX.utils.book_append_sheet(wb, ws2, "Voucher Redemptions");
  XLSX.utils.book_append_sheet(wb, ws3, "Gift Card Redemptions");
  XLSX.writeFile(wb, "sales_vouchers_report.xlsx");
}


// Frontend.
export default function DashboardOrderChart({ analytics, vouchers, locations }) {
  const [dateFilter, setDateFilter] = useState("All");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const marketOptions = ["Market #1", "Market #2", "Market #3", "Market #4", "Market #5", "Market #6", "Market #7"];
  const [filters, setFilters] = useState({ products: "All Products", locations: "All Locations", market: "All Markets" });
  // Reset location filter when market changes
  function handleMarketChange(e) {
    setFilters(f => ({ ...f, market: e.target.value, locations: "All Locations" }));
  }
  // Define filteredLocations for use in dropdowns and voucher filtering
  const filteredLocations = filters.market === "All Markets"
    ? (locations || [])
    : (locations || []).filter(loc => loc.market === filters.market);
  const isFilterActive = filters.date !== "All" || filters.products !== "All Products" || filters.locations !== "All Locations";
  const { voucherRedemptions: allVoucherRedemptions } = useLoaderData();

// Is date match.
function isDateMatch(dateString, filter, customStart, customEnd) {
  if (filter === "All") return true;
  if (!dateString) return false;

  // Normalize date formats
  let norm = dateString;
  if (/^\d{4}-\d{2}-\d{2}/.test(dateString)) norm = dateString.slice(0, 10);
  else if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [d, m, y] = dateString.split("-");
    norm = `${y}-${m}-${d}`;
  } else if (/^\d{2}-\d{2}$/.test(dateString)) {
    const [m, d] = dateString.split("-");
    norm = `${new Date().getFullYear()}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const date = new Date(norm);
  if (isNaN(date.getTime())) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const year = today.getFullYear();
  const month = today.getMonth();
  const weekDay = today.getDay();

  // Today
  if (filter === "Today") {
    return date.toDateString() === today.toDateString();
  }
  // Yesterday
  if (filter === "Yesterday") {
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  }
  // This Week (Sunday to Saturday)
  if (filter === "This Week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - weekDay);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return date >= weekStart && date <= weekEnd;
  }
  // Last Week (previous full week Sunday to Saturday)
  if (filter === "Last Week") {
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - weekDay - 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return date >= weekStart && date <= weekEnd;
  }
  // This Month (full current month)
  if (filter === "This Month") {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);
    return date >= monthStart && date <= monthEnd;
  }
  // Last Month (full previous month)
  if (filter === "Last Month") {
    const lastMonthStart = new Date(year, month - 1, 1);
    const lastMonthEnd = new Date(year, month, 0, 23, 59, 59, 999);
    return date >= lastMonthStart && date <= lastMonthEnd;
  }
  // This Year (full current year)
  if (filter === "This Year") {
    const yearStart = new Date(year, 0, 1);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);
    return date >= yearStart && date <= yearEnd;
  }
  // Last Year (full previous year)
  if (filter === "Last Year") {
    const lastYearStart = new Date(year - 1, 0, 1);
    const lastYearEnd = new Date(year - 1, 11, 31, 23, 59, 59, 999);
    return date >= lastYearStart && date <= lastYearEnd;
  }
  // Custom Range
  if (filter === "Custom Range" && customStart && customEnd) {
    const start = new Date(customStart);
    const end = new Date(customEnd);
    end.setHours(23, 59, 59, 999);
    return date >= start && date <= end;
  }
  return true;
}


  function isProductMatch(product, filter) {
    return filter === "All Products" ? true : product === filter;
  }

  function isLocationMatch(location, filter) {
    return filter === "All Locations" ? true : location === filter;
  }


  // Transform vouchers data for display
  const transformedVouchers = (vouchers || []).map(voucher => {
    let product = voucher.productTitle || "";
    let use = voucher.statusUse || "";
    let date = voucher.createdAt
      ? new Date(voucher.createdAt).toLocaleDateString("en-US")
      : "";
    let location = Array.isArray(voucher.locationUsed)
      ? voucher.locationUsed.filter(Boolean).join(", ")
      : (voucher.locationUsed || "—");
    let balance = voucher.totalPrice;

    if (!product && voucher.order?.lineItems) {
      try {
        const items = Array.isArray(voucher.order.lineItems)
          ? voucher.order.lineItems
          : JSON.parse(voucher.order.lineItems);
        if (Array.isArray(items) && items.length > 0) {
          product = items[0].title || "";
        } else if (items.edges && items.edges.length > 0) {
          product = items.edges[0].node.title || "";
        }
      } catch (e) {
        // ignore
      }
    }

    return { product, date, locationUsed: location, used: voucher.order?.statusUse || false, type: voucher.type || "[voucher]", createdAt: voucher.createdAt, balance: voucher.totalPrice || 0, use: voucher.statusUse };
  });

  // Filtered vouchers by date
  // Filter vouchers by date and selected market
  const filteredVouchers = transformedVouchers.filter(item => {
    // Find location object for this voucher
    let locationObj = filteredLocations.find(loc => {
      if (!loc.name) return false;
      // Match by name (case-insensitive)
      return (item.locationUsed || "").toLowerCase().includes((loc.name || "").toLowerCase());
    });
    // If market filter is active, only show vouchers for that market
    if (filters.market !== "All Markets") {
      if (!locationObj) return false;
    }
    return isDateMatch(item.date, dateFilter, customStart, customEnd);
  });

  // Group vouchers by productTitle and show count and totalPrice for each product
  const productTitleMap = {};
  filteredVouchers.forEach(voucher => {
    const product = voucher.product || voucher.productTitle || "[voucher]";
    if (!productTitleMap[product]) {
      productTitleMap[product] = { product, sales: 0, revenue: 0 };
    }
    productTitleMap[product].sales += 1;
    productTitleMap[product].revenue += voucher.balance || 0;
  });
  const productSales = Object.values(productTitleMap);

  // Prepare sales over time for chart (group by date)
  const salesByDate = {};
  filteredVouchers.forEach(voucher => {
    const date = voucher.date || (voucher.createdAt ? new Date(voucher.createdAt).toLocaleDateString("en-US") : "");
    if (!date) return;
    if (!salesByDate[date]) salesByDate[date] = 0;
    salesByDate[date] += 1;
  });
  // Sort dates ascending (oldest to newest)
  const salesChartData = Object.entries(salesByDate)
    .map(([date, sales]) => ({ date, sales }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  // Filtered voucher redemptions
  const voucherRedemptions = filteredVouchers.filter(item => {
    if (item.product.toLowerCase().includes("gift") || item.type === "gift") return false;
    if (!isProductMatch(item.product, filters.products)) return false;
    // Location filter: only show if location matches or "All Locations"
    if (filters.locations !== "All Locations") {
      // Find location object for this voucher
      let locationObj = filteredLocations.find(loc => {
        if (!loc.name) return false;
        return (item.locationUsed || "").toLowerCase().includes((loc.name || "").toLowerCase());
      });
      if (!locationObj || locationObj.name !== filters.locations) return false;
    }
    return true;
  });

  // Filtered gift card redemptions
  const giftCardRedemptions = filteredVouchers.filter(item => {
    if (!(item.product.toLowerCase().includes("gift") || item.type === "gift")) return false;
    if (!isProductMatch(item.product, filters.products)) return false;
    // Location filter: show if any location in locationUsed matches selected location
    if (filters.locations !== "All Locations") {
      const locationsArr = (item.locationUsed || "").split(",").map(l => l.trim().toLowerCase());
      const selectedLocation = filters.locations.toLowerCase();
      if (!locationsArr.some(loc => loc === selectedLocation)) return false;
    }
    return true;
  });

  // Filtered metrics
  const totalProductSales = productSales.reduce((sum, item) => sum + (item.revenue || 0), 0);
  const totalGiftCardBalance = filteredVouchers.reduce((sum, v) => sum + (v.balance || 0), 0);
  const totalVouchers = filteredVouchers.length;
  const usedVouchersCount = filteredVouchers.filter(v => v.use === true).length;
  const activeVouchers = totalVouchers - usedVouchersCount;


  return (
    <div style={styles.container}>
      <div style={styles.header}><h1 style={styles.title}>Sales & Vouchers Report</h1></div>

      <div style={styles.filterSection}>
        <span style={styles.filterLabel}>Filter by:</span>
        <select style={styles.select} value={dateFilter} onChange={(e) => setDateFilter(e.target.value)}>
          <option value="All">All</option>
          <option value="Today">Today</option>
          <option value="Yesterday">Yesterday</option>
          <option value="This Week">This Week</option>
          <option value="Last Week">Last Week</option>
          <option value="This Month">This Month</option>
          <option value="Last Month">Last Month</option>
          <option value="This Year">This Year</option>
          <option value="Last Year">Last Year</option>
          <option value="Custom Range">Custom Range</option>
        </select>
        {dateFilter === "Custom Range" && (
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "8px" }}>
            <DatePicker style={{ width: "150px" }} placeholder="Start Date" value={customStart ? dayjs(customStart) : null} onChange={(date, dateString) => setCustomStart(dateString)} format="YYYY-MM-DD" />
            <DatePicker style={{ width: "150px" }} placeholder="End Date" value={customEnd ? dayjs(customEnd) : null} onChange={(date, dateString) => setCustomEnd(dateString)} format="YYYY-MM-DD" />
          </div>
        )}
        <select style={styles.select} value={filters.products} onChange={e => setFilters(f => ({ ...f, products: e.target.value }))}>
          <option>All Products</option>
          {[...new Set([
          ...((vouchers || []).map(v => v.productTitle).filter(Boolean)),
          ...((analytics?.allProducts || []).map(p => p.title))
          ])].map((product, idx) => (
          <option key={idx} value={product}>{product}</option>
          ))}
        </select>
        <select style={styles.select} value={filters.market} onChange={handleMarketChange}>
          <option>All Markets</option>
          {marketOptions.map((market, idx) => (
            <option key={idx} value={market}>{market}</option>
          ))}
        </select>
        {/* Hide Location filter until Market is selected */}
        {filters.market !== "All Markets" && (
          <select style={styles.select} value={filters.locations} onChange={e => setFilters(f => ({ ...f, locations: e.target.value }))}>
            <option>All Locations</option>
            {(filteredLocations || []).map((loc, idx) => (
              <option key={idx} value={loc.name || loc}>
                {loc.name || loc}
              </option>
            ))}
          </select>
        )}
        {isFilterActive && <button style={styles.resetButton} onClick={() => { setDateFilter("All"); setCustomStart(""); setCustomEnd(""); setFilters({ products: "All Products", locations: "All Locations" })}}>
          Reset
        </button>}
      </div>

      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Product Sales</div><div style={styles.metricValue}>{typeof totalProductSales === "number" ? totalProductSales.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalProductSales}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Gift Card Balances</div><div style={styles.metricValue}>{typeof totalGiftCardBalance === "number" ? totalGiftCardBalance.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : totalGiftCardBalance}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Total Vouchers</div><div style={styles.metricValue}>{typeof totalVouchers === "number" ? totalVouchers.toLocaleString('en-US') : totalVouchers}</div></div>
        <div style={styles.metricCard}><div style={styles.metricLabel}>Active Vouchers</div><div style={styles.metricValue}>{typeof activeVouchers === "number" ? activeVouchers.toLocaleString('en-US') : activeVouchers}</div></div>
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        {/* Column 1: Product Sales + Voucher Redemptions */}
        <div style={styles.chartColumn}>
          <div style={styles.chartContainer}>
            <div style={styles.chartTitle}>Product Sales Chart</div>
            <div style={styles.lineChart}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={salesChartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="sales" stroke="#8884d8" name="Sales" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div style={styles.tableContainer}>
            <div style={styles.tableTitle}>Voucher Redemptions</div>
            <table style={styles.table}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Date</th><th style={styles.tableHeader}>Location</th></tr></thead>
            <tbody>
              {voucherRedemptions && voucherRedemptions.length > 0 ? (
                voucherRedemptions.map((item, index) => (
                  <tr key={index}><td style={styles.tableCell}>{item.product || "—"}</td><td style={styles.tableCell}>{item.date || "—"}</td><td style={styles.tableCell}>{item.locationUsed || "—"}</td></tr>
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
                {(totalVouchers === 0) && (
                  <circle cx="50" cy="50" r="40" fill="#888" stroke="white" strokeWidth="2" />
                )}
                {/* Agar 100% active hai to green circle dikhaye */}
                {totalVouchers > 0 && activeVouchers === totalVouchers && (
                  <circle cx="50" cy="50" r="40" fill="#28a745" stroke="white" strokeWidth="2" />
                )}
                {/* Agar 0% active hai to red circle dikhaye */}
                {totalVouchers > 0 && activeVouchers === 0 && (
                  <circle cx="50" cy="50" r="40" fill="#dc3545" stroke="white" strokeWidth="2" />
                )}
                {/* Agar kuch active hain kuch inactive hain to proportion dikhaye */}
                {totalVouchers > 0 && activeVouchers > 0 && activeVouchers < totalVouchers && (
                  <>
                    <circle cx="50" cy="50" r="40" fill="#dc3545" stroke="white" strokeWidth="2" />
                    <path d={`M 50 10 A 40 40 0 ${activeVouchers / totalVouchers > 0.5 ? 1 : 0} 1 ${50 + 40 * Math.sin(2 * Math.PI * activeVouchers / totalVouchers)} ${50 - 40 * Math.cos(2 * Math.PI * activeVouchers / totalVouchers)} L 50 50 Z`}  fill="#28a745"  stroke="white"  strokeWidth="2" />
                  </>
                )}
              </svg>
              </div>
                  

              </div>
              <div style={styles.pieLegend}>
      <div style={styles.legendItem}>
        <div style={{ ...styles.legendColor, backgroundColor: "#dc3545" }}></div>
        <span>{totalVouchers > 0 ? Math.round(((totalVouchers - activeVouchers) / totalVouchers) * 100) : 0}% Inactive</span>
      </div>
      <div style={styles.legendItem}>
        <div style={{ ...styles.legendColor, backgroundColor: "#28a745" }}></div>
        <span>{totalVouchers > 0 ? Math.round((activeVouchers / totalVouchers) * 100) : 0}% Active</span>
      </div>
    </div>
          </div>
          <div style={styles.tableContainer}>
            <div style={styles.tableTitle}>Gift Card Redemption</div>
            <table style={styles.tables}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Date</th><th style={styles.tableHeader}>Location</th><th style={styles.tableHeader}>Balance</th></tr></thead>
            <tbody>{giftCardRedemptions.map((item, i) => (<tr key={i}><td style={styles.tableCell}>{item.product || "—"}</td><td style={styles.tableCell}>{item.date || "—"}</td><td style={styles.tableCell}>{item.locationUsed || "—"}</td><td style={styles.tableCell}>{item.balance !== undefined ? item.balance.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "$0.00"}</td></tr>))}</tbody>
            </table>
          </div>
        </div>

        {/* Column 3: Group Product Sales */}
        <div style={styles.chartColumn}>
          <div style={styles.chartContainerss}>
            <div style={styles.chartTitle}>Group Product Sales</div>
            <table style={styles.table}><thead><tr><th style={styles.tableHeader}>Product</th><th style={styles.tableHeader}>Sales</th><th style={styles.tableHeader}>Revenue</th></tr></thead>
            <tbody>{productSales.map((item, i) => (<tr key={i}><td style={styles.tableCell}>{item.product}</td><td style={styles.tableCell}>{item.sales}</td><td style={styles.tableCell}>{ item.revenue !== undefined ? item.revenue.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "$0.00"}</td></tr>))}</tbody>
            </table>
          </div>
          <button style={styles.exportButton} onClick={() => exportToExcel(productSales, voucherRedemptions, giftCardRedemptions)}>
            Export
          </button>
        </div>
      </div>
    </div>
  )
}