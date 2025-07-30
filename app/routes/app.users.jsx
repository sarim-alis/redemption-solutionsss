// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { Drawer, Input, Button, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
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

        const newEmployee = await response.json();
        setEmployees(prev => [...prev, newEmployee]);
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
          <Text variant="headingXl" as="h1">Employees 👨‍💼🧑⭐🌱</Text>
          <Button onClick={openDrawer} style={{ fontWeight: 'bold' }}>
            Add Employee
          </Button>
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
            <Text variant="headingMd" as="h2">Actions</Text>
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
              <Dropdown trigger={['click']} placement="bottomRight" arrow>
                <MoreOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Dropdown>
            </div>
          ))}
        </div>

        {/* Drawer to Add Employee */}
        <Drawer
          title="Add Employee 🧑‍💼"
          placement="right"
          open={drawerVisible}
          onClose={closeDrawer}
          width={400}
        >
          <form onSubmit={formik.handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label>Username <span style={{ color: '#ce1127' }}>*</span></label>
              <Input name="username" placeholder="Doron" style={{ width: '100%', height: '40px' }} value={formik.values.username} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              {formik.touched.username && formik.errors.username && (
                <div style={{ color: '#ff4d4f' }}>{formik.errors.username}</div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Email <span style={{ color: '#ce1127' }}>*</span></label>
              <Input name="email" placeholder="doron@gmail.com" style={{ width: '100%', height: '40px' }} value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              {formik.touched.email && formik.errors.email && (
                <div style={{ color: '#ff4d4f' }}>{formik.errors.email}</div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Address <span style={{ color: '#ce1127' }}>*</span></label>
              <Input name="address" placeholder="United States" style={{ width: '100%', height: '40px' }} value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              {formik.touched.address && formik.errors.address && (
                <div style={{ color: '#ff4d4f' }}>{formik.errors.address}</div>
              )}
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label>Password <span style={{ color: '#ce1127' }}>*</span></label>
              <Input.Password name="password" placeholder="******" style={{ width: '100%', height: '40px' }} value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur} />
              {formik.touched.password && formik.errors.password && (
                <div style={{ color: '#ff4d4f' }}>{formik.errors.password}</div>
              )}
            </div>

            <Button htmlType="submit" block style={styles.button} loading={formik.isSubmitting}>
              Save
            </Button>
          </form>
        </Drawer>
      </Page>
        </div> 
    </SidebarLayout>
  );
};

export default Users;
