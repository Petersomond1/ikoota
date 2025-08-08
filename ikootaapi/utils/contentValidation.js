// ikootaapi/utils/contentValidation.js - NEW FILE

// Content validation functions
export const validateChatData = (data) => {
  const errors = [];
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  }
  if (!data.text || data.text.trim().length === 0) {
    errors.push('Text content is required');
  }
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
    errors.push('User ID must be a 10-character converse_id for chats');
  }
  
  return errors;
};

export const validateTeachingData = (data) => {
  const errors = [];
  
  if (!data.topic || data.topic.trim().length === 0) {
    errors.push('Topic is required');
  }
  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  if (data.user_id && isNaN(data.user_id)) {
    errors.push('User ID must be numeric for teachings');
  }
  if (!data.content && (!data.media || data.media.length === 0)) {
    errors.push('Either content text or media files must be provided');
  }
  
  return errors;
};

export const validateCommentData = (data) => {
  const errors = [];
  
  if (!data.comment || data.comment.trim().length === 0) {
    errors.push('Comment text is required');
  }
  if (!data.user_id) {
    errors.push('User ID is required');
  }
  if (data.user_id && (typeof data.user_id !== 'string' || data.user_id.length !== 10)) {
    errors.push('User ID must be a 10-character converse_id for comments');
  }
  if (!data.chat_id && !data.teaching_id) {
    errors.push('Either chat_id or teaching_id is required');
  }
  if (data.chat_id && data.teaching_id) {
    errors.push('Cannot comment on both chat and teaching simultaneously');
  }
  
  return errors;
};