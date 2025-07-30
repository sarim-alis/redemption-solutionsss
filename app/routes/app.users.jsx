// app/routes/app.users.jsx
// Imports.
import { useState } from 'react';
import { Page } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import styles from '../styles/users.js';


// Frontend
const Users = () => {
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
  // const handleSubmit = (e) => {
  //   e.preventDefault();
  //   console.log('Submitting', formData);
  //   // You can POST formData to your backend here
  // };
  const handleSubmit = async (e) => {
  e.preventDefault();

  const response = await fetch('/api/employee', {
    method: 'POST',
    body: new URLSearchParams(formData),
  });

  if (response.ok) {
    const user = await response.json();
    console.log('User created:', user);
    alert('User created successfully!');
    setFormData({ username: '', email: '', address: '', password: '' });
  } else {
    const error = await response.json();
    alert('Error: ' + error.error);
  }
};


  const butts = {button: {padding: '10px',backgroundColor: isHovered ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.45)',borderColor: 'rgba(0, 0, 0, 0.45)',color: 'white',borderRadius: '4px',cursor: 'pointer'}};


  return (
    <SidebarLayout>
      <Page fullWidth title="Users 🧑⭐🌱">
        <div style={styles.container}>
          <form style={styles.form} onSubmit={handleSubmit}>
            <img src="/logo.svg" alt="Logo" style={{ width: '120px', height: '120px', marginBottom: '20px', margin: 'auto' }} />

            {/* Username */}
            <label style={styles.label}>Username<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="text" name="username" value={formData.username} onChange={handleChange} style={styles.input} required />

            {/* Email */}
            <label style={styles.label}>Email<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} style={styles.input} required />

            {/* Address */}
            <label style={styles.label}>Address<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="text" name="address" value={formData.address} onChange={handleChange} style={styles.input} required />

            {/* Password */}
            <label style={styles.label}>Password<span style={{ color: '#ce1127' }}>*</span></label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} style={styles.input} required />

            {/* Save */}
            <button type="submit" style={butts.button} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
              Sign Up
            </button>
          </form>
        </div>
      </Page>
    </SidebarLayout>
  );
};

export default Users;
