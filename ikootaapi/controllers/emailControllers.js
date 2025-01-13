import { sendEmail } from '../services/emailServices.js';

export const sendEmailHandler = async (req, res) => {
  try {
    const { email, template, status } = req.body;
    await sendEmail(email, template, status);
    res.status(200).json({ message: 'Email sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
