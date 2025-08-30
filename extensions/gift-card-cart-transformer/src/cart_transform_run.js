// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function cartTransformRun(input) {  // ← Name change kiya
  const operations = [];

  console.log('Cart Transform Function Started');
  console.log('Input cart lines:', input.cart.lines.length);

  input.cart.lines.forEach((line, index) => {
    console.log(`Processing line ${index + 1}:`, line.id);
    
    if (line.merchandise?.__typename === 'ProductVariant') {
      const product = line.merchandise.product;
      
      // Gift card identify karein
      const isGiftCard = product?.productType?.toLowerCase() === 'gift card' ||
                        product?.productType?.toLowerCase() === 'giftcard' ||
                        product?.productType?.toLowerCase().includes('gift');

      console.log(`Line ${index + 1} product type:`, product?.productType);
      console.log(`Line ${index + 1} is gift card:`, isGiftCard);

      if (isGiftCard) {
        // Custom amount attribute check
        const customAmountAttr = line.attribute;

        console.log(`Custom amount attribute:`, customAmountAttr);

        if (customAmountAttr && customAmountAttr.value) {
          const customAmount = parseFloat(customAmountAttr.value);
          
          if (customAmount > 0) {
            console.log(`Updating price to: $${customAmount}`);
            
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
        }
      }
    }
  });

  console.log('Total operations:', operations.length);
  
  return {
    operations: operations
  };
}
