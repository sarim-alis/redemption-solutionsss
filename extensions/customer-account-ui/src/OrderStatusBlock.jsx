import React, { useState, useEffect } from 'react';
import {
  BlockStack,
  reactExtension,
  TextBlock,
  Banner,
  useApi,
  InlineStack,
  Text,
  Card,
  Spinner,
  Badge,
} from "@shopify/ui-extensions-react/customer-account";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => {
    console.log('🚀 Extension is loading!');
    console.error('🔥 EXTENSION DEBUG: This should appear in console!');
    alert('Extension is loading - you should see this popup!');
    return <VoucherDisplay />;
  }
);

function VoucherDisplay() {
  console.log('🔥 VoucherDisplay component rendered!');
  
  // Simple test - just return basic UI first
  return (
    <BlockStack spacing="base">
      <Text size="large" emphasis="bold">🎉 EXTENSION IS WORKING!</Text>
      <Banner status="success">
        Extension successfully loaded in customer account!
      </Banner>
      <Text>This proves the extension is visible and functional.</Text>
    </BlockStack>
  );
}