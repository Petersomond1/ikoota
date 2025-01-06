import { submitSurveyService } from '../services/surveyServices.js';
import { generateToken } from '../utils/jwt.js';

export const submitSurvey = async (req, res, next) => {
  try {
    const email = req.user.email;
    await submitSurveyService(req.body, email);
    const userData = { userId: req.user.userId, email, is_member: 'pending' };
    const token = generateToken(userData);
    res.cookie('access_token', token, { httpOnly: true });
    res.status(200).json({ redirect: "/thankyou" });
  } catch (error) {
    console.error('Error in submitSurvey controller:', error);
    next(error);
  }
};