// ikootaapi/utils/contentHelpers.js - NEW FILE

// Function to normalize content across types
export const normalizeContentItem = (item, contentType) => {
  const base = {
    id: item.id,
    prefixed_id: item.prefixed_id,
    content_type: contentType,
    user_id: item.user_id,
    approval_status: item.approval_status,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    media: {
      media1: { url: item.media_url1, type: item.media_type1 },
      media2: { url: item.media_url2, type: item.media_type2 },
      media3: { url: item.media_url3, type: item.media_type3 }
    }
  };

  switch (contentType) {
    case 'chat':
      return {
        ...base,
        title: item.title,
        content_title: item.title,
        audience: item.audience,
        summary: item.summary,
        text: item.text,
        is_flagged: item.is_flagged
      };
    case 'teaching':
      return {
        ...base,
        topic: item.topic,
        content_title: item.topic,
        description: item.description,
        lessonNumber: item.lessonNumber,
        subjectMatter: item.subjectMatter,
        audience: item.audience,
        content: item.content
      };
    case 'comment':
      return {
        ...base,
        comment: item.comment,
        content_title: item.comment?.substring(0, 50) + '...',
        chat_id: item.chat_id,
        teaching_id: item.teaching_id,
        parent_type: item.chat_id ? 'chat' : 'teaching'
      };
    default:
      return base;
  }
};




// Content processing utilities

/**
 * Normalize content item structure
 */
// export const normalizeContentItem = (item, contentType) => {
//   if (!item) return null;
  
//   const normalized = {
//     id: item.id,
//     content_type: contentType,
//     prefixed_id: item.prefixed_id || `${contentType[0]}${item.id}`,
//     user_id: item.user_id,
//     createdAt: item.createdAt,
//     updatedAt: item.updatedAt,
//     approval_status: item.approval_status || 'approved'
//   };
  
//   // Add type-specific fields
//   switch (contentType) {
//     case 'chat':
//       normalized.title = item.title;
//       normalized.text = item.text;
//       normalized.summary = item.summary;
//       normalized.audience = item.audience;
//       break;
      
//     case 'teaching':
//       normalized.topic = item.topic;
//       normalized.description = item.description;
//       normalized.content = item.content;
//       normalized.subjectMatter = item.subjectMatter;
//       normalized.audience = item.audience;
//       break;
      
//     case 'comment':
//       normalized.comment = item.comment;
//       normalized.chat_id = item.chat_id;
//       normalized.teaching_id = item.teaching_id;
//       break;
//   }
  
//   // Add media fields if present
//   if (item.media_url1 || item.media_url2 || item.media_url3) {
//     normalized.media = [
//       item.media_url1 ? { url: item.media_url1, type: item.media_type1 } : null,
//       item.media_url2 ? { url: item.media_url2, type: item.media_type2 } : null,
//       item.media_url3 ? { url: item.media_url3, type: item.media_type3 } : null
//     ].filter(Boolean);
//   }
  
//   return normalized;
// };

// Function to validate content permissions
export const validateContentPermissions = (requestingUser, content, action = 'view') => {
  try {
    const isAdmin = ['admin', 'super_admin'].includes(requestingUser.role);
    const isOwner = content.user_id === requestingUser.user_id || 
                    content.user_id === requestingUser.id ||
                    content.user_id === requestingUser.converse_id;

    switch (action) {
      case 'view':
        return true; // Most content is viewable
      case 'edit':
      case 'delete':
        return isAdmin || isOwner;
      case 'moderate':
        return isAdmin;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error in validateContentPermissions:', error);
    return false;
  }
};


/**
 * Format content for API response
 */
export const formatContentResponse = (content, includeDetails = true) => {
  if (!content) return null;
  
  const formatted = {
    id: content.id,
    prefixed_id: content.prefixed_id,
    content_type: content.content_type,
    user_id: content.user_id,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt
  };
  
  if (includeDetails) {
    // Add all other properties
    Object.assign(formatted, content);
  }
  
  return formatted;
};

/**
 * Process media URLs
 */
export const processMediaUrls = (media) => {
  if (!media || !Array.isArray(media)) return {};
  
  const mediaFields = {};
  
  media.slice(0, 3).forEach((item, index) => {
    const num = index + 1;
    mediaFields[`media_url${num}`] = item?.url || null;
    mediaFields[`media_type${num}`] = item?.type || null;
  });
  
  return mediaFields;
};

/**
 * Generate content slug
 */
export const generateContentSlug = (title, id) => {
  if (!title) return `content-${id}`;
  
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, '')
    .replace(/\s+/g, '-')
    .substring(0, 50) + `-${id}`;
};

/**
 * Sanitize content text
 */
export const sanitizeContent = (text) => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '');
};

/**
 * Extract content preview
 */
export const extractPreview = (content, maxLength = 150) => {
  if (!content) return '';
  
  const cleaned = sanitizeContent(content);
  return cleaned.length > maxLength 
    ? cleaned.substring(0, maxLength) + '...'
    : cleaned;
};