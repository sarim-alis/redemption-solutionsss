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
      products(first: 30) {
        edges {
          node {
            id
            title
            description
            vendor
            status
            media(first: 30) {
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
            metafield(namespace: "custom", key: "product_type") {
              value
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
            lineItems(first: 30) {
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

  // Fetch gift cards
  const giftCardResponse = await admin.graphql(`
    query {
      giftCards(first: 100) {
        edges {
          node {
            id
            initialValue {
              amount
            }
            balance {
              amount
            }
            enabled
          }
        }
      }
    }
  `);

  const orderJson = await orderResponse.json();
  const orders = orderJson.data.orders.edges.map(edge => edge.node);

  const giftCardJson = await giftCardResponse.json();
  const giftCards = giftCardJson.data.giftCards.edges.map(edge => edge.node);

  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(edge => edge.node);

  // Calculate analytics
  const totalProductSales = orders.reduce((total, order) => {
    if (order.displayFinancialStatus === "PAID" || order.displayFinancialStatus === "PAID_IN_FULL") {
      const orderTotal = parseFloat(order.totalPriceSet.shopMoney.amount);
      return total + orderTotal;
    }
    return total;
  }, 0);

  const totalGiftCardBalance = giftCards.reduce((total, card) => {
    const balance = parseFloat(card.balance.amount);
    return total + balance;
  }, 0);

  // Fetch vouchers from database
  const allVouchers = await prisma.voucher.findMany();
  const activeVouchers = await prisma.voucher.findMany({
    where: {
      used: false
    }
  });

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
      type: p.metafield?.value || null,
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

  return { 
    products, 
    orders, 
    giftCards,
    analytics: {
      totalProductSales,
      totalGiftCardBalance,
      totalVouchers: allVouchers.length,
      activeVouchers: activeVouchers.length
    }
  };
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
            variants(first: 30) {
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
  const { orders = [], giftCards = [], analytics } = useLoaderData();
  // Calculate analytics from real order data
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.displayFinancialStatus === "PAID" || o.displayFinancialStatus === "PAID_IN_FULL").length;
  const unpaidOrders = totalOrders - paidOrders;

  return (
    <SidebarLayout>
      <div style={{ 
        margin: 0, 
        padding: 0, 
        backgroundColor: "#666666",
        minHeight: "100vh"
      }}>
        <DashboardOrderChart 
          paidOrders={paidOrders} 
          unpaidOrders={unpaidOrders}
          analytics={analytics}
        />
      </div>
    </SidebarLayout>
  );
}
