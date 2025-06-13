// Imports.
import { Link, Outlet, useLoaderData, useRouteError } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { Frame, Navigation, Text, Icon } from "@shopify/polaris";
import { HomeIcon, OrderIcon, ProductIcon, SettingsIcon, StoreManagedIcon, } from "@shopify/polaris-icons";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { authenticate } from "../shopify.server";
import { useState } from "react";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Loader.
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return { apiKey: process.env.SHOPIFY_API_KEY || "" };
};


// Frontend.
export default function App() {
  const { apiKey } = useLoaderData();
  const [mobileNavigationActive, setMobileNavigationActive] = useState(false);

  const toggleMobileNavigationActive = () =>
    setMobileNavigationActive((mobileNavigationActive) => !mobileNavigationActive);

  // Navigation markup.
  const navigationMarkup = (
    <Navigation location="/">
      <Navigation.Section
        items={[
          {
            url: '/app',
            label: 'Home',
            icon: HomeIcon,
            exactMatch: true,
          },
          {
            url: '/app/orders',
            label: 'Orders',
            icon: OrderIcon,
          },
          {
            url: '/app/customers',
            label: 'Customers',
            icon: StoreManagedIcon,
          },
          {
            url: '/app/additional',
            label: 'Vouchers',
            icon: ProductIcon,
          },
        ]}
      />
      <Navigation.Section
        title="Settings"
        items={[
          {
            url: '/app/settings',
            label: 'App Settings',
            icon: SettingsIcon,
          },
        ]}
      />
    </Navigation>
  );

  return (
    <AppProvider isEmbeddedApp apiKey={apiKey}>
      <Frame
        navigation={navigationMarkup}
        showMobileNavigation={mobileNavigationActive}
        onNavigationDismiss={toggleMobileNavigationActive}
      >
        <div style={{ padding: '20px' }}>
          <Outlet />
        </div>
      </Frame>
      
      {/* Nav Menu. */}
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/orders">Orders</Link>
        <Link to="/app/customers">Customers</Link>
      </NavMenu>
    </AppProvider>
  );
}

// Error Boundary.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

// Headers.
export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};
