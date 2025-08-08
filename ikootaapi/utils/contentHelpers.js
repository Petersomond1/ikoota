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