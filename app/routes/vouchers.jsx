import React from "react";
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Page, DataTable, Text, Button, BlockStack } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
// server-only functions will be imported dynamically inside loader to avoid bundling into client
export const loader = async ({ request }) => {
  const { getAllVouchers } = await import("../models/voucher.server");
  const vouchers = await getAllVouchers();
  return json({ vouchers });
};

export default function VouchersPage() {
  const { vouchers } = useLoaderData();
  const rows = vouchers.map(v => [
    v.shopifyOrderId,
    v.code,
    new Date(v.createdAt).toLocaleString(),
    <Button
      external
      url={`/vouchers/${v.shopifyOrderId}/download`}
    >
      Download PDF
    </Button>
  ]);
  return (
    <SidebarLayout>
      <Page fullWidth title="Vouchers">
        {vouchers.length > 0 ? (
          <DataTable
            columnContentTypes={["text", "text", "text", "text"]}
            headings={["Order ID", "Code", "Created At", ""]}
            rows={rows}
          />
        ) : (
          <BlockStack gap="400">
            <Text variant="bodyMd" as="p">No vouchers found.</Text>
          </BlockStack>
        )}
      </Page>
    </SidebarLayout>
  );
}
