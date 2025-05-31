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

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  // Fetch products using the provided GraphQL query
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

  return { products };
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const color = ["Red", "Orange", "Yellow", "Green"][
    Math.floor(Math.random() * 4)
  ];
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
  const { products } = useLoaderData();
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
      // Image column - using Thumbnail component
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
      <TitleBar title="Remix app template">
        <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button>
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <Layout.Section>
            <Card>
              <BlockStack gap="500">
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Redemption Solution 🎵⭐🦋
                  </Text>
                   <Text variant="bodyMd" as="p">
                     Redemption Solution is a trusted oil change company committed to keeping your vehicle running smoothly and efficiently. 
                   </Text>
                  <Text variant="bodyMd" as="p">
                    App uses{" "}
                    <Link
                      url="https://shopify.dev/docs/apps/tools/app-bridge"
                      target="_blank"
                      removeUnderline
                    >
                      App Bridge
                    </Link>{" "}
                    interface examples like an{" "}
                    <Link url="/app/additional" removeUnderline>
                      additional page in app nav
                    </Link>
                    , as well as an{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql"
                      target="_blank"
                      removeUnderline
                    >
                      Admin GraphQL
                    </Link>{" "}
                    mutation demo, to provide starting point for app
                    development.
                  </Text>
                </BlockStack>
                
                {/* New Products Section */}
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Featured Products 📦💗
                  </Text>
                  <Text variant="bodyMd" as="p">
                    These are the featured products from our store. This data is fetched using the GraphQL Admin API.
                  </Text>
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
                </BlockStack>
                <BlockStack gap="200">
                  <Text as="h3" variant="headingMd">
                    Create Products 🧚⭐💎
                  </Text>
                  <Text as="p" variant="bodyMd">
                    Generate product with GraphQL and get JSON output for
                    that product. Learn more about the{" "}
                    <Link
                      url="https://shopify.dev/docs/api/admin-graphql/latest/mutations/productCreate"
                      target="_blank"
                      removeUnderline
                    >
                      productCreate
                    </Link>{" "}
                    mutation in our API references.
                  </Text>
                </BlockStack>
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
            </Card>
          </Layout.Section>
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    App template specs
                  </Text>
                  <BlockStack gap="200">
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Framework
                      </Text>
                      <Link
                        url="https://remix.run"
                        target="_blank"
                        removeUnderline
                      >
                        Remix
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Database
                      </Text>
                      <Link
                        url="https://www.prisma.io/"
                        target="_blank"
                        removeUnderline
                      >
                        Prisma
                      </Link>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        Interface
                      </Text>
                      <span>
                        <Link
                          url="https://polaris.shopify.com"
                          target="_blank"
                          removeUnderline
                        >
                          Polaris
                        </Link>
                        {", "}
                        <Link
                          url="https://shopify.dev/docs/apps/tools/app-bridge"
                          target="_blank"
                          removeUnderline
                        >
                          App Bridge
                        </Link>
                      </span>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span" variant="bodyMd">
                        API
                      </Text>
                      <Link
                        url="https://shopify.dev/docs/api/admin-graphql"
                        target="_blank"
                        removeUnderline
                      >
                        GraphQL API
                      </Link>
                    </InlineStack>
                  </BlockStack>
                </BlockStack>
              </Card>
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    Next steps
                  </Text>
                  <List>
                    <List.Item>
                      Build an{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/getting-started/build-app-example"
                        target="_blank"
                        removeUnderline
                      >
                        {" "}
                        example app
                      </Link>{" "}
                      to get started
                    </List.Item>
                    <List.Item>
                      Explore Shopify’s API with{" "}
                      <Link
                        url="https://shopify.dev/docs/apps/tools/graphiql-admin-api"
                        target="_blank"
                        removeUnderline
                      >
                        GraphiQL
                      </Link>
                    </List.Item>
                  </List>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
