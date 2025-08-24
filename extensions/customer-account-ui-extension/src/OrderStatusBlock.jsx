
import {
  BlockStack,
  reactExtension,
  TextBlock,
  Link,
  Banner,
  useCustomer,
  Spinner
} from "@shopify/ui-extensions-react/customer-account";



import { useOrder } from "@shopify/ui-extensions-react/customer-account";

export default reactExtension(
  "customer-account.order-status.block.render",
  () => <VoucherListByOrder />
);


function VoucherListByOrder() {
  const order = useOrder();
  const email = order?.customer?.email;
  const [loading, setLoading] = React.useState(true);
  const [vouchers, setVouchers] = React.useState([]);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (!email) return;
    setLoading(true);
    fetch(`/api.customer.vouchers?customerEmail=${encodeURIComponent(email)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setVouchers(data.vouchers);
        } else {
          setError(data.error || 'No vouchers found');
        }
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to load vouchers');
        setLoading(false);
      });
  }, [email]);

  if (!email) {
    return (
      <BlockStack>
        <TextBlock>No customer email found for this order.</TextBlock>
        <TextBlock>Order object:</TextBlock>
        <TextBlock>{JSON.stringify(order)}</TextBlock>
      </BlockStack>
    );
  }
  if (loading) {
    return <Spinner />;
  }
  if (error) {
    return <Banner status="critical">{error}</Banner>;
  }
  if (!vouchers.length) {
    return <Banner>No vouchers found for this customer.</Banner>;
  }

  return (
    <BlockStack spacing="base">
      <TextBlock size="large" emphasis="bold">Vouchers for this Customer</TextBlock>
      {vouchers.map((v) => (
        <Banner key={v.id} status={v.used ? 'success' : 'info'}>
          <BlockStack>
            <TextBlock>Voucher Code: <b>{v.code}</b></TextBlock>
            <TextBlock>Order: {v.orderName}</TextBlock>
            <TextBlock>Used: {v.used ? 'Yes' : 'No'}</TextBlock>
            <TextBlock>Created: {new Date(v.createdAt).toLocaleString()}</TextBlock>
          </BlockStack>
        </Banner>
      ))}
    </BlockStack>
  );
}
import React from "react";
