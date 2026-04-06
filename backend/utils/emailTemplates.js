const BRAND = {
  name:    "BioBurg Pharma",
  logo:    "https://yourdomain.com/logo.png", 
  color:   "#0077a3",
  dark:    "#0f172a",
  light:   "#f0f9ff",
  website: "https://bioburglifesciences.in/",
  hr:      "careers@bioburgpharma.com",
};

// ── Base wrapper ──────────────────────────────────────────────────────────────
const wrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${BRAND.name}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#003d57,${BRAND.color});padding:28px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;letter-spacing:0.3px;">${BRAND.name}</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">Careers Portal</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px;">
            ${content}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              This email was sent by <strong>${BRAND.name}</strong> Recruitment Team.<br/>
              If you have questions, reply to <a href="mailto:${BRAND.hr}" style="color:${BRAND.color};">${BRAND.hr}</a>.<br/>
              <a href="${BRAND.website}" style="color:${BRAND.color};">${BRAND.website}</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ── Stage badge colors ────────────────────────────────────────────────────────
const BADGE = {
  application_filled: { bg: "#fef9c3", color: "#854d0e", label: "Application Received" },
  online_test:        { bg: "#eff6ff", color: "#1d4ed8", label: "Online Test"           },
  result:             { bg: "#f0fdf4", color: "#15803d", label: "Result Declared"        },
  interview:          { bg: "#fdf4ff", color: "#7e22ce", label: "Interview Scheduled"    },
  offer_letter:       { bg: "#fff7ed", color: "#c2410c", label: "Offer Letter"           },
  joining:            { bg: "#f0fdfa", color: "#0f766e", label: "Joining Confirmation"   },
};

const badge = (stage) => {
  const b = BADGE[stage] || { bg: "#f1f5f9", color: "#374151", label: stage };
  return `<span style="display:inline-block;padding:4px 14px;border-radius:20px;background:${b.bg};color:${b.color};font-size:12px;font-weight:700;letter-spacing:0.5px;">${b.label}</span>`;
};

const btn = (url, text, color = BRAND.color) =>
  `<a href="${url}" style="display:inline-block;padding:12px 28px;background:${color};color:#fff;border-radius:8px;font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.3px;">${text}</a>`;

const divider = `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;

const greeting = (name) =>
  `<p style="margin:0 0 16px;font-size:16px;color:#374151;">Dear <strong>${name}</strong>,</p>`;

const closing = `
  <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.7;">
    Warm regards,<br/>
    <strong style="color:#0f172a;">${BRAND.name} Recruitment Team</strong>
  </p>`;

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 1 — Application Received
// ════════════════════════════════════════════════════════════════════════════════
export const applicationFilledEmail = ({ name, role, jobType }) =>
  wrap(`
    ${greeting(name)}
    ${badge("application_filled")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#0f172a;font-weight:700;">
      Thank you for applying!
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      We have successfully received your application for the <strong>${role}</strong>
      ${jobType ? `(${jobType})` : ""} position at <strong>${BRAND.name}</strong>.
    </p>
    <div style="background:#f0f9ff;border-left:4px solid #0077a3;border-radius:6px;padding:14px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#0f172a;line-height:1.6;">
        📋 Our team will review your profile and reach out within <strong>5–7 business days</strong>.<br/>
        Keep an eye on your inbox — next steps will be communicated via email.
      </p>
    </div>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 2 — Online Test (with unique test link)
// ════════════════════════════════════════════════════════════════════════════════
export const onlineTestEmail = ({ name, role, testUrl, expiresIn = "48 hours" }) =>
  wrap(`
    ${greeting(name)}
    ${badge("online_test")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#0f172a;font-weight:700;">
      You're invited to take our Online Test
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      Congratulations on advancing to the next stage for <strong>${role}</strong>!
      Please complete the online assessment to continue your application.
    </p>
    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:20px 24px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 6px;font-size:13px;color:#1d4ed8;font-weight:600;">📝 Online Assessment</p>
      <p style="margin:0 0 16px;font-size:13px;color:#475569;line-height:1.6;">
        <strong>20 multiple choice questions</strong> · Domain: <strong>${role}</strong><br/>
        ⏱ Time limit: <strong>30 minutes</strong> · Passing score: <strong>60% (12/20)</strong>
      </p>
      ${btn(testUrl, "Start Your Test →", "#1d4ed8")}
    </div>
    <div style="background:#fef9c3;border-left:4px solid #facc15;border-radius:6px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#854d0e;line-height:1.6;">
        ⚠️ This link expires in <strong>${expiresIn}</strong>. The test is one-attempt only —
        once started it must be completed in one sitting.
      </p>
    </div>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 3 — Result (Pass)
// ════════════════════════════════════════════════════════════════════════════════
export const resultPassEmail = ({ name, role, score }) =>
  wrap(`
    ${greeting(name)}
    ${badge("result")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#15803d;font-weight:700;">
      🎉 Congratulations — You Passed!
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      You have successfully cleared the online assessment for <strong>${role}</strong>.
    </p>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:20px 24px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#15803d;font-weight:600;">Your Score</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#15803d;">${score} / 20</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${Math.round((score/20)*100)}% · <strong>PASS ✓</strong></p>
    </div>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Our team will review your overall profile and contact you shortly about the next steps.
      Please stay available on your registered email and phone.
    </p>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 3 — Result (Fail)
// ════════════════════════════════════════════════════════════════════════════════
export const resultFailEmail = ({ name, role, score }) =>
  wrap(`
    ${greeting(name)}
    ${badge("result")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#be123c;font-weight:700;">
      Assessment Result
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      Thank you for completing the online assessment for <strong>${role}</strong>.
      Unfortunately, you did not meet the minimum qualifying score this time.
    </p>
    <div style="background:#fff1f2;border:1px solid #fecdd3;border-radius:10px;padding:20px 24px;margin:16px 0;text-align:center;">
      <p style="margin:0 0 4px;font-size:13px;color:#be123c;font-weight:600;">Your Score</p>
      <p style="margin:0;font-size:36px;font-weight:700;color:#be123c;">${score} / 20</p>
      <p style="margin:4px 0 0;font-size:13px;color:#64748b;">${Math.round((score/20)*100)}% · <strong>Minimum required: 60%</strong></p>
    </div>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      We appreciate your effort and encourage you to apply again for future openings.
      We wish you all the best in your career journey.
    </p>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 4 — Interview (with Zoom link)
// ════════════════════════════════════════════════════════════════════════════════
export const interviewEmail = ({ name, role, zoomLink, scheduledDate, scheduledTime }) =>
  wrap(`
    ${greeting(name)}
    ${badge("interview")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#7e22ce;font-weight:700;">
      🎙️ Interview Invitation
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      We are pleased to invite you for an interview for the <strong>${role}</strong> position at
      <strong>${BRAND.name}</strong>.
    </p>
    <div style="background:#fdf4ff;border:1px solid #e9d5ff;border-radius:10px;padding:20px 24px;margin:16px 0;">
      <p style="margin:0 0 12px;font-size:13px;color:#7e22ce;font-weight:600;">📅 Interview Details</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;width:120px;">Date</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${scheduledDate || "To be communicated"}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Time</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">${scheduledTime || "To be communicated"}</td>
        </tr>
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#64748b;">Mode</td>
          <td style="padding:6px 0;font-size:13px;color:#0f172a;font-weight:600;">Video Interview (Zoom)</td>
        </tr>
      </table>
      <div style="margin-top:16px;text-align:center;">
        ${btn(zoomLink || "#", "Join Zoom Interview 🎥", "#7e22ce")}
      </div>
      ${zoomLink ? `<p style="margin:12px 0 0;font-size:11px;color:#94a3b8;text-align:center;">Link: ${zoomLink}</p>` : ""}
    </div>
    <div style="background:#f8fafc;border-left:4px solid #c084fc;border-radius:6px;padding:12px 16px;margin:16px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">
        💡 <strong>Tips:</strong> Please join 5 minutes early, ensure stable internet, and have your resume ready.
        Dress professionally and be in a quiet, well-lit environment.
      </p>
    </div>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 5 — Offer Letter
// ════════════════════════════════════════════════════════════════════════════════
export const offerLetterEmail = ({ name, role, jobType }) =>
  wrap(`
    ${greeting(name)}
    ${badge("offer_letter")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#c2410c;font-weight:700;">
      🎉 Congratulations — You've Received an Offer!
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      We are thrilled to extend an offer for the <strong>${role}</strong>
      ${jobType ? `(${jobType})` : ""} position at <strong>${BRAND.name}</strong>.
    </p>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:20px 24px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#c2410c;line-height:1.7;">
        📧 Your formal offer letter will be sent as a separate email attachment shortly.
        Please review it carefully and confirm your acceptance by replying to
        <a href="mailto:${BRAND.hr}" style="color:#c2410c;">${BRAND.hr}</a>
        within <strong>3 business days</strong>.
      </p>
    </div>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      If you have any questions regarding compensation, benefits, or your start date,
      please do not hesitate to reach out to our HR team.
    </p>
    ${divider}
    ${closing}
  `);

// ════════════════════════════════════════════════════════════════════════════════
// STAGE 6 — Joining Confirmation
// ════════════════════════════════════════════════════════════════════════════════
export const joiningEmail = ({ name, role }) =>
  wrap(`
    ${greeting(name)}
    ${badge("joining")}
    <h2 style="margin:16px 0 8px;font-size:20px;color:#0f766e;font-weight:700;">
      🌟 Welcome to ${BRAND.name}!
    </h2>
    <p style="margin:0 0 16px;font-size:14px;color:#475569;line-height:1.7;">
      We are delighted to confirm your joining as <strong>${role}</strong> at <strong>${BRAND.name}</strong>.
      The entire team is excited to have you on board!
    </p>
    <div style="background:#f0fdfa;border:1px solid #99f6e4;border-radius:10px;padding:20px 24px;margin:16px 0;">
      <p style="margin:0;font-size:14px;color:#0f766e;line-height:1.7;">
        📌 Please report to HR on your joining date with the following documents:
      </p>
      <ul style="margin:10px 0 0;padding-left:20px;font-size:13px;color:#374151;line-height:2;">
        <li>Original educational certificates</li>
        <li>Government-issued photo ID (Aadhaar / PAN)</li>
        <li>Previous employment documents (if applicable)</li>
        <li>2 passport-size photographs</li>
        <li>Signed copy of the offer letter</li>
      </ul>
    </div>
    <p style="margin:16px 0;font-size:14px;color:#475569;line-height:1.7;">
      Our HR team will contact you 1–2 days before your joining date with further details
      about your first day, reporting time, and department induction.
    </p>
    ${divider}
    ${closing}
  `);

export const getStageEmail = (stage, data) => {
  switch (stage) {
    case "application_filled": return { subject: `Application Received — ${data.role} | ${BRAND.name}`, html: applicationFilledEmail(data) };
    case "online_test":        return { subject: `Online Test Invitation — ${data.role} | ${BRAND.name}`, html: onlineTestEmail(data) };
    case "result":
      if (data.passed) return { subject: `You Passed! — ${data.role} Assessment | ${BRAND.name}`, html: resultPassEmail(data) };
      else             return { subject: `Assessment Result — ${data.role} | ${BRAND.name}`,       html: resultFailEmail(data) };
    case "interview":          return { subject: `Interview Invitation — ${data.role} | ${BRAND.name}`, html: interviewEmail(data) };
    case "offer_letter":       return { subject: `🎉 Offer Letter — ${data.role} | ${BRAND.name}`,      html: offerLetterEmail(data) };
    case "joining":            return { subject: `Welcome to ${BRAND.name}! — Joining Confirmation`,    html: joiningEmail(data) };
    default:                   return null;
  }
};

// ══════════════════════════════════════════════════════════════════════════════
// ORDER STATUS EMAIL TEMPLATES  ←  ADD THIS BLOCK AT THE BOTTOM OF emailTemplates.js
// ══════════════════════════════════════════════════════════════════════════════

const ORDER_BRAND = {
  name:    "BioBurg",
  color:   "#1976d2",
  website: "http://localhost:5173",        // change to prod URL
  support: "support@bioburgpharma.com",   // change to your support email
};

const orderWrap = (content) => `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#003d57,${ORDER_BRAND.color});padding:28px 36px;">
            <p style="margin:0;font-size:20px;font-weight:700;color:#ffffff;">BioBurg</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">Your Trusted Pharmacy</p>
          </td>
        </tr>
        <tr><td style="padding:36px;">${content}</td></tr>
        <tr>
          <td style="background:#f8fafc;padding:20px 36px;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
              Track your order at <a href="${ORDER_BRAND.website}/userprofile" style="color:${ORDER_BRAND.color};">My Orders</a>.<br/>
              Questions? Contact <a href="mailto:${ORDER_BRAND.support}" style="color:${ORDER_BRAND.color};">${ORDER_BRAND.support}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

const ORDER_STATUS_CONFIG = {
  PLACED: {
    subject: (id) => `✅ Order Placed – #${id} | BioBurg`,
    color: "#1565c0", bg: "#e3f2fd", icon: "✅", title: "Order Placed Successfully!",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> has been placed successfully. We'll start processing it shortly.`,
    note: "You'll receive email updates at every step of your order.",
  },
  PRESCRIPTION_UPLOADED: {
    subject: (id) => `📋 Prescription Received – #${id} | BioBurg`,
    color: "#7b1fa2", bg: "#f3e5f5", icon: "📋", title: "Prescription Received",
    body: (name, id) => `Hi <strong>${name}</strong>, we've received your prescription for order <strong>#${id}</strong>. Our pharmacist team is reviewing it.`,
    note: "Approval typically takes 2–4 hours. You'll be notified once done.",
  },
  UNDER_REVIEW: {
    subject: (id) => `🔍 Prescription Under Review – #${id} | BioBurg`,
    color: "#f57c00", bg: "#fff3e0", icon: "🔍", title: "Under Review",
    body: (name, id) => `Hi <strong>${name}</strong>, your prescription for order <strong>#${id}</strong> is currently being reviewed by our licensed pharmacist.`,
    note: "We'll notify you as soon as the review is complete.",
  },
  APPROVED: {
    subject: (id) => `🎉 Prescription Approved – #${id} | BioBurg`,
    color: "#388e3c", bg: "#e8f5e9", icon: "🎉", title: "Prescription Approved!",
    body: (name, id) => `Hi <strong>${name}</strong>, your prescription for order <strong>#${id}</strong> has been approved. Your order will now be processed.`,
    note: "Your medicines will be dispatched very soon.",
  },
  REJECTED: {
    subject: (id) => `❌ Prescription Rejected – #${id} | BioBurg`,
    color: "#d32f2f", bg: "#ffebee", icon: "❌", title: "Prescription Rejected",
    body: (name, id) => `Hi <strong>${name}</strong>, unfortunately your prescription for order <strong>#${id}</strong> was rejected.`,
    note: "Please upload a valid prescription signed by a licensed doctor. Contact support for help.",
  },
  CONFIRMED: {
    subject: (id) => `✔️ Order Confirmed – #${id} | BioBurg`,
    color: "#0277bd", bg: "#e1f5fe", icon: "✔️", title: "Order Confirmed",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> is confirmed and is being prepared for dispatch.`,
    note: "Estimated delivery: 3–5 business days.",
  },
  PROCESSING: {
    subject: (id) => `⚙️ Order Being Processed – #${id} | BioBurg`,
    color: "#00838f", bg: "#e0f7fa", icon: "⚙️", title: "Processing",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> is being packed and prepared for shipping.`,
    note: "We're making sure everything is perfect before dispatch.",
  },
  SHIPPED: {
    subject: (id) => `🚚 Order Shipped – #${id} | BioBurg`,
    color: "#2e7d32", bg: "#e8f5e9", icon: "🚚", title: "Order Shipped!",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> has been shipped and is on its way!`,
    note: "Track your order in the Orders section of your BioBurg profile.",
  },
  OUT_FOR_DELIVERY: {
    subject: (id) => `📦 Out for Delivery – #${id} | BioBurg`,
    color: "#e65100", bg: "#fff8e1", icon: "📦", title: "Out for Delivery!",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> is out for delivery and will reach you today!`,
    note: "Please be available at your delivery address.",
  },
  DELIVERED: {
    subject: (id) => `🎊 Order Delivered – #${id} | BioBurg`,
    color: "#1b5e20", bg: "#f1f8e9", icon: "🎊", title: "Order Delivered!",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> has been delivered. We hope you're happy with your purchase!`,
    note: "If you have any issues, please contact our support team within 48 hours.",
  },
  CANCELLED: {
    subject: (id) => `🚫 Order Cancelled – #${id} | BioBurg`,
    color: "#b71c1c", bg: "#ffebee", icon: "🚫", title: "Order Cancelled",
    body: (name, id) => `Hi <strong>${name}</strong>, your order <strong>#${id}</strong> has been cancelled.`,
    note: "If you didn't request this cancellation, please contact support immediately.",
  },
};

/**
 * Usage:
 *   import { getOrderStatusEmail } from "../utils/emailTemplates.js";
 *   const { subject, html } = getOrderStatusEmail({ userName, orderId, status });
 */
export const getOrderStatusEmail = ({ userName, orderId, status }) => {
  const cfg = ORDER_STATUS_CONFIG[status?.toUpperCase()];
  if (!cfg) return null;

  const shortId = orderId?.toString().slice(-8).toUpperCase();

  const html = orderWrap(`
    <!-- Status Badge -->
    <div style="margin-bottom:20px;">
      <span style="display:inline-block;padding:5px 16px;border-radius:20px;background:${cfg.bg};color:${cfg.color};font-size:12px;font-weight:700;">
        ${cfg.icon} ${cfg.title}
      </span>
    </div>

    <p style="margin:0 0 16px;font-size:16px;color:#374151;">
      ${cfg.body(userName, shortId)}
    </p>

    <!-- Order ID box -->
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:20px 0;text-align:center;">
      <p style="margin:0;font-size:12px;color:#94a3b8;">Order ID</p>
      <p style="margin:6px 0 0;font-size:22px;font-weight:800;color:#1e293b;letter-spacing:2px;">#${shortId}</p>
    </div>

    <!-- Note -->
    <div style="background:${cfg.bg};border-left:4px solid ${cfg.color};border-radius:0 6px 6px 0;padding:14px 16px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.6;">💡 ${cfg.note}</p>
    </div>

    <p style="margin:24px 0 0;font-size:14px;color:#64748b;line-height:1.7;">
      Warm regards,<br/>
      <strong style="color:#0f172a;">BioBurg Pharmacy Team</strong>
    </p>
  `);

  return { subject: cfg.subject(shortId), html };
};