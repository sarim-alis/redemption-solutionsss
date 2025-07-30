// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { Drawer, Form, Input, Button, Dropdown, Menu } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { getAllEmployees } from "../models/employee.server.js";
import styles from '../styles/users.js';

// Loader to get initial employees
export const loader = async () => {
  const employees = await getAllEmployees();
  return json({ employees });
};

// Component
const Users = () => {
  const { employees: initialEmployees } = useLoaderData();
  const [employees, setEmployees] = useState(initialEmployees);
  const [isHovered, setIsHovered] = useState(false);

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
      password: Yup.string().min(6, 'Password must be at least 6 characters').required('Password is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
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
        alert('User created successfully!');
        setEmployees([...employees, newEmployee]);
        resetForm();
      } catch (err) {
        console.error(err);
        alert('Unexpected error');
      }
    },
  });

  const buttonStyle = {
    padding: '10px',
    backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',
    borderColor: 'rgba(0, 0, 0, 0.45)',
    color: 'white',
    borderRadius: '4px',
    cursor: 'pointer'
  };

  return (
    <SidebarLayout>
      <Page fullWidth title="Users 🧑⭐🌱">
        <div style={styles.container}>
          <form style={styles.form} onSubmit={formik.handleSubmit}>
            <img
              src="/logo.svg"
              alt="Logo"
              style={{ width: '120px', height: '120px', marginBottom: '20px', margin: 'auto' }}
            />

            {/* Username */}
            <label style={styles.label}>
              Username<span style={{ color: '#ce1127' }}>*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formik.values.username}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={styles.input}
            />
            {formik.touched.username && formik.errors.username && (
              <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{formik.errors.username}</div>
            )}

            {/* Email */}
            <label style={styles.label}>
              Email<span style={{ color: '#ce1127' }}>*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={styles.input}
            />
            {formik.touched.email && formik.errors.email && (
              <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{formik.errors.email}</div>
            )}

            {/* Address */}
            <label style={styles.label}>
              Address<span style={{ color: '#ce1127' }}>*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formik.values.address}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={styles.input}
            />
            {formik.touched.address && formik.errors.address && (
              <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{formik.errors.address}</div>
            )}

            {/* Password */}
            <label style={styles.label}>
              Password<span style={{ color: '#ce1127' }}>*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              style={styles.input}
            />
            {formik.touched.password && formik.errors.password && (
              <div style={{ color: '#ff4d4f', marginBottom: '8px' }}>{formik.errors.password}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              style={buttonStyle}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              Sign Up
            </button>
          </form>
        </div>

        {/* Employee List */}
        <div style={{ marginTop: "40px" }}>
          <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            fontWeight: 'bold',
            paddingBottom: '12px',
            borderBottom: '2px solid white',
            gap: '220px',
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
                gap: '170px',
                color: 'white'
              }}
            >
              <span style={{ minWidth: "90px" }}>{emp.username}</span>
              <span style={{ minWidth: "90px" }}>{emp.email}</span>
              <span style={{ minWidth: "90px" }}>{emp.address}</span>
              <Dropdown trigger={['click']} placement="bottomRight" arrow>
                <MoreOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
              </Dropdown>
            </div>
          ))}
        </div>
      </Page>
    </SidebarLayout>
  );
};

export default Users;
