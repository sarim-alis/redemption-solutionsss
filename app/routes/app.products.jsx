import React, { useState, useEffect } from "react";
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, Thumbnail, Badge, BlockStack, Modal } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
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
            createdAt
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
  const [sortedProducts, setSortedProducts] = useState(initialProducts);
  const [sortIndex, setSortIndex] = useState(null);
  const [sortDirection, setSortDirection] = useState('ascending');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImageClick = (image) => {
    setSelectedImage(image);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  // Update sorted products.
  useEffect(() => {
    setSortedProducts(products);
  }, [products]);

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

  // Handle sort.
  const handleSort = (index) => {
    const newDirection = sortIndex === index && sortDirection === 'ascending' ? 'descending' : 'ascending';
    setSortIndex(index);
    setSortDirection(newDirection);

    const sorted = [...sortedProducts].sort((a, b) => {
      let aValue, bValue;

      switch (index) {
        case 0: // Title
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 2: // Status
          aValue = a.status === "ACTIVE" ? 1 : 0;
          bValue = b.status === "ACTIVE" ? 1 : 0;
          break;
        case 3: // Inventory
          aValue = a.totalInventory || 0;
          bValue = b.totalInventory || 0;
          break;
        case 4: // Category
          aValue = (a.category?.name || "Uncategorized").toLowerCase();
          bValue = (b.category?.name || "Uncategorized").toLowerCase();
          break;
        case 5: // Type
          const getProductTypeValue = (product) => {
            if (!product.productType?.value) return "—";
            const value = product.productType.value.replace(/[\[\]"]/g, '');
            if (value === "voucher") return "Voucher";
            else if (value === "gift") return "Gift";
            return value;
          };
          aValue = getProductTypeValue(a).toLowerCase();
          bValue = getProductTypeValue(b).toLowerCase();
          break;
        case 6: // Expiry Date
          const getExpiryValue = (product) => {
            if (!product.expiryDate?.value) return 0;
            try {
              const days = parseInt(product.expiryDate.value);
              return isNaN(days) ? 0 : days;
            } catch (error) {
              return 0;
            }
          };
          aValue = getExpiryValue(a);
          bValue = getExpiryValue(b);
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return newDirection === 'ascending' ? -1 : 1;
      if (aValue > bValue) return newDirection === 'ascending' ? 1 : -1;
      return 0;
    });

    setSortedProducts(sorted);
  };

const getExpiryFromPurchase = (createdAt, expiryDate) => {
  if (!expiryDate) return "—";

  try {
    // Parse expiry as integer (days)
    const days = parseInt(expiryDate);
    if (isNaN(days)) {
      console.log('⚠️ Invalid expiry days:', expiryDate);
      return "—";
    }

    return `${days} days from purchase`;
  } catch (error) {
    console.log('⚠️ Error parsing expiry days:', error.message);
    return "—";
  }
};



  const productRows = sortedProducts.map(product => {
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
  expiryDate = getExpiryFromPurchase(null, product.expiryDate.value);
}


  return [
      product.title,
      image ? (
      <button onClick={() => handleImageClick(image)} style={{ border: "none", background: "none", padding: 0, cursor: "pointer" }}>
        <Thumbnail source={image.url} alt={image.altText || product.title} size="small" />
      </button>
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
              columnContentTypes={['text', 'text', 'text', 'text', 'text', 'text', 'text']}
              headings={productTableHeaders}
              rows={productRows}
              sortable={[true, false, true, true, true, true, true]}
              defaultSortDirection="ascending"
              initialSortColumnIndex={sortIndex}
              onSort={handleSort}
            />
          ) : (
            <Text variant="bodyMd" as="p">No products found.</Text>
          )}
        </BlockStack>

        {/* Image Modal */}
        {selectedImage && (
          <Modal open={isModalOpen} onClose={handleModalClose} title="Product Image" large>
            <div style={{ textAlign: "center", padding: "20px" }}>
              <img src={selectedImage.url} alt={selectedImage.altText || "Product image"} style={{ maxWidth: "100%", maxHeight: "70vh", borderRadius: "8px" }} />
            </div>
          </Modal>
        )}
      </Page>
    </SidebarLayout>
  );
}