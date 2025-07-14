import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Inline saveOrder function (since we can't import the TypeScript file)
async function saveOrder(orderData) {
  console.log('🔄 Starting saveOrder function with data:', {
    orderId: orderData?.id,
    financial_status: orderData?.financial_status,
    email: orderData?.email || orderData?.customer?.email
  });

  if (!orderData || !orderData.id) {
    console.error("❌ Invalid order data received:", orderData);
    throw new Error("Invalid order data: missing order ID");
  }

  try {
    console.log('📊 Processing order line items...');
    // Calculate total quantity from line items
    const itemQuantity = orderData.line_items?.reduce(
      (sum, item) => sum + (parseInt(item.quantity) || 0),
      0
    ) || 0;

    // Format customer name
    const customerName = orderData.customer 
      ? `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim() 
      : null;

    // Prepare line items data
    const lineItems = orderData.line_items?.map((item) => ({
      title: item.title,
      quantity: parseInt(item.quantity) || 0,
      price: parseFloat(item.price) || 0,
      productId: item.product_id?.toString(),
      variantId: item.variant_id?.toString(),
    })) || [];

    const orderInfo = {
      shopifyOrderId: orderData.id.toString(),
      customerEmail: orderData.email || orderData.customer?.email || null,
      customerName,
      totalPrice: parseFloat(orderData.total_price) || 0,
      currency: orderData.currency || 'USD',
      status: orderData.financial_status?.toUpperCase() || 'PENDING',
      fulfillmentStatus: orderData.fulfillment_status || null,
      itemQuantity,
      processedAt: new Date(orderData.processed_at || orderData.created_at || new Date()),
      lineItems: lineItems,
    };

    console.log('💾 Attempting to save order to database...', {
      shopifyOrderId: orderInfo.shopifyOrderId,
      status: orderInfo.status,
      email: orderInfo.customerEmail
    });

    // Test database connection first
    await prisma.$connect();
    console.log('✅ Database connection successful');

    // Create or update order in database
    const order = await prisma.order.upsert({
      where: {
        shopifyOrderId: orderInfo.shopifyOrderId,
      },
      update: orderInfo,
      create: orderInfo,
    });

    console.log('✅ Order saved successfully:', {
      orderId: order.shopifyOrderId,
      status: order.status,
      customer: order.customerEmail,
      dbId: order.id
    });

    return order;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    const errorName = error instanceof Error ? error.name : 'Error';
    
    console.error('❌ Error saving order:', {
      message: errorMessage,
      orderId: orderData?.id,
      stack: errorStack,
      name: errorName
    });
    throw error;
  }
}

// Sample orders that might exist in your Shopify store
// This script simulates importing orders - you'll need to replace this with actual Shopify API calls
const sampleExistingOrders = [
  {
    id: "1001",
    email: "customer1@example.com",
    customer: {
      first_name: "John",
      last_name: "Doe",
      email: "customer1@example.com"
    },
    total_price: "150.00",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    processed_at: "2025-06-15T10:30:00Z",
    line_items: [
      {
        title: "Premium T-Shirt",
        quantity: 2,
        price: "75.00",
        product_id: "prod123",
        variant_id: "var456"
      }
    ]
  },
  {
    id: "1002", 
    email: "customer2@example.com",
    customer: {
      first_name: "Jane",
      last_name: "Smith",
      email: "customer2@example.com"
    },
    total_price: "89.99",
    currency: "USD", 
    financial_status: "paid",
    fulfillment_status: "pending",
    processed_at: "2025-06-20T14:15:00Z",
    line_items: [
      {
        title: "Coffee Mug",
        quantity: 1,
        price: "29.99",
        product_id: "prod789",
        variant_id: "var101"
      },
      {
        title: "Notebook",
        quantity: 1, 
        price: "59.99",
        product_id: "prod112",
        variant_id: "var131"
      }
    ]
  },
  {
    id: "1003",
    email: "customer3@example.com", 
    customer: {
      first_name: "Bob",
      last_name: "Johnson",
      email: "customer3@example.com"
    },
    total_price: "299.99",
    currency: "USD",
    financial_status: "paid", 
    fulfillment_status: "fulfilled",
    processed_at: "2025-07-01T09:45:00Z",
    line_items: [
      {
        title: "Premium Jacket",
        quantity: 1,
        price: "299.99", 
        product_id: "prod445",
        variant_id: "var667"
      }
    ]
  },
  {
    id: "1004",
    email: "customer4@example.com",
    customer: {
      first_name: "Alice", 
      last_name: "Wilson",
      email: "customer4@example.com"
    },
    total_price: "45.50",
    currency: "USD",
    financial_status: "pending",
    fulfillment_status: null,
    processed_at: "2025-07-05T16:20:00Z",
    line_items: [
      {
        title: "Phone Case",
        quantity: 1,
        price: "25.00",
        product_id: "prod334",
        variant_id: "var556"
      },
      {
        title: "Screen Protector", 
        quantity: 1,
        price: "20.50",
        product_id: "prod889",
        variant_id: "var223"
      }
    ]
  },
  {
    id: "1005",
    email: "customer5@example.com",
    customer: {
      first_name: "David",
      last_name: "Brown", 
      email: "customer5@example.com"
    },
    total_price: "199.99",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    processed_at: "2025-07-08T11:30:00Z",
    line_items: [
      {
        title: "Wireless Headphones",
        quantity: 1,
        price: "199.99",
        product_id: "prod998",
        variant_id: "var887"
      }
    ]
  }
];

async function importExistingOrders() {
  try {
    console.log('🚀 Starting to import existing orders to database...');
    console.log(`📦 Found ${sampleExistingOrders.length} orders to import`);
    
    await prisma.$connect();
    
    // Check current orders in database
    const currentCount = await prisma.order.count();
    console.log(`📊 Current orders in database: ${currentCount}`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const orderData of sampleExistingOrders) {
      try {
        console.log(`\n⏳ Processing order ${orderData.id}...`);
        
        // Check if order already exists
        const existingOrder = await prisma.order.findUnique({
          where: { shopifyOrderId: orderData.id }
        });
        
        if (existingOrder) {
          console.log(`⏭️  Order ${orderData.id} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Save the order using your existing saveOrder function
        const savedOrder = await saveOrder(orderData);
        
        if (savedOrder) {
          console.log(`✅ Successfully saved order ${orderData.id}`);
          console.log(`   Customer: ${savedOrder.customerName} (${savedOrder.customerEmail})`);
          console.log(`   Total: ${savedOrder.totalPrice} ${savedOrder.currency}`);
          console.log(`   Status: ${savedOrder.status}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error saving order ${orderData.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} orders`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} orders`);
    console.log(`❌ Failed: ${errorCount} orders`);
    
    // Final count
    const finalCount = await prisma.order.count();
    console.log(`📊 Total orders in database now: ${finalCount}`);
    
    console.log('\n💡 Note: These are sample orders. To import real orders from your Shopify store:');
    console.log('1. Visit your app\'s /app/orders page - it will auto-save orders');
    console.log('2. Or modify this script to use the Shopify Admin API');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import
importExistingOrders();
