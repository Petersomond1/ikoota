import express from 'express';
import { submitSurvey } from '../controllers/surveyControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';


const router = express.Router();

// // Submit application survey form
// router.post('/submit_applicationsurvey', authenticate, submitSurvey);

router.post('/submit_applicationsurvey', authenticate, submitSurvey);
  

export default router;