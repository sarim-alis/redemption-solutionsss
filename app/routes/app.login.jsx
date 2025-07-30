// app/routes/app.login.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';

const Login = () => {
  return (
    <SidebarLayout>
    <div style={{ color: "white" }}>
    <Page fullWidth title="Login 🔒⭐🌱">
        Login
    </Page>
    </div>
    </SidebarLayout>
  )
}

export default Login