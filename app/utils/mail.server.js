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
