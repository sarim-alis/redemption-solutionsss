import nodemailer from "nodemailer";

const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

console.log("✅ .env variables loaded");

if (!smtpUser || !smtpPass) {
  throw new Error("SMTP credentials are missing from .env");
}

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

//@ts-ignore
export async function sendEmail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: `"Redemption 👻" <${smtpUser}>`,
    to,
    subject,
    text,
    html,
  });

  console.log("✅ Message sent:", info.messageId);
}

// getVoucherHTML
export function getVoucherHTML() {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="border:2px solid #4a5568; background:#862633; padding:30px; border-radius:0 8px 8px 8px;">
          <tr>
            <td align="center" style="padding-bottom:20px;">
              <h1 style="font-size:32px; font-weight:bold; color:#ffffff; margin:0;">Oil Change Voucher</h1>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding-bottom:30px;">
              <p style="font-size:18px; color:#ffffff; margin:0; line-height:1.6;">
                Present this at participating locations to redeem.
              </p>
            </td>
          </tr>

          <!-- Valid through -->
          <tr>
            <td style="border-bottom:1px solid #e2e8f0; padding:20px 0;">
              <table width="100%">
                <tr>
                  <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Valid through:</td>
                  <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">08/16/2026</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Issued on -->
          <tr>
            <td style="border-bottom:1px solid #e2e8f0; padding:20px 0;">
              <table width="100%">
                <tr>
                  <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Issued on:</td>
                  <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">03/16/2026</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Used on -->
          <tr>
            <td style="border-bottom:1px solid #e2e8f0; padding:20px 0;">
              <table width="100%">
                <tr>
                  <td align="left" style="font-size:20px; color:#ffffff; font-weight:500;">Used on:</td>
                  <td align="right" style="font-size:20px; color:#ffffff; font-weight:500;">— — —</td>
                </tr>
              </table>
            </td>
          </tr>

<!-- Voucher Code -->
<tr>
<td height="30" style="line-height:30px; font-size:0;">&nbsp;</td>
</tr>
<tr>
  <td align="center" style="background:#edf2f7; border-radius:12px; padding:20px; margin:30px 0;">
    <table width="100%">
      <tr>
        <td align="left" style="font-size:24px; color:#862633; font-weight:bold; padding-right:10px;">
          Voucher Code:
        </td>
        <td align="right" style="font-size:32px; font-weight:bold; color:#000000; letter-spacing:2px;">
          32A9-TV09
        </td>
      </tr>
    </table>
  </td>
</tr>


          <!-- Terms -->
          <tr>
            <td style="font-size:16px; color:#ffffff; line-height:1.8; text-align:left; padding-top:20px;">
              *Only valid at participating ACE Jiffy Lube Locations. <br />
              ** Term 2 <br />
              <table width="100%" style="margin-top:10px;">
                <tr>
                  <td style="font-size:16px; color:#ffffff;">*** Term 3</td>
                  <td align="right">
                    <img src="https://res.cloudinary.com/dgk3gaml0/image/upload/v1755837350/lxkizea7xfe7omtekg5r.png" width="60" height="60" style="display:block;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
  `;
}

export function getGiftHTML() {
  return `
  <table width="100%" cellpadding="0" cellspacing="0" border="0" align="center" style="font-family:Arial, sans-serif; background-color:#f9f9f9; padding:20px 0;">
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
              #293A-29CB
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
          $50.00
        </td>
      </tr>
    </table>
  </td>
</tr>
        </table>
      </td>
    </tr>
  </table>
  `;
}
