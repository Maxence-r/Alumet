import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Create transporter (configure based on your email provider)
const createTransporter = () => {
  if (process.env.NODE_ENV === 'production') {
    // Production email configuration
    return nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Development: Use Ethereal Email for testing
    return nodemailer.createTransporter({
      host: 'smtp.ethereal.email',
      port: 587,
      auth: {
        user: 'ethereal.user@ethereal.email',
        pass: 'ethereal.pass',
      },
    });
  }
};

// Email templates
const templates = {
  welcome: (data: any) => ({
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Welcome to Alumet Education!</h1>
        <p>Hello ${data.name},</p>
        <p>Welcome to Alumet Education! Your account has been created successfully.</p>
        <p><strong>Username:</strong> ${data.username}</p>
        <p>You can now start creating workspaces, studying with flashcards, and collaborating with others.</p>
        <p>Best regards,<br>The Alumet Team</p>
      </div>
    `,
    text: `Welcome to Alumet Education! Hello ${data.name}, your account has been created successfully. Username: ${data.username}. You can now start using the platform.`
  }),

  passwordReset: (data: any) => ({
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #3b82f6;">Password Reset Request</h1>
        <p>Hello ${data.name},</p>
        <p>You requested a password reset for your Alumet Education account.</p>
        <p>Click the link below to reset your password:</p>
        <p><a href="${data.resetUrl}" style="background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
        <p>This link will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Best regards,<br>The Alumet Team</p>
      </div>
    `,
    text: `Hello ${data.name}, you requested a password reset. Visit: ${data.resetUrl} (expires in 10 minutes)`
  }),
};

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    const transporter = createTransporter();
    const template = templates[options.template as keyof typeof templates];
    
    if (!template) {
      throw new Error(`Email template '${options.template}' not found`);
    }

    const { html, text } = template(options.data);

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@alumet.io',
      to: options.to,
      subject: options.subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Email sent:', result.messageId);
      console.log('Preview URL:', nodemailer.getTestMessageUrl(result));
    }
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
};