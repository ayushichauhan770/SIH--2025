import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'at917920@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

// Create reusable transporter
const transporter = nodemailer.createTransport(emailConfig);

// Email templates
const generateOTPEmailHTML = (otp: string, purpose: string) => {
  const purposeText = purpose === 'login' ? 'Login' : purpose === 'register' ? 'Registration' : 'Password Reset';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #2563eb 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 8px; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fef2f2; border-left: 4px solid #ef4444; padding: 12px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Digital Governance</h1>
          <p>Your ${purposeText} OTP</p>
        </div>
        <div class="content">
          <h2>Hello!</h2>
          <p>You requested a one-time password for ${purposeText.toLowerCase()}. Use the code below to proceed:</p>
          
          <div class="otp-box">
            <div class="otp-code">${otp}</div>
            <p style="margin-top: 10px; color: #666;">Valid for 10 minutes</p>
          </div>
          
          <div class="warning">
            <strong>⚠️ Security Notice:</strong> Never share this OTP with anyone. Our team will never ask for your OTP.
          </div>
          
          <p>If you didn't request this code, please ignore this email or contact support if you have concerns.</p>
        </div>
        <div class="footer">
          <p>© ${new Date().getFullYear()} Digital Governance Platform. All rights reserved.</p>
          <p>This is an automated message, please do not reply.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

/**
 * Send OTP via email
 */
export async function sendEmailOTP(email: string, otp: string, purpose: string): Promise<void> {
  try {
    const mailOptions = {
      from: `"Digital Governance" <${emailConfig.auth.user}>`,
      to: email,
      subject: `Your OTP for ${purpose === 'login' ? 'Login' : purpose === 'register' ? 'Registration' : 'Password Reset'}`,
      html: generateOTPEmailHTML(otp, purpose),
      text: `Your OTP is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email OTP sent successfully to ${email}`);
  } catch (error: any) {
    console.error('Failed to send email OTP:', error);
    if (error.code === 'EAUTH') {
      console.error('Email authentication failed. Please check your SMTP credentials in the .env file.');
      console.error('Ensure you are using an App Password if using Gmail.');
    }
    throw new Error('Failed to send email. Please try again.');
  }
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email server verification failed:', error);
    return false;
  }
}
