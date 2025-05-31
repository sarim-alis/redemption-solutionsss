// Imports.
import { useEffect } from "react";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Box,
  List,
  Link,
  InlineStack,
  DataTable,
  Badge,
  Thumbnail
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import prisma from "../db.server";

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
  const { products, orders } = useLoaderData();
  const fetcher = useFetcher();
  const shopify = useAppBridge();
  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";
  const productId = fetcher.data?.product?.id.replace(
    "gid://shopify/Product/",
    "",
  );

  useEffect(() => {
    if (productId) {
      shopify.toast.show("Product created");
    }
  }, [productId, shopify]);
  
  const generateProduct = () => fetcher.submit({}, { method: "POST" });

  const getProductImage = (product) => {
    const mediaEdges = product.media?.edges || [];
    const imageMedia = mediaEdges.find(edge => 
      edge.node.__typename === "MediaImage" && edge.node.image
    );
    return imageMedia?.node.image || null;
  };


 const productRows = products.map(product => {
    const image = getProductImage(product);
    
    return [
      product.title,
      image ? (
        <Thumbnail
          source={image.url}
          alt={image.altText || product.title}
          size="small"
        />
      ) : (
        <Text variant="bodyMd" as="span" tone="subdued">
          No image
        </Text>
      ),
      product.status === "ACTIVE" ? <Badge status="success">Active</Badge> : <Badge>Inactive</Badge>,
      product.totalInventory || 0,
      product.category?.name || "Uncategorized",
      product.description ? product.description.substring(0, 50) + "..." : "No description",
    ];
  });

  const productTableHeaders = [
    "Title",
    "Image",
    "Status",
    "Inventory",
    "Category",
    "Description"
  ];

  return (
    <Page>
      <TitleBar title="Redemption Solution" primaryAction>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              {/* Products */}
              <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Products 🎵⭐🦋
                  </Text>
                
                {/* Products table */}
                  {products.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'text', 'text']}
                      headings={productTableHeaders}
                      rows={productRows}
                    />
                  ) : (
                    <Text variant="bodyMd" as="p">
                      No products found. Try generating a product first!
                    </Text>
                  )}
                <BlockStack gap="200">
                </BlockStack>

                {/* Generate product */}
                <InlineStack gap="300">
                  <Button loading={isLoading} onClick={generateProduct}>
                    Generate product
                  </Button>
                  {fetcher.data?.product && (
                    <Button
                      url={`shopify:admin/products/${productId}`}
                      target="_blank"
                      variant="plain"
                    >
                      View product
                    </Button>
                  )}
                </InlineStack>
                {fetcher.data?.product && (
                  <>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productCreate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.product, null, 2)}
                        </code>
                      </pre>
                    </Box>
                    <Text as="h3" variant="headingMd">
                      {" "}
                      productVariantsBulkUpdate mutation
                    </Text>
                    <Box
                      padding="400"
                      background="bg-surface-active"
                      borderWidth="025"
                      borderRadius="200"
                      borderColor="border"
                      overflowX="scroll"
                    >
                      <pre style={{ margin: 0 }}>
                        <code>
                          {JSON.stringify(fetcher.data.variant, null, 2)}
                        </code>
                      </pre>
                    </Box>
                  </>
                )}
              </BlockStack>

            {/* Orders */}
            <Box paddingBlockStart="600">
               <BlockStack gap="400">
                <Text as="h2" variant="headingMd">
                  Orders 📦🧾
                </Text>

            {/* Orders table */}
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
