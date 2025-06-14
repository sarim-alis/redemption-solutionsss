// Imports.
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  DataTable,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

// Loader.
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch orders.
  const orderResponse = await admin.graphql(`
    query {
      orders(first: 10, reverse: true) {
        edges {
          node {
            id
            name
            processedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            customer {
              firstName
              lastName
              email
            }
            lineItems(first: 10) {
              edges {
                node {
                  title
                  quantity
                  originalUnitPriceSet {
                    shopMoney {
                      amount
                      currencyCode
                    }
                  }
                  variant {
                    id
                    product {
                      id
                      title
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `);

  const orderJson = await orderResponse.json();
  const orders = orderJson.data.orders.edges.map(edge => edge.node);

  // Transform and save orders to database.
  const transformedOrders = orders.map((o) => ({
  shopifyId: o.id,
  name: o.name,
  processedAt: new Date(o.processedAt),
  totalAmount: parseFloat(o.totalPriceSet.shopMoney.amount),
  currency: o.totalPriceSet.shopMoney.currencyCode,
  customerName: `${o.customer?.firstName || "Guest"} ${o.customer?.lastName || ""}`.trim(),
  customerEmail: o.customer?.email || null,
  displayFinancialStatus: o.displayFinancialStatus,
  displayFulfillmentStatus: o.displayFulfillmentStatus,
  itemsCount: o.lineItems.edges.reduce((sum, edge) => sum + edge.node.quantity, 0),
}));

  // Save to database.
  await Promise.all(
    transformedOrders.map((order) =>
      prisma.order.upsert({
        where: { shopifyId: order.shopifyId },
        update: order,
        create: order,
      })
    )
  );

  return { orders };
};


export default function Index() {
  const { orders } = useLoaderData();

  return (
    <Page>
      <TitleBar title="Redemption Solution" primaryAction>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>

            {/* Orders. */}
            <Box paddingBlockStart="600">
               <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Orders 📦🧾
                </Text>

            {/* Orders table. */}
            {orders.length > 0 ? (
              <DataTable
                columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'text', 'text', 'text']}
                headings={['Order ID', 'Customer', 'Email', 'Date', 'Price', 'Items', 'Payment Status', 'Fulfillment Status']}
                rows={orders.map(order => [
                order.name,
                `${order.customer?.firstName || 'Guest'} ${order.customer?.lastName || ''}`,
                order.customer?.email || 'N/A',
                new Date(order.processedAt).toLocaleDateString(),
                `${order.totalPriceSet.shopMoney.amount} ${order.totalPriceSet.shopMoney.currencyCode}`,
                order.lineItems.edges.reduce((sum, edge) => sum + edge.node.quantity, 0),
                order.displayFinancialStatus || 'Unknown',
                order.displayFulfillmentStatus || 'Unknown',
            ])}
            />
            ) : (
            <Text variant="bodyMd" as="p">No orders found.</Text>
          )}
          </BlockStack>
          </Box>

          </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
