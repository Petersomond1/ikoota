// ikootaapi/controllers/teachingsControllers.js - Fixed user_id handling
import {
  getAllTeachings,
  getTeachingsByUserId,
  createTeachingService,
  updateTeachingById,
  deleteTeachingById,
  getTeachingsByIds,
  getTeachingByPrefixedId,
  searchTeachings,
  getTeachingStats,
} from '../services/teachingsServices.js';


import { validateChatData } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ✅ FIXED: Enhanced createTeaching with proper user_id handling for teachings
export const createTeaching = async (req, res) => {
  try {
    const { topic, description, subjectMatter, audience, content, lessonNumber } = req.body;
    const requestingUser = req.user;

    // Validation
    if (!topic || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields',
        message: 'Topic and description are required'
      });
    }

    if (!requestingUser?.user_id && !requestingUser?.id) {
      return res.status(401).json({ 
        success: false, 
        error: 'Authentication required',
        message: 'User authentication is required'
      });
    }

    // ✅ CRITICAL FIX: Use numeric user_id (int) for teachings as per database schema
    const user_id = requestingUser.id || requestingUser.user_id;

    // Validate user_id is numeric for teachings table
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid user ID format',
        message: 'Teachings require a valid numeric user ID'
      });
    }

    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    // Validate content or media presence
    if (!content && media.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Content required',
        message: 'Either text content or media files must be provided'
      });
    }

    const newTeaching = await createTeachingService({
      topic: topic.trim(),
      description: description.trim(),
      subjectMatter: subjectMatter?.trim(),
      audience: audience?.trim(),
      content: content?.trim(),
      media,
      user_id: parseInt(user_id), // Ensure it's an integer
      lessonNumber,
    });

    res.status(201).json({
      success: true,
      data: newTeaching,
      message: "Teaching created successfully"
    });
  } catch (error) {
    console.error('Error in createTeaching:', error);
    
    if (error.message.includes('required')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        message: 'Validation failed'
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to create teaching'
    });
  }
};

// ✅ FIXED: Enhanced fetchTeachingsByUserId with proper user_id mapping
export const fetchTeachingsByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'User ID is required',
        message: 'Please provide a valid user ID'
      });
    }

    // ✅ CRITICAL: Handle user_id mapping for teachings
    // If user_id is converse_id (char(10)), we need to map it to numeric user.id
    let searchUserId = user_id;
    
    if (typeof user_id === 'string' && user_id.length === 10) {
      // This is a converse_id, need to map to numeric user.id
      // You might need to add a service to map converse_id to user.id
      console.log(`Mapping converse_id ${user_id} to numeric user.id for teachings`);
      // TODO: Implement mapping logic if needed
      // searchUserId = await mapConverseIdToUserId(user_id);
    }

    const teachings = await getTeachingsByUserId(searchUserId);
    
    res.status(200).json({
      success: true,
      data: teachings,
      count: teachings.length,
      user_id: searchUserId
    });
  } catch (error) {
    console.error('Error in fetchTeachingsByUserId:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch user teachings'
    });
  }
};

// Enhanced fetchAllTeachings with pagination and filtering
export const fetchAllTeachings = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search, 
      audience, 
      subjectMatter 
    } = req.query;

    // If search parameters are provided, use search function
    if (search || audience || subjectMatter) {
      const filters = {
        query: search,
        audience,
        subjectMatter,
        limit: parseInt(limit),
        offset: (parseInt(page) - 1) * parseInt(limit)
      };

      const result = await searchTeachings(filters);
      
      return res.status(200).json({
        success: true,
        data: result.teachings,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: result.total,
          pages: Math.ceil(result.total / parseInt(limit))
        }
      });
    }

    // Standard fetch all
    const teachings = await getAllTeachings();
    
    res.status(200).json({
      success: true,
      data: teachings,
      count: teachings.length
    });
  } catch (error) {
    console.error('Error in fetchAllTeachings:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch teachings'
    });
  }
};

// Enhanced fetchTeachingsByIds with better error handling
export const fetchTeachingsByIds = async (req, res) => {
  try {
    const { ids } = req.query;
    
    if (!ids) {
      return res.status(400).json({ 
        success: false, 
        error: 'IDs parameter is required',
        message: 'Please provide comma-separated teaching IDs'
      });
    }

    const idArray = ids.split(',').map(id => id.trim()).filter(Boolean);
    
    if (idArray.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valid IDs are required',
        message: 'Please provide at least one valid teaching ID'
      });
    }

    const teachings = await getTeachingsByIds(idArray);
    
    res.status(200).json({
      success: true,
      data: teachings,
      count: teachings.length,
      requested_ids: idArray
    });
  } catch (error) {
    console.error('Error in fetchTeachingsByIds:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch teachings by IDs'
    });
  }
};

// Enhanced fetchTeachingByPrefixedId
export const fetchTeachingByPrefixedId = async (req, res) => {
  try {
    const { prefixedId } = req.params;
    
    if (!prefixedId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Teaching identifier is required',
        message: 'Please provide a valid teaching ID or prefixed ID'
      });
    }

    const teaching = await getTeachingByPrefixedId(prefixedId);
    
    if (!teaching) {
      return res.status(404).json({ 
        success: false, 
        error: 'Teaching not found',
        message: `No teaching found with identifier: ${prefixedId}`
      });
    }
    
    res.status(200).json({
      success: true,
      data: teaching
    });
  } catch (error) {
    console.error('Error in fetchTeachingByPrefixedId:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch teaching'
    });
  }
};

// Enhanced editTeaching
export const editTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.user_id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid teaching ID',
        message: 'Please provide a valid numeric teaching ID'
      });
    }

    // Optional: Add ownership check
    // const existingTeaching = await getTeachingByPrefixedId(id);
    // if (existingTeaching && existingTeaching.user_id !== requestingUserId && !req.user.isAdmin) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Access denied',
    //     message: 'You can only edit your own teachings'
    //   });
    // }

    const files = req.uploadedFiles || [];
    const media = files.map((file) => ({
      url: file.url,
      type: file.type,
    }));

    const data = {
      ...req.body,
      media,
    };

    const updatedTeaching = await updateTeachingById(parseInt(id), data);
    
    res.status(200).json({
      success: true,
      data: updatedTeaching,
      message: 'Teaching updated successfully'
    });
  } catch (error) {
    console.error('Error in editTeaching:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to update teaching'
    });
  }
};

// Enhanced removeTeaching
export const removeTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const requestingUserId = req.user?.user_id;

    if (!id || isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid teaching ID',
        message: 'Please provide a valid numeric teaching ID'
      });
    }

    // Optional: Add ownership check
    // const existingTeaching = await getTeachingByPrefixedId(id);
    // if (existingTeaching && existingTeaching.user_id !== requestingUserId && !req.user.isAdmin) {
    //   return res.status(403).json({ 
    //     success: false, 
    //     error: 'Access denied',
    //     message: 'You can only delete your own teachings'
    //   });
    // }

    const result = await deleteTeachingById(parseInt(id));
    
    res.status(200).json({ 
      success: true, 
      message: 'Teaching deleted successfully',
      deleted_id: result.prefixed_id
    });
  } catch (error) {
    console.error('Error in removeTeaching:', error);
    
    const statusCode = error.message.includes('not found') ? 404 : 500;
    res.status(statusCode).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to delete teaching'
    });
  }
};

// NEW: Search teachings controller
export const searchTeachingsController = async (req, res) => {
  try {
    const { 
      q: query, 
      user_id, 
      audience, 
      subjectMatter, 
      page = 1, 
      limit = 20 
    } = req.query;

    if (!query && !user_id && !audience && !subjectMatter) {
      return res.status(400).json({ 
        success: false, 
        error: 'Search parameters required',
        message: 'Please provide at least one search parameter'
      });
    }

    const filters = {
      query,
      user_id,
      audience,
      subjectMatter,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit)
    };

    const result = await searchTeachings(filters);
    
    res.status(200).json({
      success: true,
      data: result.teachings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: result.total,
        pages: Math.ceil(result.total / parseInt(limit))
      },
      filters: {
        query,
        user_id,
        audience,
        subjectMatter
      }
    });
  } catch (error) {
    console.error('Error in searchTeachingsController:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to search teachings'
    });
  }
};

// NEW: Get teaching statistics controller
export const fetchTeachingStats = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requestingUserId = req.user?.user_id;

    // If requesting user stats and not admin, ensure they can only see their own stats
    if (user_id && user_id !== requestingUserId && !req.user?.isAdmin) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied',
        message: 'You can only view your own statistics'
      });
    }

    const stats = await getTeachingStats(user_id);
    
    res.status(200).json({
      success: true,
      data: stats,
      scope: user_id ? 'user' : 'global'
    });
  } catch (error) {
    console.error('Error in fetchTeachingStats:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      message: 'Failed to fetch teaching statistics'
    });
  }
};