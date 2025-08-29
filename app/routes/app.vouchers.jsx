// Imports.
import React from "react";
import { useLoaderData, useNavigation } from "@remix-run/react";
import SidebarLayout from "../components/SidebarLayout";
import { json } from "@remix-run/node";
import { getAllVouchers } from "../models/voucher.server";
import { Loader } from "@shopify/polaris";


// Loader.
export const loader = async () => {
  const vouchers = await getAllVouchers();
  return json({ vouchers });
};


// Helper function to get voucher type
const getVoucherType = (lineItems) => {
  if (!lineItems) return '--';
  
  try {
    // If lineItems is already an object, use it directly
    const items = typeof lineItems === 'string' ? JSON.parse(lineItems) : lineItems;
    
    // Debug log the line items structure
    console.log('Line items:', JSON.stringify(items, null, 2));
    
    // Handle different possible structures
    let firstItem;
    if (Array.isArray(items)) {
      firstItem = items[0];
    } else if (items?.edges?.[0]?.node) {
      firstItem = items.edges[0].node;
    } else if (items?.line_items?.[0]) {
      // Shopify's line_items format
      firstItem = items.line_items[0];
    } else if (items?.length > 0) {
      firstItem = items[0];
    } else if (typeof items === 'object') {
      firstItem = items;
    }
    
    // Debug log the first item
    console.log('First item:', JSON.stringify(firstItem, null, 2));
    
    // Try different possible type fields
    const type = firstItem?.type || 
                firstItem?.product_type || 
                firstItem?.productType ||
                firstItem?.properties?.find(p => p.name === 'type' || p.name === 'product_type')?.value ||
                (firstItem?.title?.toLowerCase().includes('gift') ? 'Gift Card' : 'Voucher');
    
    return type || 'Voucher';
  } catch (e) {
    console.error('Error parsing line items:', e);
    console.log('Line items data:', lineItems);
    return '--';
  }
};

// Frontend.
export default function VouchersPage() {
  const { vouchers } = useLoaderData();
  const navigation = useNavigation();
  const [search, setSearch] = React.useState("");
  
  const isLoading = navigation.state === "loading";
  const [dateFilter, setDateFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [usedFilter, setUsedFilter] = React.useState("all");
  
  // Calculate summary counts
  const summary = React.useMemo(() => {
    return vouchers.reduce((acc, v) => {
      let type = getVoucherType(v.order?.lineItems);
      // Clean up the type display
      if (type.startsWith('["') && type.endsWith('"]')) {
        type = type.slice(2, -2);
      }
      console.log('Voucher type for order', v.order?.shopifyOrderId, ':', type);
      const isGift = type.toLowerCase().includes('gift');
      const isVoucher = !isGift && type !== '--';
      const isUsed = v.order?.statusUse;
      
      // Total counts
      acc.totalVouchers++;
      
      // Voucher specific counts
      if (isVoucher) {
        acc.vouchers.total++;
        if (isUsed) acc.vouchers.used++;
        else acc.vouchers.unused++;
      } 
      // Gift card specific counts
      else if (isGift) {
        acc.gifts.total++;
        if (isUsed) acc.gifts.used++;
        else acc.gifts.unused++;
      }
      
      return acc;
    }, { 
      totalVouchers: 0,
      vouchers: { total: 0, used: 0, unused: 0 },
      gifts: { total: 0, used: 0, unused: 0 }
    });
  }, [vouchers]);

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

  // Filter vouchers by search, date, type and status
  const filteredVouchers = React.useMemo(() => {
    return vouchers.filter(v => {
      const q = search.toLowerCase();
      const code = (v.code || "").toLowerCase();
      const orderId = (v.shopifyOrderId || "").toLowerCase();
      const email = (v.customerEmail || "").toLowerCase();
      const type = getVoucherType(v.order?.lineItems).toLowerCase();
      const isGift = type.includes('gift');
      
      const matchesSearch = code.includes(q) || orderId.includes(q) || email.includes(q);
      const matchesDate = isDateMatch(v.createdAt, dateFilter);
      const matchesType = typeFilter === 'all' || 
                         (typeFilter === 'voucher' && !isGift) ||
                         (typeFilter === 'gift' && isGift);
      const matchesUsed = usedFilter === 'all' || 
                         (usedFilter === 'used' && v.order?.statusUse) || 
                         (usedFilter === 'not_used' && !v.order?.statusUse);
      
      return matchesSearch && matchesDate && matchesType && matchesUsed;
    });
  }, [vouchers, search, dateFilter, typeFilter, usedFilter]);

  return (
    <SidebarLayout>
      <div style={{ padding: 40, position: 'relative' }}>
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              background: 'white',
              padding: '20px 40px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Loader size="large" />
              <div style={{ color: '#4b5563', marginTop: '12px' }}>Loading vouchers...</div>
            </div>
          </div>
        )}
        {/* Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
          {/* Vouchers Card */}
          <div style={cardStyle}>
            <div style={{ ...cardTitleStyle, fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Vouchers</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <div style={cardTitleStyle}>Total</div>
                <div style={cardValueStyle}>{summary.vouchers.total}</div>
              </div>
              <div>
                <div style={cardTitleStyle}>Used</div>
                <div style={{ ...cardValueStyle, color: '#b91c1c' }}>{summary.vouchers.used}</div>
              </div>
              <div>
                <div style={cardTitleStyle}>Available</div>
                <div style={{ ...cardValueStyle, color: '#065f46' }}>{summary.vouchers.unused}</div>
              </div>
            </div>
          </div>

          {/* Gift Cards Card */}
          <div style={cardStyle}>
            <div style={{ ...cardTitleStyle, fontSize: '16px', fontWeight: '600', color: '#111827', marginBottom: '16px' }}>Gift Cards</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <div style={cardTitleStyle}>Total</div>
                <div style={cardValueStyle}>{summary.gifts.total}</div>
              </div>
              <div>
                <div style={cardTitleStyle}>Used</div>
                <div style={{ ...cardValueStyle, color: '#b91c1c' }}>{summary.gifts.used}</div>
              </div>
              <div>
                <div style={cardTitleStyle}>Available</div>
                <div style={{ ...cardValueStyle, color: '#065f46' }}>{summary.gifts.unused}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div style={{ 
          backgroundColor: '#fff', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
            gap: '16px',
            marginBottom: '16px'
          }}>
            <div>
              <label style={labelStyle}>Search</label>
              <input
                type="text"
                placeholder="Search by code, order ID, or email"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date Range</label>
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="Yesterday">Yesterday</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
                <option value="This Year">This Year</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All Types</option>
                <option value="voucher">Vouchers</option>
                <option value="gift">Gift Cards</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Status</label>
              <select
                value={usedFilter}
                onChange={e => setUsedFilter(e.target.value)}
                style={inputStyle}
              >
                <option value="all">All Status</option>
                <option value="used">Used</option>
                <option value="not_used">Not Used</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <form method="post" action="/vouchers/export">
              <button type="submit" style={exportButtonStyle}>
                Export
              </button>
            </form>
          </div>
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
                <th style={headStyle}>Code</th>
                <th style={headStyle}>Type</th>
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
                    <td style={cellStyle}>
                      {(() => {
                        let type = getVoucherType(v.order?.lineItems);
                        // Clean up the type display
                        if (type.startsWith('["') && type.endsWith('"]')) {
                          type = type.slice(2, -2);
                        }
                        return type === '--' ? 'Voucher' : type;
                      })()}
                    </td>
                    <td style={cellStyle}>
                      <a
                        href={`https://${v.shopifyOrderId.split('/')[0]}/admin/orders/${v.shopifyOrderId.split('/')[1]}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: '#1976d2', textDecoration: 'none' }}
                      >
                        {v.shopifyOrderId}
                      </a>
                    </td>
                    <td style={cellStyle}>{v.customerEmail}</td>
                    <td style={cellStyle}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: v.order?.statusUse ? "#fee2e2" : "#f3f4f6",
                          color: v.order?.statusUse ? "#b91c1c" : "#4b5563",
                          fontWeight: 600,
                          fontSize: 12,
                          textTransform: 'uppercase',
                        }}>
                        {v.order?.statusUse ? "USED" : "NO"}
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

// Styles
const cardStyle = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  textAlign: 'center',
  borderTop: '3px solid #862633'
};

const cardTitleStyle = {
  color: '#6b7280',
  fontSize: '14px',
  marginBottom: '8px'
};

const cardValueStyle = {
  color: '#111827',
  fontSize: '24px',
  fontWeight: '600'
};

const labelStyle = {
  display: 'block',
  marginBottom: '6px',
  fontSize: '14px',
  color: '#374151',
  fontWeight: '500'
};

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#111827',
  backgroundColor: '#fff',
  transition: 'border-color 0.2s',
  ':focus': {
    outline: 'none',
    borderColor: '#862633',
    boxShadow: '0 0 0 2px rgba(134, 38, 51, 0.1)'
  }
};

const exportButtonStyle = {
  backgroundColor: '#862633',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  padding: '10px 20px',
  fontSize: '14px',
  fontWeight: '500',
  cursor: 'pointer',
  transition: 'background-color 0.2s',
  ':hover': {
    backgroundColor: '#6e1e2c'
  }
};

const containerStyle = {
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
