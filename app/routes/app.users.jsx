// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { Drawer, Input, Button, Select, Table, Popconfirm, Menu, Dropdown } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { getAllEmployees } from "../models/employee.server.js";
import { getAllLocations } from "../models/location.server.js";
import styles from '../styles/users.js';

// Loader.
export const loader = async () => {
  const employees = await getAllEmployees();
  const locations = await getAllLocations();
  return json({ employees, locations });
};


// Frontend.
const Users = () => {
  const { employees: initialEmployees, locations } = useLoaderData();
  const [employees, setEmployees] = useState(initialEmployees);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  const openEditDrawer = (user) => {
    setEditingUser(user);
    editFormik.setValues({ username: user.username, email: user.email, locationId: user.locationId, password: user.password});
    setEditDrawerVisible(true);
  };

  const closeEditDrawer = () => {
    setEditingUser(null);
    setEditDrawerVisible(false);
  };

  const formik = useFormik({
    initialValues: {
      username: '',
      email: '',
      locationId: '',
      password: '',
    },
    validationSchema: Yup.object({
      username: Yup.string().required('Username is required'),
      email: Yup.string().email('Invalid email').required('Email is required'),
      locationId: Yup.string().required('Location is required'),
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

  const editFormik = useFormik({
  initialValues: {
    username: '',
    email: '',
    locationId: '',
    password: '',
  },
  validationSchema: Yup.object({
    username: Yup.string().required('Username is required'),
    email: Yup.string().email('Invalid email').required('Email is required'),
    locationId: Yup.string().required('Location is required'),
    password: Yup.string().required('Password is required'),
  }),
  onSubmit: async (values, { setSubmitting }) => {
    try {
      const formData = new FormData();
      formData.append("id", editingUser.id);
      formData.append("username", values.username);
      formData.append("email", values.email);
      formData.append("locationId", values.locationId);
      formData.append("password", values.password);

      const response = await fetch('/api/employee', {method: 'PUT', body: formData});
      const result = await response.json();

      if (result.success) {
        setEmployees(prev =>
          prev.map(emp => (emp.id === editingUser.id ? result.employee : emp))
        );
        alert("User updated successfully!");
        closeEditDrawer();
      } else {
        alert("Error: " + result.error);
      }
    } catch (err) {
      console.error(err);
      alert("Unexpected error");
    } finally {
      setSubmitting(false);
    }
  },
});


  // Handle delete.
  const handleDelete = async (id) => {
  try {
    const formData = new FormData();
    formData.append("id", id);

    const response = await fetch("/api/employee", {method: "DELETE", body: formData});
    const result = await response.json();

    if (result.success) {
      setEmployees(prev => prev.filter(emp => emp.id !== id));
      alert("User deleted successfully!");
    } else {
      alert("Error: " + result.error);
    }
  } catch (err) {
    console.error(err);
    alert("Unexpected error while deleting");
  }
};

  // Columns.
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
      key: "location",
      render: (_, record) => record.location?.name || 'N/A',
    },
    {
    title: "Actions",
    key: "actions",
    render: (_, record) => {
      const menu = (
        <Menu>
          <Menu.Item key="edit" onClick={() => openEditDrawer(record)}>Edit</Menu.Item>
          <Menu.Item key="delete"><Popconfirm title="Are you sure to delete this user?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">Delete</Popconfirm></Menu.Item>
        </Menu>
      );

      return (
        <Dropdown overlay={menu} trigger={["click"]}>
          <MoreOutlined style={{ fontSize: 20, cursor: "pointer" }} />
        </Dropdown>
      );
    },
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

        {/* Table */}
        <Table columns={columns} dataSource={employees.map(emp => ({ ...emp, key: emp.id }))} style={{ marginTop: "20px" }} bordered pagination={false} />

        {/* Add Employee */}
        <Drawer title="Add Employee" placement="right" open={drawerVisible} onClose={closeDrawer} width={400}>
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
              <label>Location <span style={{ color: '#ce1127' }}>*</span></label>
              <Select name="locationId" placeholder="Select Location" style={{ width: '100%', height: '40px' }} value={formik.values.locationId} onChange={(value) => formik.setFieldValue('locationId', value)} onBlur={formik.handleBlur}>
                {locations.map(location => (<Select.Option key={location.id} value={location.id}>{location.name}</Select.Option>))}
              </Select>
              {formik.touched.locationId && formik.errors.locationId && (
                <div style={{ color: '#ff4d4f' }}>{formik.errors.locationId}</div>
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

{/* Edit Employee */}
<Drawer title="Edit Employee" placement="right" open={editDrawerVisible} onClose={closeEditDrawer} width={400}>
  <form onSubmit={editFormik.handleSubmit}>
    <div style={{ marginBottom: '16px' }}>
      <label>Username <span style={{ color: '#ce1127' }}>*</span></label>
      <Input name="username" placeholder="Doron" style={{ width: '100%', height: '40px' }} value={editFormik.values.username} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur}/>
      {editFormik.touched.username && editFormik.errors.username && (
        <div style={{ color: '#ff4d4f' }}>{editFormik.errors.username}</div>
      )}
    </div>

    <div style={{ marginBottom: '16px' }}>
      <label>Email <span style={{ color: '#ce1127' }}>*</span></label>
      <Input name="email" placeholder="doron@gmail.com" style={{ width: '100%', height: '40px' }} value={editFormik.values.email} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur}/>
      {editFormik.touched.email && editFormik.errors.email && (
        <div style={{ color: '#ff4d4f' }}>{editFormik.errors.email}</div>
      )}
    </div>

    <div style={{ marginBottom: '16px' }}>
      <label>Location <span style={{ color: '#ce1127' }}>*</span></label>
      <Select name="locationId" placeholder="Select Location" style={{ width: '100%', height: '40px' }} value={editFormik.values.locationId} onChange={(value) => editFormik.setFieldValue('locationId', value)} onBlur={editFormik.handleBlur}>
        {locations.map(location => (<Select.Option key={location.id} value={location.id}>{location.name}</Select.Option>))}
      </Select>
      {editFormik.touched.locationId && editFormik.errors.locationId && (
        <div style={{ color: '#ff4d4f' }}>{editFormik.errors.locationId}</div>
      )}
    </div>

    <div style={{ marginBottom: '16px' }}>
      <label>Password <span style={{ color: '#ce1127' }}>*</span></label>
      <Input.Password name="password" placeholder="******" style={{ width: '100%', height: '40px' }} value={editFormik.values.password} onChange={editFormik.handleChange} onBlur={editFormik.handleBlur}/>
      {editFormik.touched.password && editFormik.errors.password && (
        <div style={{ color: '#ff4d4f' }}>{editFormik.errors.password}</div>
      )}
    </div>

    <Button htmlType="submit" block style={styles.button} loading={editFormik.isSubmitting}>Save</Button>
  </form>
</Drawer>

      </Page>
        </div> 
    </SidebarLayout>
  );
};

export default Users;
