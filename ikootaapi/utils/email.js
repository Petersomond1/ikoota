import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

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

export const sendEmail = async (to, subject, text) => {
  console.log(to, subject, text)
  console.log(process.env.MAIL_USER)
  try {
    const info = await transporter.sendMail({
      from: process.env.MAIL_USER,
      to,
      subject,
      text,
    });
    console.log('Email sent:', info.response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed');
  }
};