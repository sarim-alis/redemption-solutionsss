// Imports.
import React, { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { Drawer, Form, Input, Button } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import styles from '../styles/location.js';


// Frontend.
const Locations = () => {
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
    const res = await fetch("/api/models", {
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
        <Page fullWidth title="Locations 📍">
          <div style={styles.container}>
            <Text variant="headingMd" as="h1">Add Location 🍺</Text>
            <MoreOutlined onClick={openDrawer} style={{ fontSize: '20px', fontWeight: 'bold', cursor: 'pointer' }}/>
          </div>

          {/* Drawer */}
          <Drawer title="Add Location 🍺" placement="right" open={drawerVisible} onClose={closeDrawer}>
            <Form layout="vertical" onFinish={formik.handleSubmit}>
              {/* Name */}
              <Form.Item
                label={<span>Location Name <span style={{ color: '#ce1127' }}>*</span></span>}
                validateStatus={formik.errors.name && formik.touched.name ? "error" : ""}
                help={formik.errors.name && formik.touched.name ? formik.errors.name : ""}
                style={{fontSize: '16px', marginTop: '20px', marginBottom: '20px'}}
              >
                <Input
                  name="name"
                  placeholder="e.g. Woodland Hills"
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  style={{ width: '100%', height: '40px' }}
                />
              </Form.Item>

              {/* Save */}
              <Form.Item>
                <Button htmlType="submit" block style={styles.button}>
                  Save Location
                </Button>
              </Form.Item>
            </Form>
          </Drawer>
        </Page>
      </div>
    </SidebarLayout>
  );
};

export default Locations;
