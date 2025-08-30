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
      console.log('- Quantity:', line.quantity);
      
      // Access the attribute using the alias name from GraphQL
      const customPriceAttr = line.customPriceAttribute;
      console.log('- Custom Price Attribute:', customPriceAttr);
      
      // Target your specific product
      const targetProductId = 'gid://shopify/Product/7488258998368';
      
      if (product?.id === targetProductId) {
        console.log('🎯 Jiffy Lube Gift Card detected!');
        
        // Get customer's custom amount from attribute
        let customAmount = "25.00"; // Default fallback
        
        if (customPriceAttr && customPriceAttr.value) {
          const customerAmount = parseFloat(customPriceAttr.value);
          if (customerAmount > 0 && customerAmount <= 1000) {
            customAmount = customerAmount.toFixed(2);
            console.log('💰 Customer entered amount:', customAmount);
          }
        } else {
          console.log('⚠️ No custom amount found, using default');
        }
        
        operations.push({
          update: {
            cartLineId: line.id,
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
        console.log(`✅ Quantity: ${line.quantity}`);
        
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
