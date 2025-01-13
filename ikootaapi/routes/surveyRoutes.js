import express from 'express';
import { submitSurvey, getSurveyQuestions, updateSurveyQuestions, getSurveyLogs, approveSurvey } from '../controllers/surveyControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Submit application survey form
router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// Get survey questions
router.get('/questions', authenticate, getSurveyQuestions);

// Update survey questions
router.put('/questions', authenticate, updateSurveyQuestions);

// Get survey logs
router.get('/logs', authenticate, getSurveyLogs);

// Approve survey
router.put('/approve', authenticate, approveSurvey);

export default router;