// Test script to verify metafield handling in webhook processing
const { authenticate } = require("./app/shopify.server");

// Mock webhook payload with product metafields
const mockOrderPayload = {
  id: "12345678901234567890",
  name: "#TEST-001",
  financial_status: "paid",
  fulfillment_status: "unfulfilled",
  total_price: "99.99",
  currency: "USD",
  processed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  customer: {
    id: "98765432109876543210",
    first_name: "Test",
    last_name: "Customer",
    email: "test@example.com",
    created_at: new Date().toISOString()
  },
  line_items: [
    {
      title: "Test Product with Metafields",
      quantity: 1,
      price: "99.99",
      product_id: "1234567890",
      variant_id: "0987654321"
    }
  ]
};

async function testMetafieldFetching() {
  console.log('🧪 Testing metafield fetching in webhook handler...');
  
  try {
    // Import the functions we need to test
    const { saveOrder } = await import('./app/models/order.server');
    
    // Test 1: Check if metafields are properly extracted from GraphQL structure
    const testLineItems = {
      edges: [
        {
          node: {
            title: "Test Product",
            quantity: 1,
            originalUnitPriceSet: {
              shopMoney: {
                amount: "99.99",
                currencyCode: "USD"
              }
            },
            variant: {
              id: "gid://shopify/ProductVariant/0987654321",
              product: {
                id: "gid://shopify/Product/1234567890",
                metafield: {
                  value: "gift_card"
                },
                metafield_expiry: {
                  value: "2024-12-31"
                }
              }
            }
          }
        }
      ]
    };

    const testOrderData = {
      shopifyOrderId: "TEST-12345",
      customer: mockOrderPayload.customer,
      displayFinancialStatus: "PAID",
      displayFulfillmentStatus: "UNFULFILLED",
      totalPriceSet: {
        shopMoney: {
          amount: "99.99",
          currencyCode: "USD"
        }
      },
      processedAt: new Date().toISOString(),
      lineItems: testLineItems
    };

    console.log('📋 Testing order processing with metafields...');
    
    // This should now properly extract metafield values
    const result = await saveOrder(testOrderData);
    
    if (result.order) {
      console.log('✅ Order saved successfully with ID:', result.order.shopifyOrderId);
      
      // Parse the stored lineItems to check if metafields are preserved
      const storedLineItems = JSON.parse(result.order.lineItems);
      const firstItem = storedLineItems[0];
      
      if (firstItem.type && firstItem.expire) {
        console.log('✅ Metafields successfully saved:');
        console.log('   - Product Type:', firstItem.type);
        console.log('   - Expiry Date:', firstItem.expire);
      } else {
        console.log('❌ Metafields not found in saved data');
        console.log('   - Stored item:', JSON.stringify(firstItem, null, 2));
      }
    } else {
      console.log('❌ Failed to save order');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testMetafieldFetching().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
