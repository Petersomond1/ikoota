import express from 'express';
import {
  fetchTeachings,
  addTeaching,
  editTeaching,
  removeTeaching,
} from '../controllers/teachingsControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Fetch all teachings
router.get('/', authenticate, fetchTeachings);

// Add a new teaching
router.post('/', authenticate, addTeaching);

// Update a teaching by ID
router.put('/:id', authenticate, editTeaching);

// Delete a teaching by ID
router.delete('/:id', authenticate, removeTeaching);

export default router;






// import express from 'express';
// import { submitTeachings } from '../controllers/teachingsControllers.js';
// import { authenticate } from '../middlewares/auth.middleware.js';


// const router = express.Router();

// // // Submit application survey form
// // router.post('/submit_applicationsurvey', authenticate, submitSurvey);

// router.post('/teachings', authenticate, submitTeachings);
  

// export default router;