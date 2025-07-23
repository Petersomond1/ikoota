//ikootaapi/routes/surveyRoutes.js - UPDATED WITH QUESTION LABELS
import express from 'express';
import { 
  submitSurvey, 
  getSurveyQuestions, 
  updateSurveyQuestions, 
  getSurveyLogs, 
  approveSurvey,
  getQuestionLabels,           // ✅ NEW
  updateSurveyQuestionLabels   // ✅ NEW
} from '../controllers/surveyControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Submit application survey form
router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// ✅ NEW: Question labels endpoints for dynamic survey management
router.get('/question-labels', authenticate, getQuestionLabels);
router.put('/question-labels', authenticate, updateSurveyQuestionLabels);

// Legacy endpoints (backward compatibility)
router.get('/questions', authenticate, getSurveyQuestions);
router.put('/questions', authenticate, updateSurveyQuestions);

// Survey logs and approval
router.get('/logs', authenticate, getSurveyLogs);
router.put('/approve', authenticate, approveSurvey);

export default router;