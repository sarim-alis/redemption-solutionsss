// app/routes/app.customers.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getAllEmployees } from "../models/employee.server.js";
import styles from '../styles/customers.js';

// Loader.
export const loader = async () => {
  const employees = await getAllEmployees();
  return json({ employees });
};


// Frontend.
const Customers = () => {
  const { employees: initialEmployees } = useLoaderData();
  const [employees] = useState(initialEmployees);

  return (
    <SidebarLayout>
     <div style={{ color: "white" }}>
      <Page fullWidth>
        {/* Header */}
        <Text variant="headingXl" as="h1">Customers 🙍🏻‍♂️⭐🌱</Text>

        {/* Customer List */}
        <div style={{ marginTop: "40px" }}>
          <div style={{display: 'flex',justifyContent: 'flex-start',fontWeight: 'bold',paddingBottom: '12px',borderBottom: '2px solid white',gap: '450px',color: 'white'}}>
            <Text variant="headingMd" as="h2">Name</Text>
            <Text variant="headingMd" as="h2">Email</Text>
            <Text variant="headingMd" as="h2">Address</Text>
            <Text variant="headingMd" as="h2">Phone</Text>
          </div>

          {employees.map(emp => (
            <div key={emp.id} style={{display: 'flex',justifyContent: 'flex-start',alignItems: 'center',padding: '12px 0',gap: '310px',color: 'white'}}>
              <span style={{ minWidth: "170px" }}>{emp.username}</span>
              <span style={{ minWidth: "170px" }}>{emp.email}</span>
              <span style={{ minWidth: "170px" }}>{emp.address}</span>
              <span style={{ minWidth: "170px" }}>{emp.address}</span>
            </div>
          ))}
        </div>
      </Page>
        </div> 
    </SidebarLayout>
  );
};

export default Customers;
