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
           <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:#862633; padding:10px; text-align:center;">
                  <tr>
                    <td style="color:white; text-align:center; padding: 10px;">
                     
                          <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1756224071/gtgy8nrnhkbcemgyh1ps.png" width="50%" height="40" style="margin-right:10px; object-fit: contain;" />
                         
                      
                    </td>
                  </tr>
            </table>

              <!-- Main Content -->
             <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color:white; margin:35px 30px;">
              <tr>
                <td align="center" style="color:#000000; font-size:28px; font-weight:bold; margin-bottom:10px;">
                  <span style="color:#862633;">Thank you </span> for your purchase!
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; margin-bottom:10px; font-weight:500;">
                  Your Jiffy Lube® Oil Change Pack is ready to use.
                </td>
              </tr>
              <tr>
                <td align="center" style="color:#000000; font-size:16px; line-height:1.5; margin-bottom:5px; font-weight:400;">
                  You'll find your voucher(s) below—just bring a voucher number with you on your next visit to a participating location.
                </td>
              </tr>
          </table>


          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px; background:#862633; margin:30px; color:#ffffff;">
                <!-- Top Row -->
                    <tr>
                      <td align="left" style="width:60px; padding: 10px;">
                        <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png"
                            width="60" height="60" style="border-radius:50%; object-fit:contain;" />
                      </td>
                      <td align="right" style="font-size:24px; font-weight:bold; color:#ffffff; padding-right:10px;">
                         ${code}
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
              <td align="center" style="padding: 0 20px; ">
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
                <td align="left" style="font-size:24px; font-weight:bold; color:#000000;  padding-bottom:10px; padding-left:20px;">
                  How to Redeem?
                </td>
              </tr>
              <tr>
                <td style="font-size:14px; color:#555555; line-height:1.6; text-align:left; padding: 0 20px;">
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
                style="background:#ffffff; margin:40px 0">
            <tr>
              <td style=" font-size:22px; font-weight:bold; color:#000000; border-bottom:1px solid #63666A;">
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
      <div style="color: black; font-size: 11px;  line-height: 1.4; max-width: 500px; margin: 0 auto; font-style: italic; text-align:center; padding-top:10px;">
        *Valid for up to 5 quarts of oil, extra fee for additional quarts. Not valid with any other offer for same service. Only valid at participating ACE Jiffy Lube locations. Shop supply fees and applicable taxes are not included and must be paid at time of service.
      </div>
        </td>
    </tr>
  </table>
    </body>
    </html>
  `;
}
