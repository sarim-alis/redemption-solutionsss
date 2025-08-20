//@ts-nocheck
import prisma from "../db.server";

function extractShopifyId(gid) {
  if (!gid) return null;
  return gid.split("/").pop();
}

// Save.
export async function saveCustomer(customerData) {
  try {
    const shopifyId = extractShopifyId(customerData.shopifyId);
    const hardcodedPassword = "123456";

    console.log('💾 Saving customer to database:', {
      shopifyId,
      email: customerData.email,
      name: `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim()
    });

    const customer = await prisma.customer.upsert({
      where: {
        shopifyId
      },
      update: {
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        password: hardcodedPassword,
      },
      create: {
        shopifyId,
        firstName: customerData.firstName,
        lastName: customerData.lastName,
        email: customerData.email,
        password: hardcodedPassword,
      }
    });

    console.log('✅ Customer saved successfully:', customer.id);

    return customer;
  } catch (error) {
    console.error('❌ Error saving customer:', error);
    throw error;
  }
}

// Save customer address
export async function saveCustomerAddress(customerId, shopifyId, addressData) {
  try {
    const address = await prisma.customerAddress.upsert({
      where: {
        shopifyId: shopifyId
      },
      update: {
        address1: addressData.address1,
        address2: addressData.address2,
        city: addressData.city,
        province: addressData.province,
        country: addressData.country,
        zip: addressData.zip,
        phone: addressData.phone,
        name: addressData.name,
        company: addressData.company,
        updatedAt: new Date()
      },
      create: {
        shopifyId: shopifyId,
        customerId: customerId,
        address1: addressData.address1,
        address2: addressData.address2,
        city: addressData.city,
        province: addressData.province,
        country: addressData.country,
        zip: addressData.zip,
        phone: addressData.phone,
        name: addressData.name,
        company: addressData.company
      }
    });

    return address;
  } catch (error) {
    console.error('❌ Error saving customer address:', error);
    throw error;
  }
}

// Get all customers from database
export async function getAllCustomers() {
  try {
    const customers = await prisma.customer.findMany({
      include: {
        orders: {
          select: {
            id: true,
            shopifyOrderId: true,
            totalPrice: true,
            status: true,
            processedAt: true
          }
        },
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return customers;
  } catch (error) {
    console.error('❌ Error fetching customers:', error);
    throw error;
  }
}

// Get customer by Shopify ID
export async function getCustomerByShopifyId(shopifyId) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        shopifyId: shopifyId
      },
      include: {
        addresses: true,
        orders: true,
        vouchers: true
      }
    });

    return customer;
  } catch (error) {
    console.error('❌ Error fetching customer by Shopify ID:', error);
    throw error;
  }
}

// Get customer by email
export async function getCustomerByEmail(email) {
  try {
    const customer = await prisma.customer.findUnique({
      where: {
        email: email
      },
      include: {
        addresses: true,
        orders: true,
        vouchers: true
      }
    });

    return customer;
  } catch (error) {
    console.error('❌ Error fetching customer by email:', error);
    throw error;
  }
}

// Update customer orders count and total spent
export async function updateCustomerStats(customerId, ordersCount, totalSpent) {
  try {
    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId
      },
      data: {
        ordersCount: ordersCount,
        totalSpent: totalSpent,
        updatedAt: new Date()
      }
    });

    return updatedCustomer;
  } catch (error) {
    console.error('❌ Error updating customer stats:', error);
    throw error;
  }
}