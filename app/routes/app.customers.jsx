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

  // Fetch customers.
  const customerResponse = await admin.graphql(`
  query {
  customers(first: 10) {
    edges {
      node {
        id
        firstName
        lastName
        email
        state
        createdAt
        numberOfOrders
        orders(first: 5) {
          edges {
            node {
              id
              fulfillmentOrders(first:5) {
                edges {
                  node {
                    id
                  }
                }
              }
            }
          }
        }
        amountSpent {
          amount
          currencyCode
        }
        defaultAddress {
          address1
          city
          province
          country
          zip
        }
      }
    }
  }
 }
`);

  const customerJson = await customerResponse.json();
  const customers = customerJson.data.customers.edges.map(edge => edge.node);

  // Transform and save customers to database.
  const transformedCustomers = customers.map((c) => ({
  shopifyId: c.id,
  firstName: c.firstName || null,
  lastName: c.lastName || null,
  email: c.email || null,
  phone: c.phone || null,
  createdAt: new Date(c.createdAt),
  state: c.state,
  totalOrders: c.orders?.edges.length || 0,
  amountSpent: parseFloat(c.amountSpent?.amount || "0"),
  currency: c.amountSpent?.currencyCode || "USD",
  address1: c.defaultAddress?.address1 || null,
  city: c.defaultAddress?.city || null,
  province: c.defaultAddress?.province || null,
  country: c.defaultAddress?.country || null,
  zip: c.defaultAddress?.zip || null,
}));

// Save to database.
await Promise.all(
  transformedCustomers.map((customer) =>
    prisma.customer.upsert({
      where: { shopifyId: customer.shopifyId },
      update: customer,
      create: customer,
    })
  )
);

  return { customers };
};


export default function Index() {
  const { customers } = useLoaderData();

  return (
    <Page>
      <TitleBar title="Redemption Solution" primaryAction>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>

          {/* Customers. */}
          <Box paddingBlockStart="600">
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">
                Customers 🧍🧍‍♀️🧍‍♂️
              </Text>

          {/* Customers table. */}
          {customers.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'numeric', 'text']}
              headings={['Name', 'Location', 'Orders', 'Amount Spent',]}
              rows={customers.map(customer => {
              const fullName = (customer.firstName || customer.lastName)
                ? `${customer.firstName || ''} ${customer.lastName || ''}`.trim(): 'Guest';

              const location = customer.defaultAddress?.city && customer.defaultAddress?.country
              ? `${customer.defaultAddress.city}, ${customer.defaultAddress.country}, ${customer.defaultAddress.province || ''} ${customer.defaultAddress.zip || ''}`.trim()
              : 'N/A';

              const ordersCount = customer.numberOfOrders ?? customer.orders?.edges?.length ?? 0;

              const amountSpent = customer.amountSpent
              ? `${customer.amountSpent.amount} ${customer.amountSpent.currencyCode}`
              : '0.00';

            return [
            fullName,
            location,
            ordersCount,
            amountSpent,
            ];
          })}
          />
        ) : (
        <Text variant="bodyMd" as="p">No customers found.</Text>
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
