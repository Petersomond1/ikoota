// ikootaapi/controllers/surveyControllers.js
import { submitSurveyService, fetchSurveyQuestions, modifySurveyQuestions, fetchSurveyLogs, approveUserSurvey } from '../services/surveyServices.js';
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

export const getSurveyQuestions = async (req, res) => {
  try {
    const questions = await fetchSurveyQuestions();
    res.status(200).json(questions);
    console.log('questions at bked authcontrols', questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSurveyQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    await modifySurveyQuestions(questions);
    res.status(200).json({ message: 'Survey questions updated successfully.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// export const getSurveyLogs = async (req, res) => {
//   try {
//     const logs = await fetchSurveyLogs();
//     res.status(200).json(logs);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

export const getSurveyLogs = async (req, res) => {
  try {
    console.log('🔍 getSurveyLogs endpoint called');
    console.log('🔍 User:', req.user?.id, req.user?.role);
    
    // ✅ Check if user has admin privileges
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
      error: error.message || 'Failed to fetch survey logs',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};


export const approveSurvey = async (req, res) => {
  try {
    const { surveyId, userId, status } = req.body;
    await approveUserSurvey(surveyId, userId, status);
    res.status(200).json({ message: 'Survey status updated.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};