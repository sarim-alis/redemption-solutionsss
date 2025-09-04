# Multiple Vouchers Per Order Implementation

## Problem Statement
Previously, the system created only ONE voucher per order, regardless of how many different products were in the order. This meant:
- If a customer ordered 3 different products, they only got 1 voucher
- No way to distinguish between different product types in vouchers
- Email templates couldn't be customized per product

## Solution Implemented

### 1. Database Schema Changes
**File: `prisma/schema.prisma`**
- Added `productTitle` column to Voucher table
- Added `type` column to Voucher table

```prisma
model Voucher {
  id            String   @id @default(uuid())
  code          String   @unique
  shopifyOrderId String
  customerEmail String
  productTitle  String?  // Product title for this specific voucher
  type          String?  // Type of voucher (gift, voucher, etc.)
  used          Boolean  @default(false)
  createdAt     DateTime @default(now())
  order         Order    @relation(fields: [shopifyOrderId], references: [shopifyOrderId])
  emailSent      Boolean  @default(false)
  username      String[] @default([])
}
```

### 2. Voucher Model Updates
**File: `app/models/voucher.server.ts`**

#### New Function: `createVouchersForOrder`
- Creates multiple vouchers for an order
- One voucher per quantity of each product
- Each voucher includes product title and type

```typescript
export async function createVouchersForOrder({ 
  shopifyOrderId, 
  customerEmail, 
  lineItems 
}: { 
  shopifyOrderId: string, 
  customerEmail: string, 
  lineItems: any[] 
}) {
  const vouchers = [];
  
  for (const item of lineItems) {
    // Create one voucher per quantity of each product
    for (let i = 0; i < item.quantity; i++) {
      const voucher = await createVoucher({
        shopifyOrderId,
        customerEmail,
        productTitle: item.title,
        type: item.type || 'voucher'
      });
      vouchers.push(voucher);
    }
  }
  
  return vouchers;
}
```

#### Updated Function: `createVoucher`
- Now accepts `productTitle` and `type` parameters
- Backward compatible with existing code

### 3. Webhook Updates
**File: `app/routes/webhooks.orders.jsx`**

#### Changes in ORDERS_PAID handling:
- Instead of creating one voucher, now creates multiple vouchers
- Each voucher corresponds to a specific product
- Sends separate emails for each voucher

```javascript
// Create vouchers for each product
const newVouchers = await createVouchersForOrder({
  shopifyOrderId: paidOrder.shopifyOrderId,
  customerEmail: paidOrder.customerEmail || '',
  lineItems: lineItems
});

// Send voucher emails for each voucher
for (const voucher of newVouchers) {
  sendVoucherEmailIfFirstOrder(paidOrder, voucher)
    .then((result) => {
      console.log(`✅ Email sent for voucher: ${result.voucherCode} (${voucher.productTitle})`);
    });
}
```

### 4. Order Model Updates
**File: `app/models/order.server.ts`**

#### Updated voucher creation logic:
- All voucher creation points now use `createVouchersForOrder`
- Maintains backward compatibility by returning first voucher

### 5. Email System Updates
**File: `app/utils/sendVoucherEmailIfFirstOrder.js`**

#### Enhanced email personalization:
- Uses voucher's `productTitle` in email subject and content
- Uses voucher's `type` to determine email template
- More specific product information in emails

```javascript
// Determine email type based on voucher type
const isGift = voucher.type === 'gift' || order.type === 'gift';

// Use product title in email
const productTitle = voucher.productTitle || 'Oil Change Voucher';
emailSubject = `Here are your ${productTitle}! Where to Redeem... 🎟️`;
```

## How It Works Now

### Example Scenario:
Customer orders:
- 2x Oil Change Vouchers
- 1x Gift Card

**Before:** 1 voucher created for entire order
**After:** 3 vouchers created:
1. Oil Change Voucher (productTitle: "Oil Change Voucher", type: "voucher")
2. Oil Change Voucher (productTitle: "Oil Change Voucher", type: "voucher")  
3. Gift Card (productTitle: "Gift Card", type: "gift")

### Email Flow:
1. Each voucher gets its own email
2. Email subject includes the specific product title
3. Email content is customized based on voucher type
4. PDF attachments are generated per voucher

## Benefits

1. **Product-Specific Vouchers**: Each product gets its own voucher
2. **Better Email Personalization**: Emails include specific product details
3. **Type-Based Email Templates**: Different templates for gifts vs vouchers
4. **Quantity Handling**: Correct number of vouchers per product quantity
5. **Backward Compatibility**: Existing code continues to work

## Migration Notes

- Existing vouchers will have `null` values for `productTitle` and `type`
- New vouchers will have these fields populated
- Email system gracefully handles both old and new voucher formats
- Database migration required to add new columns

## Testing

To test the implementation:
1. Create an order with multiple products
2. Mark the order as paid
3. Verify multiple vouchers are created
4. Check that emails are sent for each voucher
5. Verify email content includes product-specific information
