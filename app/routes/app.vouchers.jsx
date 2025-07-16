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
  console.log("📦 vouchers list:", vouchers);

  return (
    <SidebarLayout>
      <div style={{ padding: 40 }}>
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
              </tr>
            </thead>
            <tbody>
              {vouchers.length > 0 ? (
                vouchers.map((v, idx) => (
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={5}
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
};

const cellStyle = {
  padding: "8px 6px",
  borderBottom: "1px solid #f3f4f6",
  fontSize: 13,
  color: "#6b7280",
};
