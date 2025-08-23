// app/routes/app.customers.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getAllCustomers } from '../models/customer.server.js';
import styles from '../styles/customers.js';

// Loader.
export const loader = async () => {
  const customers = await getAllCustomers();
  return json({ customers });
};


// Frontend.
const Customers = () => {
  const { customers: initialCustomers } = useLoaderData();
  const [customers] = useState(initialCustomers);

  return (
    <SidebarLayout>
     <div style={{ color: "black" }}>
      <Page fullWidth>
        {/* Header */}
        <Text variant="headingXl" as="h1">Customers 🙍🏻‍♂️⭐🌱</Text>

        {/* Customer List */}
        <div style={{ marginTop: "40px" }}>
          <div style={{display: 'flex',justifyContent: 'flex-start',fontWeight: 'bold',paddingBottom: '12px',borderBottom: '2px solid #333',gap: '450px',color: 'black'}}>
            <Text variant="headingMd" as="h2">Name</Text>
            <Text variant="headingMd" as="h2">Email</Text>
          </div>

          {customers.map(customer => (
            <div key={customer.id} style={{display: 'flex',justifyContent: 'flex-start',alignItems: 'center',padding: '12px 0',gap: '310px',color: 'black'}}>
              <span style={{ minWidth: "170px" }}>{customer.firstName} {customer.lastName}</span>
              <span style={{ minWidth: "170px" }}>{customer.email}</span>
            </div>
          ))}
        </div>
      </Page>
        </div> 
    </SidebarLayout>
  );
};

export default Customers;
