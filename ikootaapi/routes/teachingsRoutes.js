import express from 'express';
import {uploadMiddleware, uploadToS3 } from '../middlewares/upload.middleware.js';
import {
  // createTeaching,
  fetchAllTeachings,
  addTeaching,
  editTeaching,
  removeTeaching,
} from '../controllers/teachingsControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();




// Fetch all teachings
router.get('/', authenticate, fetchAllTeachings);

// Add a new teaching
router.post("/", authenticate, uploadMiddleware.array("files", 3), uploadToS3, addTeaching);

// Update a teaching by ID
router.put('/:id', authenticate, editTeaching);

// Delete a teaching by ID
router.delete('/:id', authenticate, removeTeaching);

export default router;

