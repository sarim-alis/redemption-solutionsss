// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function cartTransformRun(input) {
  const operations = [];
  
  console.log('=== Gift Card Cart Transform ===');
  console.log('Cart lines:', input.cart.lines.length);
  
  input.cart.lines.forEach((line, index) => {
    if (line.merchandise?.__typename === 'ProductVariant') {
      const product = line.merchandise.product;
      
      console.log(`\nLine ${index + 1}:`);
      console.log('- Product ID:', product?.id);
      console.log('- Line Quantity:', line.quantity);
      console.log('- Product Type:', product?.productType);
      
      // Target your specific Jiffy Lube Gift Card product
      const targetProductId = 'gid://shopify/Product/7488258998368';
      
      if (product?.id === targetProductId) {
        console.log('🎯 Jiffy Lube Gift Card detected!');
        
        // Extract customer amount from quantity
        let customAmount = "25.00"; // Default fallback price
        
        if (line.quantity >= 1 && line.quantity <= 1000) {
          // Customer amount was transferred via quantity
          customAmount = line.quantity.toFixed(2);
          console.log('💰 Customer entered amount:', customAmount);
        }
        
        operations.push({
          update: {
            cartLineId: line.id,
            quantity: 1, // Reset quantity to 1
            price: {
              adjustment: {
                fixedAmountPerUnit: {
                  amount: customAmount
                }
              }
            }
          }
        });
        
        console.log(`✅ Applied customer price: $${customAmount}`);
        console.log('✅ Quantity reset to: 1');
        
      } else {
        console.log('❌ Different product, skipping...');
      }
    }
  });
  
  console.log('\n=== Transform Summary ===');
  console.log('Operations applied:', operations.length);
  
  return {
    operations: operations
  };
}
