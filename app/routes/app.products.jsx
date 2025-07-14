import React from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, Thumbnail, Badge, BlockStack } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
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
  return { products };
};

export default function ProductsPage() {
  const { products } = useLoaderData();

  const getProductImage = (product) => {
    const mediaEdges = product.media?.edges || [];
    const imageMedia = mediaEdges.find(edge => edge.node.__typename === "MediaImage" && edge.node.image);
    return imageMedia?.node.image || null;
  };

  const productRows = products.map(product => {
    const image = getProductImage(product);
    return [
      product.title,
      image ? (
        <Thumbnail source={image.url} alt={image.altText || product.title} size="small" />
      ) : (
        <Text variant="bodyMd" as="span" tone="subdued">No image</Text>
      ),
      product.status === "ACTIVE" ? <Badge status="success">Active</Badge> : <Badge>Inactive</Badge>,
      product.totalInventory || 0,
      <Badge tone="info" progress="complete">{product.category?.name || "Uncategorized"}</Badge>,
    ];
  });

  const productTableHeaders = [
    "Title",
    "Image",
    "Status",
    "Inventory",
    "Category"
  ];

  return (
    <SidebarLayout>
      <Page fullWidth title="Products">
        <BlockStack gap="200">
          {products.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'text']}
              headings={productTableHeaders}
              rows={productRows}
            />
          ) : (
            <Text variant="bodyMd" as="p">No products found.</Text>
          )}
        </BlockStack>
      </Page>
    </SidebarLayout>
  );
}
