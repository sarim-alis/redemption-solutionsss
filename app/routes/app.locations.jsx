// app/routes/app.location.jsx
// Imports.
import React, { useState, useEffect } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { Drawer, Input, Button, Dropdown, Menu } from 'antd';
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
  const market = formData.get("market");

  if (!name || !market) {
    return json({ error: "Location name and market is required" }, { status: 400 });
  }

  await createLocation(name);
  return redirect("/app.locations");
};

// Loader.
export const loader = async () => {
  const locations = await getAllLocations();
  return json({ locations });
};


// Frontend.
const Locations = () => {
  const { locations: initialLocations } = useLoaderData();
  const [locations, setLocations] = useState(initialLocations);
  const [editDrawerVisible, setEditDrawerVisible] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const marketOptions = ["Market #1", "Market #2", "Market #3", "Market #4", "Market #5", "Market #6", "Market #7"];


  const handleDelete = async (locationId) => {
  try {
    const res = await fetch("/api/location", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id: locationId }),
    });

    if (!res.ok) {
      console.error("❌ Delete failed");
      return;
    }

    // Remove from local state
    setLocations((prev) => prev.filter((loc) => loc.id !== locationId));
    console.log("🗑️ Deleted:", locationId);
  } catch (err) {
    console.error("❌ Error deleting:", err);
  }
};

// Action Menu.
const actionMenu = (locationId) => (
  <Menu
    items={[
      {
        key: 'edit',
        label: 'Edit',
        onClick: () => {
  const loc = locations.find((l) => l.id === locationId);
  setEditingLocation(loc);
  setEditDrawerVisible(true);
}

      },
      {
        key: 'delete',
        label: 'Delete',
        onClick: () => handleDelete(locationId),
      },
    ]}
  />
);
  
  // States.
  const [drawerVisible, setDrawerVisible] = useState(false);
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  // Formik.
  const formik = useFormik({
    initialValues: {
      name: '',
      market: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Location name is required'),
      market: Yup.string().required('Market is required'),
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

  const editFormik = useFormik({
  initialValues: {
    id: '',
    name: '',
    market: '',
  },
  enableReinitialize: true,
  validationSchema: Yup.object({
    name: Yup.string().required("Location name is required"),
    market: Yup.string().required("Market is required"),
  }),
  onSubmit: async (values) => {
    try {
      const res = await fetch("/api/location", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        const data = await res.json();
        console.error("Error updating:", data.error);
        return;
      }

      const data = await res.json();
      console.log("✅ Updated:", data.location);

      setLocations((prev) =>
        prev.map((loc) =>
          loc.id === data.location.id ? data.location : loc
        )
      );

      setEditDrawerVisible(false);
      setEditingLocation(null);
    } catch (error) {
      console.error("❌ Update failed:", error);
    }
  },
});

useEffect(() => {
  if (editingLocation) {
    editFormik.setValues({
      id: editingLocation.id,
      name: editingLocation.name,
      market: editingLocation.market,
    });
  }
}, [editingLocation]);


  return (
    <SidebarLayout>
      <div style={{ color: "black" }}>
        <Page fullWidth>
          {/* Header */}
          <div style={{ ...styles.container, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="headingXl" as="h1">Locations</Text>
            <div style={{ display: 'flex', justifyContent: 'flex-end', flex: 1 }}>
              <Button onClick={openDrawer} style={{backgroundColor: 'rgb(134, 38, 51)', color: 'white', border: 'none', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto'}}>Add Location</Button>
            </div>
          </div>

        <div style={{ marginTop: "40px" }}>
          <div style={{display: 'flex',fontWeight: 'bold',paddingBottom: '12px',borderBottom: '2px solid #333',color: 'black'}}>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <Text variant="headingMd" as="h2">Location Name</Text>
            </div>
            <div style={{ width: 200, textAlign: 'right' }}>
              <Text variant="headingMd" as="h2">Actions</Text>
            </div>
          </div>

          {locations.map((loc) => (
            <div
              key={loc.id}
              style={{display: 'flex',alignItems: 'center',padding: '12px 0',color: 'black'}}>
              <span style={{ flex: 1, minWidth: "120px", textAlign: 'left' }}>{loc.name}</span>
              <span style={{ flex: 1, minWidth: "120px", textAlign: 'left' }}>{loc.market}</span>
              <div style={{ width: 200, textAlign: 'right' }}>
                <Dropdown overlay={actionMenu(loc.id)} trigger={['click']} placement="bottomRight" arrow>
                  <MoreOutlined style={{ fontSize: 30, cursor: 'pointer' }} />
                </Dropdown>
              </div>
            </div>
          ))}
        </div>

        


          {/* Drawer */}
        <Drawer title="Add Location" placement="right" open={drawerVisible} onClose={closeDrawer}>
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

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '16px', marginBottom: '8px' }}>
                  Market <span style={{ color: '#ce1127' }}>*</span>
                </label>
                <select
                  name="market"
                  value={formik.values.market}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  style={{ width: '100%', height: '40px' }}
                >
                  <option value="">Select Market</option>
                  {marketOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {formik.touched.market && formik.errors.market && (
                  <div style={{ color: '#ff4d4f', marginTop: '4px' }}>{formik.errors.market}</div>
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

<Drawer
  title="Edit Location"
  placement="right"
  open={editDrawerVisible}
  onClose={() => {
    setEditDrawerVisible(false);
    setEditingLocation(null);
  }}
>
  <form onSubmit={editFormik.handleSubmit}>
    <div style={{ marginBottom: "20px" }}>
      <label
        style={{
          display: "block",
          fontSize: "16px",
          marginBottom: "8px",
        }}
      >
        Location Name <span style={{ color: "#ce1127" }}>*</span>
      </label>
      <Input
        name="name"
        placeholder="e.g. Woodland Hills"
        style={{ width: "100%", height: "40px" }}
        value={editFormik.values.name}
        onChange={editFormik.handleChange}
        onBlur={editFormik.handleBlur}
        status={
          editFormik.touched.name && editFormik.errors.name ? "error" : ""
        }
      />
      {editFormik.touched.name && editFormik.errors.name && (
        <div style={{ color: "#ff4d4f", marginTop: "4px" }}>
          {editFormik.errors.name}
        </div>
      )}
    </div>

     <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "16px", marginBottom: "8px" }}>
                  Market <span style={{ color: "#ce1127" }}>*</span>
                </label>
                <select
                  name="market"
                  value={editFormik.values.market}
                  onChange={editFormik.handleChange}
                  onBlur={editFormik.handleBlur}
                  style={{ width: "100%", height: "40px" }}
                >
                  <option value="">Select Market</option>
                  {marketOptions.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {editFormik.touched.market && editFormik.errors.market && (
                  <div style={{ color: "#ff4d4f", marginTop: "4px" }}>
                    {editFormik.errors.market}
                  </div>
                )}
              </div>


    <Button
      htmlType="submit"
      block
      style={styles.button}
      loading={editFormik.isSubmitting}
    >
      Update Location
    </Button>
  </form>
</Drawer>


        </Page>
      </div>
    </SidebarLayout>
  );
};

export default Locations;