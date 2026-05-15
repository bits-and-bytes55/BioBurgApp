import nodemailer from "nodemailer";
import axios from "axios";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendSMS = async (phone, message) => {
  try {
    await axios.post(
      "https://www.fast2sms.com/dev/bulkV2",
      { route: "v3", message, numbers: phone, flash: 0 },
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`SMS sent to ${phone}`);
  } catch (err) {
    console.error("SMS send error:", err?.response?.data || err.message);
  }
};

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: `"Bioburg Pharma" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    html,
  });
  console.log(`Email sent to ${to}`);
};

export const notifyRegistrationReceived = async ({ name, email, phone }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#f59e0b,#d97706);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Application Received</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Delivery Agent Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          We've received your delivery agent application. Our team will review it within <strong>24–48 hours</strong>.
          You'll receive another notification once a decision is made.
        </p>
        <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#92400e">⏳ Status: <strong>Pending Admin Review</strong></p>
        </div>
      </div>
    </div>`;
  await sendEmail(email, "Application Received — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, your Bioburg Pharma delivery agent application has been received. We'll review it within 24-48 hours.`);
};

export const notifyApproved = async ({ name, email, phone, agentId }) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/delivery/login`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#10b981,#059669);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Application Approved!</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Delivery Agent Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          Congratulations! Your delivery agent application has been <strong style="color:#10b981">approved</strong>.
        </p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0 0 6px;font-size:13px;color:#065f46">Status: <strong>Approved</strong></p>
          <p style="margin:0;font-size:13px;color:#065f46">🪪 Agent ID: <strong>${agentId}</strong></p>
        </div>
        <a href="${loginUrl}" style="display:inline-block;background:#10b981;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Login to Portal →</a>
      </div>
    </div>`;
  await sendEmail(email, "Application Approved — Bioburg Pharma", html);
  await sendSMS(phone, `Congratulations ${name}! Your Bioburg Pharma delivery agent application is APPROVED. Agent ID: ${agentId}. Login: ${loginUrl}`);
};

export const notifyRejected = async ({ name, email, phone, reason }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Application Update</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Delivery Agent Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          Unfortunately, your delivery agent application has been <strong style="color:#ef4444">rejected</strong>.
        </p>
        ${reason ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#7f1d1d">Reason: <strong>${reason}</strong></p>
        </div>` : ""}
        <p style="color:#94a3b8;font-size:13px">For queries, contact support@bioburgpharma.com</p>
      </div>
    </div>`;
  await sendEmail(email, "Application Status Update — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, your Bioburg Pharma delivery agent application was not approved. ${reason ? "Reason: " + reason : ""} Contact: support@bioburgpharma.com`);
};

export const notifyDraft = async ({ name, email, phone, fieldLabels, adminNote }) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/delivery/login`;

  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#f97316,#c2410c);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Application Needs Updates</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Delivery Agent Portal</p>
      </div>

      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>

        <p style="color:#64748b;font-size:14px;line-height:1.7">
          Your delivery agent application has been reviewed, but a few details need to be updated before approval.
        </p>

        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0 0 8px;font-size:13px;color:#9a3412">
            Please update the following field(s):
          </p>
          <p style="margin:0;font-size:13px;color:#7c2d12">
            <strong>${fieldLabels || "Required fields"}</strong>
          </p>
        </div>

        ${
          adminNote
            ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 18px;margin:20px 0">
                <p style="margin:0;font-size:13px;color:#475569">
                  Admin note: <strong>${adminNote}</strong>
                </p>
              </div>`
            : ""
        }

        <p style="color:#64748b;font-size:13px;line-height:1.7">
          Log in to your delivery agent application and update only the requested fields. Your other details will remain saved.
        </p>

        <a href="${loginUrl}" style="display:inline-block;background:#f97316;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Update Application →
        </a>
      </div>

      <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Bioburg Pharma · support@bioburgpharma.com</p>
      </div>
    </div>
  `;

  await sendEmail(email, "Update Required — Bioburg Pharma Delivery Application", html);

  await sendSMS(
    phone,
    `Hi ${name}, your Bioburg Pharma delivery agent application needs updates: ${fieldLabels || "some fields"}. ${adminNote ? "Note: " + adminNote + ". " : ""}Login: ${loginUrl}`
  );
};


export const notifyHospitalApproved = async ({ name, email, phone, facilityName }) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/hospital/login`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#0077a3,#005580);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Hospital Approved!</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Hospital Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          Great news! <strong>${facilityName}</strong> has been <strong style="color:#10b981">approved</strong> and is now live on the Bioburg Pharma platform.
        </p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0 0 4px;font-size:13px;color:#065f46">Status: <strong>Approved & Active</strong></p>
          <p style="margin:0;font-size:13px;color:#065f46">Facility: <strong>${facilityName}</strong></p>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.7">
          You can now log in to your hospital portal to manage patients, appointments, staff, billing, and more.
        </p>
        <a href="${loginUrl}" style="display:inline-block;background:#0077a3;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Login to Hospital Portal →</a>
      </div>
      <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Bioburg Pharma · support@bioburgpharma.com</p>
      </div>
    </div>`;
  await sendEmail(email, "Hospital Approved — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, your hospital "${facilityName}" has been APPROVED on Bioburg Pharma platform. Login: ${loginUrl}`);
};

export const notifyHospitalRejected = async ({ name, email, phone, facilityName, reason }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Hospital Registration Update</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Hospital Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          We regret to inform you that the registration for <strong>${facilityName}</strong> has been <strong style="color:#ef4444">rejected</strong>.
        </p>
        ${reason ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#7f1d1d">Reason: <strong>${reason}</strong></p>
        </div>` : ""}
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          If you believe this is an error or wish to reapply, please contact our support team.
        </p>
        <p style="color:#94a3b8;font-size:13px">📧 support@bioburgpharma.com</p>
      </div>
      <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Bioburg Pharma · support@bioburgpharma.com</p>
      </div>
    </div>`;
  await sendEmail(email, "Hospital Registration Status — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, the registration for "${facilityName}" on Bioburg Pharma was not approved. ${reason ? "Reason: " + reason + "." : ""} Contact: support@bioburgpharma.com`);
};

export const notifyPharmacyApproved = async ({ name, email, phone, facilityName }) => {
  const loginUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/pharmacy/login`;
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#16a34a,#14532d);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Pharmacy Approved!</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Pharmacy Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          Great news! <strong>${facilityName}</strong> has been <strong style="color:#16a34a">approved</strong> and is now live on the Bioburg Pharma platform.
        </p>
        <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0 0 4px;font-size:13px;color:#065f46">Status: <strong>Approved & Active</strong></p>
          <p style="margin:0;font-size:13px;color:#065f46">Facility: <strong>${facilityName}</strong></p>
        </div>
        <p style="color:#64748b;font-size:13px;line-height:1.7">
          You can now log in to your pharmacy portal to manage prescriptions, inventory, billing, orders, and more.
        </p>
        <a href="${loginUrl}" style="display:inline-block;background:#16a34a;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">Login to Pharmacy Portal →</a>
      </div>
      <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Bioburg Pharma · support@bioburgpharma.com</p>
      </div>
    </div>`;
  await sendEmail(email, "Pharmacy Approved — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, your pharmacy "${facilityName}" has been APPROVED on Bioburg Pharma platform. Login: ${loginUrl}`);
};

export const notifyPharmacyRejected = async ({ name, email, phone, facilityName, reason }) => {
  const html = `
    <div style="font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:28px 32px">
        <h2 style="margin:0;color:#fff;font-size:22px">Pharmacy Registration Update</h2>
        <p style="margin:6px 0 0;color:rgba(255,255,255,0.8);font-size:13px">Bioburg Pharma — Pharmacy Portal</p>
      </div>
      <div style="padding:28px 32px">
        <p style="font-size:15px;color:#334155">Hi <strong>${name}</strong>,</p>
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          We regret to inform you that the registration for <strong>${facilityName}</strong> has been <strong style="color:#ef4444">rejected</strong>.
        </p>
        ${reason ? `<div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:8px;padding:14px 18px;margin:20px 0">
          <p style="margin:0;font-size:13px;color:#7f1d1d">Reason: <strong>${reason}</strong></p>
        </div>` : ""}
        <p style="color:#64748b;font-size:14px;line-height:1.7">
          If you believe this is an error or wish to reapply with updated documents, please contact our support team.
        </p>
        <p style="color:#94a3b8;font-size:13px">📧 support@bioburgpharma.com</p>
      </div>
      <div style="padding:16px 32px;background:#f8fafc;border-top:1px solid #e2e8f0">
        <p style="margin:0;font-size:12px;color:#94a3b8">Bioburg Pharma · support@bioburgpharma.com</p>
      </div>
    </div>`;
  await sendEmail(email, "Pharmacy Registration Status — Bioburg Pharma", html);
  await sendSMS(phone, `Hi ${name}, the registration for "${facilityName}" on Bioburg Pharma was not approved. ${reason ? "Reason: " + reason + "." : ""} Contact: support@bioburgpharma.com`);
};