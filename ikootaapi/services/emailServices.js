import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const sendEmail = async (to, template, status) => {
  // Customize email content based on the template and status
  const emailContent = template === 'approveverifyinfo' 
    ? 'Your request has been approved.' 
    : 'Your request has been declined.';
  
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to,
    subject: 'Survey Update',
    text: emailContent,
  });
};
