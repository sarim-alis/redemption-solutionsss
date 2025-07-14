import React from "react";
import { useLoaderData } from "@remix-run/react";
import SidebarLayout from "../components/SidebarLayout";

export default function VouchersPage() {
  let data;
  try {
    data = useLoaderData();
  } catch (e) {
    data = null;
  }
  const vouchers = data && data.vouchers ? data.vouchers : [];

  return (
    <SidebarLayout>
      <div style={{ padding: 40 }}>
        <div
          style={{
            overflowX: "auto",
            width: "100%",
            margin: 0,
            background: "#fff",
            borderRadius: 12,
            boxShadow: "0 2px 16px #0001",
            border: "1px solid #eee",
          }}
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
                <th
                  style={{
                    padding: "12px 6px",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  Voucher Code
                </th>
                <th
                  style={{
                    padding: "12px 6px",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  Order ID
                </th>
                <th
                  style={{
                    padding: "12px 6px",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  Customer Email
                </th>
                <th
                  style={{
                    padding: "12px 6px",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  Used
                </th>
                <th
                  style={{
                    padding: "12px 6px",
                    fontWeight: 600,
                    borderBottom: "2px solid #e5e7eb",
                    fontSize: 13,
                  }}
                >
                  Created At
                </th>
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
                    <td
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid #f3f4f6",
                        fontFamily: "monospace",
                        fontSize: 13,
                      }}
                    >
                      {v.code}
                    </td>
                    <td
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                    >
                      {v.shopifyOrderId}
                    </td>
                    <td
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                    >
                      {v.customerEmail}
                    </td>
                    <td
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid #f3f4f6",
                        fontSize: 13,
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: v.used ? "#d1fae5" : "#fef3c7",
                          color: v.used ? "#065f46" : "#92400e",
                          fontWeight: 600,
                          fontSize: 12,
                        }}
                      >
                        {v.used ? "Yes" : "No"}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "8px 6px",
                        borderBottom: "1px solid #f3f4f6",
                        color: "#6b7280",
                        fontSize: 13,
                      }}
                    >
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
