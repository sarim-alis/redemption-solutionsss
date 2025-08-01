function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function addMonths(dateStr, months) {
  const date = new Date(dateStr);
  date.setMonth(date.getMonth() + months);
  return date;
}

function formatCustomerName(email) {
  if (!email) return "Customer";
  const namePart = email.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

export function generateVoucherEmailHTML(voucher) {
  const validThrough = voucher?.createdAt
    ? formatDate(addMonths(voucher.createdAt, 3))
    : "N/A";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "N/A";
  const name = formatCustomerName(voucher.customerEmail);

  return `
    <div style="max-width:600px;margin:20px auto;font-family:Arial,sans-serif;margin-bottom:40px;">
      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:left;margin-bottom:20px;">
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Hey ${name},</p>
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Thank you for your purchase of the Oil Change Vouchers/ Gift Cards. Use the Vouchers below to redeem at participating locations. See below for terms and details.</p>
      </div>

      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:center;margin-bottom:20px;">
        <h1 style="font-size:28px;font-weight:bold;color:#2d3748;margin-bottom:16px;letter-spacing:0.5px;">Jiffy Lube Oil Change Voucher</h1>
        <p style="font-size:16px;color:#718096;margin-bottom:40px;line-height:1.5;">
          Present this at participating locations<br />to redeem.
        </p>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Valid through:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">${validThrough}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Issued on:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">${issuedOn}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #e2e8f0;">
          <span style="font-size:16px;color:#4299e1;font-weight:500;">Used on:</span>
          <span style="font-size:16px;color:#4299e1;font-weight:500;">---</span>
        </div>
        <div style="border:3px solid #2d3748;border-radius:8px;padding:20px;margin:30px 0;background:#edf2f7;display:flex;justify-content:space-around;">
          <div style="font-size:24px;color:#2d3748;font-weight:600;margin-bottom:8px;">Voucher Code</div>
          <div style="font-size:24px;font-weight:bold;color:#2d3748;letter-spacing:2px;">${voucher.code}</div>
        </div>
        <div style="font-size:14px;color:#4299e1;line-height:1.4;text-align:left;margin-top:20px;">
          * Must be used at participating locations<br />
          ** Term 2<br />
          *** Term 3
        </div>
      </div>

      <div style="border:2px solid #4a5568;background:#f7fafc;padding:40px 30px;border-radius:0 8px 8px 8px;text-align:left;margin-bottom:20px;">
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Terms and Conditions</p>
        <p style="font-size:18px;font-weight:500;margin-bottom:15px;">Details of Terms. Locations available to redeem. How to redeem.</p>
      </div>

      <div style="padding:40px;border-radius:8px;max-width:480px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#fff;border:2px solid black;border-radius:10px;padding:24px;display:flex;flex-direction:column;gap:32px;">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <img src="/logo.svg" alt="Logo" style="width:40px;height:40px;" />
            <span style="font-weight:500;color:#2d3748;font-size:16px;">${voucher.code}</span>
          </div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:18px;color:#2d3748;font-weight:500;">Balance:</span>
            <span style="font-size:28px;color:#2d3748;font-weight:700;">$50.00</span>
          </div>
        </div>
      </div>
    </div>
  `;
}
