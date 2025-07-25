// import nodemailer from 'nodemailer';

// const transportConfig = {
//   service: 'gmail',
//   auth: {
//     user: process.env.MAIL_USERNAME,
//     pass: process.env.MAIL_PASSWORD,
//   },
// } as nodemailer.TransportOptions;

// const transporter = nodemailer.createTransport(transportConfig);

// type VoucherEmailData = {
//   orderNumber: string;
//   voucherCode: string;
//   customerName: string;
// };

// export async function sendVoucherEmail(to: string, data: VoucherEmailData) {
//   const emailContent = `
//     Dear ${data.customerName},
    
//     Thank you for your order #${data.orderNumber}!
    
//     Here's your exclusive voucher code: ${data.voucherCode}
    
//     Best regards,
//     ${process.env.MAIL_FROM_NAME}
//   `;

//   try {
//     await transporter.sendMail({
//       from: process.env.MAIL_FROM_ADDRESS,
//       to,
//       subject: 'Your Purchase Voucher',
//       text: emailContent,
//     });
//     console.log("Email sent to:", to);
//   } catch (err) {
//     console.error("Error sending email to:", to, err);
//   }
// }
