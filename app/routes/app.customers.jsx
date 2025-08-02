// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getAllEmployees } from "../models/employee.server.js";
import styles from '../styles/users.js';

// Loader.
export const loader = async () => {
  const employees = await getAllEmployees();
  return json({ employees });
};

// Component
const Users = () => {
  const { employees: initialEmployees } = useLoaderData();
  const [employees, setEmployees] = useState(initialEmployees);
  const [drawerVisible, setDrawerVisible] = useState(false);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      address: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      address: Yup.string().required('Address is required'),
      password: Yup.string().required('Password is required'),
    }),
    onSubmit: async (values, { resetForm, setSubmitting }) => {
      try {
        const response = await fetch('/api/employee', {
          method: 'POST',
          body: new URLSearchParams(values),
        });

        if (!response.ok) {
          const error = await response.json();
          alert('Error: ' + error.error);
          return;
        }

        const { employee } = await response.json();
        setEmployees(prev => [...prev, employee]);
        alert('User created successfully!');
        resetForm();
        closeDrawer();
      } catch (err) {
        console.error(err);
        alert('Unexpected error');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <SidebarLayout>
     <div style={{ color: "white" }}>
      <Page fullWidth>
        {/* Header */}
        <div style={styles.container}>
          <Text variant="headingXl" as="h1">Customers 🙍🏻‍♂️⭐🌱</Text>
        </div>

        {/* Employee List */}
        <div style={{ marginTop: "40px" }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            fontWeight: 'bold',
            paddingBottom: '12px',
            borderBottom: '2px solid white',
            gap: '450px',
            color: 'white'
          }}>
            <Text variant="headingMd" as="h2">Name</Text>
            <Text variant="headingMd" as="h2">Email</Text>
            <Text variant="headingMd" as="h2">Address</Text>
            <Text variant="headingMd" as="h2">Phone</Text>
          </div>

          {employees.map(emp => (
            <div
              key={emp.id}
              style={{
                display: 'flex',
                justifyContent: 'flex-start',
                alignItems: 'center',
                padding: '12px 0',
                gap: '310px',
                color: 'white'
              }}
            >
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

export default Users;
