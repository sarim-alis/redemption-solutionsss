// Gift Card Email Template
export function generateGiftCardEmailHTML({ code, customerEmail, amount = 0 }) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);

  // const customerName = customerEmail ? customerEmail.split('@')[0] : 'Valued Customer';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
      <title>Your Gift Card - Jiffy Lube</title>
      <style>
        body { margin: 0; padding: 0; font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        table { border-collapse: collapse; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9; }
        .header { background-color: #862633; padding: 30px; border-radius: 12px; color: #ffffff; }
        .logo { border-radius: 50%; object-fit: contain; }
      </style>
    </head>
    <body>
      <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px 0;">
      <tr>
      <td align="center">

        <!-- Header -->
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#862633; padding:20px; text-align:center;">
              <tr>
                <td style="color:white; font-size:24px; font-weight:bold; text-align:center;">
                  <span style="display:inline-flex; align-items:center; justify-content:center;">
                    <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" width="60" height="60" style="margin-right:10px;" />
                    jiffylube
                  </span>
                </td>
              </tr>
            </table>

              <!-- Main Content -->
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; padding:40px 30px;">
                <tr>
                  <td align="center" style="color:#862633; font-size:28px; font-weight:bold; padding-bottom:20px;">
                    Thank you for your purchase!
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color:#333333; font-size:18px; padding-bottom:30px;">
                    Your Jiffy Lube® Oil Change Pack is ready to use.
                  </td>
                </tr>
                <tr>
                  <td align="center" style="color:#666666; font-size:16px; line-height:1.5; padding-bottom:40px;">
                    You'll find your voucher(s) below—just bring a voucher number with you on your next visit to a participating location.
                  </td>
                </tr>
              </table>


          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px; background:#862633; padding:30px; color:#ffffff;">
                <!-- Top Row -->
                    <tr>
                      <td align="left" style="width:60px;">
                        <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png"
                            width="60" height="60" style="border-radius:50%; object-fit:contain;" />
                      </td>
                      <td align="right" style="font-size:24px; font-weight:bold; color:#ffffff;">
                         ${code}
                      </td>
                    </tr>

                      <!-- Spacer -->
                      <tr><td colspan="2" height="40"></td></tr>

                  <!-- Balance Row -->
                  <tr>
                    <td colspan="2" style="padding:10px 0;">
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

<!-- Find a Location Section -->
<tr>
  <td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
           style="background:#f5f5f5; border-radius:8px; padding:30px;">
      <tr>
        <td align="center" style="font-size:20px; font-weight:bold; color:#000000; padding-bottom:20px;">
          Find a Participating Location Near You
        </td>
      </tr>
      <tr>
        <td align="center">
          <a href="https://redemption-portal-487066d362b4.herokuapp.com" 
             style="display:inline-block; background:#862633; color:#ffffff; 
                    text-decoration:none; font-size:16px; font-weight:bold; 
                    padding:14px 30px; border-radius:6px;">
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
           style="background:#ffffff; border:1px solid #e0e0e0; padding:20px;">
      <tr>
        <td align="left" style="font-size:18px; font-weight:bold; color:#862633; border-left:4px solid #862633; padding-left:10px; padding-bottom:10px;">
          How to Redeem?
        </td>
      </tr>
      <tr>
        <td style="font-size:14px; color:#555555; line-height:1.6; text-align:left;">
          Keep them all for yourself or share with friends and family. 
          It’s a smart way to save and help others stay road-ready too. 
          Look forward to seeing you soon at your local Jiffy Lube!
        </td>
      </tr>
    </table>
  </td>
</tr>


<!-- Billing Information (inside same flow, wrapped in td) -->
<tr>
  <td align="center">
    <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" 
           style="background:#ffffff; border:1px solid #cccccc;">
      <tr>
        <td style="padding:20px; font-size:18px; font-weight:bold; color:#000000; border-bottom:1px solid #ddd;">
          Billing Information:
        </td>
      </tr>
      <tr>
        <td style="padding:15px;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <!-- Billing Address -->
              <td width="50%" valign="top" style="font-size:14px; color:#333333;">
                <strong style="display:block; margin-bottom:6px;">Billing Address</strong>
                Full Name <br/>
                Street <br/>
                City, State, Zip Code
              </td>
              <!-- Payment Method -->
              <td width="50%" valign="top" style="font-size:14px; color:#333333;">
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
  <span style="display:inline-flex; align-items:center; justify-content:center;">
    <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" width="60" height="60" style="margin-right:10px;" />
    <span style="color: #862633;">jiffylube</span>
  </span>
</td>
</tr>
  <div style="color: black; font-size: 12px; line-height: 1.4; max-width: 500px; margin: 0 auto;">
    *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
  </div>
</div>
      </td>
    </tr>
  </table>
    </body>
    </html>
  `;
}
