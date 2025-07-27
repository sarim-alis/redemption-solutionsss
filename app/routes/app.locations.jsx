// Imports.
import React from 'react';
import { useLoaderData } from "@remix-run/react";
import { Page, DataTable, Text, Thumbnail, Badge, BlockStack } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { authenticate } from "../shopify.server";


// Frontend.
const Locations = () => {
  return (
    <SidebarLayout>
     <div style={{ color: "white" }}>
       <Page fullWidth title="Products">
            <div style={{ color: "white" }}>
                <Text variant="headingMd" as="h1">Locations 📍</Text>
            </div>
       </Page>
     </div>
    </SidebarLayout>
  )
}

export default Locations