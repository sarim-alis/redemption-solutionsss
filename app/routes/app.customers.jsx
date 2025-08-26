// app/routes/app.customers.jsx
// Imports.
import { useState } from 'react';
import { Page, Text } from "@shopify/polaris";
import SidebarLayout from '../components/SidebarLayout';
import { useLoaderData } from "@remix-run/react";
import { json } from "@remix-run/node";
import { Table } from "antd";
import { getAllCustomers } from '../models/customer.server.js';

// Loader.
export const loader = async () => {
  const customers = await getAllCustomers();
  return json({ customers });
};


// Frontend.
const Customers = () => {
  const { customers: initialCustomers } = useLoaderData();
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("All");
  const [customers] = useState(initialCustomers);

  // Helper: date filter
  function isDateMatch(dateString, filter) {
    if (filter === "All") return true;
    if (!dateString) return false;
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (filter === "Today") {
      return date.toDateString() === today.toDateString();
    }
    if (filter === "Yesterday") {
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      return date.toDateString() === yesterday.toDateString();
    }
    if (filter === "This Week") {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      return date >= weekStart && date <= today;
    }
    if (filter === "This Month") {
      return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    }
    if (filter === "This Year") {
      return date.getFullYear() === today.getFullYear();
    }
    return true;
  }

  // Filter customers by search (name or email) and date
  const filteredCustomers = customers.filter(customer => {
    const name = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const email = (customer.email || "").toLowerCase();
    const q = search.toLowerCase();
    const matchesSearch = name.includes(q) || email.includes(q);
    const matchesDate = isDateMatch(customer.createdAt, dateFilter);
    return matchesSearch && matchesDate;
  });

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
  ];

  const tableData = filteredCustomers.map(c => ({
    key: c.id,
    name: `${c.firstName} ${c.lastName}`,
    email: c.email,
  }));

  return (
    <SidebarLayout>
      <div style={{ color: "black" }}>
        <Page fullWidth>
          {/* Header */}
          <Text variant="headingXl" as="h1">Customers</Text>

          {/* Search and Date Filter */}
          <div style={{ marginTop: 24, marginBottom: 16, display: 'flex', gap: '16px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                width: "320px",
                fontSize: "16px"
              }}
            />
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              style={{
                padding: "10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "16px"
              }}
            >
              <option value="All">All</option>
              <option value="Today">Today</option>
              <option value="Yesterday">Yesterday</option>
              <option value="This Week">This Week</option>
              <option value="This Month">This Month</option>
              <option value="This Year">This Year</option>
            </select>
          </div>

          {/* Customer List */}
          <Table
            columns={columns}
            dataSource={tableData}
            bordered
            pagination={false}
            style={{ marginTop: "20px" }}
          />
        </Page>
      </div>
    </SidebarLayout>
  );
};

export default Customers;