// Imports.
import { useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  BlockStack,
  Box,
  Badge,
  Thumbnail
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
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

  const responseJson = await response.json();
  const products = responseJson.data.products.edges.map(edge => edge.node);;

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
  const { products } = useLoaderData();

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

              {/* Vouchers. */}
            <Box paddingBlockStart="600">
              <BlockStack gap="400">
                  <Text as="h2" variant="headingMd">
                    Settings ⚙️⭐
                  </Text>
                
                {/* Products table. */}
                  {/* {products.length > 0 ? (
                    <DataTable
                      columnContentTypes={['text', 'text', 'text', 'text', 'numeric', 'text', 'text']}
                      headings={productTableHeaders}
                      rows={productRows}
                    />
                  ) : (
                    <Text variant="bodyMd" as="p">
                      No products found. Try generating a product first!
                    </Text>
                  )} */}

              </BlockStack>
              </Box>

          </Card>
          </Layout.Section>
        </Layout>
      </BlockStack>
    </Page>
  );
}
