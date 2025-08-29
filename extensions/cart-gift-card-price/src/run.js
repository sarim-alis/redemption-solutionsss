// @ts-check

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

const NO_CHANGES = {
  operations: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export default (input) => {
  const operations = [];

  input.cart.lines.forEach((line) => {
    const customAmount = line.attribute?.value;
    
    // Safe union type check - only access .product if ProductVariant
    if (
      customAmount &&
      line.merchandise &&
      line.merchandise.__typename === 'ProductVariant' &&
      line.merchandise.product
    ) {
      const parsedAmount = parseFloat(customAmount);
      
      if (parsedAmount && parsedAmount > 0) {
        operations.push({
          update: {
            cartLineId: line.id,
            price: {
              adjustment: {
                fixedPricePerUnit: {
                  amount: parsedAmount.toString(),
                },
              },
            },
          },
        });
      }
    }
  });

  if (operations.length === 0) {
    return NO_CHANGES;
  }

  return { operations };
};
