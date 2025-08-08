// ikootaapi/routes/classAdminRoutes.js
// ADMIN CLASS MANAGEMENT ROUTES
// Administrative control over class creation and management

import express from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

// Import class admin controllers
import {
  // Class management
  createClass,
  updateClass,
  deleteClass,
  getClassManagement,
  
  // Participant management
  manageClassParticipants,
  addParticipantToClass,
  removeParticipantFromClass,
  getClassEnrollmentStats,
  
  // Content management
  manageClassContent,
  addClassContent,
  updateClassContent,
  deleteClassContent,
  
  // Analytics and reporting
  getClassAnalytics,
  getClassStats,
  exportClassData
} from '../controllers/classAdminControllers.js';

const router = express.Router();

// ===============================================
// APPLY ADMIN AUTHENTICATION TO ALL ROUTES
// ===============================================
router.use(authenticate);
router.use(authorize(['admin', 'super_admin']));

// ===============================================
// CLASS MANAGEMENT
// ===============================================

// GET /admin/classes - Get all classes for management
router.get('/', getClassManagement);

// POST /admin/classes - Create new class
router.post('/', createClass);

// PUT /admin/classes/:id - Update class
router.put('/:id', updateClass);

// DELETE /admin/classes/:id - Delete class
router.delete('/:id', deleteClass);

// ===============================================
// PARTICIPANT MANAGEMENT
// ===============================================

// GET /admin/classes/:id/participants - Get class participants (admin view)
router.get('/:id/participants', manageClassParticipants);

// POST /admin/classes/:id/participants - Add participant to class
router.post('/:id/participants', addParticipantToClass);

// DELETE /admin/classes/:id/participants/:userId - Remove participant
router.delete('/:id/participants/:userId', removeParticipantFromClass);

// GET /admin/classes/:id/enrollment-stats - Get enrollment statistics
router.get('/:id/enrollment-stats', getClassEnrollmentStats);

// ===============================================
// CLASS CONTENT MANAGEMENT
// ===============================================

// GET /admin/classes/:id/content - Get class content (admin view)
router.get('/:id/content', manageClassContent);

// POST /admin/classes/:id/content - Add content to class
router.post('/:id/content', addClassContent);

// PUT /admin/classes/:id/content/:contentId - Update class content
router.put('/:id/content/:contentId', updateClassContent);

// DELETE /admin/classes/:id/content/:contentId - Delete class content
router.delete('/:id/content/:contentId', deleteClassContent);

// ===============================================
// INSTRUCTOR MANAGEMENT
// ===============================================

// GET /admin/classes/:id/instructors - Get class instructors
router.get('/:id/instructors', async (req, res) => {
  res.json({
    success: true,
    message: 'Class instructors endpoint - implement with class admin service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// POST /admin/classes/:id/instructors - Add instructor to class
router.post('/:id/instructors', async (req, res) => {
  res.json({
    success: true,
    message: 'Add instructor endpoint - implement with class admin service',
    classId: req.params.id,
    timestamp: new Date().toISOString()
  });
});

// DELETE /admin/classes/:id/instructors/:instructorId - Remove instructor
router.delete('/:id/instructors/:instructorId', async (req, res) => {
  res.json({
    success: true,
    message: 'Remove instructor endpoint - implement with class admin service',
    classId: req.params.id,
    instructorId: req.params.instructorId,
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// ANALYTICS & REPORTING
// ===============================================

// GET /admin/classes/analytics - Get class analytics
router.get('/analytics', getClassAnalytics);

// GET /admin/classes/stats - Get class statistics
router.get('/stats', getClassStats);

// GET /admin/classes/:id/analytics - Get specific class analytics
router.get('/:id/analytics', (req, res, next) => {
  req.classId = req.params.id;
  getClassAnalytics(req, res, next);
});

// ===============================================
// DATA EXPORT
// ===============================================

// GET /admin/classes/export - Export class data (super admin only)
router.get('/export', authorize(['super_admin']), exportClassData);

// GET /admin/classes/export/participants - Export participant data
router.get('/export/participants', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'participants';
  exportClassData(req, res, next);
});

// GET /admin/classes/export/analytics - Export class analytics
router.get('/export/analytics', authorize(['super_admin']), (req, res, next) => {
  req.exportType = 'analytics';
  exportClassData(req, res, next);
});

// ===============================================
// CLASS CONFIGURATION
// ===============================================

// GET /admin/classes/config - Get class system configuration
router.get('/config', async (req, res) => {
  res.json({
    success: true,
    message: 'Class configuration endpoint - implement with class admin service',
    timestamp: new Date().toISOString()
  });
});

// PUT /admin/classes/config - Update class system configuration
router.put('/config', async (req, res) => {
  res.json({
    success: true,
    message: 'Update class configuration endpoint - implement with class admin service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// BULK OPERATIONS
// ===============================================

// POST /admin/classes/bulk-create - Bulk create classes
router.post('/bulk-create', async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk create classes endpoint - implement with class admin service',
    timestamp: new Date().toISOString()
  });
});

// PUT /admin/classes/bulk-update - Bulk update classes
router.put('/bulk-update', async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk update classes endpoint - implement with class admin service',
    timestamp: new Date().toISOString()
  });
});

// DELETE /admin/classes/bulk-delete - Bulk delete classes
router.delete('/bulk-delete', async (req, res) => {
  res.json({
    success: true,
    message: 'Bulk delete classes endpoint - implement with class admin service',
    timestamp: new Date().toISOString()
  });
});

// ===============================================
// TESTING ENDPOINTS
// ===============================================

// Class admin test
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Admin class routes are working!',
    timestamp: new Date().toISOString(),
    user: {
      id: req.user?.id,
      username: req.user?.username,
      role: req.user?.role
    },
    availableOperations: [
      'class creation',
      'participant management',
      'content management',
      'analytics'
    ],
    endpoint: '/api/admin/classes/test'
  });
});

// ===============================================
// ERROR HANDLING
// ===============================================

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Admin class route not found',
    path: req.path,
    method: req.method,
    availableRoutes: {
      classManagement: [
        'GET / - Get all classes for management',
        'POST / - Create new class',
        'PUT /:id - Update class',
        'DELETE /:id - Delete class'
      ],
      participantManagement: [
        'GET /:id/participants - Get class participants',
        'POST /:id/participants - Add participant',
        'DELETE /:id/participants/:userId - Remove participant',
        'GET /:id/enrollment-stats - Enrollment statistics'
      ],
      contentManagement: [
        'GET /:id/content - Get class content (admin view)',
        'POST /:id/content - Add content to class',
        'PUT /:id/content/:contentId - Update class content',
        'DELETE /:id/content/:contentId - Delete class content'
      ],
      instructorManagement: [
        'GET /:id/instructors - Get class instructors',
        'POST /:id/instructors - Add instructor',
        'DELETE /:id/instructors/:instructorId - Remove instructor'
      ],
      analytics: [
        'GET /analytics - Class analytics',
        'GET /stats - Class statistics',
        'GET /:id/analytics - Specific class analytics'
      ],
      dataExport: [
        'GET /export - Export class data (super admin)',
        'GET /export/participants - Export participants (super admin)',
        'GET /export/analytics - Export analytics (super admin)'
      ],
      configuration: [
        'GET /config - Get class configuration',
        'PUT /config - Update class configuration'
      ],
      bulkOperations: [
        'POST /bulk-create - Bulk create classes',
        'PUT /bulk-update - Bulk update classes',
        'DELETE /bulk-delete - Bulk delete classes'
      ],
      testing: [
        'GET /test - Admin class routes test'
      ]
    },
    adminNote: 'All routes require admin or super_admin role',
    timestamp: new Date().toISOString()
  });
});

// Error handler
router.use((error, req, res, next) => {
  console.error('❌ Admin class route error:', {
    error: error.message,
    path: req.path,
    method: req.method,
    user: req.user?.username || 'unauthenticated',
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
  
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Admin class operation error',
    path: req.path,
    method: req.method,
    userRole: req.user?.role,
    timestamp: new Date().toISOString()
  });
});

if (process.env.NODE_ENV === 'development') {
  console.log('🔐 Admin class routes loaded: creation, participant management, content, analytics');
}

export default router;