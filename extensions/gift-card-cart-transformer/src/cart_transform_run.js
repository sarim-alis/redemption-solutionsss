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

  console.log('=== Cart Transform Debug ===');
  console.log('Input cart lines:', input.cart.lines.length);

  input.cart.lines.forEach((line, index) => {
    console.log(`\nLine ${index + 1}:`);
    console.log('- Line ID:', line.id);
    console.log('- Product Type:', line.merchandise?.product?.productType);
    console.log('- Custom Attribute:', line.attribute);
    
    if (line.merchandise?.__typename === 'ProductVariant') {
      // IMPORTANT: Check for custom amount attribute FIRST (any product type)
      const customAmountAttr = line.attribute;
      
      if (customAmountAttr && customAmountAttr.value) {
        const customAmount = parseFloat(customAmountAttr.value);
        console.log('- Custom Amount Found:', customAmount);
        
        if (customAmount > 0) {
          console.log('- Applying price update:', customAmount);
          
          operations.push({
            update: {
              cartLineId: line.id,
              price: {
                adjustment: {
                  fixedAmountPerUnit: {
                    amount: customAmount.toFixed(2)
                  }
                }
              }
            }
          });
        }
      } else {
        console.log('- No custom amount attribute found');
      }
    }
  });

  console.log('\nTotal operations:', operations.length);
  console.log('Operations:', JSON.stringify(operations, null, 2));
  
  return {
    operations: operations
  };
}
