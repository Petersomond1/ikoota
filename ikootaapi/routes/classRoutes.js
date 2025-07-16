// ikootaapi/routes/classRoutes.js
import express from 'express';
import { getClasses, postClass, putClass, assignUserToClass, getClassContent } from '../controllers/classControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';


const router = express.Router();

// Fetch all classes
router.get('/', getClasses);

// Create a new class
router.post('/', postClass);

// Update an existing class
router.put('/:id', putClass);

// Assign user to class
router.post('/assign', authenticate, assignUserToClass);

// Get content for a specific class
router.get('/:classId/content', authenticate, getClassContent);

export default router;