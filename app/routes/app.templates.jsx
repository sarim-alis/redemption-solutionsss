// Imports.
import React from "react";
import { useLoaderData } from "@remix-run/react";
import styles from "../styles/customer.js";
import { json } from "@remix-run/node";
import { getVoucherByOrderId } from "../models/voucher.server";

// Format date.
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {year: "numeric", month: "short", day: "numeric",});
}

// Add months to date.
function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

// Format customer name.
function formatCustomerName(email) {
  if (!email) return "Customer";
  const namePart = email.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}


// Loader.
export const loader = async () => {
  const shopifyOrderId = "5935739404384";
  const voucher = await getVoucherByOrderId(shopifyOrderId);
  return json({ voucher });
  // const vouchers = await getAllVouchers();
  // return json({ vouchers });
};


// Frontend.
export default function CustomersPage() {
  const { voucher } = useLoaderData();
  console.log("📦 Voucher data:", voucher);

  return (
     <div style={styles.containerStyle}>
      {/* Subject */}
      {/* <div style={styles.subjectStyle}>
        <p style={styles.subjectTitle}>Subject, Here are your Oil Change Vouchers! Where to Redeem.</p>
      </div> */}

      {/* Customer Greeting */}
      <div style={styles.subjectStyle}>
        <p style={styles.customerTitle}>Hey {formatCustomerName(voucher.customerEmail)},</p>
        <p style={styles.customerTitle}>Thank you for your purchase of the Oil Change Vouchers/ Gift Cards. Use the Vouchers below to redeem at participating locations. See below for terms and details.</p>
      </div>


      {/* Voucher Details */}
      <div style={styles.voucherStyle}>
        <h1 style={styles.titleStyle}>Jiffy Lube Oil Change Voucher</h1>
        <p style={styles.subtitleStyle}>
          Present this at participating locations
          <br />
          to redeem.
        </p>

        <div style={styles.infoRowStyle}>
          <span style={styles.labelStyle}>Valid through:</span>
          <span style={styles.valueStyle}>{voucher.createdAt ? formatDate(addMonths(voucher.createdAt, 3)) : "N/A"}</span>
        </div>

        <div style={styles.infoRowStyle}>
          <span style={styles.labelStyle}>Issued on:</span>
          <span style={styles.valueStyle}>{voucher.createdAt ? formatDate(voucher.createdAt) : "N/A"}</span>
        </div>

        <div style={styles.infoRowStyle}>
          <span style={styles.labelStyle}>Used on:</span>
          <span style={styles.valueStyle}>---</span>
        </div>

        <div style={styles.codeContainerStyle}>
          <div style={styles.codeLabelStyle}>Voucher Code</div>
          <div style={styles.codeStyle}>{voucher.code}</div>
        </div>

        <div style={styles.termsStyle}>
          * Must be used at participating locations
          <br />
          ** Term 2<br />
          *** Term 3
        </div>
      </div>

      {/* Terms and Conditions */}
      <div style={styles.subjectStyle}>
        <p style={styles.customerTitle}>Terms and Conditions</p>
        <p style={styles.customerTitle}>Details of Terms. Locations available to redeem. How to redeem.</p>
      </div>

      {/* Gift Card */}
      <div style={styles.cardContainer}>
        <div style={styles.giftCard}>
         <div style={styles.cardHeader}>
          <img src="/logo.svg" alt="Logo" style={styles.logoStyle} />
          <span style={styles.voucherCode}>{voucher.code}</span>
         </div>

         <div style={styles.balanceRow}>
          <span style={styles.balanceLabel}>Balance:</span>
           <span style={styles.balanceAmount}>$50.00</span>
         </div>
        </div>
      </div>
    </div>
  )
}
