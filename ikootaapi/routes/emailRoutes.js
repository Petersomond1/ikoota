import express from 'express';
import { sendEmailHandler } from '../controllers/emailControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/send', authenticate, sendEmailHandler);

export default router;