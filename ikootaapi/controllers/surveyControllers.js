// ikootaapi/controllers/surveyControllers.js - UPDATED WITH QUESTION LABELS
import { 
  submitSurveyService, 
  fetchSurveyQuestions, 
  modifySurveyQuestions, 
  fetchSurveyLogs, 
  approveUserSurvey 
} from '../services/surveyServices.js';
import { 
  fetchQuestionLabels, 
  updateQuestionLabels 
} from '../services/questionLabelsService.js';
import { generateToken } from '../utils/jwt.js';

export const submitSurvey = async (req, res, next) => {
  try {
    const email = req.user.email;
    await submitSurveyService(req.body, email);
    const userData = { userId: req.user.userId, email, is_member: 'pending' };
    const token = generateToken(userData);
    res.cookie('access_token', token, { httpOnly: true });
    res.status(200).json({ redirect: "/thankyou" });
  } catch (error) {
    console.error('Error in submitSurvey controller:', error);
    next(error);
  }
};

// ✅ NEW: Get question labels for dynamic survey form
export const getQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 getQuestionLabels endpoint called');
    const labels = await fetchQuestionLabels();
    console.log('✅ Question labels fetched:', Object.keys(labels).length, 'labels');
    
    res.status(200).json({
      success: true,
      data: labels,
      count: Object.keys(labels).length,
      message: 'Question labels fetched successfully'
    });
  } catch (error) {
    console.error('❌ Error in getQuestionLabels:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to fetch question labels'
    });
  }
};

// ✅ NEW: Update question labels from AuthControls
export const updateSurveyQuestionLabels = async (req, res) => {
  try {
    console.log('🔍 updateSurveyQuestionLabels endpoint called');
    console.log('🔍 User:', req.user?.id, req.user?.role);
    
    // Check admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to update question labels');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required to update question labels'
      });
    }
    
    const { labels } = req.body;
    
    // Validate input
    if (!labels || typeof labels !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Labels object is required',
        message: 'Please provide a labels object in the request body'
      });
    }
    
    const labelCount = Object.keys(labels).length;
    if (labelCount === 0) {
      return res.status(400).json({
        success: false,
        error: 'No labels provided',
        message: 'Please provide at least one question label'
      });
    }
    
    console.log(`🔍 Updating ${labelCount} question labels`);
    
    await updateQuestionLabels(labels);
    
    console.log('✅ Question labels updated successfully');
    
    res.status(200).json({ 
      success: true,
      message: 'Question labels updated successfully',
      labelsUpdated: labelCount
    });
    
  } catch (error) {
    console.error('❌ Error in updateSurveyQuestionLabels controller:', error);
    
    res.status(error.statusCode || 500).json({ 
      success: false,
      error: error.message || 'Failed to update question labels'
    });
  }
};

// Keep existing functions for backward compatibility
export const getSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 getSurveyQuestions endpoint called (legacy)');
    
    // Return question labels in old format for compatibility
    const labels = await fetchQuestionLabels();
    const questions = Object.values(labels);
    
    res.status(200).json(questions);
    
  } catch (error) {
    console.error('❌ Error in getSurveyQuestions:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to fetch survey questions'
    });
  }
};

export const updateSurveyQuestions = async (req, res) => {
  try {
    console.log('🔍 updateSurveyQuestions endpoint called (legacy)');
    
    // This now updates question labels instead
    return updateSurveyQuestionLabels(req, res);
    
  } catch (error) {
    console.error('❌ Error in updateSurveyQuestions:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Failed to update survey questions'
    });
  }
};

export const getSurveyLogs = async (req, res) => {
  try {
    console.log('🔍 getSurveyLogs endpoint called');
    console.log('🔍 User:', req.user?.id, req.user?.role);
        
    // Check if user has admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to survey logs');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required'
      });
    }
        
    console.log('🔍 Fetching survey logs...');
    const logs = await fetchSurveyLogs();
        
    console.log(`✅ Survey logs fetched successfully: ${logs.length} records`);
        
    res.status(200).json({
      success: true,
      data: logs,
      count: logs.length,
      message: 'Survey logs fetched successfully'
    });
      
  } catch (error) {
    console.error('❌ Error in getSurveyLogs:', error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || 'Failed to fetch survey logs'
    });
  }
};

export const approveSurvey = async (req, res) => {
  try {
    console.log('🔍 approveSurvey endpoint called');
    console.log('🔍 Request body:', req.body);
    console.log('🔍 User:', req.user?.id, req.user?.role);
    
    // Check if user has admin privileges
    if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
      console.log('❌ Unauthorized access attempt to approve survey');
      return res.status(403).json({
        success: false,
        error: 'Admin privileges required to approve surveys'
      });
    }
    
    const { surveyId, userId, status } = req.body;
    
    // Validate input
    if (!surveyId || !userId || !status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'surveyId, userId, and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['approved', 'declined', 'granted', 'rejected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status',
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const result = await approveUserSurvey(surveyId, userId, status);
    
    console.log('✅ Survey approval status updated successfully');
    
    res.status(200).json({ 
      success: true,
      message: `Survey ${status} successfully`
    });
    
  } catch (error) {
    console.error('❌ Error in approveSurvey controller:', error);
    res.status(error.statusCode || 500).json({ 
      success: false,
      error: error.message || 'Failed to update survey status'
    });
  }
};




// // ikootaapi/controllers/surveyControllers.js - BACKWARD COMPATIBLE VERSION
// import { 
//   submitSurveyService, 
//   fetchSurveyQuestions, 
//   modifySurveyQuestions, 
//   fetchSurveyLogs, 
//   approveUserSurvey 
// } from '../services/surveyServices.js';
// import { generateToken } from '../utils/jwt.js';

// export const submitSurvey = async (req, res, next) => {
//   try {
//     const email = req.user.email;
//     await submitSurveyService(req.body, email);
//     const userData = { userId: req.user.userId, email, is_member: 'pending' };
//     const token = generateToken(userData);
//     res.cookie('access_token', token, { httpOnly: true });
//     res.status(200).json({ redirect: "/thankyou" });
//   } catch (error) {
//     console.error('Error in submitSurvey controller:', error);
//     next(error);
//   }
// };

// // export const getSurveyQuestions = async (req, res) => {
// //   try {
// //     console.log('🔍 getSurveyQuestions endpoint called');
// //     const questions = await fetchSurveyQuestions();
// //     console.log('✅ Questions fetched:', questions);
    
// //     // ✅ BACKWARD COMPATIBLE: Return both formats for compatibility
// //     // Frontend will handle both old and new format
// //     res.status(200).json({
// //       success: true,
// //       data: questions,
// //       count: questions.length,
// //       message: 'Survey questions fetched successfully',
// //       // ✅ Also include direct array for backward compatibility
// //       questions: questions
// //     });
// //   } catch (error) {
// //     console.error('❌ Error in getSurveyQuestions:', error);
// //     res.status(500).json({ 
// //       success: false,
// //       error: error.message || 'Failed to fetch survey questions',
// //       questions: [] // Fallback empty array
// //     });
// //   }
// // };


// export const getSurveyQuestions = async (req, res) => {
//   try {
//     console.log('🔍 getSurveyQuestions endpoint called');
//     const questions = await fetchSurveyQuestions();
//     console.log('✅ Questions fetched:', questions);
    
//     // ✅ SIMPLE BACKWARD COMPATIBLE: Return questions directly like before
//     // but also include new format for future compatibility
//     res.status(200).json(questions);
    
//   } catch (error) {
//     console.error('❌ Error in getSurveyQuestions:', error);
//     res.status(500).json({ 
//       error: error.message || 'Failed to fetch survey questions'
//     });
//   }
// };

// export const updateSurveyQuestions = async (req, res) => {
//   try {
//     console.log('🔍 updateSurveyQuestions endpoint called');
//     console.log('🔍 Request body:', req.body);
//     console.log('🔍 User:', req.user?.id, req.user?.role);
    
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to update questions');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required to update survey questions'
//       });
//     }
    
//     const { questions } = req.body;
    
//     // ✅ Validate input
//     if (!questions) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions array is required',
//         message: 'Please provide a questions array in the request body'
//       });
//     }
    
//     if (!Array.isArray(questions)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions must be an array',
//         message: 'The questions field must be an array of strings'
//       });
//     }
    
//     if (questions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions array cannot be empty',
//         message: 'Please provide at least one question'
//       });
//     }
    
//     // ✅ Filter out empty questions
//     const validQuestions = questions.filter(q => q && typeof q === 'string' && q.trim().length > 0);
    
//     if (validQuestions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No valid questions provided',
//         message: 'All questions appear to be empty. Please provide valid question text.'
//       });
//     }
    
//     console.log(`🔍 Updating ${validQuestions.length} valid questions`);
    
//     await modifySurveyQuestions(validQuestions);
    
//     console.log('✅ Survey questions updated successfully');
    
//     // ✅ BACKWARD COMPATIBLE: Return simple success message like before
//     res.status(200).json({ 
//       success: true,
//       message: 'Survey questions updated successfully',
//       questionsUpdated: validQuestions.length
//     });
    
//   } catch (error) {
//     console.error('❌ Error in updateSurveyQuestions controller:', error);
    
//     // ✅ BACKWARD COMPATIBLE: Return simple error format
//     res.status(500).json({ 
//       success: false,
//       error: error.message || 'Failed to update survey questions'
//     });
//   }
// };

// export const getSurveyLogs = async (req, res) => {
//   try {
//     console.log('🔍 getSurveyLogs endpoint called');
//     console.log('🔍 User:', req.user?.id, req.user?.role);
        
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to survey logs');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required'
//       });
//     }
        
//     console.log('🔍 Fetching survey logs...');
//     const logs = await fetchSurveyLogs();
        
//     console.log(`✅ Survey logs fetched successfully: ${logs.length} records`);
        
//     res.status(200).json({
//       success: true,
//       data: logs,
//       count: logs.length,
//       message: 'Survey logs fetched successfully'
//     });
      
//   } catch (error) {
//     console.error('❌ Error in getSurveyLogs:', error);
//     res.status(error.statusCode || 500).json({
//       success: false,
//       error: error.message || 'Failed to fetch survey logs'
//     });
//   }
// };

// export const approveSurvey = async (req, res) => {
//   try {
//     console.log('🔍 approveSurvey endpoint called');
//     console.log('🔍 Request body:', req.body);
//     console.log('🔍 User:', req.user?.id, req.user?.role);
    
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to approve survey');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required to approve surveys'
//       });
//     }
    
//     const { surveyId, userId, status } = req.body;
    
//     // ✅ Validate input
//     if (!surveyId || !userId || !status) {
//       return res.status(400).json({
//         success: false,
//         error: 'Missing required fields',
//         message: 'surveyId, userId, and status are required'
//       });
//     }
    
//     // ✅ Validate status
//     const validStatuses = ['approved', 'declined', 'granted', 'rejected'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status',
//         message: `Status must be one of: ${validStatuses.join(', ')}`
//       });
//     }
    
//     const result = await approveUserSurvey(surveyId, userId, status);
    
//     console.log('✅ Survey approval status updated successfully');
    
//     // ✅ BACKWARD COMPATIBLE: Return simple success message
//     res.status(200).json({ 
//       success: true,
//       message: `Survey ${status} successfully`
//     });
    
//   } catch (error) {
//     console.error('❌ Error in approveSurvey controller:', error);
//     res.status(error.statusCode || 500).json({ 
//       success: false,
//       error: error.message || 'Failed to update survey status'
//     });
//   }
// };















// // ikootaapi/controllers/surveyControllers.js
// import { 
//   submitSurveyService, 
//   fetchSurveyQuestions, 
//   modifySurveyQuestions, 
//   fetchSurveyLogs, 
//   approveUserSurvey 
// } from '../services/surveyServices.js';
// import { generateToken } from '../utils/jwt.js';

// export const submitSurvey = async (req, res, next) => {
//   try {
//     const email = req.user.email;
//     await submitSurveyService(req.body, email);
//     const userData = { userId: req.user.userId, email, is_member: 'pending' };
//     const token = generateToken(userData);
//     res.cookie('access_token', token, { httpOnly: true });
//     res.status(200).json({ redirect: "/thankyou" });
//   } catch (error) {
//     console.error('Error in submitSurvey controller:', error);
//     next(error);
//   }
// };

// export const getSurveyQuestions = async (req, res) => {
//   try {
//     console.log('🔍 getSurveyQuestions endpoint called');
//     const questions = await fetchSurveyQuestions();
//     console.log('✅ Questions fetched:', questions);
    
//     res.status(200).json({
//       success: true,
//       data: questions,
//       count: questions.length,
//       message: 'Survey questions fetched successfully'
//     });
//   } catch (error) {
//     console.error('❌ Error in getSurveyQuestions:', error);
//     res.status(error.statusCode || 500).json({ 
//       success: false,
//       error: error.message || 'Failed to fetch survey questions',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

// export const updateSurveyQuestions = async (req, res) => {
//   try {
//     console.log('🔍 updateSurveyQuestions endpoint called');
//     console.log('🔍 Request body:', req.body);
//     console.log('🔍 User:', req.user?.id, req.user?.role);
    
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to update questions');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required to update survey questions'
//       });
//     }
    
//     const { questions } = req.body;
    
//     // ✅ Validate input
//     if (!questions) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions array is required',
//         message: 'Please provide a questions array in the request body'
//       });
//     }
    
//     if (!Array.isArray(questions)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions must be an array',
//         message: 'The questions field must be an array of strings'
//       });
//     }
    
//     if (questions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'Questions array cannot be empty',
//         message: 'Please provide at least one question'
//       });
//     }
    
//     // ✅ Filter out empty questions
//     const validQuestions = questions.filter(q => q && typeof q === 'string' && q.trim().length > 0);
    
//     if (validQuestions.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: 'No valid questions provided',
//         message: 'All questions appear to be empty. Please provide valid question text.'
//       });
//     }
    
//     console.log(`🔍 Updating ${validQuestions.length} valid questions`);
    
//     await modifySurveyQuestions(validQuestions);
    
//     console.log('✅ Survey questions updated successfully');
    
//     res.status(200).json({ 
//       success: true,
//       message: 'Survey questions updated successfully',
//       questionsUpdated: validQuestions.length,
//       data: {
//         updatedQuestions: validQuestions
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ Error in updateSurveyQuestions controller:', error);
//     console.error('❌ Full error details:', {
//       message: error.message,
//       stack: error.stack,
//       code: error.code,
//       sql: error.sql
//     });
    
//     // ✅ Enhanced error response
//     const statusCode = error.statusCode || 500;
//     const errorResponse = {
//       success: false,
//       error: error.message || 'Failed to update survey questions',
//       message: 'Unable to save the survey questions. Please try again.',
//     };
    
//     // Add debugging info in development
//     if (process.env.NODE_ENV === 'development') {
//       errorResponse.details = {
//         stack: error.stack,
//         code: error.code,
//         sql: error.sql
//       };
//     }
    
//     res.status(statusCode).json(errorResponse);
//   }
// };

// export const getSurveyLogs = async (req, res) => {
//   try {
//     console.log('🔍 getSurveyLogs endpoint called');
//     console.log('🔍 User:', req.user?.id, req.user?.role);
        
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to survey logs');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required'
//       });
//     }
        
//     console.log('🔍 Fetching survey logs...');
//     const logs = await fetchSurveyLogs();
        
//     console.log(`✅ Survey logs fetched successfully: ${logs.length} records`);
        
//     res.status(200).json({
//       success: true,
//       data: logs,
//       count: logs.length,
//       message: 'Survey logs fetched successfully'
//     });
      
//   } catch (error) {
//     console.error('❌ Error in getSurveyLogs:', error);
//     res.status(error.statusCode || 500).json({
//       success: false,
//       error: error.message || 'Failed to fetch survey logs',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };

// export const approveSurvey = async (req, res) => {
//   try {
//     console.log('🔍 approveSurvey endpoint called');
//     console.log('🔍 Request body:', req.body);
//     console.log('🔍 User:', req.user?.id, req.user?.role);
    
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to approve survey');
//       return res.status(403).json({
//         success: false,
//         error: 'Admin privileges required to approve surveys'
//       });
//     }
    
//     const { surveyId, userId, status } = req.body;
    
//     // ✅ Validate input
//     if (!surveyId || !userId || !status) {
//       return res.status(400).json({
//         success: false,
//         error: 'Missing required fields',
//         message: 'surveyId, userId, and status are required'
//       });
//     }
    
//     // ✅ Validate status
//     const validStatuses = ['approved', 'declined', 'granted', 'rejected'];
//     if (!validStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: 'Invalid status',
//         message: `Status must be one of: ${validStatuses.join(', ')}`
//       });
//     }
    
//     const result = await approveUserSurvey(surveyId, userId, status);
    
//     console.log('✅ Survey approval status updated successfully');
    
//     res.status(200).json({ 
//       success: true,
//       message: `Survey ${status} successfully`,
//       data: {
//         surveyId,
//         userId,
//         status,
//         affectedRows: result.affectedRows
//       }
//     });
    
//   } catch (error) {
//     console.error('❌ Error in approveSurvey controller:', error);
//     res.status(error.statusCode || 500).json({ 
//       success: false,
//       error: error.message || 'Failed to update survey status',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };


// // ikootaapi/controllers/surveyControllers.js
// import { submitSurveyService, fetchSurveyQuestions, modifySurveyQuestions, fetchSurveyLogs, approveUserSurvey } from '../services/surveyServices.js';
// import { generateToken } from '../utils/jwt.js';

// export const submitSurvey = async (req, res, next) => {
//   try {
//     const email = req.user.email;
//     await submitSurveyService(req.body, email);
//     const userData = { userId: req.user.userId, email, is_member: 'pending' };
//     const token = generateToken(userData);
//     res.cookie('access_token', token, { httpOnly: true });
//     res.status(200).json({ redirect: "/thankyou" });
//   } catch (error) {
//     console.error('Error in submitSurvey controller:', error);
//     next(error);
//   }
// };

// export const getSurveyQuestions = async (req, res) => {
//   try {
//     const questions = await fetchSurveyQuestions();
//     res.status(200).json(questions);
//     console.log('questions at bked authcontrols', questions);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// export const updateSurveyQuestions = async (req, res) => {
//   try {
//     const { questions } = req.body;
//     await modifySurveyQuestions(questions);
//     res.status(200).json({ message: 'Survey questions updated successfully.' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

// // export const getSurveyLogs = async (req, res) => {
// //   try {
// //     const logs = await fetchSurveyLogs();
// //     res.status(200).json(logs);
// //   } catch (error) {
// //     res.status(500).json({ error: error.message });
// //   }
// // };

// export const getSurveyLogs = async (req, res) => {
//   try {
//     console.log('🔍 getSurveyLogs endpoint called');
//     console.log('🔍 User:', req.user?.id, req.user?.role);
    
//     // ✅ Check if user has admin privileges
//     if (!req.user || !['admin', 'super_admin'].includes(req.user.role)) {
//       console.log('❌ Unauthorized access attempt to survey logs');
//       return res.status(403).json({ 
//         success: false, 
//         error: 'Admin privileges required' 
//       });
//     }
    
//     console.log('🔍 Fetching survey logs...');
//     const logs = await fetchSurveyLogs();
    
//     console.log(`✅ Survey logs fetched successfully: ${logs.length} records`);
    
//     res.status(200).json({
//       success: true,
//       data: logs,
//       count: logs.length,
//       message: 'Survey logs fetched successfully'
//     });
    
//   } catch (error) {
//     console.error('❌ Error in getSurveyLogs:', error);
//     res.status(error.statusCode || 500).json({ 
//       success: false,
//       error: error.message || 'Failed to fetch survey logs',
//       details: process.env.NODE_ENV === 'development' ? error.stack : undefined
//     });
//   }
// };


// export const approveSurvey = async (req, res) => {
//   try {
//     const { surveyId, userId, status } = req.body;
//     await approveUserSurvey(surveyId, userId, status);
//     res.status(200).json({ message: 'Survey status updated.' });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };