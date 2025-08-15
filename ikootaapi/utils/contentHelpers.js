// ikootaapi/utils/contentHelpers.js - CONTENT NORMALIZATION UTILITIES
// Provides consistent data structure across chats, teachings, and comments

// ✅ Normalize content item to consistent format for frontend
export const normalizeContentItem = (item, contentType) => {
  if (!item) return null;

  try {
    // Base normalized structure
    const normalized = {
      id: item.id,
      prefixed_id: item.prefixed_id || null,
      content_type: contentType || item.content_type || 'unknown',
      
      // Timestamps (consistent format)
      created_at: item.createdAt || item.created_at || item.content_createdAt,
      updated_at: item.updatedAt || item.updated_at || item.content_updatedAt,
      
      // User information
      user_id: item.user_id,
      author_id: item.author_id || item.user_id,
      
      // Content fields
      title: item.title || item.topic || item.content_title || null,
      content: item.content || item.text || item.comment || null,
      description: item.description || item.summary || null,
      
      // Status fields
      approval_status: item.approval_status || 'pending',
      is_flagged: item.is_flagged || false,
      
      // Media handling (normalize individual fields to array)
      media: normalizeMediaFields(item),
      
      // Metadata
      audience: item.audience || 'general',
      tags: item.tags || [],
      
      // Admin fields
      admin_notes: item.admin_notes || null,
      reviewed_by: item.reviewed_by || null,
      reviewed_at: item.reviewedAt || item.reviewed_at || null,
      
      // Preserve original data for reference
      _original: {
        table: getTableName(contentType),
        raw_data: item
      }
    };

    // Content-type specific normalization
    switch (contentType) {
      case 'chat':
        return normalizeChatItem(item, normalized);
      case 'teaching':
        return normalizeTeachingItem(item, normalized);
      case 'comment':
        return normalizeCommentItem(item, normalized);
      default:
        return normalizeGenericItem(item, normalized);
    }
  } catch (error) {
    console.error('Error normalizing content item:', error);
    return item; // Return original if normalization fails
  }
};

// ✅ Normalize chat-specific fields
const normalizeChatItem = (original, base) => {
  return {
    ...base,
    content_type: 'chat',
    title: original.title,
    content: original.text, // Chat uses 'text' field
    summary: original.summary || '',
    audience: original.audience || 'general',
    
    // Chat-specific fields
    is_flagged: original.is_flagged || false,
    
    // User ID format (converse_id for chats)
    user_id: original.user_id, // Keep as char(10)
    author_name: original.username || null,
    author_email: original.email || null,
    
    // Chat metadata
    metadata: {
      message_type: 'chat',
      has_media: hasMediaContent(original),
      character_count: (original.text || '').length,
      word_count: (original.text || '').split(' ').length
    }
  };
};

// ✅ Normalize teaching-specific fields
const normalizeTeachingItem = (original, base) => {
  return {
    ...base,
    content_type: 'teaching',
    title: original.topic, // Teaching uses 'topic' field
    content: original.content,
    description: original.description,
    
    // Teaching-specific fields
    lesson_number: original.lessonNumber,
    subject_matter: original.subjectMatter,
    audience: original.audience || 'general',
    
    // User ID format (numeric for teachings)
    user_id: original.user_id, // Keep as int
    author_name: original.username || null,
    author_email: original.email || null,
    
    // Teaching metadata
    metadata: {
      message_type: 'teaching',
      lesson_number: original.lessonNumber,
      subject_matter: original.subjectMatter,
      has_media: hasMediaContent(original),
      character_count: (original.content || '').length,
      word_count: (original.content || '').split(' ').length,
      educational_level: determineEducationalLevel(original)
    }
  };
};

// ✅ Normalize comment-specific fields
const normalizeCommentItem = (original, base) => {
  return {
    ...base,
    content_type: 'comment',
    title: null, // Comments don't have titles
    content: original.comment, // Comment uses 'comment' field
    
    // Comment-specific fields
    parent_content_id: original.chat_id || original.teaching_id,
    parent_content_type: original.chat_id ? 'chat' : 'teaching',
    parent_comment_id: original.parent_comment_id || null,
    
    // Parent content info
    parent_title: original.chat_title || original.teaching_title || null,
    parent_prefixed_id: original.chat_prefixed_id || original.teaching_prefixed_id || null,
    
    // User ID format (converse_id for comments)
    user_id: original.user_id, // Keep as char(10)
    author_name: original.username || null,
    author_email: original.email || null,
    
    // Comment metadata
    metadata: {
      message_type: 'comment',
      is_reply: !!original.parent_comment_id,
      parent_content_type: original.chat_id ? 'chat' : 'teaching',
      has_media: hasMediaContent(original),
      character_count: (original.comment || '').length,
      word_count: (original.comment || '').split(' ').length
    }
  };
};

// ✅ Normalize generic content item
const normalizeGenericItem = (original, base) => {
  return {
    ...base,
    content_type: 'unknown',
    metadata: {
      message_type: 'unknown',
      has_media: hasMediaContent(original),
      character_count: (base.content || '').length,
      word_count: (base.content || '').split(' ').length
    }
  };
};

// ✅ Normalize media fields from individual columns to array
const normalizeMediaFields = (item) => {
  const media = [];
  
  // Check for up to 3 media fields
  for (let i = 1; i <= 3; i++) {
    const urlField = `media_url${i}`;
    const typeField = `media_type${i}`;
    
    if (item[urlField]) {
      media.push({
        url: item[urlField],
        type: item[typeField] || 'file',
        position: i
      });
    }
  }
  
  return media;
};

// ✅ Check if content has media attachments
const hasMediaContent = (item) => {
  return !!(item.media_url1 || item.media_url2 || item.media_url3);
};

// ✅ Determine educational level based on content
const determineEducationalLevel = (teaching) => {
  const content = (teaching.content || teaching.description || '').toLowerCase();
  const topic = (teaching.topic || '').toLowerCase();
  
  // Simple heuristic based on keywords
  if (content.includes('beginner') || content.includes('basic') || content.includes('introduction')) {
    return 'beginner';
  } else if (content.includes('advanced') || content.includes('expert') || content.includes('professional')) {
    return 'advanced';
  } else if (content.includes('intermediate') || content.includes('medium')) {
    return 'intermediate';
  }
  
  return 'general';
};

// ✅ Get table name from content type
const getTableName = (contentType) => {
  switch (contentType) {
    case 'chat': return 'chats';
    case 'teaching': return 'teachings';
    case 'comment': return 'comments';
    default: return 'unknown';
  }
};

// ✅ Convert between user ID formats
export const convertUserIdFormat = (userId, fromFormat, toFormat) => {
  try {
    // fromFormat: 'numeric' | 'converse_id'
    // toFormat: 'numeric' | 'converse_id'
    
    if (!userId) return null;
    
    if (fromFormat === toFormat) return userId;
    
    // This would need actual database lookup in real implementation
    // For now, return as-is with warning
    console.warn(`User ID conversion needed: ${userId} from ${fromFormat} to ${toFormat}`);
    return userId;
  } catch (error) {
    console.error('Error converting user ID format:', error);
    return userId;
  }
};

// ✅ Validate content structure
export const validateContentStructure = (content, contentType) => {
  const errors = [];
  
  if (!content) {
    errors.push('Content is required');
    return errors;
  }
  
  // Common validations
  if (!content.id) {
    errors.push('Content ID is required');
  }
  
  if (!content.user_id) {
    errors.push('User ID is required');
  }
  
  // Content-type specific validations
  switch (contentType) {
    case 'chat':
      if (!content.title) errors.push('Chat title is required');
      if (!content.text && !content.content) errors.push('Chat text content is required');
      if (content.user_id && typeof content.user_id !== 'string') {
        errors.push('Chat user_id must be string (converse_id)');
      }
      break;
      
    case 'teaching':
      if (!content.topic && !content.title) errors.push('Teaching topic is required');
      if (!content.description) errors.push('Teaching description is required');
      if (content.user_id && typeof content.user_id !== 'number') {
        errors.push('Teaching user_id must be numeric');
      }
      break;
      
    case 'comment':
      if (!content.comment && !content.content) errors.push('Comment text is required');
      if (!content.chat_id && !content.teaching_id) {
        errors.push('Comment must be associated with chat or teaching');
      }
      if (content.user_id && typeof content.user_id !== 'string') {
        errors.push('Comment user_id must be string (converse_id)');
      }
      break;
  }
  
  return errors;
};

// ✅ Sanitize content for display
export const sanitizeContent = (content, options = {}) => {
  if (!content || typeof content !== 'string') return content;
  
  const {
    maxLength = null,
    allowHtml = false,
    stripUrls = false
  } = options;
  
  let sanitized = content;
  
  // Strip HTML if not allowed
  if (!allowHtml) {
    sanitized = sanitized.replace(/<[^>]*>/g, '');
  }
  
  // Strip URLs if requested
  if (stripUrls) {
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/g, '[URL]');
  }
  
  // Truncate if max length specified
  if (maxLength && sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  // Basic XSS prevention
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  return sanitized;
};

// ✅ Generate content summary
export const generateContentSummary = (content, maxLength = 150) => {
  if (!content || typeof content !== 'string') return '';
  
  // Remove extra whitespace and line breaks
  const cleaned = content.replace(/\s+/g, ' ').trim();
  
  if (cleaned.length <= maxLength) return cleaned;
  
  // Try to break at sentence boundary
  const sentences = cleaned.split(/[.!?]+/);
  let summary = '';
  
  for (const sentence of sentences) {
    if ((summary + sentence).length > maxLength) break;
    summary += sentence + '. ';
  }
  
  if (summary.length === 0) {
    // Fall back to word boundary
    const words = cleaned.split(' ');
    summary = words.slice(0, Math.floor(maxLength / 6)).join(' ') + '...';
  }
  
  return summary.trim();
};

// ✅ Format content for API response
export const formatContentResponse = (content, includeMetadata = false) => {
  if (!content) return null;
  
  const formatted = {
    id: content.id,
    prefixed_id: content.prefixed_id,
    content_type: content.content_type,
    title: content.title,
    content: content.content,
    summary: generateContentSummary(content.content || content.description),
    created_at: content.created_at,
    updated_at: content.updated_at,
    approval_status: content.approval_status,
    media: content.media || []
  };
  
  if (includeMetadata) {
    formatted.metadata = content.metadata || {};
    formatted.user_info = {
      user_id: content.user_id,
      author_name: content.author_name,
      author_email: content.author_email
    };
    formatted.admin_info = {
      admin_notes: content.admin_notes,
      reviewed_by: content.reviewed_by,
      reviewed_at: content.reviewed_at
    };
  }
  
  return formatted;
};

// ✅ Batch normalize multiple content items
export const batchNormalizeContent = (items, contentType) => {
  if (!Array.isArray(items)) return [];
  
  return items.map(item => {
    try {
      return normalizeContentItem(item, contentType);
    } catch (error) {
      console.error('Error normalizing item:', error, item);
      return item; // Return original if normalization fails
    }
  });
};

// ✅ Content search helpers
export const prepareSearchQuery = (query, options = {}) => {
  if (!query || typeof query !== 'string') return '';
  
  const {
    removeStopWords = true,
    minLength = 2
  } = options;
  
  let prepared = query.toLowerCase().trim();
  
  // Remove common stop words if requested
  if (removeStopWords) {
    const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = prepared.split(' ').filter(word => 
      word.length >= minLength && !stopWords.includes(word)
    );
    prepared = words.join(' ');
  }
  
  return prepared;
};

// ✅ Content filtering helpers
export const applyContentFilters = (items, filters) => {
  if (!Array.isArray(items)) return [];
  
  let filtered = [...items];
  
  // Apply approval status filter
  if (filters.approval_status) {
    filtered = filtered.filter(item => 
      item.approval_status === filters.approval_status
    );
  }
  
  // Apply user filter
  if (filters.user_id) {
    filtered = filtered.filter(item => 
      item.user_id === filters.user_id || item.author_id === filters.user_id
    );
  }
  
  // Apply content type filter
  if (filters.content_type) {
    filtered = filtered.filter(item => 
      item.content_type === filters.content_type
    );
  }
  
  // Apply date range filters
  if (filters.start_date) {
    const startDate = new Date(filters.start_date);
    filtered = filtered.filter(item => 
      new Date(item.created_at) >= startDate
    );
  }
  
  if (filters.end_date) {
    const endDate = new Date(filters.end_date);
    filtered = filtered.filter(item => 
      new Date(item.created_at) <= endDate
    );
  }
  
  // Apply search filter
  if (filters.search) {
    const searchTerm = prepareSearchQuery(filters.search);
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const searchableText = [
          item.title,
          item.content,
          item.description,
          item.subject_matter,
          item.audience
        ].filter(Boolean).join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm);
      });
    }
  }
  
  return filtered;
};

// ✅ Export all helper functions
export default {
  normalizeContentItem,
  convertUserIdFormat,
  validateContentStructure,
  sanitizeContent,
  generateContentSummary,
  formatContentResponse,
  batchNormalizeContent,
  prepareSearchQuery,
  applyContentFilters
};