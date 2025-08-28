// Imports.
import React from "react";
import { useLoaderData } from "@remix-run/react";
import SidebarLayout from "../components/SidebarLayout";
import { json } from "@remix-run/node";
import { getAllVouchers } from "../models/voucher.server";


// Loader.
export const loader = async () => {
  const vouchers = await getAllVouchers();
  return json({ vouchers });
};


// Frontend.
export default function VouchersPage() {
  const { vouchers } = useLoaderData();
  const [search, setSearch] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState("All");

  // Helper: date filter
  function isDateMatch(dateString, filter) {
    if (filter === "All") return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (filter === "Today") {
      return date.toDateString() === today.toDateString();
    }
    if (filter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    if (filter === "This Week") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return date >= weekStart && date <= today;
    }
    if (filter === "This Month") {
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    }
    if (filter === "This Year") {
      return date.getFullYear() === today.getFullYear();
    }
    return true;
  }

  // Filter vouchers by search and date
  const filteredVouchers = vouchers.filter(v => {
    const q = search.toLowerCase();
    const code = (v.code || "").toLowerCase();
    const orderId = (v.shopifyOrderId || "").toLowerCase();
    const email = (v.customerEmail || "").toLowerCase();
    const matchesSearch = code.includes(q) || orderId.includes(q) || email.includes(q);
    const matchesDate = isDateMatch(v.createdAt, dateFilter);
    return matchesSearch && matchesDate;
  });

  return (
    <SidebarLayout>
      <div style={{ padding: 40 }}>
        {/* Search and Date Filter */}
        <div style={{ marginBottom: 18, display: 'flex', gap: '16px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              width: "320px",
              fontSize: "15px"
            }}
          />
          <select
            value={dateFilter}
            onChange={e => setDateFilter(e.target.value)}
            style={{
              padding: "10px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "15px"
            }}
          >
            <option value="All">All</option>
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="This Week">This Week</option>
            <option value="This Month">This Month</option>
            <option value="This Year">This Year</option>
          </select>
        <form method="post" action="/vouchers/export" style={{ marginLeft: "auto" }}>
         <button type="submit" style={{ background: "#862633", color: "#fff", padding: "12px 28px", borderRadius: "6px", fontWeight: "600", border: "rgba(0, 0, 0, 0.45)", cursor: "pointer"}}>Export</button>
        </form>
        </div>
        <div
          style={containerStyle}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
            }}
          >
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th style={headStyle}>Voucher Code</th>
                <th style={headStyle}>Order ID</th>
                <th style={headStyle}>Customer Email</th>
                <th style={headStyle}>Used</th>
                <th style={headStyle}>Created At</th>
                <th style={headStyle}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredVouchers.length > 0 ? (
                filteredVouchers.map((v, idx) => (
                  <tr
                    key={v.id}
                    style={{
                      background: idx % 2 === 0 ? "#fafbfc" : "#fff",
                    }}
                  >
                    <td style={cellStyle}>{v.code}</td>
                    <td style={cellStyle}>{v.shopifyOrderId}</td>
                    <td style={cellStyle}>{v.customerEmail}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: v.used ? "#d1fae5" : "#fef3c7",
                          color: v.used ? "#065f46" : "#92400e",
                          fontWeight: 600,
                          fontSize: 12,
                        }}>
                        {v.used ? "Yes" : "No"}
                      </span>
                    </td>
                    <td style={cellStyle}>
                      {new Date(v.createdAt).toLocaleString()}
                    </td>
                    <button onClick={() => window.open(`/vouchers/export?id=${v.id}`, "_blank")} style={{ padding: "6px 12px", backgroundColor: "#862633", color: "white", border: "none", borderRadius: "6px", cursor: "pointer"}}>
                      Download
                    </button>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      textAlign: "center",
                      padding: 40,
                    }}
                  >
                    <img
                      src="/not-found.svg"
                      alt="No vouchers found"
                      style={{ width: 48, height: 48, opacity: 0.5 }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </SidebarLayout>
  );
}

// Styles.
const containerStyle ={
  overflowX: "auto",
  width: "100%",
  margin: 0,
  background: "#fff",
  borderRadius: 12,
  boxShadow: "0 2px 16px #0001",
  border: "1px solid #eee",
}

const headStyle = {
  padding: "12px 6px",
  fontWeight: 600,
  borderBottom: "2px solid #e5e7eb",
  fontSize: 13,
  textAlign: "left"
};

const cellStyle = {
  padding: "8px 6px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 13,
  color: "#6b7280",
};
