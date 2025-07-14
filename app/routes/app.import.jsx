import React, { useState } from "react";
import { useLoaderData, useFetcher } from "@remix-run/react";
import { Page, Card, Button, Text, BlockStack, Banner } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";
import { prisma } from "../db.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  
  // Get current database stats
  const totalOrders = await prisma.order.count();
  const realOrders = await prisma.order.count({
    where: {
      shopifyOrderId: {
        not: {
          startsWith: 'test-'
        }
      }
    }
  });
  
  return { totalOrders, realOrders };
};

export default function ImportOrdersPage() {
  const { totalOrders, realOrders } = useLoaderData();
  const fetcher = useFetcher();
  const [isImporting, setIsImporting] = useState(false);

  const handleImport = () => {
    setIsImporting(true);
    fetcher.submit({}, { 
      method: "POST", 
      action: "/app/import-orders"
    });
  };

  // Reset importing state when fetcher is done
  React.useEffect(() => {
    if (fetcher.state === "idle" && isImporting) {
      setIsImporting(false);
    }
  }, [fetcher.state, isImporting]);

  return (
    <SidebarLayout>
      <Page title="Import Orders from Shopify">
        <BlockStack gap="400">
          
          <Banner status="info">
            <Text variant="bodyMd">
              This tool will fetch all orders from your Shopify store and save them to your database. 
              Your orders page already auto-saves orders when you visit it, but this tool will do a complete bulk import.
            </Text>
          </Banner>

          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Database Status</Text>
              <BlockStack gap="200">
                <Text variant="bodyMd">
                  📊 <strong>Total orders in database:</strong> {totalOrders}
                </Text>
                <Text variant="bodyMd">
                  🎯 <strong>Real Shopify orders:</strong> {realOrders}
                </Text>
                <Text variant="bodyMd">
                  🧪 <strong>Test orders:</strong> {totalOrders - realOrders}
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Bulk Import Orders</Text>
              <Text variant="bodyMd">
                Click the button below to fetch ALL orders from your Shopify store and save them to your database. 
                This may take a few minutes if you have many orders.
              </Text>
              
              {fetcher.data?.success && (
                <Banner status="success">
                  <BlockStack gap="200">
                    <Text variant="bodyMd">✅ Import completed successfully!</Text>
                    <Text variant="bodyMd">📦 <strong>Total fetched:</strong> {fetcher.data.totalFetched}</Text>
                    <Text variant="bodyMd">💾 <strong>Newly saved:</strong> {fetcher.data.saved}</Text>
                    <Text variant="bodyMd">⏭️ <strong>Skipped (already existed):</strong> {fetcher.data.skipped}</Text>
                    {fetcher.data.errors > 0 && (
                      <Text variant="bodyMd">❌ <strong>Errors:</strong> {fetcher.data.errors}</Text>
                    )}
                  </BlockStack>
                </Banner>
              )}

              {fetcher.data?.success === false && (
                <Banner status="critical">
                  <Text variant="bodyMd">❌ Import failed: {fetcher.data.error}</Text>
                </Banner>
              )}

              <Button 
                variant="primary" 
                size="large"
                loading={isImporting || fetcher.state !== "idle"}
                onClick={handleImport}
              >
                {isImporting || fetcher.state !== "idle" 
                  ? "Importing Orders..." 
                  : "Import All Orders from Shopify"
                }
              </Button>
            </BlockStack>
          </Card>

          <Card>
            <BlockStack gap="300">
              <Text variant="headingMd">Quick Actions</Text>
              <BlockStack gap="200">
                <Button url="/app/orders">
                  View All Orders (Auto-saves when visited)
                </Button>
                <Text variant="bodyMd" tone="subdued">
                  💡 Tip: Every time you visit the Orders page, it automatically saves any new orders from Shopify to your database.
                </Text>
              </BlockStack>
            </BlockStack>
          </Card>

        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}
