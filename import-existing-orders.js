import { PrismaClient } from '@prisma/client';
import shopify from './app/shopify.server.js';

const prisma = new PrismaClient();

// Function to convert Shopify order to our database format
function convertShopifyOrderToDbFormat(shopifyOrder) {
  // Extract numeric order ID from Shopify GraphQL ID
  const numericId = shopifyOrder.id.split('/').pop();
  
  // Calculate total quantity from line items
  const itemQuantity = shopifyOrder.lineItems.edges.reduce(
    (sum, edge) => sum + edge.node.quantity,
    0
  );

  // Format customer name
  const customerName = shopifyOrder.customer 
    ? `${shopifyOrder.customer.firstName || ''} ${shopifyOrder.customer.lastName || ''}`.trim() 
    : null;

  // Prepare line items data
  const lineItems = shopifyOrder.lineItems.edges.map((edge) => ({
    title: edge.node.title,
    quantity: edge.node.quantity,
    price: parseFloat(edge.node.originalUnitPriceSet.shopMoney.amount),
    productId: edge.node.variant?.product?.id?.split('/').pop(),
    variantId: edge.node.variant?.id?.split('/').pop(),
  }));

  return {
    shopifyOrderId: numericId,
    customerEmail: shopifyOrder.customer?.email || null,
    customerName,
    totalPrice: parseFloat(shopifyOrder.totalPriceSet.shopMoney.amount),
    currency: shopifyOrder.totalPriceSet.shopMoney.currencyCode,
    status: shopifyOrder.displayFinancialStatus || 'PENDING',
    fulfillmentStatus: shopifyOrder.displayFulfillmentStatus || null,
    itemQuantity,
    processedAt: new Date(shopifyOrder.processedAt),
    lineItems: lineItems,
  };
}

// Function to fetch all orders with pagination
async function fetchAllOrders(admin) {
  let allOrders = [];
  let hasNextPage = true;
  let cursor = null;
  
  console.log('🔄 Starting to fetch orders from Shopify...');
  
  while (hasNextPage) {
    const query = `
      query GetOrders($first: Int!, $after: String) {
        orders(first: $first, after: $after, reverse: true) {
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
              lineItems(first: 100) {
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
            cursor
          }
          pageInfo {
            hasNextPage
            endCursor
          }
        }
      }
    `;
    
    const variables = {
      first: 250, // Maximum allowed by Shopify
      after: cursor
    };
    
    try {
      const response = await admin.graphql(query, { variables });
      const data = await response.json();
      
      if (data.errors) {
        console.error('❌ GraphQL errors:', data.errors);
        throw new Error('GraphQL query failed');
      }
      
      const orders = data.data.orders.edges.map(edge => edge.node);
      allOrders = allOrders.concat(orders);
      
      hasNextPage = data.data.orders.pageInfo.hasNextPage;
      cursor = data.data.orders.pageInfo.endCursor;
      
      console.log(`📦 Fetched ${orders.length} orders (Total so far: ${allOrders.length})`);
      
    } catch (error) {
      console.error('❌ Error fetching orders:', error);
      throw error;
    }
  }
  
  console.log(`✅ Total orders fetched from Shopify: ${allOrders.length}`);
  return allOrders;
}

// Main function to import orders
async function importExistingOrders() {
  try {
    console.log('🚀 Starting order import process...');
    
    // First, let's check current orders in database
    await prisma.$connect();
    const existingOrders = await prisma.order.count();
    console.log(`📊 Current orders in database: ${existingOrders}`);
    
    // We need to authenticate to access Shopify Admin API
    // This is a bit tricky since we need an active session
    console.log('🔑 Note: This script needs to be run in context of an authenticated Shopify session.');
    console.log('💡 Alternative approach: Run this from your app\'s admin route or create a manual import route.');
    
    // For now, let's create a more manual approach
    console.log('\n📝 Manual Import Instructions:');
    console.log('1. Go to your app\'s orders page in the browser');
    console.log('2. The orders are already being fetched from Shopify');
    console.log('3. We need to modify the orders page to also save them to database');
    
  } catch (error) {
    console.error('❌ Error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// For testing: simulate saving orders that might come from the orders page
async function saveTestOrdersToDatabase() {
  try {
    console.log('💾 Testing order save functionality...');
    await prisma.$connect();
    
    // This would be called from your app.orders.jsx to save fetched orders
    console.log('✅ Database connection working');
    console.log('💡 Ready to save orders from Shopify');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
if (process.argv.includes('--test')) {
  saveTestOrdersToDatabase();
} else {
  importExistingOrders();
}

export { convertShopifyOrderToDbFormat, fetchAllOrders };
