import React from "react";
import { Link, useLocation } from "@remix-run/react";
import { Frame, Navigation } from "@shopify/polaris";

const navItems = [
  { label: "Dashboard", url: "/app" },
  { label: "Products", url: "/app/products" },
  { label: "Orders", url: "/app/orders" },
  { label: "Vouchers", url: "/app/vouchers" },
];

export default function SidebarLayout({ children }) {
  const location = useLocation();

  return (
    <Frame
      navigation={
        <Navigation location={location.pathname}>
          <Navigation.Section
            items={navItems.map((item) => {
              // Only one tab should be active at a time
              let selected = false;
              if (item.url === "/app") {
                selected = location.pathname === "/app" || location.pathname === "/app/";
              } else {
                selected = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
              }
              return {
                label: item.label,
                url: item.url,
                selected,
                onClick: () => {},
                renderIcon: () => null,
              };
            })}
          />
        </Navigation>
      }
    >
      {children}
    </Frame>
  );
}
