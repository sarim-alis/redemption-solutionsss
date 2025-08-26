// Gift Card Email Template
export function generateGiftCardEmailHTML({ code, customerEmail, amount = 0 }) {
  const formattedAmount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);

  const customerName = customerEmail ? customerEmail.split('@')[0] : 'Valued Customer';
  
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
      <div class="container">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" border="0" style="border-radius:12px; background:#862633; padding:30px; color:#ffffff;">
                <!-- Top Row -->
                <tr>
                  <td align="left" style="width:60px;">
                    <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png"
                         width="60" height="60" style="border-radius:50%; object-fit:contain;" alt="Jiffy Lube Logo" />
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
            </td>
          </tr>
        </table>
          
        <div style="text-align: center; margin: 30px 0; font-family: Arial, sans-serif;">
          <a href="https://www.jiffylube.com/locations" style="display: inline-block; padding: 12px 24px; background-color: #862633; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; margin: 15px 0;">Find a Location</a>
          
          <p style="color: #666666; line-height: 1.6; max-width: 500px; margin: 20px auto;">
            If you have any questions about your gift card, please contact our customer service team.
          </p>
          
          <p style="margin: 20px 0;">Thank you for choosing Jiffy Lube!</p>
          
          <p style="margin: 10px 0;">Best regards,<br><strong>The Jiffy Lube Team</strong></p>
        </div>
        
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #777777; border-top: 1px solid #eeeeee; margin-top: 20px;">
          <p>© ${new Date().getFullYear()} Jiffy Lube. All rights reserved.</p>
          <p>This email was sent to ${customerEmail}. Please add us to your address book to ensure delivery.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
