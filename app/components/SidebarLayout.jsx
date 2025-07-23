import React, { useState } from "react";
import { Link, useLocation } from "@remix-run/react";
import { Frame, Navigation, Icon } from "@shopify/polaris";
import { ChartVerticalFilledIcon, ProductIcon, OrderIcon, ReceiptIcon, EmailIcon } from "@shopify/polaris-icons";

const navItems = [
  { label: "Report", url: "/app", icon: ChartVerticalFilledIcon },
  { label: "Products", url: "/app/products", icon: ProductIcon },
  { label: "Orders", url: "/app/orders", icon: OrderIcon },
  { label: "Vouchers", url: "/app/vouchers", icon: ReceiptIcon },
  // { label: "Customers", url: "/app/customers", icon: CustomersIcon },
  { label: "Emails", url: "/app/emails", icon: EmailIcon },
];

export default function SidebarLayout({ children }) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMouseEnter = () => {
    setSidebarOpen(true);
  };

  const handleMouseLeave = () => {
    setSidebarOpen(false);
  };

  const styles = {
    customSidebar: {
      position: "fixed",
      top: 0,
      left: 0, // Always visible
      width: sidebarOpen ? "300px" : "60px", // 60px for icons only, 300px for full
      height: "100vh",
      backgroundColor: "#666666",
      transition: "width 0.3s ease-in-out",
      zIndex: 1000,
      padding: sidebarOpen ? "20px" : "10px",
      boxShadow: "2px 0 10px rgba(0,0,0,0.3)",
      color: "white",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
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
      margin: 0,
    },
    sidebarMenuItem: {
      padding: sidebarOpen ? "12px 0" : "12px 5px",
      borderBottom: sidebarOpen ? "1px solid #666666" : "none",
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
      display: sidebarOpen ? "block" : "none", // Hide close button when closed
    },
    hamburger: {
      position: "fixed",
      top: "20px",
      left: sidebarOpen ? "270px" : "20px", // Move hamburger when sidebar is open
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      cursor: "pointer",
      zIndex: 1001,
      padding: "10px",
      backgroundColor: "#666666",
      borderRadius: "5px",
      transition: "all 0.3s ease",
      border: "2px solid #888888",
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    },
    hamburgerActive: {
      transform: "rotate(90deg)",
    },
    hamburgerLine: {
      width: "25px",
      height: "3px",
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
      backgroundColor: "#666666", 
    }
  };

  return (
    <>
      {/* Overlay when sidebar is open */}
      <div style={styles.sidebarOverlay} onClick={handleMouseLeave}></div>
      
      {/* Custom Sidebar */}
      <div 
        style={styles.customSidebar}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >

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
                  backgroundColor: isSelected ? "#555555" : "transparent",
                  fontWeight: isSelected ? "bold" : "normal"
                }}
                title={!sidebarOpen ? item.label : ""} // Tooltip when closed
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
                    alignItems: "center"
                  }}>
                    <Icon source={item.icon} color="white" />
                  </div>
                  {sidebarOpen && <span style={{ marginLeft: "5px" }}>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Main Content */}
      <div style={styles.contentWrapper}>
        {children}
      </div>
    </>
  );
}
