// Imports.
import { authenticate } from "../shopify.server";
import prisma from "../db.server";
import SidebarLayout from "../components/SidebarLayout";
import { useLoaderData } from "@remix-run/react";
import DashboardOrderChart from '../components/DashboardOrderChart';
import { parse } from "url";
import { parse as parseQuery } from "querystring";


// Loader.
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const urlObj = parse(request.url);
  const query = parseQuery(urlObj.query || "");
  const filterDate = query.date || "All";

  // Fetch products
  const response = await admin.graphql(`
    query {
      products(first: 250) {
        edges {
          node {
            id
            title
            description
            vendor
            status
            media(first: 250) {
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
            expiryDate: metafield(namespace: "custom", key: "expiry_date") {
              value
            }
            productType: metafield(namespace: "custom", key: "product_type") {
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

  // Fetch orders
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
            lineItems(first: 250) {
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
  let orders = orderJson.data.orders.edges.map(edge => edge.node);
  const giftCardJson = await giftCardResponse.json();
  const giftCards = giftCardJson.data.giftCards.edges.map(edge => edge.node);
  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(edge => edge.node);

  // Filter orders by date
  if (filterDate !== "All") {
    const today = new Date();
    orders = orders.filter(order => {
      const orderDate = new Date(order.processedAt);
      if (filterDate === "Today") {
        return orderDate.toDateString() === today.toDateString();
      } else if (filterDate === "Yesterday") {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return orderDate.toDateString() === yesterday.toDateString();
      } else if (filterDate === "This Week") {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return orderDate >= weekStart && orderDate <= today;
      }
      return true;
    });
  }

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
  const { getAllVouchers } = await import("../models/voucher.server");
  const { getAllLocations } = await import("../models/location.server");
  const locations = await getAllLocations();
  const allVouchers = await getAllVouchers();
  const activeVouchers = await prisma.voucher.findMany({
    where: {
      used: false
    }
  });

  // Transform and save products to database.
  const transformedProducts = products.map((p) => {
    const media = p.media?.edges.find(edge => edge.node.__typename === "MediaImage");
    
    // Handle expire date safely to avoid Invalid Date errors
    let expireDays = null;
    if (p.expiryDate?.value) {
      try {
        // Parse as integer (days) since schema expects Int
        const days = parseInt(p.expiryDate.value);
        if (!isNaN(days)) {
          expireDays = days;
        } else {
          console.log(`⚠️ Invalid expiry days for product ${p.title}: ${p.expiryDate.value}`);
        }
      } catch (error) {
        console.log(`⚠️ Error parsing expiry days for product ${p.title}:`, error.message);
      }
    }
    
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
      type: p.productType?.value || null,
      expire: expireDays,
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

  // Product sales by product (dynamic)
  const productSalesMap = {};
  orders.forEach(order => {
    if (order.displayFinancialStatus === "PAID" || order.displayFinancialStatus === "PAID_IN_FULL") {
      order.lineItems.edges.forEach(itemEdge => {
        const item = itemEdge.node;
        const title = item.title;
        const quantity = item.quantity;
        const price = parseFloat(item.originalUnitPriceSet.shopMoney.amount);
        if (!productSalesMap[title]) {
          productSalesMap[title] = { sales: 0, revenue: 0 };
        }
        productSalesMap[title].sales += quantity;
        productSalesMap[title].revenue += price * quantity;
      });
    }
  });
  // const productSales = Object.entries(productSalesMap).map(([product, data]) => ({
  //   product,
  //   sales: data.sales,
  //   revenue: data.revenue
  // }));

  const productSales = (products || []).map(p => {
  const stats = productSalesMap[p.title] || { sales: 0, revenue: 0 };
  return {
    product: p.title,
    sales: stats.sales,
    revenue: stats.revenue,
    expire: p.expire ? new Date(p.expire).toLocaleDateString() : "No Expiry"
  };
});

  // Voucher Redemptions (dynamic)
  // Join voucher with order and lineItems
  const voucherRedemptions = await prisma.voucher.findMany({
    where: { used: true },
    include: {
      order: true
    }
  });

  // For each voucher, try to get product name from order.lineItems (JSON)
  const voucherRedemptionRows = voucherRedemptions.map(voucher => {
    let product = "";
    let location = voucher.customerEmail || "";
    let date = voucher.createdAt.toISOString().slice(0, 10);
    // Try to get product from order.lineItems
    if (voucher.order && voucher.order.lineItems) {
      try {
        const items = Array.isArray(voucher.order.lineItems)
          ? voucher.order.lineItems
          : JSON.parse(voucher.order.lineItems);
        if (Array.isArray(items) && items.length > 0) {
          product = items[0].title || "";
        } else if (items.edges && items.edges.length > 0) {
          product = items.edges[0].node.title || "";
        }
      } catch (e) {
        // ignore
      }
    }
    return {
      product,
      date,
      location
    };
  });

  return { 
    products, 
    orders, 
    giftCards,
    analytics: {
      totalProductSales,
      totalGiftCardBalance,
      totalVouchers: allVouchers.length,
      activeVouchers: activeVouchers.length,
      allProducts: products
    },
    productSales,
    voucherRedemptions: voucherRedemptionRows,
    vouchers: allVouchers,
    locations: locations
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
  const { orders = [], giftCards = [], analytics, vouchers, locations } = useLoaderData();
  // Calculate analytics from real order data
  const totalOrders = orders.length;
  const paidOrders = orders.filter(o => o.displayFinancialStatus === "PAID" || o.displayFinancialStatus === "PAID_IN_FULL").length;
  const unpaidOrders = totalOrders - paidOrders;

  return (
    <SidebarLayout>
      <div style={{ margin: 0, padding: 0, backgroundColor: "white",color: "black",minHeight: "100vh",border: "2px solid black",borderRadius: "10px"
       
      }}>
        <DashboardOrderChart 
          paidOrders={paidOrders} 
          unpaidOrders={unpaidOrders}
          analytics={analytics}
          vouchers={vouchers}
          locations={locations}
        />
      </div>
    </SidebarLayout>
  );
}
