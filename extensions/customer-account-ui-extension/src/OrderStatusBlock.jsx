
// import {
//   BlockStack,
//   reactExtension,
//   TextBlock,
//   Link,
//   Banner,
//   useCustomer,
//   Spinner
// } from "@shopify/ui-extensions-react/customer-account";



// import { useOrder } from "@shopify/ui-extensions-react/customer-account";

// export default reactExtension(
//   "customer-account.order-status.block.render",
//   () => <VoucherListByOrder />
// );


// function VoucherListByOrder() {
//   const order = useOrder();
//   // Extract the numeric order ID from Shopify's global ID
//   const orderId = order?.id ? order.id.split("/").pop() : null;
//   const [loading, setLoading] = React.useState(true);
//   const [vouchers, setVouchers] = React.useState([]);
//   const [error, setError] = React.useState(null);

//   React.useEffect(() => {
//     if (!orderId) return;
//     setLoading(true);
//     fetch(`/api.customer.vouchers?orderId=${encodeURIComponent(orderId)}`)
//       .then(res => res.json())
//       .then(data => {
//         if (data.success) {
//           setVouchers(data.vouchers);
//         } else {
//           setError(data.error || 'No vouchers found');
//         }
//         setLoading(false);
//       })
//       .catch(err => {
//         setError('Failed to load vouchers');
//         setLoading(false);
//       });
//   }, [orderId]);

//   if (!orderId) {
//     return (
//       <BlockStack>
//         <TextBlock>No order ID found for this order.</TextBlock>
//         <TextBlock>Order object fields:</TextBlock>
//         {order && Object.entries(order).map(([key, value]) => (
//           <TextBlock key={key}>{key}: {typeof value === 'object' ? JSON.stringify(value) : String(value)}</TextBlock>
//         ))}
//       </BlockStack>
//     );
//   }
//   if (loading) {
//     return <Spinner />;
//   }
//   if (error) {
//     return <Banner status="critical">{error}</Banner>;
//   }
//   if (!vouchers.length) {
//     return <Banner>No vouchers found for this order.</Banner>;
//   }

//   return (
//     <BlockStack spacing="base">
//       <TextBlock size="large" emphasis="bold">Vouchers for this Order</TextBlock>
//       {vouchers.map((v) => (
//         <Banner key={v.id} status={v.used ? 'success' : 'info'}>
//           <BlockStack>
//             <TextBlock>Voucher Code: <b>{v.code}</b></TextBlock>
//             <TextBlock>Order: {v.orderName}</TextBlock>
//             <TextBlock>Used: {v.used ? 'Yes' : 'No'}</TextBlock>
//             <TextBlock>Created: {new Date(v.createdAt).toLocaleString()}</TextBlock>
//           </BlockStack>
//         </Banner>
//       ))}
//     </BlockStack>
//   );
// }
// import React from "react";
