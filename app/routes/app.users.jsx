// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { Drawer, Input, Button, Dropdown, Table } from 'antd';
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

  // Ant Design Table columns
  const columns = [
    {
      title: "Name",
      dataIndex: "username",
      key: "username",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Location",
      dataIndex: "address",
      key: "address",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <MoreOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      ),
    },
  ];

  return (
    <SidebarLayout>
     <div style={{ color: "black" }}>
      <Page fullWidth>
        {/* Header */}
        <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text variant="headingXl" as="h1">Employees</Text>
          <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
          <Button onClick={openDrawer} style={{backgroundColor: 'rgb(134, 38, 51)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'}}>Add Employee</Button>
          </div>
        </div>

          {/* Employee Table */}
          <Table
            columns={columns}
            dataSource={employees.map(emp => ({ ...emp, key: emp.id }))}
            style={{ marginTop: "20px" }}
            bordered
            pagination={false}
          />

        {/* Drawer to Add Employee */}
        <Drawer
          title="Add Employee"
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
