// ikootaapi/utils/contentValidation.js - NEW FILE

// Content validation functions
// export const validateChatData = (data) => {
//   const errors = [];
  
//   if (!data.title || data.title.trim().length === 0) {
//     errors.push('Title is required');
//   }
//   if (!data.text || data.text.trim().length === 0) {
//     errors.push('Text content is required');
//   }
//   if (!data.user_id) {
//     errors.push('User ID is required');
//   }
//   if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
//     errors.push('User ID must be a 10-character converse_id for chats');
//   }
  
//   return errors;
// };

// export const validateTeachingData = (data) => {
//   const errors = [];
  
//   if (!data.topic || data.topic.trim().length === 0) {
//     errors.push('Topic is required');
//   }
//   if (!data.description || data.description.trim().length === 0) {
//     errors.push('Description is required');
//   }
//   if (!data.user_id) {
//     errors.push('User ID is required');
//   }
//   if (data.user_id && isNaN(data.user_id)) {
//     errors.push('User ID must be numeric for teachings');
//   }
//   if (!data.content && (!data.media || data.media.length === 0)) {
//     errors.push('Either content text or media files must be provided');
//   }
  
//   return errors;
// };

// export const validateCommentData = (data) => {
//   const errors = [];
  
//   if (!data.comment || data.comment.trim().length === 0) {
//     errors.push('Comment text is required');
//   }
//   if (!data.user_id) {
//     errors.push('User ID is required');
//   }
//   if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
//     errors.push('User ID must be a 10-character converse_id for comments');
//   }
//   if (!data.chat_id && !data.teaching_id) {
//     errors.push('Either chat_id or teaching_id is required');
//   }
//   if (data.chat_id && data.teaching_id) {
//     errors.push('Cannot comment on both chat and teaching simultaneously');
//   }
  
//   return errors;
// };



// Content validation utilities
import CustomError from './CustomError.js';

/**
 * Validate chat data
 */
export const validateChatData = (data) => {
  const { title, text, user_id } = data;
  
  if (!title || title.trim().length === 0) {
    throw new CustomError('Title is required', 400);
  }
  
  if (title.length > 255) {
    throw new CustomError('Title must be less than 255 characters', 400);
  }
  
  if (!text || text.trim().length === 0) {
    throw new CustomError('Text content is required', 400);
  }
  
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
  
  return true;
};

/**
 * Validate teaching data
 */
export const validateTeachingData = (data) => {
  const { topic, description, user_id } = data;
  
  if (!topic || topic.trim().length === 0) {
    throw new CustomError('Topic is required', 400);
  }
  
  if (!description || description.trim().length === 0) {
    throw new CustomError('Description is required', 400);
  }
  
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
  
  return true;
};

/**
 * Validate comment data
 */
export const validateCommentData = (data) => {
  const { comment, user_id, chat_id, teaching_id } = data;
  
  if (!comment || comment.trim().length === 0) {
    throw new CustomError('Comment text is required', 400);
  }
  
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
  
  if (!chat_id && !teaching_id) {
    throw new CustomError('Either chat_id or teaching_id is required', 400);
  }
  
  return true;
};

/**
 * Validate user ID format
 */
export const validateUserId = (user_id, type = 'any') => {
  if (!user_id) {
    throw new CustomError('User ID is required', 400);
  }
  
  if (type === 'converse' && (typeof user_id !== 'string' || user_id.length !== 10)) {
    throw new CustomError('Converse ID must be a 10-character string', 400);
  }
  
  if (type === 'numeric' && isNaN(parseInt(user_id))) {
    throw new CustomError('User ID must be numeric', 400);
  }
  
  return true;
};

/**
 * Validate content approval status
 */
export const validateApprovalStatus = (status) => {
  const validStatuses = ['pending', 'approved', 'rejected'];
  
  if (!status || !validStatuses.includes(status)) {
    throw new CustomError(`Status must be one of: ${validStatuses.join(', ')}`, 400);
  }
  
  return true;
};