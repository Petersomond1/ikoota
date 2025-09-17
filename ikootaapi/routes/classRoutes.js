// ikootaapi/routes/classRoutes.js
// USER CLASS ROUTES - TYPE 1 (Traditional) + TYPE 3 (Recorded)
// Following scheduleClassroomSession.md documentation strictly

import express from 'express';
import multer from 'multer';
import { authenticate, requireMembership } from '../middleware/auth.js';
import {
  validateClassId,
  validatePagination,
  validateSorting,
  validateRequestSize
} from '../middleware/classValidation.js';
import * as classController from '../controllers/classController.js';
import * as classAdminController from '../controllers/classAdminController.js';

// Configure multer for video uploads (up to 5GB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024 * 1024, // 5GB limit
    fieldSize: 100 * 1024 * 1024      // 100MB for other fields
  },
  fileFilter: (req, file, cb) => {
    // Accept video, audio files, and common document formats
    if (file.mimetype.startsWith('video/') ||
        file.mimetype.startsWith('audio/') ||
        file.mimetype.startsWith('image/') ||
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'text/plain') {
      cb(null, true);
    } else {
      cb(new Error('File type not supported'), false);
    }
  }
});

const router = express.Router();

// =============================================================================
// GLOBAL MIDDLEWARE
// =============================================================================

// Apply request size validation to all routes
router.use(validateRequestSize);

// Add route logging middleware
router.use((req, res, next) => {
  console.log(`🛣️ Class Route: ${req.method} ${req.path} - User: ${req.user?.id || 'anonymous'}`);
  next();
});

// =============================================================================
// TYPE 1: TRADITIONAL CLASS SESSIONS ROUTES
// Following scheduleClassroomSession.md documentation
// =============================================================================

/**
 * STEP 1: BROWSE AVAILABLE CLASSES
 * GET /api/classes
 * Role: Any User
 */
router.get('/',
  authenticate,
  validatePagination,
  validateSorting,
  classController.getAllClasses
);

/**
 * GET USER'S ENROLLED CLASSES
 * GET /api/classes/my-classes
 * Role: Member
 * NOTE: Must come BEFORE /:classId route to avoid parameter capture
 */
router.get('/my-classes',
  authenticate,
  requireMembership('pre_member'),
  classController.getUserClasses
);

/**
 * GET USER PROGRESS
 * GET /api/classes/my-progress
 * Role: Member
 * NOTE: Must come BEFORE /:classId route to avoid parameter capture
 */
router.get('/my-progress',
  authenticate,
  requireMembership('pre_member'),
  classController.getUserProgress
);

/**
 * STEP 2: GET CLASS DETAILS
 * GET /api/classes/:classId
 * Role: Any User
 * NOTE: Must come AFTER specific routes like /my-classes
 */
router.get('/:classId',
  authenticate,
  validateClassId,
  classController.getClassById
);

/**
 * STEP 2: JOIN A CLASS
 * POST /api/classes/:classId/join
 * Role: Member
 */
router.post('/:classId/join',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.joinClass
);

/**
 * LEAVE A CLASS
 * POST /api/classes/:classId/leave
 * Role: Member
 */
router.post('/:classId/leave',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.leaveClass
);

/**
 * STEP 3: ACCESS CLASS MEMBERS
 * GET /api/classes/:classId/members
 * Role: Class Member
 */
router.get('/:classId/members',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassMembers
);

/**
 * MARK CLASS ATTENDANCE
 * POST /api/classes/:classId/attendance
 * Role: Class Member
 */
router.post('/:classId/attendance',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.markClassAttendance
);

/**
 * SUBMIT CLASS FEEDBACK
 * POST /api/classes/:classId/feedback
 * Role: Class Member
 */
router.post('/:classId/feedback',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.submitClassFeedback
);

/**
 * GET CLASS STATISTICS
 * GET /api/classes/:classId/stats
 * Role: Class Member
 */
router.get('/:classId/stats',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassStats
);

/**
 * GET ATTENDANCE REPORTS (INSTRUCTOR FEATURE)
 * GET /api/classes/:classId/attendance/reports
 * Role: Instructor (Member level required)
 */
router.get('/:classId/attendance/reports',
  authenticate,
  requireMembership('member'),
  validateClassId,
  classController.getAttendanceReports
);

/**
 * GET FEEDBACK SUMMARY (INSTRUCTOR FEATURE)
 * GET /api/classes/:classId/feedback/summary
 * Role: Instructor (Member level required)
 */
router.get('/:classId/feedback/summary',
  authenticate,
  requireMembership('member'),
  validateClassId,
  classController.getFeedbackSummary
);

/**
 * GET CLASS CONTENT
 * GET /api/classes/:classId/content
 * Role: Class Member
 */
router.get('/:classId/content',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassContent
);

// =============================================================================
// TYPE 3: RECORDED TEACHING SESSIONS ROUTES
// Following scheduleClassroomSession.md documentation
// =============================================================================

/**
 * STEP 1: INSTRUCTOR UPLOADS VIDEO/AUDIO CONTENT
 * POST /api/classes/:id/videos
 * Role: Instructor (Member level required)
 * Status: Content uploaded but NOT LIVE (pending approval)
 */
router.post('/:id/videos',
  authenticate,
  requireMembership('member'), // Member level required per documentation
  validateClassId,
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
    { name: 'attachment', maxCount: 10 }
  ]),
  classController.uploadClassVideo
);

/**
 * STEP 6: GET APPROVED CLASS VIDEOS
 * GET /api/classes/:id/videos
 * Role: Students (only shows approved content)
 */
router.get('/:id/videos',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassVideos
);

/**
 * DELETE CLASS VIDEO
 * DELETE /api/classes/:classId/videos/:videoId
 * Role: Instructor/Admin
 */
router.delete('/:classId/videos/:videoId',
  authenticate,
  requireMembership('member'),
  validateClassId,
  classController.deleteClassVideo
);

/**
 * STEP 5: CREATE CLASSROOM SESSION (OPTIONAL)
 * POST /api/classes/:id/classroom/sessions
 * Role: Instructor
 * Note: Optional - students can access videos directly or instructor can create guided sessions
 */
router.post('/:id/classroom/sessions',
  authenticate,
  requireMembership('member'),
  validateClassId,
  classController.createClassroomSession
);

/**
 * GET CLASSROOM SESSION INFO
 * GET /api/classes/:classId/classroom/session
 * Role: Students/Attendees
 */
router.get('/:classId/classroom/session',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassroomSession
);

/**
 * STEP 6: JOIN CLASSROOM SESSION
 * POST /api/classes/:classId/classroom/sessions/:sessionId/join
 * Role: Students/Attendees
 */
router.post('/:classId/classroom/sessions/:sessionId/join',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.joinClassroomSession
);

/**
 * STEP 6: GET CLASSROOM CHAT MESSAGES
 * GET /api/classes/:id/classroom/chat
 * Role: Students/Attendees
 * Features: Get chat messages for live/recorded sessions
 */
router.get('/:id/classroom/chat',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassroomChat
);

/**
 * STEP 6: SEND CLASSROOM CHAT MESSAGE
 * POST /api/classes/:id/classroom/chat
 * Role: Students/Attendees
 * Features: Send chat message during live/recorded sessions
 */
router.post('/:id/classroom/chat',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.sendClassroomChatMessage
);

/**
 * STEP 6: GET CLASSROOM PARTICIPANTS
 * GET /api/classes/:id/classroom/participants
 * Role: Students/Attendees
 * Features: View current participants in classroom session
 */
router.get('/:id/classroom/participants',
  authenticate,
  requireMembership('pre_member'),
  validateClassId,
  classController.getClassroomParticipants
);

// =============================================================================
// TYPE 2: LIVE TEACHING SESSIONS INSTRUCTOR ROUTES
// Following scheduleClassroomSession.md documentation exactly
// =============================================================================

/**
 * STEP 1: INSTRUCTOR SCHEDULES LIVE TEACHING SESSION
 * POST /api/classes/live/schedule
 * Role: Instructor (Member level required)
 * Features: Schedule live session → Admin Approval → Notify → Start Live → Students Join
 */
router.post('/live/schedule',
  authenticate,
  requireMembership('member'), // Member level required per documentation
  classAdminController.scheduleLiveClass
);

/**
 * GET USER'S LIVE CLASS SESSIONS
 * GET /api/classes/live/my-sessions
 * Role: Instructor
 */
router.get('/live/my-sessions',
  authenticate,
  requireMembership('member'),
  classAdminController.getUserLiveClasses
);

/**
 * STEP 4: INSTRUCTOR STARTS LIVE SESSION
 * POST /api/classes/live/start/:sessionId
 * Role: Instructor
 */
router.post('/live/start/:sessionId',
  authenticate,
  requireMembership('member'),
  classAdminController.startLiveClassSession
);

// =============================================================================
// ERROR HANDLING MIDDLEWARE
// =============================================================================

// Handle multer errors
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'File size exceeds 5GB limit',
        timestamp: new Date().toISOString()
      });
    }
  }
  next(error);
});

// General error handler
router.use((error, req, res, next) => {
  console.error('❌ Class Routes Error:', error);
  return res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

export default router;