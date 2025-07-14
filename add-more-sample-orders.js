/*
 * Manual Order Import Guide
 * ========================
 * 
 * Since you've asked to save all existing orders to your database, here are the ways to do it:
 * 
 * 🎯 OPTION 1: Automatic Import (Recommended)
 * -------------------------------------------
 * 1. Start your Shopify app: npm run dev
 * 2. Open your app in browser
 * 3. Go to "Import Orders" page in the sidebar
 * 4. Click "Import All Orders from Shopify" button
 * 5. This will fetch ALL orders from your store and save them
 * 
 * 🎯 OPTION 2: Auto-save via Orders Page  
 * ----------------------------------------
 * 1. Start your Shopify app: npm run dev
 * 2. Go to "Orders" page in the sidebar
 * 3. The page automatically saves any orders it fetches from Shopify
 * 4. Refresh the page a few times to ensure all orders are saved
 * 
 * 🎯 OPTION 3: Add More Sample Orders (for testing)
 * --------------------------------------------------
 * Run: node add-more-sample-orders.js
 * 
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// More sample orders to add to your database
const additionalSampleOrders = [
  {
    id: "2001",
    email: "newcustomer1@example.com",
    customer: {
      first_name: "Sarah",
      last_name: "Parker",
      email: "newcustomer1@example.com"
    },
    total_price: "75.00",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "fulfilled",
    processed_at: "2025-07-07T08:15:00Z",
    line_items: [
      {
        title: "Summer Dress",
        quantity: 1,
        price: "75.00",
        product_id: "prod201",
        variant_id: "var301"
      }
    ]
  },
  {
    id: "2002",
    email: "newcustomer2@example.com", 
    customer: {
      first_name: "Mike",
      last_name: "Johnson",
      email: "newcustomer2@example.com"
    },
    total_price: "129.99",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "pending",
    processed_at: "2025-07-06T14:30:00Z",
    line_items: [
      {
        title: "Gaming Mouse",
        quantity: 1,
        price: "59.99",
        product_id: "prod202",
        variant_id: "var302"
      },
      {
        title: "Mouse Pad",
        quantity: 1,
        price: "29.99",
        product_id: "prod203", 
        variant_id: "var303"
      },
      {
        title: "USB Cable",
        quantity: 2,
        price: "19.99",
        product_id: "prod204",
        variant_id: "var304"
      }
    ]
  },
  {
    id: "2003", 
    email: "newcustomer3@example.com",
    customer: {
      first_name: "Emma",
      last_name: "Davis",
      email: "newcustomer3@example.com"
    },
    total_price: "250.00",
    currency: "USD",
    financial_status: "paid",
    fulfillment_status: "fulfilled", 
    processed_at: "2025-07-05T10:45:00Z",
    line_items: [
      {
        title: "Professional Camera",
        quantity: 1,
        price: "250.00",
        product_id: "prod205",
        variant_id: "var305"
      }
    ]
  }
];

// Same saveOrder function as before
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
    const itemQuantity = orderData.line_items?.reduce(
      (sum, item) => sum + (parseInt(item.quantity) || 0),
      0
    ) || 0;

    const customerName = orderData.customer 
      ? `${orderData.customer.first_name || ''} ${orderData.customer.last_name || ''}`.trim() 
      : null;

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

    console.log('💾 Attempting to save order to database...');
    await prisma.$connect();
    
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
    console.error('❌ Error saving order:', {
      message: error.message,
      orderId: orderData?.id,
    });
    throw error;
  }
}

async function addMoreSampleOrders() {
  try {
    console.log('🚀 Adding more sample orders to database...');
    console.log(`📦 Found ${additionalSampleOrders.length} additional orders to import`);
    
    await prisma.$connect();
    
    const currentCount = await prisma.order.count();
    console.log(`📊 Current orders in database: ${currentCount}`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const orderData of additionalSampleOrders) {
      try {
        console.log(`\n⏳ Processing order ${orderData.id}...`);
        
        const existingOrder = await prisma.order.findUnique({
          where: { shopifyOrderId: orderData.id }
        });
        
        if (existingOrder) {
          console.log(`⏭️  Order ${orderData.id} already exists, skipping...`);
          skippedCount++;
          continue;
        }
        
        const savedOrder = await saveOrder(orderData);
        
        if (savedOrder) {
          console.log(`✅ Successfully saved order ${orderData.id}`);
          console.log(`   Customer: ${savedOrder.customerName} (${savedOrder.customerEmail})`);
          console.log(`   Total: ${savedOrder.totalPrice} ${savedOrder.currency}`);
          successCount++;
        }
        
      } catch (error) {
        console.error(`❌ Error saving order ${orderData.id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n🎉 Additional Orders Import Summary:');
    console.log(`✅ Successfully imported: ${successCount} orders`);
    console.log(`⏭️  Skipped (already exist): ${skippedCount} orders`);
    console.log(`❌ Failed: ${errorCount} orders`);
    
    const finalCount = await prisma.order.count();
    console.log(`📊 Total orders in database now: ${finalCount}`);
    
    console.log('\n💡 Next Steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Open your Shopify app in browser');
    console.log('3. Go to "Import Orders" page to import REAL orders from your Shopify store');
    console.log('4. Or visit "Orders" page which auto-saves orders when you view them');
    
  } catch (error) {
    console.error('💥 Fatal error during import:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Show instructions and run import
console.log(`
🎯 ORDER IMPORT STATUS
=====================

You now have these options to import your orders:

📱 OPTION 1 - Use Your Shopify App (Recommended):
   1. Run: npm run dev  
   2. Open app in browser
   3. Click "Import Orders" in sidebar
   4. Click "Import All Orders from Shopify"
   → This gets REAL orders from your Shopify store

📋 OPTION 2 - Auto-save via Orders Page:
   1. Run: npm run dev
   2. Go to "Orders" page in sidebar  
   3. Page automatically saves orders it fetches
   → This also gets REAL orders from your Shopify store

🧪 OPTION 3 - Add More Sample Orders (for testing):
   → Running this script will add 3 more sample orders

Which would you like to do? Running this script now will add sample orders...
`);

addMoreSampleOrders();
