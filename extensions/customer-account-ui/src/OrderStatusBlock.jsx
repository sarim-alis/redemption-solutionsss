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
  () => <VoucherDisplay />
);

function VoucherDisplay() {
  const { order, query } = useApi();
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchVouchers();
  }, [order]);

  const fetchVouchers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get customer email from the order
      const customerEmail = order?.customer?.email;
      if (!customerEmail) {
        setLoading(false);
        return;
      }

      // Fetch vouchers from your app's API using customer email
      const response = await fetch(`/api/customer/vouchers?customerEmail=${encodeURIComponent(customerEmail)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch vouchers: ${response.status}`);
      }

      const data = await response.json();
      setVouchers(data.vouchers || []);
    } catch (err) {
      console.error('Error fetching vouchers:', err);
      setError('Failed to load vouchers');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (voucher) => {
    if (voucher.used) {
      return <Badge tone="critical">Invalid</Badge>;
    }
    return <Badge tone="success">Valid</Badge>;
  };

  if (loading) {
    return (
      <BlockStack spacing="base">
        <Text size="large" emphasis="bold">Your Vouchers</Text>
        <InlineStack spacing="tight" blockAlignment="center">
          <Spinner size="small" />
          <Text>Loading vouchers...</Text>
        </InlineStack>
      </BlockStack>
    );
  }

  if (error) {
    return (
      <BlockStack spacing="base">
        <Text size="large" emphasis="bold">Your Vouchers</Text>
        <Banner status="critical">
          {error}
        </Banner>
      </BlockStack>
    );
  }

  if (vouchers.length === 0) {
    return (
      <BlockStack spacing="base">
        <Text size="large" emphasis="bold">Your Vouchers</Text>
        <Banner status="info">
          No vouchers found for your account.
        </Banner>
      </BlockStack>
    );
  }

  return (
    <BlockStack spacing="base">
      <Text size="large" emphasis="bold">Your Vouchers</Text>
      <Text size="small" appearance="subdued">
        Present these voucher codes at participating locations to redeem your services.
      </Text>
      
      {vouchers.map((voucher) => (
        <Card key={voucher.id} padding="base">
          <BlockStack spacing="tight">
            <InlineStack spacing="base" blockAlignment="center">
              <Text size="medium" emphasis="bold">
                {voucher.code}
              </Text>
              {getStatusBadge(voucher)}
            </InlineStack>
            
            <Text size="small" appearance="subdued">
              Order: #{voucher.orderName}
            </Text>
            
            <Text size="small" appearance="subdued">
              Created: {new Date(voucher.createdAt).toLocaleDateString()}
            </Text>
            
            {voucher.used && voucher.usedAt && (
              <Text size="small" appearance="subdued">
                Used on: {new Date(voucher.usedAt).toLocaleDateString()}
              </Text>
            )}
          </BlockStack>
        </Card>
      ))}
      
      <Text size="small" appearance="subdued">
        * Only valid at participating locations. Terms and conditions apply.
      </Text>
    </BlockStack>
  );
}