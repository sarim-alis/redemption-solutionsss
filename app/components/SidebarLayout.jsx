import React, { useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { Frame, Navigation, Icon } from "@shopify/polaris";
import { ChartVerticalFilledIcon, ProductIcon, OrderIcon, ReceiptIcon, EmailIcon, LocationIcon, PersonFilledIcon, LockFilledIcon, ProfileIcon, CashDollarFilledIcon, GiftCardFilledIcon } from "@shopify/polaris-icons";

const navItems = [
  { label: "Report", url: "/app", icon: ChartVerticalFilledIcon },
  { label: "Products", url: "/app/products", icon: ProductIcon },
  { label: "Orders", url: "/app/orders", icon: OrderIcon },
  { label: "Vouchers", url: "/app/vouchers", icon: ReceiptIcon },
  { label: "Locations", url: "/app/locations", icon: LocationIcon },
  { label: "Customers", url: "/app/customers", icon: ProfileIcon },
  { label: "Employees", url: "/app/users", icon: PersonFilledIcon },
  // { label: "Login", url: "/app/login", icon: LockFilledIcon },
  // { label: "Voucher", url: "/app/voucher", icon: CashDollarFilledIcon },
  // { label: "Gift", url: "/app/gift", icon: GiftCardFilledIcon },
];


export default function SidebarLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  const styles = {
    customSidebar: {
      position: "fixed",
      top: 0,
      left: 0, // Always visible
      width: sidebarOpen ? "300px" : "60px", // 60px for icons only, 300px for full
      height: "100vh",
      backgroundColor: "#862633", // Updated to dark red
      transition: "width 0.3s ease-in-out",
      zIndex: 1000,
      padding: sidebarOpen ? "20px" : "10px",
      boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      // overflow: "hidden",
    },
    sidebarOverlay: {
      position: "fixed",
      top: 0,
      left: 0,
      width: "100vw",
      height: "100vh",
      backgroundColor: "rgba(0,0,0,0.5)",
      zIndex: 999,
      display: sidebarOpen ? "block" : "none",
      transition: "opacity 0.3s ease-in-out",
    },
    sidebarHeader: {
      borderBottom: sidebarOpen ? "2px solid white" : "none",
      paddingBottom: sidebarOpen ? "15px" : "5px",
      marginBottom: sidebarOpen ? "20px" : "10px",
      textAlign: sidebarOpen ? "left" : "center",
    },
    sidebarTitle: {
      fontSize: sidebarOpen ? "24px" : "16px",
      fontWeight: "bold",
      margin: 0,
      display: sidebarOpen ? "block" : "none", // Hide title when closed
    },
    sidebarMenu: {
      listStyle: "none",
      padding: 0,
      marginTop: "45px",
    },
    sidebarMenuItem: {
      padding: sidebarOpen ? "12px 0" : "12px 5px",
      borderBottom: sidebarOpen ? "1px solid #a13a4a" : "none", // Lighter red border
      cursor: "pointer",
      transition: "background-color 0.2s ease",
      textAlign: sidebarOpen ? "left" : "center",
      marginBottom: sidebarOpen ? "0" : "10px",
    },
    closeButton: {
      position: "absolute",
      top: "15px",
      right: "15px",
      background: "none",
      border: "none",
      color: "white",
      fontSize: "24px",
      cursor: "pointer",
      display: sidebarOpen ? "block" : "none",
    },
    hamburger: {
      position: "fixed",
      top: "3px",
      left: sidebarOpen ? "270px" : "7px",
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      cursor: "pointer",
      zIndex: 1001,
      padding: "10px",
      backgroundColor: "#862633", // Updated to dark red
      borderRadius: "5px",
      transition: "all 0.3s ease",
      border: "2px solid #a13a4a", // Lighter red border
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    },
    hamburgerActive: {
      transform: "rotate(90deg)",
    },
    hamburgerLine: {
      width: "25px",
      height: "2px",
      backgroundColor: "white",
      transition: "all 0.2s ease",
    },
    contentWrapper: {
      marginLeft: "75px", // 60px for sidebar + 15px margin
      marginRight: "15px", // 15px right margin
      paddingTop: "0px", 
      marginTop: "0px", 
      minHeight: "100vh",
      width: "calc(100% - 90px)", 
      transition: "none", 
      backgroundColor: "white", // Updated to white
      color: "black", // Ensure text color is black
    }
  };

  return (
    <>
      {/* Hamburger Button */}
      <div style={styles.hamburger} onClick={toggleSidebar}>
        <div
          style={{
            ...styles.hamburgerLine,
            transform: sidebarOpen
              ? 'translateY(11px) rotate(45deg)'
              : 'none',
            marginBottom: '4px',
          }}
        ></div>
        <div
          style={{
            ...styles.hamburgerLine,
            opacity: sidebarOpen ? 0 : 1,
            transition: 'all 0.3s cubic-bezier(.4,2,.6,1)',
          }}
        ></div>
        <div
          style={{
            ...styles.hamburgerLine,
            transform: sidebarOpen
              ? 'translateY(-8px) rotate(-45deg)'
              : 'none',
            marginTop: '4px',
          }}
        ></div>
      </div>

      {/* Overlay when sidebar is open */}
      <div style={styles.sidebarOverlay} onClick={() => setSidebarOpen(false)}></div>

      {/* Custom Sidebar */}
      <div style={styles.customSidebar}>
        <ul style={styles.sidebarMenu}>
          {navItems.map((item, index) => {
            const isSelected = item.url === "/app" 
              ? (location.pathname === "/app" || location.pathname === "/app/")
              : (location.pathname === item.url || location.pathname.startsWith(item.url + "/"));
            return (
              <li 
                key={index}
                style={{
                  ...styles.sidebarMenuItem,
                  backgroundColor: isSelected ? "#a13a4a" : "transparent", // Lighter red for active state
                  fontWeight: isSelected ? "bold" : "normal",
                  position: 'relative',
                }}
              >
                <Link 
                  to={item.url} 
                  style={{ 
                    color: "white", 
                    textDecoration: "none",
                    display: "flex",
                    alignItems: "center",
                    position: "relative"
                  }}
                >
                  <div style={{
                    width: "40px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    position: 'relative',
                  }}>
                    <Icon source={item.icon} color="white" />
                    {!sidebarOpen && (
                      <span
                        style={{
                          position: 'absolute',
                          left: '110%',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: '#862633', // Match sidebar background color
                          color: 'white', // White text color
                          padding: '4px 12px',
                          borderRadius: '4px',
                          whiteSpace: 'nowrap',
                          fontSize: '14px',
                          opacity: 0,
                          pointerEvents: 'none',
                          transition: 'opacity 0.2s',
                          zIndex: 2000,
                          border: '1px solid #a13a4a', // Add subtle border for definition
                        }}
                        className="sidebar-tooltip"
                      >
                        {item.label}
                      </span>
                    )}
                  </div>
                  {sidebarOpen && <span style={{ marginLeft: "5px" }}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
        {/* Tooltip CSS for sidebar icon hover */}
        <style>{`
          .sidebar-tooltip {
            opacity: 0;
          }
          li:hover .sidebar-tooltip {
            opacity: 1 !important;
          }
        `}</style>
      </div>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {children}
      </div>
    </>
  );
}
