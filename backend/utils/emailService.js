import nodemailer from "nodemailer";
import { getOrderStatusEmail } from "./emailTemplates.js";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Send order status update email.
 * @param {string} toEmail  - recipient email
 * @param {string} userName - customer name
 * @param {string} orderId  - MongoDB _id
 * @param {string} status   - e.g. "SHIPPED", "DELIVERED"
 */
export const sendOrderStatusEmail = async ({ toEmail, userName, orderId, status }) => {
  const template = getOrderStatusEmail({ userName, orderId, status });
  if (!template) {
    console.warn(`[emailService] No template for status: ${status}`);
    return;
  }
  await transporter.sendMail({
    from: `"BioBurg Orders" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: template.subject,
    html: template.html,
  });
};