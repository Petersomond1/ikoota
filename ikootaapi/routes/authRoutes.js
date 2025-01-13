import express from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  verifyUser,
  getAuthenticatedUser,
  requestPasswordReset,
  resetPassword,
  verifyPasswordReset,
} from '../controllers/authControllers.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Authentication Routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/logout', logoutUser);

// Password Reset Routes
router.post('/passwordreset/request', requestPasswordReset);
router.post('/passwordreset/reset', resetPassword);
router.post('/passwordreset/verify', verifyPasswordReset);

// User Verification
router.get('/verify/:token', verifyUser);

// Authenticated User
router.get('/', authenticate, getAuthenticatedUser);

export default router;





// import express from 'express';
// import { registerUser, loginUser, logoutUser, verifyUser, getAuthenticatedUser,
//      requestPasswordReset, resetPassword, verifyPasswordReset,
//      resetPassword, verifyCode  } from '../controllers/authControllers.js';
// import { authenticate } from '../middlewares/auth.middleware.js';

// const router = express.Router();

// // User registration
// router.post('/register', registerUser);

// // User login
// router.post('/login', loginUser);

// // User logout
// router.get('/logout', logoutUser);

// // User password Reset

// router.post('/passwordreset/request', requestPasswordReset);
// router.post('/passwordreset/reset', resetPassword);
// router.post('/passwordreset/verify', verifyPasswordReset);
// router.post('/passwordreset', resetPassword);
// router.post('/verify-reset-code', verifyCode);


// // User verification
// router.get('/verify/:token', verifyUser);

// // Get authenticated user
// router.get("/", authenticate, getAuthenticatedUser);



// export default router;