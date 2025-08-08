import React from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, Thumbnail, Badge, BlockStack } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
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
    const productType = product.productType?.value || "—";
    const expiryDate = product.expiryDate?.value || "—";

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
      <Text variant="bodyMd" as="span">{productType}</Text>,
      <Text variant="bodyMd" as="span">{expiryDate}</Text>,
    ];
  });

  const productTableHeaders = [
    "Title",
    "Image",
    "Status",
    "Inventory",
    "Category",
    "Type",
    "Expiry Date"
  ];

  return (
    <SidebarLayout>
      <Page fullWidth title="Products">
        <BlockStack gap="200">
          {products.length > 0 ? (
            <DataTable
              columnContentTypes={['text', 'text', 'text', 'numeric', 'text', 'text', 'text']}
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
