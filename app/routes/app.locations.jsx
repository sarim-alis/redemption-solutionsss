// app/routes/app.location.jsx
// Imports.
import React, { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { Drawer, Form, Input, Button, Dropdown, Menu } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useLoaderData } from "@remix-run/react";
import { json, redirect } from "@remix-run/node";
import { createLocation } from '../models/location.server';
import { getAllLocations } from '../models/location.server';
import styles from '../styles/location.js';


// Action.
export const action = async ({ request }) => {
  const formData = await request.formData();
  const name = formData.get("name");

  if (!name) {
    return json({ error: "Location name is required" }, { status: 400 });
  }

  await createLocation(name);
  return redirect("/app.locations"); // refresh after save
};

// Loader.
export const loader = async () => {
  const locations = await getAllLocations();
  return json({ locations });
};

// Action Menu.
const actionMenu = (locationId) => (
  <Menu
    items={[
      {
        key: 'edit',
        label: 'Edit',
        onClick: () => {
          console.log('Edit', locationId);
          // Handle Edit logic here
        },
      },
      {
        key: 'delete',
        label: 'Delete',
        onClick: () => {
          console.log('Delete', locationId);
          // Handle Delete logic here
        },
      },
    ]}
  />
);



// Frontend.
const Locations = () => {
  // const { locations } = useLoaderData();
  const { locations: initialLocations } = useLoaderData();
  const [locations, setLocations] = useState(initialLocations);
  
  // States.
  const [drawerVisible, setDrawerVisible] = useState(false);
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Formik.
  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Location name is required'),
    }),
    // onSubmit: (values) => {
    //   console.log('Form Values:', values);
    //   // Integration to API will come later
    // },
    onSubmit: async (values) => {
  try {
    const res = await fetch("/api/location", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });

    if (!res.ok) {
      const data = await res.json();
      console.error("Error:", data.error);
      return;
    }

    const data = await res.json();
    console.log("Location created:", data.location);
    setLocations([...locations, data.location]);
    formik.resetForm();
    closeDrawer();
  } catch (error) {
    console.error("Request failed:", error);
  }
},
  });

  return (
    <SidebarLayout>
      <div style={{ color: "white" }}>
        <Page fullWidth>
          {/* Header */}
          <div style={styles.container}>
           <Text variant="headingXl" as="h1">Locations 🍺📍⭐</Text>
            <Button onClick={openDrawer} style={{backgroundColor: '#fff',color: 'black',border: 'none',fontWeight: 'bold',display: 'flex',alignItems: 'center',gap: '6px'}}>Add Location</Button>
          </div>

        <div style={{ marginTop: "40px" }}>
          <div style={{display: 'flex',justifyContent: 'flex-start',fontWeight: 'bold',paddingBottom: '12px',borderBottom: '2px solid white',gap: '250px',color: 'white'}}>
            <Text variant="headingMd" as="h2">Location Name</Text>
            <Text variant="headingMd" as="h2">Actions</Text>
          </div>

  {locations.map((loc) => (
    <div
      key={loc.id}
      style={{display: 'flex',justifyContent: 'flex-start',alignItems: 'center',padding: '12px 0',gap: '250px',color: 'white'}}
    >
      <span>{loc.name}</span>
      <Dropdown overlay={actionMenu(loc.id)} trigger={['click']} placement="bottomRight" arrow>
        <MoreOutlined style={{ fontSize: 20, cursor: 'pointer' }} />
      </Dropdown>
    </div>
  ))}
</div>

        


          {/* Drawer */}
        <Drawer title="Add Location 🍺" placement="right" open={drawerVisible} onClose={closeDrawer}>
  <form onSubmit={formik.handleSubmit}>
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>
        Location Name <span style={{ color: '#ce1127' }}>*</span>
      </label>
      <Input
        name="name"
        placeholder="e.g. Woodland Hills"
        style={{ width: '100%', height: '40px' }}
        value={formik.values.name}
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        status={formik.touched.name && formik.errors.name ? 'error' : ''}
      />
      {formik.touched.name && formik.errors.name && (
        <div style={{ color: '#ff4d4f', marginTop: '4px' }}>{formik.errors.name}</div>
      )}
    </div>

    <Button
      htmlType="submit"
      block
      style={styles.button}
      loading={formik.isSubmitting}
    >
      Save Location
    </Button>
  </form>
</Drawer>

        </Page>
      </div>
    </SidebarLayout>
  );
};

export default Locations;
