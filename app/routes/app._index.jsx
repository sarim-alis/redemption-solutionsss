// Imports.
import { Page, Layout, Text, Card, BlockStack } from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import SidebarLayout from "../components/SidebarLayout";
import { useEffect, useRef } from "react";
import { useLoaderData } from "@remix-run/react";
import { FaShoppingCart, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import DashboardOrderChart from '../components/DashboardOrderChart';

// Loader.
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch products.
  const response = await admin.graphql(`
    query {
      products(first: 10) {
        edges {
          node {
            id
            title
            description
            vendor
            status
            media(first: 10) {
              edges {
                node {
                  __typename
                  mediaContentType
                  ... on MediaImage {
                    id
                    image {
                      url
                      altText
                    }
                  }
                }
              }
            }
            totalInventory
            category {
              id
              name
            }
          }
        }
      }
    }
  `);

  // Fetch orders.
  const orderResponse = await admin.graphql(`
    query {
      orders(first: 250, reverse: true) {
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


  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(edge => edge.node);

  // Transform and save products to database.
  const transformedProducts = products.map((p) => {
    const media = p.media?.edges.find(edge => edge.node.__typename === "MediaImage");
    return {
      shopifyId: p.id,
      title: p.title,
      description: p.description || null,
      vendor: p.vendor || null,
      status: p.status,
      imageUrl: media?.node.image.url || null,
      imageAlt: media?.node.image.altText || null,
      totalInventory: p.totalInventory || 0,
      categoryId: p.category?.id || null,
      categoryName: p.category?.name || null,
    };
  });

  // Save to database.
  await Promise.all(
    transformedProducts.map((product) =>
      prisma.product.upsert({
        where: { shopifyId: product.shopifyId },
        update: product,
        create: product,
      })
    )
  );

  return { products, orders };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];

  // Create products.
  const response = await admin.graphql(
    `#graphql
      mutation populateProduct($product: ProductCreateInput!) {
        productCreate(product: $product) {
          product {
            id
            title
            handle
            status
            variants(first: 10) {
              edges {
                node {
                  id
                  price
                  barcode
                  createdAt
                }
              }
            }
          }
        }
      }`,
    {
      variables: {
        product: {
          title: `${color} Snowboard`,
        },
      },
    },
  );
  const responseJson = await response.json();
  const product = responseJson.data.productCreate.product;
  const variantId = product.variants.edges[0].node.id;
  const variantResponse = await admin.graphql(
    `#graphql
    mutation shopifyRemixTemplateUpdateVariant($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        productVariants {
          id
          price
          barcode
          createdAt
        }
      }
    }`,
    {
      variables: {
        productId: product.id,
        variants: [{ id: variantId, price: "100.00" }],
      },
    },
  );
  const variantResponseJson = await variantResponse.json();

  return {
    product: responseJson.data.productCreate.product,
    variant: variantResponseJson.data.productVariantsBulkUpdate.productVariants,
  };
};

export default function Index() {
  const { orders = [] } = useLoaderData();
  // Calculate analytics from real order data
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.displayFinancialStatus === "PAID" || o.displayFinancialStatus === "PAID_IN_FULL").length;
  const unpaidOrders = totalOrders - paidOrders;

  return (
    <SidebarLayout>
      <Page fullWidth>
        <TitleBar title="Dashboard" primaryAction />
        <BlockStack gap="500">
          <div style={{ display: "flex", gap: 24, marginBottom: 32, flexWrap: "nowrap", width: "100%" }}>
            <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 24, display: "flex", alignItems: "center", minHeight: 100 }}>
              <FaShoppingCart size={28} color="#6366f1" style={{ marginRight: 12 }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Total Orders</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#64748b" }}>{totalOrders}</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 24, display: "flex", alignItems: "center", minHeight: 100 }}>
              <FaCheckCircle size={28} color="#22c55e" style={{ marginRight: 12 }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Paid Orders</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#64748b" }}>{paidOrders}</div>
              </div>
            </div>
            <div style={{ flex: 1, background: "#fff", borderRadius: 12, boxShadow: "0 1px 4px rgba(0,0,0,0.06)", padding: 24, display: "flex", alignItems: "center", minHeight: 100 }}>
              <FaTimesCircle size={28} color="#ef4444" style={{ marginRight: 12 }} />
              <div style={{ textAlign: "left" }}>
                <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 4 }}>Unpaid Orders</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#64748b" }}>{unpaidOrders}</div>
              </div>
            </div>
          </div>
          <Layout>
            <Layout.Section oneHalf>
              <Card>
                <Text as="h2" variant="headingMd">Order Analytics</Text>
                <DashboardOrderChart paidOrders={paidOrders} unpaidOrders={unpaidOrders} />
              </Card>
            </Layout.Section>
          </Layout>
        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}
