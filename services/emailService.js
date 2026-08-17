/**
 * services/emailService.js
 *
 * Single, reusable email-sending service for the entire backend.
 * No other file should contain email-sending code.
 *
 * Uses nodemailer with SMTP credentials from environment variables.
 * If SMTP is not configured, falls back to console-logging the email
 * content clearly labeled "[EMAIL STUB]" so development can proceed.
 *
 * Every public function wraps sending in try/catch — it must never
 * throw back to a caller or block any API response.
 */

const nodemailer = require("nodemailer");

// ─── Transporter setup ────────────────────────────────────────────────────

let transporter = null;

/**
 * Lazily create the SMTP transporter on first use.
 * Returns null if SMTP env vars are not configured.
 */
function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If any required SMTP var is missing, we can't send real emails
  if (!host || !port || !user || !pass) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for 587/other
    auth: { user, pass },
  });

  return transporter;
}

// ─── Internal send helper ─────────────────────────────────────────────────

/**
 * Low-level send. Wraps in try/catch so it never throws.
 * Returns true if sent, false otherwise.
 */
async function safeSend({ to, subject, text, html }) {
  const from = process.env.ALERT_EMAIL_FROM || "noreply@pss04.local";

  const transport = getTransporter();

  if (!transport) {
    // SMTP not configured — log to console as a clear stub
    console.log("──────────────── [EMAIL STUB] ────────────────");
    console.log(`To:      ${to}`);
    console.log(`From:    ${from}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${text}`);
    console.log("──────────────── [/EMAIL STUB] ───────────────");
    return false;
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
    console.log(`[EmailService] Sent email to ${to}: "${subject}"`);
    return true;
  } catch (err) {
    // Log the failure but NEVER throw — callers must not be blocked
    console.error(`[EmailService] Failed to send email to ${to}:`, err.message);
    return false;
  }
}

// ─── Public API ───────────────────────────────────────────────────────────

/**
 * Send an auto-refill alert email when the system creates an automatic
 * reorder for a hospital/drug pair.
 *
 * Signature designed to match what the auto-refill job (Task D) will call.
 *
 * @param {Object} params
 * @param {string} params.drug         — drug name
 * @param {string} params.hospital     — hospital name
 * @param {string} params.severity     — "red" | "yellow"
 * @param {number|null} params.daysOfStockRemaining — days left at burn rate
 * @param {string} params.orderId      — the created order's _id
 * @param {string} [params.recipientEmail] — override recipient (for testing)
 */
async function sendAutoRefillEmail({ drug, hospital, severity, daysOfStockRemaining, orderId, recipientEmail }) {
  try {
    const to = recipientEmail || process.env.ALERT_EMAIL_FROM || "admin@pss04.local";
    const subject = `[PSS04 Auto-Refill] ${severity.toUpperCase()} alert — ${drug} at ${hospital}`;

    const daysText = daysOfStockRemaining != null
      ? `${daysOfStockRemaining.toFixed(1)} days of stock remaining`
      : "stock level unknown";

    const text = [
      `Auto-Refill Order Created`,
      `─────────────────────────`,
      `Hospital:   ${hospital}`,
      `Drug:       ${drug}`,
      `Severity:   ${severity.toUpperCase()}`,
      `Stock left: ${daysText}`,
      `Order ID:   ${orderId}`,
      ``,
      `An automatic reorder has been placed. Please review in the admin dashboard.`,
    ].join("\n");

    await safeSend({ to, subject, text });
  } catch (err) {
    // Final safety net — must never throw
    console.error("[EmailService] sendAutoRefillEmail error:", err.message);
  }
}

/**
 * Generic alert email — can be called for any severity alert.
 * Useful for manually triggering emails from insights/alerts results.
 *
 * @param {Object} params
 * @param {string} params.drug
 * @param {string} params.hospital
 * @param {string} params.severity
 * @param {number|null} params.daysOfStockRemaining
 * @param {string[]} [params.reasons]
 */
async function sendAlertEmail({ drug, hospital, severity, daysOfStockRemaining, reasons }) {
  try {
    const to = process.env.ALERT_EMAIL_FROM || "admin@pss04.local";
    const subject = `[PSS04 Alert] ${severity.toUpperCase()} — ${drug} at ${hospital}`;

    const daysText = daysOfStockRemaining != null
      ? `${daysOfStockRemaining.toFixed(1)} days remaining`
      : "stock level unknown";

    const text = [
      `Stock Alert — ${severity.toUpperCase()}`,
      `─────────────────────────`,
      `Hospital:   ${hospital}`,
      `Drug:       ${drug}`,
      `Stock left: ${daysText}`,
      ``,
      ...(reasons || []).map((r) => `• ${r}`),
    ].join("\n");

    await safeSend({ to, subject, text });
  } catch (err) {
    console.error("[EmailService] sendAlertEmail error:", err.message);
  }
}

module.exports = {
  sendAutoRefillEmail,
  sendAlertEmail,
};
