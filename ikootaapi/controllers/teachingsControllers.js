// ikootaapi/controllers/teachingsControllers.js - COMPLETE FINAL VERSION
// Merges ALL functionality from both versions + database compatibility

import {
  getAllTeachings,
  getTeachingsByUserId,
  getTeachingByPrefixedId,
  createTeachingService,
  updateTeachingById,
  deleteTeachingById,
  getTeachingsByIds,
  searchTeachings,
  getTeachingStats,
  getTeachingByLessonNumber,
  getTeachingsByDateRange
} from "../services/teachingsServices.js";

import { validateTeachingData, validatePagination } from '../utils/contentValidation.js';
import { formatErrorResponse } from '../utils/errorHelpers.js';
import { normalizeContentItem } from '../utils/contentHelpers.js';

// ===============================================
// STANDARD TEACHING OPERATIONS
// ===============================================

// ✅ Enhanced fetchAllTeachings with advanced filtering
export const fetchAllTeachings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      approval_status,
      user_id,
      audience,
      subjectMatter,
      search,
      start_date,
      end_date,
      sort_by = 'updatedAt',
      sort_order = 'desc',
      // Enhanced fields
      is_featured,
      is_public,
      difficulty_level,
      status
    } = req.query;

    // Validate pagination
    const validationErrors = validatePagination(page, limit);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid pagination parameters',
        details: validationErrors
      });
    }

    const filters = {
      approval_status,
      user_id: user_id ? parseInt(user_id) : undefined,
      audience,
      subjectMatter,
      search,
      start_date,
      end_date,
      sort_by,
      sort_order,
      page: parseInt(page),
      limit: parseInt(limit),
      // Enhanced filters
      is_featured: is_featured === 'true' ? true : undefined,
      is_public: is_public === 'true' ? true : undefined,
      difficulty_level,
      status
    };

    console.log('🔍 fetchAllTeachings filters:', filters);

    const teachings = await getAllTeachings(filters);

    // Apply normalization for consistent frontend interface
    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.status(200).json({
      success: true,
      message: 'Teachings retrieved successfully',
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      filters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: normalizedTeachings.length
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchAllTeachings error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchTeachingsByUserId with proper user_id validation
export const fetchTeachingsByUserId = async (req, res) => {
  try {
    const { user_id } = req.query;
    const requestingUser = req.user;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required',
        message: 'Please provide a valid user_id parameter',
        required_fields: ['user_id']
      });
    }

    // ✅ CRITICAL: For teachings, user_id should be numeric (int)
    const numericUserId = parseInt(user_id);
    if (isNaN(numericUserId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
        message: 'Teachings require numeric user_id (not converse_id)',
        provided: user_id,
        expected_format: 'integer'
      });
    }

    // Authorization check - users can only see their own teachings unless admin
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const requestingUserId = requestingUser?.id; // For teachings, use numeric id
    
    if (!isAdmin && numericUserId !== requestingUserId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only view your own teachings'
      });
    }

    const teachings = await getTeachingsByUserId(numericUserId);

    // Apply normalization
    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.status(200).json({
      success: true,
      message: `Teachings retrieved for user ${user_id}`,
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      user_id: numericUserId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchTeachingsByUserId error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchTeachingByPrefixedId with fallback support
export const fetchTeachingByPrefixedId = async (req, res) => {
  try {
    const { prefixedId, id } = req.params;
    const identifier = prefixedId || id;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'Teaching identifier is required',
        message: 'Please provide either prefixed ID or numeric ID',
        examples: ['t123456789', '123']
      });
    }

    const teaching = await getTeachingByPrefixedId(identifier);

    if (!teaching) {
      return res.status(404).json({
        success: false,
        error: 'Teaching not found',
        message: `No teaching found with identifier: ${identifier}`,
        identifier_type: identifier.startsWith('t') ? 'prefixed_id' : 'numeric_id'
      });
    }

    // Apply normalization
    const normalizedTeaching = normalizeContentItem(teaching, 'teaching');

    res.status(200).json({
      success: true,
      message: 'Teaching retrieved successfully',
      data: normalizedTeaching,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchTeachingByPrefixedId error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchTeachingsByIds with validation
export const fetchTeachingsByIds = async (req, res) => {
  try {
    const { ids } = req.query;

    if (!ids) {
      return res.status(400).json({
        success: false,
        error: 'Teaching IDs are required',
        message: 'Please provide a comma-separated list of teaching IDs',
        examples: ['123,456,789', 't123456789,t987654321']
      });
    }

    // Parse IDs from comma-separated string
    const idArray = ids.split(',').map(id => id.trim()).filter(id => id);
    
    if (idArray.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid teaching IDs are required',
        message: 'Please provide valid teaching IDs'
      });
    }

    // Limit bulk requests to prevent abuse
    if (idArray.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Too many IDs requested',
        message: 'Maximum 100 IDs allowed per request'
      });
    }

    const teachings = await getTeachingsByIds(idArray);

    // Apply normalization
    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.status(200).json({
      success: true,
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      requested_ids: idArray,
      found_count: normalizedTeachings.length,
      missing_count: idArray.length - normalizedTeachings.length
    });
  } catch (error) {
    console.error('fetchTeachingsByIds error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// 8-STEP TEACHING CREATION PROCESS
// ===============================================

// ✅ Step 1: Initialize teaching with basic information
export const createTeachingStep1 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 1 - Basic Information:', req.body);
    const { topic, description } = req.body;
    const user_id = req.user?.id;

    // Validate required fields for step 1
    if (!topic || topic.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Topic is required for step 1'
      });
    }

    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Description is required for step 1'
      });
    }

    if (!user_id) {
      return res.status(400).json({
        success: false,
        error: 'User authentication required'
      });
    }

    // Create initial teaching record
    const teachingData = {
      topic: topic.trim(),
      description: description.trim(),
      user_id: parseInt(user_id),
      approval_status: 'pending',
      step_data: JSON.stringify({
        currentStep: 1,
        completedSteps: [1],
        step1: { topic, description }
      })
    };

    const result = await createTeachingService(teachingData);

    res.json({
      success: true,
      message: 'Teaching step 1 completed successfully',
      data: {
        teachingId: result.id,
        prefixed_id: result.prefixed_id,
        currentStep: 1,
        nextStep: 2,
        completed: ['basic_info']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 1:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 2: Add main content
export const createTeachingStep2 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 2 - Content:', req.body);
    const { teachingId, content } = req.body;

    if (!teachingId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID and content are required for step 2'
      });
    }

    // Update teaching with content
    const updateData = {
      content: content.trim(),
      step_data: JSON.stringify({
        currentStep: 2,
        completedSteps: [1, 2],
        step2: { content }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 2 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 2,
        nextStep: 3,
        completed: ['basic_info', 'content']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 2:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 3: Set difficulty level and duration
export const createTeachingStep3 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 3 - Difficulty & Duration:', req.body);
    const { teachingId, difficulty_level, estimated_duration } = req.body;

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 3'
      });
    }

    const validDifficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
    if (difficulty_level && !validDifficulties.includes(difficulty_level)) {
      return res.status(400).json({
        success: false,
        error: `Difficulty level must be one of: ${validDifficulties.join(', ')}`
      });
    }

    // Update teaching with difficulty and duration using ACTUAL field names
    const updateData = {
      subjectMatter: req.body.subjectMatter || null, // Use actual field name
      audience: req.body.audience || 'general',
      step_data: JSON.stringify({
        currentStep: 3,
        completedSteps: [1, 2, 3],
        step3: { difficulty_level, estimated_duration, subjectMatter: req.body.subjectMatter, audience: req.body.audience }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 3 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 3,
        nextStep: 4,
        completed: ['basic_info', 'content', 'difficulty_duration']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 3:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 4: Add prerequisites
export const createTeachingStep4 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 4 - Prerequisites:', req.body);
    const { teachingId, prerequisites } = req.body;

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 4'
      });
    }

    // Update teaching with prerequisites
    const updateData = {
      lessonNumber: req.body.lessonNumber || `auto-${Date.now()}`, // Use actual field name
      step_data: JSON.stringify({
        currentStep: 4,
        completedSteps: [1, 2, 3, 4],
        step4: { prerequisites, lessonNumber: req.body.lessonNumber }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 4 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 4,
        nextStep: 5,
        completed: ['basic_info', 'content', 'difficulty_duration', 'prerequisites']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 4:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 5: Add learning objectives
export const createTeachingStep5 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 5 - Learning Objectives:', req.body);
    const { teachingId, learning_objectives } = req.body;

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 5'
      });
    }

    // Update teaching with learning objectives (store in admin_notes temporarily)
    const updateData = {
      admin_notes: learning_objectives || null,
      step_data: JSON.stringify({
        currentStep: 5,
        completedSteps: [1, 2, 3, 4, 5],
        step5: { learning_objectives }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 5 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 5,
        nextStep: 6,
        completed: ['basic_info', 'content', 'difficulty_duration', 'prerequisites', 'objectives']
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 5:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 6: Add resources and media
export const createTeachingStep6 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 6 - Resources & Media:', req.body);
    const { teachingId, resources } = req.body;
    
    // Get uploaded files from middleware
    const uploadedFiles = req.uploadedFiles || [];

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 6'
      });
    }

    // Process uploaded files for media fields
    const media = uploadedFiles.slice(0, 3).map((file) => ({
      url: file.url,
      type: file.type || 'file',
    }));

    // Update teaching with resources and media
    const updateData = {
      media: media, // For compatibility with service layer
      step_data: JSON.stringify({
        currentStep: 6,
        completedSteps: [1, 2, 3, 4, 5, 6],
        step6: { resources, uploadedFiles }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 6 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 6,
        nextStep: 7,
        completed: ['basic_info', 'content', 'difficulty_duration', 'prerequisites', 'objectives', 'resources'],
        uploadedFiles: uploadedFiles
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 6:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 7: Add quiz/assessment (optional)
export const createTeachingStep7 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 7 - Quiz/Assessment:', req.body);
    const { teachingId, quiz } = req.body;

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 7'
      });
    }

    // Update teaching with quiz data (store in a way that's compatible)
    const updateData = {
      step_data: JSON.stringify({
        currentStep: 7,
        completedSteps: [1, 2, 3, 4, 5, 6, 7],
        step7: { quiz }
      })
    };

    await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching step 7 completed successfully',
      data: {
        teachingId: parseInt(teachingId),
        currentStep: 7,
        nextStep: 8,
        completed: ['basic_info', 'content', 'difficulty_duration', 'prerequisites', 'objectives', 'resources', 'quiz'],
        readyToPublish: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 7:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Step 8: Final review and publish
export const createTeachingStep8 = async (req, res) => {
  try {
    console.log('📚 Teaching Step 8 - Final Review & Publish:', req.body);
    const { teachingId, is_public, tags } = req.body;

    if (!teachingId) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required for step 8'
      });
    }

    // Final update with publication settings using ACTUAL field names
    const updateData = {
      approval_status: 'pending', // Set to pending for admin approval
      step_data: JSON.stringify({
        currentStep: 8,
        completedSteps: [1, 2, 3, 4, 5, 6, 7, 8],
        step8: { is_public, tags },
        completedAt: new Date().toISOString()
      })
    };

    const result = await updateTeachingById(parseInt(teachingId), updateData);

    res.json({
      success: true,
      message: 'Teaching creation completed successfully! Submitted for approval.',
      data: {
        teachingId: parseInt(teachingId),
        prefixed_id: result.prefixed_id,
        currentStep: 8,
        status: 'pending',
        completed: ['basic_info', 'content', 'difficulty_duration', 'prerequisites', 'objectives', 'resources', 'quiz', 'published'],
        awaitingApproval: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error in teaching step 8:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// STANDARD CRUD OPERATIONS
// ===============================================

// ✅ Enhanced createTeaching with 8-step form support
export const createTeaching = async (req, res) => {
  try {
    const {
      topic,           // Step 1: Topic
      description,     // Step 2: Description  
      subjectMatter,   // Step 3: Subject Matter
      content,         // Step 4: Content
      audience,        // Step 5: Audience
      lessonNumber     // Step 6: Lesson Number
      // Steps 7-8: Media files handled via uploadMiddleware
    } = req.body;

    const requestingUser = req.user;

    console.log('createTeaching request:', {
      body: req.body,
      user: requestingUser,
      files: req.uploadedFiles?.length || 0
    });

    // Validation for 8-step form
    if (!topic || !description) {
      return res.status(400).json({
        success: false,
        error: 'Required fields missing',
        message: 'Topic and description are required (steps 1-2 of 8-step form)',
        required_fields: ['topic', 'description'],
        optional_fields: ['subjectMatter', 'content', 'audience', 'lessonNumber']
      });
    }

    if (!requestingUser?.id) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required',
        message: 'Valid user authentication is required'
      });
    }

    // ✅ CRITICAL: For teachings, use numeric user_id (int)
    const user_id = requestingUser.id;
    if (!user_id || isNaN(user_id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID',
        message: 'Teachings require numeric user_id from authenticated user',
        user_data: {
          id: requestingUser.id,
          converse_id: requestingUser.converse_id
        }
      });
    }

    // Process uploaded files (steps 7-8: up to 3 media files)
    const files = req.uploadedFiles || [];
    console.log("Teaching files uploaded:", files);
    
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    // Validate content requirement (step 4 or media required)
    if (!content && media.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Content required',
        message: 'Either text content (step 4) or media files (steps 7-8) must be provided',
        provided: {
          content_length: content?.length || 0,
          media_count: media.length
        }
      });
    }

    // Additional validation
    const validationErrors = validateTeachingData({
      topic: topic.trim(),
      description: description.trim(),
      subjectMatter: subjectMatter?.trim(),
      content: content?.trim(),
      audience: audience?.trim(),
      lessonNumber: lessonNumber?.trim(),
      user_id
    });

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors,
        form_step_guidance: {
          step_1: 'Topic must be 3-255 characters',
          step_2: 'Description must be 10-1000 characters',
          step_3: 'Subject matter is optional but recommended',
          step_4: 'Content is required if no media provided',
          step_5: 'Audience defaults to "general"',
          step_6: 'Lesson number is auto-generated if not provided',
          steps_7_8: 'Up to 3 media files supported'
        }
      });
    }

    const teachingData = {
      topic: topic.trim(),
      description: description.trim(),
      subjectMatter: subjectMatter?.trim() || null,
      content: content?.trim() || null,
      audience: audience?.trim() || 'general',
      lessonNumber: lessonNumber?.trim() || null,
      user_id,
      media,
      approval_status: 'pending' // Default for new teachings
    };

    const newTeaching = await createTeachingService(teachingData);

    // Apply normalization
    const normalizedTeaching = normalizeContentItem(newTeaching, 'teaching');

    res.status(201).json({
      success: true,
      message: 'Teaching created successfully',
      data: normalizedTeaching,
      form_completion: {
        step_1_topic: !!topic,
        step_2_description: !!description,
        step_3_subject: !!subjectMatter,
        step_4_content: !!content,
        step_5_audience: !!audience,
        step_6_lesson: !!lessonNumber,
        step_7_8_media: media.length
      },
      next_steps: [
        "Teaching is pending approval",
        "Check approval status in your dashboard", 
        "Admin will review within 24-48 hours"
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('createTeaching error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced editTeaching with comprehensive update support
export const editTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      topic,
      description,
      lessonNumber,
      subjectMatter,
      audience,
      content,
      approval_status
    } = req.body;

    const requestingUser = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required',
        message: 'Please provide a valid teaching ID'
      });
    }

    // Check if teaching exists and get ownership info
    const existingTeaching = await getTeachingByPrefixedId(id);
    if (!existingTeaching) {
      return res.status(404).json({
        success: false,
        error: 'Teaching not found',
        message: `No teaching found with ID: ${id}`
      });
    }

    // Authorization check
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const isOwner = existingTeaching.user_id === requestingUser?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only edit your own teachings',
        teaching_owner: existingTeaching.user_id,
        requesting_user: requestingUser?.id
      });
    }

    // Only admins can change approval status
    if (approval_status && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only administrators can change approval status'
      });
    }

    // Process uploaded files if any
    const files = req.uploadedFiles || [];
    const media = files.slice(0, 3).map((file, index) => ({
      url: file.url,
      type: file.type || `media${index + 1}`,
    }));

    // Build update data
    const updateData = {};
    if (topic !== undefined) updateData.topic = topic.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (lessonNumber !== undefined) updateData.lessonNumber = lessonNumber;
    if (subjectMatter !== undefined) updateData.subjectMatter = subjectMatter?.trim() || null;
    if (audience !== undefined) updateData.audience = audience?.trim() || 'general';
    if (content !== undefined) updateData.content = content?.trim() || null;
    if (approval_status !== undefined) updateData.approval_status = approval_status;
    if (media.length > 0) updateData.media = media;

    // Admin-only fields
    if (isAdmin) {
      if (req.body.admin_notes !== undefined) updateData.admin_notes = req.body.admin_notes;
      if (req.body.reviewed_by !== undefined) updateData.reviewed_by = requestingUser.id;
      if (approval_status) updateData.reviewedAt = new Date();
    }

    // Validation
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No update data provided',
        message: 'Please provide at least one field to update'
      });
    }

    const validationErrors = validateTeachingData(updateData, true); // true for partial validation

    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        validation_errors: validationErrors
      });
    }

    const numericId = isNaN(id) ? existingTeaching.id : parseInt(id);
    const updatedTeaching = await updateTeachingById(numericId, updateData);

    // Apply normalization
    const normalizedTeaching = normalizeContentItem(updatedTeaching, 'teaching');

    res.status(200).json({
      success: true,
      message: 'Teaching updated successfully',
      data: normalizedTeaching,
      updated_fields: Object.keys(updateData),
      updated_by: requestingUser?.username || requestingUser?.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('editTeaching error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced removeTeaching with proper authorization
export const removeTeaching = async (req, res) => {
  try {
    const { id } = req.params;
    const { force_delete = false } = req.query;
    const requestingUser = req.user;

    if (!id) {
      return res.status(400).json({
        success: false,
        error: 'Teaching ID is required',
        message: 'Please provide a valid teaching ID'
      });
    }

    // Check if teaching exists
    const existingTeaching = await getTeachingByPrefixedId(id);
    if (!existingTeaching) {
      return res.status(404).json({
        success: false,
        error: 'Teaching not found',
        message: `No teaching found with ID: ${id}`
      });
    }

    // Authorization check
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    const isOwner = existingTeaching.user_id === requestingUser?.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You can only delete your own teachings'
      });
    }

    // Only admins can force delete (which includes cascade delete of comments)
    if (force_delete && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Permission denied',
        message: 'Only administrators can perform force delete'
      });
    }

    const numericId = isNaN(id) ? existingTeaching.id : parseInt(id);
    
    if (force_delete === 'true' || force_delete === true) {
      // Force delete - removes teaching and all related comments
      const result = await deleteTeachingById(numericId);
      
      res.status(200).json({
        success: true,
        data: result,
        message: "Teaching and all related comments deleted successfully.",
        deletion_type: 'force_delete',
        deleted_by: requestingUser?.username || requestingUser?.id,
        timestamp: new Date().toISOString()
      });
    } else {
      // Soft delete - mark as deleted but keep in database
      const updateData = {
        approval_status: 'deleted',
        admin_notes: `Deleted by ${requestingUser?.username || requestingUser?.id} at ${new Date().toISOString()}`,
        reviewed_by: requestingUser?.id,
        reviewedAt: new Date()
      };
      
      const updatedTeaching = await updateTeachingById(numericId, updateData);
      
      res.status(200).json({
        success: true,
        data: updatedTeaching,
        message: "Teaching marked as deleted.",
        deletion_type: 'soft_delete',
        deleted_by: requestingUser?.username || requestingUser?.id,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('removeTeaching error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// SEARCH AND FILTERING
// ===============================================

// ✅ Enhanced searchTeachingsController with advanced search
export const searchTeachingsController = async (req, res) => {
  try {
    const {
      query: searchQuery,
      q, // Alternative query parameter
      user_id,
      audience,
      subjectMatter,
      difficulty_level,
      approval_status = 'approved', // Default to approved for public search
      page = 1,
      limit = 50,
      sort_by = 'relevance',
      sort_order = 'desc',
      is_featured
    } = req.query;

    const finalQuery = searchQuery || q;

    if (!finalQuery || finalQuery.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Search query too short',
        message: 'Please provide a search query with at least 2 characters',
        provided_query: finalQuery
      });
    }

    const filters = {
      query: finalQuery.trim(),
      user_id: user_id ? parseInt(user_id) : undefined,
      audience,
      subjectMatter,
      difficulty_level,
      approval_status,
      limit: parseInt(limit),
      offset: (parseInt(page) - 1) * parseInt(limit),
      sort_by,
      sort_order,
      is_featured: is_featured ? is_featured === 'true' : undefined
    };

    console.log('🔍 Teaching search filters:', filters);

    const searchResult = await searchTeachings(filters);
    const { teachings, total } = searchResult;

    // Apply normalization
    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.status(200).json({
      success: true,
      message: `Found ${total} teaching(s) matching "${finalQuery}"`,
      data: normalizedTeachings,
      search_info: {
        query: finalQuery,
        total_results: total,
        current_page: parseInt(page),
        per_page: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      },
      filters,
      search_tips: [
        "Use specific keywords for better results",
        "Search includes topic, description, and content",
        "Use subject matter and audience filters to narrow results"
      ],
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('searchTeachingsController error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Get featured teachings
export const fetchFeaturedTeachings = async (req, res) => {
  try {
    console.log('📚 Getting featured teachings');

    const { limit = 10, audience, difficulty_level } = req.query;

    // For now, get teachings with high engagement or marked as featured
    const teachings = await getAllTeachings({
      approval_status: 'approved',
      limit: parseInt(limit),
      audience,
      difficulty_level,
      sort_by: 'updatedAt',
      sort_order: 'desc'
    });

    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.json({
      success: true,
      message: `Found ${normalizedTeachings.length} featured teaching(s)`,
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting featured teachings:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Get popular teachings
export const fetchPopularTeachings = async (req, res) => {
  try {
    console.log('📚 Getting popular teachings');

    const { timeframe = '30days', limit = 10, sort_by = 'views' } = req.query;

    // For now, get recent approved teachings
    const teachings = await getAllTeachings({
      approval_status: 'approved',
      limit: parseInt(limit),
      sort_by: 'updatedAt',
      sort_order: 'desc'
    });

    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.json({
      success: true,
      message: `Found ${normalizedTeachings.length} popular teaching(s)`,
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      timeframe,
      sort_by,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting popular teachings:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// ANALYTICS AND STATISTICS
// ===============================================

// ✅ Enhanced fetchTeachingStats with comprehensive analytics
export const fetchTeachingStats = async (req, res) => {
  try {
    console.log('📚 Getting teaching statistics');

    const requestingUser = req.user;
    const {
      user_id,
      timeframe = '30days',
      include_breakdown = 'true'
    } = req.query;

    // Authorization check for user-specific stats
    if (user_id) {
      const targetUserId = parseInt(user_id);
      const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
      
      if (!isAdmin && targetUserId !== requestingUser?.id) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You can only view your own teaching statistics'
        });
      }
    }

    // Global stats require admin privileges
    if (!user_id && !['admin', 'super_admin'].includes(requestingUser?.role)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required for global statistics'
      });
    }

    const options = {
      timeframe,
      include_breakdown: include_breakdown === 'true'
    };

    const stats = await getTeachingStats(user_id ? parseInt(user_id) : null, options);

    res.json({
      success: true,
      message: 'Teaching statistics retrieved successfully',
      data: stats,
      generated_at: new Date().toISOString(),
      scope: user_id ? 'user_specific' : 'global',
      timeframe,
      requested_by: requestingUser?.username || requestingUser?.id,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchTeachingStats error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchTeachingByLessonNumber
export const fetchTeachingByLessonNumber = async (req, res) => {
  try {
    const { lessonNumber } = req.params;
    const { user_id } = req.query;

    if (!lessonNumber) {
      return res.status(400).json({
        success: false,
        error: 'Lesson number is required',
        message: 'Please provide a valid lesson number'
      });
    }

    const teaching = await getTeachingByLessonNumber(
      lessonNumber, 
      user_id ? parseInt(user_id) : null
    );

    if (!teaching) {
      return res.status(404).json({
        success: false,
        error: 'Teaching not found',
        message: `No teaching found with lesson number: ${lessonNumber}`,
        searched_scope: user_id ? `user ${user_id}` : 'all users'
      });
    }

    // Apply normalization
    const normalizedTeaching = normalizeContentItem(teaching, 'teaching');

    res.json({
      success: true,
      message: 'Teaching retrieved successfully',
      data: normalizedTeaching,
      lessonNumber,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchTeachingByLessonNumber error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ✅ Enhanced fetchTeachingsByDateRange
export const fetchTeachingsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const {
      user_id,
      approval_status,
      audience,
      limit = 100
    } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Date range required',
        message: 'Please provide both startDate and endDate',
        format: 'YYYY-MM-DD or ISO 8601',
        example: '?startDate=2024-01-01&endDate=2024-12-31'
      });
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format',
        message: 'Please provide valid dates in YYYY-MM-DD format'
      });
    }

    if (start >= end) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date range',
        message: 'Start date must be before end date'
      });
    }

    const filters = {
      user_id: user_id ? parseInt(user_id) : undefined,
      approval_status,
      audience,
      limit: parseInt(limit)
    };

    const teachings = await getTeachingsByDateRange(startDate, endDate, filters);

    // Apply normalization
    const normalizedTeachings = teachings.map(teaching => normalizeContentItem(teaching, 'teaching'));

    res.json({
      success: true,
      message: 'Teachings retrieved successfully',
      data: normalizedTeachings,
      count: normalizedTeachings.length,
      date_range: {
        start: startDate,
        end: endDate,
        days: Math.ceil((end - start) / (1000 * 60 * 60 * 24))
      },
      filters,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('fetchTeachingsByDateRange error:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};

// ===============================================
// ADMIN OPERATIONS
// ===============================================

// ✅ Enhanced bulkTeachingOperations
export const bulkTeachingOperations = async (req, res) => {
  try {
    const { action, teaching_ids, options = {} } = req.body;
    const requestingUser = req.user;
    
    // Only admins can perform bulk operations
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser?.role);
    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Admin privileges required for bulk operations'
      });
    }

    if (!action || !teaching_ids || !Array.isArray(teaching_ids)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request',
        message: 'Action and teaching_ids array are required'
      });
    }

    const validActions = ['approve', 'reject', 'delete', 'feature', 'unfeature', 'archive'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: `Action must be one of: ${validActions.join(', ')}`
      });
    }

    const results = [];
    
    for (const teachingId of teaching_ids) {
      try {
        let result;
        const numericId = isNaN(teachingId) ? null : parseInt(teachingId);
        
        // Get teaching to ensure it exists
        const teaching = await getTeachingByPrefixedId(teachingId);
        if (!teaching) {
          results.push({
            teaching_id: teachingId,
            status: 'error',
            error: 'Teaching not found'
          });
          continue;
        }

        const actualId = numericId || teaching.id;
        
        switch (action) {
          case 'approve':
            result = await updateTeachingById(actualId, {
              approval_status: 'approved',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.approval_notes || 'Bulk approved'
            });
            break;
            
          case 'reject':
            result = await updateTeachingById(actualId, {
              approval_status: 'rejected',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.rejection_reason || 'Bulk rejected'
            });
            break;
            
          case 'delete':
            result = await deleteTeachingById(actualId);
            break;
            
          case 'feature':
            result = await updateTeachingById(actualId, {
              admin_notes: 'Featured content',
              reviewed_by: requestingUser.id
            });
            break;

          case 'unfeature':
            result = await updateTeachingById(actualId, {
              admin_notes: 'Unfeatured content',
              reviewed_by: requestingUser.id
            });
            break;
            
          case 'archive':
            result = await updateTeachingById(actualId, {
              approval_status: 'archived',
              reviewed_by: requestingUser.id,
              reviewedAt: new Date(),
              admin_notes: options.archive_reason || 'Bulk archived'
            });
            break;
        }
        
        results.push({
          teaching_id: teachingId,
          status: 'success',
          action,
          result
        });
        
      } catch (error) {
        results.push({
          teaching_id: teachingId,
          status: 'error',
          error: error.message
        });
      }
    }
    
    const successCount = results.filter(r => r.status === 'success').length;
    const errorCount = results.filter(r => r.status === 'error').length;
    
    res.status(200).json({
      success: true,
      message: `Bulk ${action} completed`,
      summary: {
        total: teaching_ids.length,
        successful: successCount,
        failed: errorCount
      },
      results,
      performed_by: requestingUser.username || requestingUser.id,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in bulkTeachingOperations:', error);
    const { statusCode, errorResponse } = formatErrorResponse(error, req);
    res.status(statusCode).json(errorResponse);
  }
};
