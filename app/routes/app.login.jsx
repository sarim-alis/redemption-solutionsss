// app/routes/app.login.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import styles from '../styles/login.js';

const Login = () => {
  const [isHovered, setIsHovered] = useState(false);
  // States.
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    address: '',
    password: '',
  });

  // handleChange.
  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // handleSubmit.
  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Submitting', formData);
    // You can POST formData to your backend here
  };

  const butts = {button: {padding: '10px',backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',borderColor: 'rgba(0, 0, 0, 0.45)',color: 'white',borderRadius: '4px',cursor: 'pointer'}};


  return (
    <SidebarLayout>
    <div style={{ color: "white" }}>
    <Page fullWidth title="Login 🔒⭐🌱">
         <div style={styles.container}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <img src="/logo.svg" alt="Logo" style={{ width: '120px', height: '120px', marginBottom: '20px', margin: 'auto' }} />

            {/* Username */}
            <label style={styles.label}>Username<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} style={styles.input} required />

            {/* Password */}
            <label style={styles.label}>Password<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} required />

            {/* Save */}
            <button type="submit" style={butts.button} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              Login
            </button>
          </form>
        </div>
    </Page>
    </div>
    </SidebarLayout>
  )
}

export default Login
