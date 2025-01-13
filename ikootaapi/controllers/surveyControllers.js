import { submitSurveyService, fetchSurveyQuestions, modifySurveyQuestions, fetchSurveyLogs, approveUserSurvey } from '../services/surveyServices.js';
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

export const getSurveyQuestions = async (req, res) => {
  try {
    const questions = await fetchSurveyQuestions();
    res.status(200).json(questions);
    console.log('questions at bked authcontrols', questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSurveyQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    await modifySurveyQuestions(questions);
    res.status(200).json({ message: 'Survey questions updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getSurveyLogs = async (req, res) => {
  try {
    const logs = await fetchSurveyLogs();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const approveSurvey = async (req, res) => {
  try {
    const { surveyId, userId, status } = req.body;
    await approveUserSurvey(surveyId, userId, status);
    res.status(200).json({ message: 'Survey status updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};