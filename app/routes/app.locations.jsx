// Imports.
import React, { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from "../components/SidebarLayout";
import { Drawer } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import styles from '../styles/location.js';


// Frontend.
const Locations = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const openDrawer = () => setDrawerVisible(true);
  const closeDrawer = () => setDrawerVisible(false);

  return (
    <SidebarLayout>
      <div style={{ color: "white" }}>
        <Page fullWidth title="Locations 📍">
          <div style={styles.container}>
            <Text variant="headingMd" as="h1">Add Location 🍺</Text>
            <MoreOutlined onClick={openDrawer} style={{ fontSize: '20px', cursor: 'pointer' }}/>
          </div>

          <Drawer title="Add Location 🍺" placement="right" onClose={closeDrawer} open={drawerVisible}>
            <p>Drawer content like edit/delete settings here…</p>
          </Drawer>
        </Page>
      </div>
    </SidebarLayout>
  );
};

export default Locations;
