// Imports.
// Export to CSV utility
function exportToCSV(filename, data) {
  if (!data || data.length === 0) return;

  const csvRows = [];
  const headers = Object.keys(data[0]);
  csvRows.push(headers.join(","));

  for (const row of data) {
    const values = headers.map((h) => {
      let val = row[h] ?? "";
      if (typeof val === "string") {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    });
    csvRows.push(values.join(","));
  }

  const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.setAttribute("hidden", "");
  a.setAttribute("href", url);
  a.setAttribute("download", filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
import React from "react";
import { useLoaderData, useNavigation, useNavigate } from "@remix-run/react";
import SidebarLayout from "../components/SidebarLayout";
import { json } from "@remix-run/node";
// server-only utilities (imported dynamically inside loader)
import { Spinner } from "@shopify/polaris";


// Loader.
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get('page') || '1');
  const perPage = Number(url.searchParams.get('perPage') || '25');

  // Dynamically import server-only function to avoid bundling server code into client bundle
  const { getVouchersPage } = await import("../models/voucher.server");
  const data = await getVouchersPage(page, perPage);
  return json({ vouchers: data.items, pagination: { page: data.page, perPage: data.perPage, totalPages: data.totalPages, totalCount: data.totalCount } });
};

// Frontend.
export default function VouchersPage() {
  const { vouchers, pagination } = useLoaderData();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState("");
  
  // treat any navigation state other than 'idle' as loading (submitting/loading)
  const isLoading = navigation.state !== "idle";
  const [dateFilter, setDateFilter] = React.useState("All");
  const [typeFilter, setTypeFilter] = React.useState("all");
  const [usedFilter, setUsedFilter] = React.useState("all");
  
  // Calculate summary counts
  const summary = React.useMemo(() => {
    // Helper to parse potential numeric fields safely
    function parseNumber(x) {
      const n = Number.parseFloat(x);
      return Number.isFinite(n) ? n : null;
    }

    // Determine status for vouchers/gift cards. For gift cards we try to detect remaining/original
    function getVoucherStatus(v) {
      const rawType = Array.isArray(v.type) ? (v.type[0] || '') : (typeof v.type === 'string' ? v.type : 'voucher');
      const normalizedType = String(rawType).replace(/\[|\]|\"/g, '').toLowerCase();
      const isGift = normalizedType.includes('gift');

      // possible fields for remaining/current balance
      const possibleRemaining = [v.balance, v.remaining, v.remainingBalance, v.amountRemaining, v.currentBalance, v.current_amount, v.remaining_amount];
      const possibleOriginal = [v.initialBalance, v.amount, v.originalAmount, v.totalPrice, v.value, v.initial_amount];

      const remaining = possibleRemaining.map(parseNumber).find(n => n !== null);
      const original = possibleOriginal.map(parseNumber).find(n => n !== null);

      const usedBool = (x => x === true || x === 1 || x === '1' || String(x).toLowerCase() === 'true')(v.used ?? v.statusUse ?? v.order?.statusUse ?? v.use);

      // Default status
      let status = 'UNUSED';

      if (!isGift) {
        status = usedBool ? 'USED' : 'UNUSED';
      } else {
        // Gift card: prefer numeric detection when available
        if (remaining == null || original == null) {
          status = usedBool ? 'USED' : 'UNUSED';
        } else {
          if (remaining <= 0) status = 'USED';
          else if (remaining < original) status = 'PARTIALLY USED';
          else status = 'UNUSED';
        }
      }

      return { isGift, status, remaining, original };
    }

    return vouchers.reduce((acc, v) => {
      const { isGift, status } = getVoucherStatus(v);

      // Total counts
      acc.totalVouchers++;

      if (!isGift) {
        acc.vouchers.total++;
        if (status === 'USED') acc.vouchers.used++;
        else acc.vouchers.unused++;
      } else {
        acc.gifts.total++;
        if (status === 'USED') acc.gifts.used++;
        else if (status === 'PARTIALLY USED') acc.gifts.partial++;
        else acc.gifts.unused++;
      }

      return acc;
    }, {
      totalVouchers: 0,
      vouchers: { total: 0, used: 0, unused: 0 },
      gifts: { total: 0, used: 0, partial: 0, unused: 0 }
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
      // Reuse the same status detection logic as summary
      function parseNumber(x) { const n = Number.parseFloat(x); return Number.isFinite(n) ? n : null; }
      const rawType = Array.isArray(v.type) ? (v.type[0] || '') : (typeof v.type === 'string' ? v.type : 'voucher');
      const normalizedType = String(rawType).replace(/\[|\]|\"/g, '').toLowerCase();
      const isGift = normalizedType.includes('gift');

      const possibleRemaining = [v.balance, v.remaining, v.remainingBalance, v.amountRemaining, v.currentBalance, v.current_amount, v.remaining_amount];
      const possibleOriginal = [v.initialBalance, v.amount, v.originalAmount, v.totalPrice, v.value, v.initial_amount];
      const remaining = possibleRemaining.map(parseNumber).find(n => n !== null);
      const original = possibleOriginal.map(parseNumber).find(n => n !== null);
      const usedBool = (x => x === true || x === 1 || x === '1' || String(x).toLowerCase() === 'true')(v.used ?? v.statusUse ?? v.order?.statusUse ?? v.use);

      let status = 'UNUSED';
      if (!isGift) status = usedBool ? 'USED' : 'UNUSED';
      else {
        if (remaining == null || original == null) status = usedBool ? 'USED' : 'UNUSED';
        else if (remaining <= 0) status = 'USED';
        else if (remaining < original) status = 'PARTIALLY USED';
        else status = 'UNUSED';
      }

      const matchesSearch = code.includes(q) || orderId.includes(q) || email.includes(q);
      const matchesDate = isDateMatch(v.createdAt, dateFilter);
      const matchesType = typeFilter === 'all' || (typeFilter === 'voucher' && !isGift) || (typeFilter === 'gift' && isGift);
      const matchesUsed = usedFilter === 'all' ||
        (usedFilter === 'used' && status === 'USED') ||
        (usedFilter === 'partial' && status === 'PARTIALLY USED') ||
        (usedFilter === 'unused' && status === 'UNUSED');
      return matchesSearch && matchesDate && matchesType && matchesUsed;
    });
  }, [vouchers, search, dateFilter, typeFilter, usedFilter]);

  const [isExporting, setIsExporting] = React.useState(false);

  return (
    <SidebarLayout>
      <div style={{ padding: 40, position: 'relative' }}>
        {isLoading && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(255, 255, 255, 0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div style={{ background: 'white', padding: '20px 40px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
              <Spinner size="large" />
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                <div>
                  <div style={cardTitleStyle}>Total</div>
                  <div style={cardValueStyle}>{summary.gifts.total}</div>
                </div>
                <div>
                  <div style={cardTitleStyle}>Used</div>
                  <div style={{ ...cardValueStyle, color: '#b91c1c' }}>{summary.gifts.used}</div>
                </div>
                <div>
                  <div style={cardTitleStyle}>Partially Used</div>
                  <div style={{ ...cardValueStyle, color: '#92400e' }}>{summary.gifts.partial}</div>
                </div>
                <div>
                  <div style={cardTitleStyle}>Available</div>
                  <div style={{ ...cardValueStyle, color: '#065f46' }}>{summary.gifts.unused}</div>
                </div>
              </div>
          </div>
        </div>

  {/* Search and Filters */}
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)',marginBottom: '24px'}}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px',marginBottom: '16px'}}>
            <div>
              <label style={labelStyle}>Search</label>
              <input type="text" placeholder="Search by code, order or email" value={search} onChange={e => setSearch(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Date Range</label>
              <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={inputStyle}>
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
                <option value="partial">Partially Used</option>
                <option value="unused">Unused</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" style={{ ...exportButtonStyle, opacity: isExporting ? 0.6 : 1, pointerEvents: isExporting ? 'none' : 'auto', position: 'relative' }} disabled={isExporting} onClick={async () => {
              setIsExporting(true);
              const csvData = filteredVouchers.map(v => {
                // compute status the same way we do for the table
                function parseNumber(x) { const n = Number.parseFloat(x); return Number.isFinite(n) ? n : null; }
                const rawType = Array.isArray(v.type) ? (v.type[0] || '') : (typeof v.type === 'string' ? v.type : 'voucher');
                const normalizedType = String(rawType).replace(/\[|\]|\"/g, '').toLowerCase();
                const isGift = normalizedType.includes('gift');
                const possibleRemaining = [v.balance, v.remaining, v.remainingBalance, v.amountRemaining, v.currentBalance, v.current_amount, v.remaining_amount];
                const possibleOriginal = [v.initialBalance, v.amount, v.originalAmount, v.totalPrice, v.value, v.initial_amount];
                const remaining = possibleRemaining.map(parseNumber).find(n => n !== null);
                const original = possibleOriginal.map(parseNumber).find(n => n !== null);
                const usedBool = (x => x === true || x === 1 || x === '1' || String(x).toLowerCase() === 'true')(v.used ?? v.statusUse ?? v.order?.statusUse ?? v.use);
                let status = 'UNUSED';
                if (!isGift) status = usedBool ? 'USED' : 'UNUSED';
                else {
                  if (remaining == null || original == null) status = usedBool ? 'USED' : 'UNUSED';
                  else if (remaining <= 0) status = 'USED';
                  else if (remaining < original) status = 'PARTIALLY USED';
                  else status = 'UNUSED';
                }

                return {
                  Code: v.code,
                  Type: Array.isArray(v.type) ? v.type[0] : (typeof v.type === 'string' ? v.type.replace(/\[|\]|"/g, '') : 'voucher'),
                  OrderID: v.shopifyOrderId,
                  CustomerEmail: v.customerEmail,
                  Status: status,
                  Remaining: remaining ?? '',
                  Original: original ?? '',
                  CreatedAt: v.createdAt
                };
              });

              await new Promise(res => setTimeout(res, 500));
              exportToCSV("all_vouchers.csv", csvData);
              setIsExporting(false);
            }} >{isExporting ? (<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span className="loader" style={{ width: 16, height: 16, border: '2px solid #fff', borderTop: '2px solid #862633', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }}></span>Exporting...</span>) : ('Export')}</button>
            <style>{`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}</style>
          </div>
        </div>
        {/* Pagination controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button disabled={isLoading || !pagination || pagination.page <= 1} onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', String((pagination?.page || 1) - 1));
              navigate(url.pathname + url.search);
            }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>Prev</button>

            <div>Page <strong>{pagination?.page || 1}</strong> of <strong>{pagination?.totalPages || 1}</strong></div>

            <button disabled={isLoading || !pagination || (pagination.page >= pagination.totalPages)} onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', String((pagination?.page || 1) + 1));
              navigate(url.pathname + url.search);
            }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff' }}>Next</button>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <label style={{ color: '#6b7280' }}>Per page</label>
            <select disabled={isLoading} value={pagination?.perPage || 25} onChange={(e) => {
              const url = new URL(window.location.href);
              url.searchParams.set('perPage', String(e.target.value));
              url.searchParams.set('page', '1');
              navigate(url.pathname + url.search);
            }} style={{ padding: '6px', borderRadius: 6 }}>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            {isLoading && <div style={{ marginLeft: 8 }}><Spinner size="small" /></div>}
          </div>
        </div>

        <div style={containerStyle}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead style={{ background: "#f3f4f6" }}>
              <tr>
                <th style={headStyle}>Code</th>
                <th style={headStyle}>Product</th>
                <th style={headStyle}>Value</th> 
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
                filteredVouchers.map((v, idx) => {
                  const rawType = Array.isArray(v.type) ? (v.type[0] || '') : (typeof v.type === 'string' ? v.type : 'voucher');
                  const normalizedType = String(rawType).replace(/\[|\]|\"/g, '').toLowerCase();
                  const isGift = normalizedType.includes('gift');

                  // determine status again
                  function parseNumber(x) { const n = Number.parseFloat(x); return Number.isFinite(n) ? n : null; }
                  const possibleRemaining = [v.balance, v.remaining, v.remainingBalance, v.amountRemaining, v.currentBalance, v.current_amount, v.remaining_amount];
                  const possibleOriginal = [v.initialBalance, v.amount, v.originalAmount, v.totalPrice, v.value, v.initial_amount];
                  const remaining = possibleRemaining.map(parseNumber).find(n => n !== null);
                  const original = possibleOriginal.map(parseNumber).find(n => n !== null);
                  const usedBool = (x => x === true || x === 1 || x === '1' || String(x).toLowerCase() === 'true')(v.used ?? v.statusUse ?? v.order?.statusUse ?? v.use);

                  let status = 'UNUSED';
                  if (!isGift) status = usedBool ? 'USED' : 'UNUSED';
                  else {
                    if (remaining == null || original == null) status = usedBool ? 'USED' : 'UNUSED';
                    else if (remaining <= 0) status = 'USED';
                    else if (remaining < original) status = 'PARTIALLY USED';
                    else status = 'UNUSED';
                  }

                  const isUsed = status === 'USED';
                  const isPartial = status === 'PARTIALLY USED';

                  return (
                    <tr key={v.id} style={{background: idx % 2 === 0 ? "#fafbfc" : "#fff"}}>
                      <td style={cellStyle}>{v.productTitle}</td>
                      <td style={cellStyle}>{v.code}</td>
                      <td style={cellStyle}>{v.totalPrice} $</td>
                      <td style={cellStyle}>{isGift ? 'gift card' : 'voucher'}</td>
                      <td style={cellStyle}>{v.shopifyOrderId}</td>
                      <td style={cellStyle}>{v.customerEmail}</td>
                      <td style={cellStyle}>
                        <span style={{
                          display: "inline-block",
                          padding: "2px 8px",
                          borderRadius: 8,
                          background: isUsed ? "#fee2e2" : (isPartial ? "#fff7ed" : "#f3f4f6"),
                          color: isUsed ? "#b91c1c" : (isPartial ? "#92400e" : "#4b5563"),
                          fontWeight: 600,
                          fontSize: 12,
                          textTransform: 'uppercase'
                        }}>
                          {isUsed ? "USED" : (isPartial ? "PARTIALLY USED" : "UNUSED")}
                        </span>
                      </td>
                      <td style={cellStyle}>{new Date(v.createdAt).toLocaleString()}</td>
                      <button onClick={() => window.open(`/vouchers/export?id=${v.id}`, "_blank")} style={{ padding: "6px 12px", backgroundColor: "#862633", color: "white", border: "none", borderRadius: "6px", cursor: "pointer"}}>
                        Download
                      </button>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: 40 }}>
                    <img src="/not-found.svg" alt="No vouchers found" style={{ width: 48, height: 48, opacity: 0.5 }} />
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
const cardStyle = { backgroundColor: '#fff', borderRadius: '8px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', textAlign: 'center', borderTop: '3px solid #862633' };
const cardTitleStyle = { color: '#6b7280', fontSize: '14px', marginBottom: '8px'};
const cardValueStyle = { color: '#111827', fontSize: '24px', fontWeight: '600' };
const labelStyle = { display: 'block', marginBottom: '6px', fontSize: '14px', color: '#374151', fontWeight: '500' };
const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', color: '#111827', backgroundColor: '#fff', transition: 'border-color 0.2s', ':focus': { outline: 'none', borderColor: '#862633', boxShadow: '0 0 0 2px rgba(134, 38, 51, 0.1)'}};
const exportButtonStyle = { backgroundColor: '#862633', color: 'white', border: 'none', borderRadius: '6px', padding: '10px 20px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', transition: 'background-color 0.2s', ':hover': { backgroundColor: '#6e1e2c'}};
const containerStyle = { overflowX: "auto", width: "100%", margin: 0, background: "#fff", borderRadius: 12, boxShadow: "0 2px 16px #0001", border: "1px solid #eee" }
const headStyle = { padding: "12px 6px", fontWeight: 600, borderBottom: "2px solid #e5e7eb", fontSize: 13, textAlign: "left" };
const cellStyle = { padding: "8px 6px", borderBottom: "1px solid #f3f4f6", fontSize: 13, color: "#6b7280" };
