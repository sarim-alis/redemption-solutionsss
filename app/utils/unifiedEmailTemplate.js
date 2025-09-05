// Unified Email Template for Multiple Vouchers
// This template handles both vouchers and gift cards in a single email

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
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

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
}

// Generate voucher card HTML
function generateVoucherCard(voucher) {
  const validThrough = voucher?.createdAt
    ? formatDate(addMonths(voucher.createdAt, 3))
    : "08/16/2026";
  const issuedOn = voucher?.createdAt
    ? formatDate(voucher.createdAt)
    : "03/16/2025";
  
  return `
    <div style="width:350px; padding:5px; background-color:#862633; margin: 20px auto;">
      <table width="350" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #ffffff; border-style:dashed; background:#862633; padding:20px; border-radius:0 8px 8px 8px;">
        <tr>
          <td align="center" style="padding-bottom:14px;">
            <h1 class="order-title" style="font-size:26px; font-weight:bold; color:#ffffff; margin:0;">${voucher.productTitle || 'Oil Change Voucher'}</h1>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-bottom:30px;">
            <p style="font-size:14px; color:#ffffff; margin:0; line-height:1.6;">
              Present this at participating locations to redeem.
            </p>
          </td>
        </tr>

        <!-- Valid through -->
        <tr>
          <td style="padding:10px 0;">
            <table width="100%">
              <tr>
                <td align="left" style="font-size:18px; color:#ffffff; font-weight:600;">Valid through:</td>
                <td align="right" style="font-size:20px; color:#ffffff; font-weight:400;">${validThrough}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Issued on -->
        <tr>
          <td style="padding:10px 0;">
            <table width="100%">
              <tr>
                <td align="left" style="font-size:18px; color:#ffffff; font-weight:600;">Issued on:</td>
                <td align="right" style="font-size:18px; color:#ffffff; font-weight:400;">${issuedOn}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Used on -->
        <tr>
          <td style="padding:10px 0;">
            <table width="100%">
              <tr>
                <td align="left" style="font-size:18px; color:#ffffff; font-weight:600;">Used on:</td>
                <td align="right" style="font-size:18px; color:#ffffff; font-weight:400;">— — —</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Voucher Code -->
        <tr>
          <td align="center" style="background:#edf2f7; border-radius:12px; padding:10px; margin:30px 0;">
            <table width="100%">
              <tr>
                <td align="left" style="font-size:20px; color:#862633; font-weight:bold; padding-right:10px;">
                  Voucher Code:
                </td>
                <td align="right" style="font-size:20px; font-weight:bold; color:#000000;">
                ${voucher.code}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Terms -->
        <tr>
          <td style="font-size:12px; font-style:italic; color:#ffffff; text-align:left; padding-top:35px;">
            *Only valid at participating ACE Jiffy Lube Locations. <br />
            ** Term 2 <br />
            *** Term 3
            <table width="100%" style="margin-top:10px;">
              <tr>
                <td align="right">
                  <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" width="60" height="60" style="display:block;" />
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Generate gift card HTML - Using original gift card design
function generateGiftCard(voucher, amount = 0) {
  const formattedAmount = formatCurrency(amount);
  
  return `
    <div style="width:600px; margin: 20px auto;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px; background:#862633; margin:30px; color:#ffffff;">
        <!-- Top Row -->
        <tr>
          <td align="left" style="width:60px; padding: 10px;">
            <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png"
                width="60" height="60" style="border-radius:50%; object-fit:contain;" />
          </td>
          <td align="right" style="font-size:24px; font-weight:bold; color:#ffffff; padding-right:10px;">
             ${voucher.code}
          </td>
        </tr>

        <!-- Spacer -->
        <tr><td colspan="2" height="40"></td></tr>

        <!-- Balance Row -->
        <tr>
          <td colspan="2" style="padding:10px;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="left" style="font-size:24px; font-weight:600; color:#ffffff; white-space:nowrap;">
                  Current Balance:
                </td>
                <td align="right" style="font-size:40px; font-weight:bold; color:#ffffff; white-space:nowrap;">
                  ${formattedAmount}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>
  `;
}

// Main unified email template
export function generateUnifiedEmailHTML({ order, vouchers }) {
  const customerName = formatCustomerName(order?.customerEmail);
  
  // Debug: Log voucher types
  console.log('🔍 [UnifiedEmail] Voucher types:', vouchers.map(v => ({ code: v.code, type: v.type, productTitle: v.productTitle })));
  
  // Separate vouchers by type
  const voucherVouchers = vouchers.filter(v => v.type !== 'gift');
  const giftVouchers = vouchers.filter(v => v.type === 'gift');
  
  console.log(`🔍 [UnifiedEmail] Found ${voucherVouchers.length} vouchers and ${giftVouchers.length} gift cards`);
  
  // Generate voucher cards HTML
  const voucherCardsHTML = voucherVouchers.map(voucher => generateVoucherCard(voucher)).join('');
  
  // Generate gift cards HTML
  const giftCardsHTML = giftVouchers.map(voucher => generateGiftCard(voucher, order?.totalPrice || 0)).join('');

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jiffy Lube - Your Order Details</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
    </head>
    <body>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family: 'Barlow Condensed', sans-serif; background-color:#f9f9f9; padding:20px 0;">
        <tr>
          <td align="center">

            <!-- Header -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#862633; padding:10px; text-align:center;">
              <tr>
                <td style="color:white; text-align:center;">
                  <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224071/gtgy8nrnhkbcemgyh1ps.png" width="50%" height="40" style="margin-right:10px; object-fit: contain;" />
                </td>
              </tr>
            </table>

            <!-- Main Content -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:35px 30px;">
              <tr>
                <td align="center" style="color:#000000; font-size:28px; font-weight:bold; padding-bottom:10px;">
                  <span style="color:#862633;">Thank you </span> for your purchase!
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; padding-bottom:10px; font-weight:500;">
                  Your Jiffy Lube® items are ready to use.
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; line-height:1.5; padding-bottom:5px; font-weight:400;">
                  You'll find your voucher(s) and gift card(s) below—just bring them with you on your next visit to a participating location.
                </td>
              </tr>
            </table>

            ${voucherVouchers.length > 0 ? `
            <!-- Vouchers Section -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:20px;">
              <tr>
                <td align="center" style="color:#000000; font-size:24px; font-weight:bold; padding-bottom:20px;">
                  Your Vouchers
                </td>
              </tr>
              <tr>
                <td align="center">
                  ${voucherCardsHTML}
                </td>
              </tr>
            </table>
            ` : ''}

            ${giftVouchers.length > 0 ? `
            <!-- Gift Cards Section -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:20px;">
              <tr>
                <td align="center" style="color:#000000; font-size:24px; font-weight:bold; padding-bottom:20px;">
                  Your Gift Cards
                </td>
              </tr>
              <tr>
                <td align="center">
                  ${giftCardsHTML}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Find a Location Section -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#f5f5f5; border-radius:8px; padding:30px 20px; margin:40px 0">
                  <tr>
                    <td align="center" style="font-size:20px; font-weight:bold; color:#000000; padding-bottom:20px;">
                      Find a Participating Location Near You
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <a href="https://redemption-portal-487066d362b4.herokuapp.com" 
                        style="display:block; background:#862633; color:#ffffff; 
                                text-decoration:none; font-size:16px; font-weight:bold; 
                                padding:14px 30px; border-radius:6px; width:100%; box-sizing:border-box">
                        FIND A LOCATION
                      </a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- How to Redeem Section -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#ffffff; padding:20px; border-left:3px solid #862633;">
                  <tr>
                    <td align="left" style="font-size:24px; font-weight:bold; color:#000000; padding-bottom:10px;">
                      How to Redeem?
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:14px; color:#555555; line-height:1.6; text-align:left;">
                      Keep them all for yourself or share with friends and family. 
                      It's a smart way to save and help others stay road-ready too. 
                      Look forward to seeing you soon at your local Jiffy Lube!
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Billing Information -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#ffffff; margin:40px 0">
                  <tr>
                    <td style="font-size:22px; font-weight:bold; color:#000000; border-bottom:1px solid #63666A;">
                      Billing Information:
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:15px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <!-- Billing Address -->
                          <td width="50%" valign="top" style="font-size:16px; color:#000000;">
                            <strong style="display:block; margin-bottom:6px;">Billing Address</strong>
                            Full Name <br/>
                            Street <br/>
                            City, State, Zip Code
                          </td>
                          <!-- Payment Method -->
                          <td width="50%" valign="top" style="font-size:16px; color:#000000;">
                            <strong style="display:block; margin-bottom:6px;">Payment Method</strong>
                            Apple Pay
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr style="margin-top:20px;">
              <td style="color:white; font-size:24px; font-weight:bold; text-align:center;">
                <span style="display:inline-block;">
                  <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224350/kuc37dmifsg42ojqxwc1.png" width="50%" height="60" style="margin-right:10px; object-fit: contain;" />
                </span>
              </td>
            </tr>
            <div style="color: black; font-size: 11px; line-height: 1.4; max-width: 500px; margin: 0 auto; font-style: italic; text-align:center; padding-top:10px;">
              *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
            </div>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Generate unified PDF HTML (EXACTLY same as email template)
export function generateUnifiedPDFHTML({ order, vouchers }) {
  const customerName = formatCustomerName(order?.customerEmail);
  
  // Separate vouchers by type
  const voucherVouchers = vouchers.filter(v => v.type !== 'gift');
  const giftVouchers = vouchers.filter(v => v.type === 'gift');
  
  // Generate voucher cards HTML (same as email)
  const voucherCardsHTML = voucherVouchers.map(voucher => generateVoucherCard(voucher)).join('');
  
  // Generate gift cards HTML (same as email)
  const giftCardsHTML = giftVouchers.map(voucher => generateGiftCard(voucher, order?.totalPrice || 0)).join('');
  
  // Return EXACT same HTML as email template with PDF-specific styles
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Jiffy Lube - Your Order Details</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap" rel="stylesheet">
      <style>
        /* PDF-specific styles only for better rendering */
        @media print {
          .voucher-container { 
            page-break-inside: avoid; 
          }
          .page-break { 
            page-break-before: always; 
          }
        }
        /* Ensure proper table rendering in PDF */
        table { 
          border-collapse: collapse !important; 
        }
        td { 
          vertical-align: top !important; 
        }
      </style>
    </head>
    <body>
      <!-- EXACT SAME STRUCTURE AS EMAIL TEMPLATE -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family: 'Barlow Condensed', sans-serif; background-color:#f9f9f9; padding:20px 0;">
        <tr>
          <td align="center">

            <!-- Header -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#862633; padding:10px; text-align:center;">
              <tr>
                <td style="color:white; text-align:center;">
                  <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224071/gtgy8nrnhkbcemgyh1ps.png" width="50%" height="40" style="margin-right:10px; object-fit: contain;" />
                </td>
              </tr>
            </table>

            <!-- Main Content -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:35px 30px;">
              <tr>
                <td align="center" style="color:#000000; font-size:28px; font-weight:bold; padding-bottom:10px;">
                  <span style="color:#862633;">Thank you </span> for your purchase!
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; padding-bottom:10px; font-weight:500;">
                  Your Jiffy Lube® items are ready to use.
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; line-height:1.5; padding-bottom:5px; font-weight:400;">
                  You'll find your voucher(s) and gift card(s) below—just bring them with you on your next visit to a participating location.
                </td>
              </tr>
            </table>

            ${voucherVouchers.length > 0 ? `
            <!-- Vouchers Section -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:20px;">
              <tr>
                <td align="center" style="color:#000000; font-size:24px; font-weight:bold; padding-bottom:20px;">
                  Your Vouchers
                </td>
              </tr>
              <tr>
                <td align="center" class="voucher-container">
                  ${voucherCardsHTML}
                </td>
              </tr>
            </table>
            ` : ''}

            ${giftVouchers.length > 0 ? `
            <!-- Gift Cards Section -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:20px;">
              <tr>
                <td align="center" style="color:#000000; font-size:24px; font-weight:bold; padding-bottom:20px;">
                  Your Gift Cards
                </td>
              </tr>
              <tr>
                <td align="center" class="voucher-container">
                  ${giftCardsHTML}
                </td>
              </tr>
            </table>
            ` : ''}

            <!-- Find a Location Section -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#f5f5f5; border-radius:8px; padding:30px 20px; margin:40px 0">
                  <tr>
                    <td align="center" style="font-size:20px; font-weight:bold; color:#000000; padding-bottom:20px;">
                      Find a Participating Location Near You
                    </td>
                  </tr>
                  <tr>
                    <td align="center">
                      <div style="display:block; background:#862633; color:#ffffff; 
                                text-decoration:none; font-size:16px; font-weight:bold; 
                                padding:14px 30px; border-radius:6px; width:100%; box-sizing:border-box; text-align:center;">
                        FIND A LOCATION
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- How to Redeem Section -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#ffffff; padding:20px; border-left:3px solid #862633;">
                  <tr>
                    <td align="left" style="font-size:24px; font-weight:bold; color:#000000; padding-bottom:10px;">
                      How to Redeem?
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:14px; color:#555555; line-height:1.6; text-align:left;">
                      Keep them all for yourself or share with friends and family. 
                      It's a smart way to save and help others stay road-ready too. 
                      Look forward to seeing you soon at your local Jiffy Lube!
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Billing Information -->
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
                      style="background:#ffffff; margin:40px 0">
                  <tr>
                    <td style="font-size:22px; font-weight:bold; color:#000000; border-bottom:1px solid #63666A;">
                      Billing Information:
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:15px;">
                      <table width="100%" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <!-- Billing Address -->
                          <td width="50%" valign="top" style="font-size:16px; color:#000000;">
                            <strong style="display:block; margin-bottom:6px;">Billing Address</strong>
                            Full Name <br/>
                            Street <br/>
                            City, State, Zip Code
                          </td>
                          <!-- Payment Method -->
                          <td width="50%" valign="top" style="font-size:16px; color:#000000;">
                            <strong style="display:block; margin-bottom:6px;">Payment Method</strong>
                            Apple Pay
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Footer -->
            <tr style="margin-top:20px;">
              <td style="color:white; font-size:24px; font-weight:bold; text-align:center;">
                <span style="display:inline-block;">
                  <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224350/kuc37dmifsg42ojqxwc1.png" width="50%" height="60" style="margin-right:10px; object-fit: contain;" />
                </span>
              </td>
            </tr>
            <tr>
              <td>
                <div style="color: black; font-size: 11px; line-height: 1.4; max-width: 500px; margin: 0 auto; font-style: italic; text-align:center; padding-top:10px;">
                  *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
                </div>
              </td>
            </tr>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
