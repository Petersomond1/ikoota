import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail', // You can change the email service provider
  auth: {
    user: process.env.MAIL_USER, // Sender's email address
    pass: process.env.MAIL_PASS  // Sender's email password or app-specific password
  },
  tls: {
    rejectUnauthorized: false, // Allow self-signed certificates
  }
});

const sendEmail = async (to, subject, text) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to:process.env.MAIL_USER,
      subject,
      text,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed', 500, error);
  }
};

export { sendEmail };