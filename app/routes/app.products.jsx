import React, { useState, useEffect } from "react";
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
  const { products: initialProducts } = useLoaderData();
  const [products, setProducts] = useState(initialProducts);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [lastUpdate, setLastUpdate] = useState(null);

  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/webhook-stream');
    
    eventSource.onopen = () => {
      setConnectionStatus('connected');
      console.log('✅ Real-time connection established');
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'webhook' && data.topic?.startsWith('PRODUCTS_')) {
          console.log('🔄 Received product webhook:', data.topic);
          setLastUpdate(new Date());
          
          setProducts(currentProducts => {
            switch (data.topic) {
              case 'PRODUCTS_CREATE':
              case 'PRODUCTS_UPDATE':
                // Transform webhook payload to match GraphQL structure
                const updatedProduct = transformWebhookToProduct(data.payload);
                
                // Update existing product or add new one
                const existingIndex = currentProducts.findIndex(p => p.id === updatedProduct.id);
                if (existingIndex >= 0) {
                  const updated = [...currentProducts];
                  updated[existingIndex] = updatedProduct;
                  return updated;
                } else {
                  return [updatedProduct, ...currentProducts];
                }
                
              case 'PRODUCTS_DELETE':
                return currentProducts.filter(p => p.id !== data.payload.id);
                
              default:
                return currentProducts;
            }
          });
        }
      } catch (error) {
        console.error('❌ Error processing SSE message:', error);
      }
    };

    eventSource.onerror = (error) => {
      setConnectionStatus('disconnected');
      console.error('❌ SSE connection error:', error);
    };

    return () => {
      eventSource.close();
    };
  }, []);

  // Transform webhook payload to match products GraphQL structure
  const transformWebhookToProduct = (webhookPayload) => {
    return {
      id: webhookPayload.id,
      title: webhookPayload.title,
      description: null,
      vendor: null,
      status: webhookPayload.status,
      media: webhookPayload.media || { edges: [] },
      expiryDate: null,
      productType: null,
      totalInventory: webhookPayload.totalInventory || 0,
      category: null
    };
  };

  const getProductImage = (product) => {
    // Handle both GraphQL format (edges) and webhook format (nodes)
    if (product.media?.edges) {
      const mediaEdges = product.media.edges;
      const imageMedia = mediaEdges.find(edge => edge.node.__typename === "MediaImage" && edge.node.image);
      return imageMedia?.node.image || null;
    } else if (product.media?.nodes) {
      const mediaNodes = product.media.nodes;
      const imageMedia = mediaNodes.find(node => node.image);
      return imageMedia?.image || null;
    }
    return null;
  };

  const productRows = products.map(product => {
  const image = getProductImage(product);
  let productType = "—";
    if (product.productType?.value) {
      const value = product.productType.value.replace(/[\[\]"]/g, '');
    if (value === "voucher") productType = "Voucher";
      else if (value === "gift") productType = "Gift";
    else productType = value;
    }
  let expiryDate = "—";
    if (product.expiryDate?.value) {
      const date = new Date(product.expiryDate.value);
    expiryDate = date.toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit",});
  }


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
          {/* Connection Status Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                backgroundColor: connectionStatus === 'connected' ? '#10b981' : connectionStatus === 'connecting' ? '#f59e0b' : '#ef4444' 
              }}></div>
              <Text variant="bodyMd" as="span" tone={connectionStatus === 'connected' ? 'success' : connectionStatus === 'connecting' ? 'warning' : 'critical'}>
                Real-time: {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </Text>
            </div>
            {lastUpdate && (
              <Text variant="bodySm" as="span" tone="subdued">
                Last update: {lastUpdate.toLocaleTimeString()}
              </Text>
            )}
          </div>
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
