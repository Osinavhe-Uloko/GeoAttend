import sgMail from '@sendgrid/mail';

// Only set the API key if it exists in the environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export const sendPasswordResetEmail = async (toEmail: string, resetLink: string) => {
  if (!process.env.SENDGRID_API_KEY || !process.env.SENDGRID_FROM_EMAIL) {
    console.warn('[Email Service] Ensure SENDGRID_API_KEY and SENDGRID_FROM_EMAIL are set. Logging reset link instead.');
    console.log(`[Mock Email] Password reset link for ${toEmail}: ${resetLink}`);
    return;
  }

  const msg = {
    to: toEmail,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'GeoAttend - Password Reset Request',
    text: `You requested a password reset. Please click the following link to reset your password: ${resetLink}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4f46e5;">GeoAttend Password Reset</h2>
        <p>You recently requested to reset your password for your GeoAttend account.</p>
        <p style="margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p>If you did not request a password reset, please ignore this email or reply to let us know. This password reset is only valid for the next 1 hour.</p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 40px;">
          Thanks,<br>
          The GeoAttend Team
        </p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`[Email Service] Password reset email sent to ${toEmail}`);
  } catch (error) {
    console.error('[Email Service] Error sending email', error);
    // If it's a SendGrid error, log more details
    if ((error as any).response) {
      console.error((error as any).response.body);
    }
    throw new Error('Failed to send email');
  }
};
