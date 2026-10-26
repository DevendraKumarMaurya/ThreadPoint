import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  }

  return transporter;
}

/**
 * Dispatch an OTP verification code via SMTP email, falling back to clean terminal dev logging.
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.otp - 6-digit verification code
 * @param {string} [options.purpose='email_verification'] - 'email_verification' | 'password_reset' | 'login'
 */
export async function sendOtpEmail({ to, otp, purpose = 'email_verification' }) {
  const mailTransporter = getTransporter();

  const isPasswordReset = purpose === 'password_reset';
  const subject = isPasswordReset
    ? 'ThreadPoint - Password Reset Code'
    : 'ThreadPoint - Verify Your Email Address';

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0F172A; color: #F8FAFC; margin: 0; padding: 24px; }
        .card { max-width: 500px; margin: 0 auto; background: #1E293B; border: 1px solid #334155; border-radius: 16px; padding: 32px; }
        .logo { font-size: 20px; font-weight: 800; color: #6366F1; letter-spacing: -0.5px; margin-bottom: 20px; }
        .title { font-size: 22px; font-weight: 700; color: #FFFFFF; margin-bottom: 12px; }
        .desc { font-size: 14px; color: #94A3B8; line-height: 1.5; margin-bottom: 24px; }
        .otp-box { background: #0F172A; border: 2px dashed #6366F1; border-radius: 12px; padding: 18px; text-align: center; margin-bottom: 24px; }
        .otp-code { font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38BDF8; }
        .footer { font-size: 12px; color: #64748B; border-top: 1px solid #334155; padding-top: 16px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">ThreadPoint</div>
        <div class="title">${isPasswordReset ? 'Reset Your Password' : 'Verify Your Email Address'}</div>
        <div class="desc">
          ${isPasswordReset
            ? 'We received a request to reset your password. Use the 6-digit code below to proceed.'
            : 'Welcome to ThreadPoint! Use the 6-digit code below to verify your email address and activate full contributor privileges.'}
        </div>
        <div class="otp-box">
          <div class="otp-code">${otp}</div>
        </div>
        <div class="desc" style="font-size: 12px; margin-bottom: 0;">
          This code expires in <strong>10 minutes</strong>. If you did not make this request, you can safely ignore this email.
        </div>
        <div class="footer">
          ThreadPoint Engineering Knowledge Exchange &copy; ${new Date().getFullYear()}
        </div>
      </div>
    </body>
    </html>
  `;

  if (mailTransporter) {
    try {
      const from = process.env.SMTP_FROM || `"ThreadPoint Security" <${process.env.SMTP_USER}>`;
      await mailTransporter.sendMail({
        from,
        to,
        subject,
        html: htmlContent,
      });
      console.log(`[MAIL] Sent OTP code via SMTP to ${to}`);
      return { sent: true, method: 'smtp' };
    } catch (err) {
      console.error('[MAIL] Failed to send via SMTP, falling back to console log:', err.message);
    }
  }

  // Development console fallback
  console.log(`\n======================================================`);
  console.log(`[DEV OTP] Target: ${to}`);
  console.log(`[DEV OTP] Purpose: ${purpose}`);
  console.log(`[DEV OTP] Code: >>> ${otp} <<< (Expires in 10 mins)`);
  console.log(`======================================================\n`);

  return { sent: true, method: 'console' };
}
