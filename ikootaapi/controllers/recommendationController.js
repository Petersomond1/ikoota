// Content Recommendation Controller
// Provides external learning resource recommendations

import {
  generateRecommendations,
  analyzeContent,
  trackRecommendationInteraction,
  getRecommendationAnalytics
} from '../services/recommendationService.js';

import { getAllChats } from '../services/chatServices.js';
import { getAllTeachings } from '../services/teachingsServices.js';
import { getAllComments } from '../services/commentServices.js';

// ===============================================
// CONTENT-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations for specific content
export const getContentRecommendations = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const {
      includeExternal = 'true',
      maxCurated = 3,
      maxExternal = 2,
      sources = 'youtube',
      minRating = 4.0
    } = req.query;

    // Validate content type
    const validTypes = ['chat', 'teaching', 'comment'];
    if (!validTypes.includes(contentType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid content type',
        validTypes,
        provided: contentType
      });
    }

    // Fetch content based on type
    let content = null;
    let text = '';

    try {
      switch (contentType) {
        case 'chat':
          const chats = await getAllChats({ id: contentId });
          content = chats[0];
          if (!content) throw new Error('Chat not found');
          text = [content?.title, content?.description, content?.content].filter(Boolean).join(' ');
          break;

        case 'teaching':
          const teachings = await getAllTeachings({ id: contentId });
          content = teachings[0];
          if (!content) throw new Error('Teaching not found');
          text = [content?.topic, content?.description, content?.content, content?.summary].filter(Boolean).join(' ');
          break;

        case 'comment':
          const comments = await getAllComments({ id: contentId });
          content = comments[0];
          if (!content) throw new Error('Comment not found');
          text = content?.comment || '';
          break;
      }
    } catch (fetchError) {
      return res.status(404).json({
        success: false,
        error: `${contentType} not found`,
        id: contentId,
        details: fetchError.message
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No content available for analysis',
        contentType,
        id: contentId
      });
    }

    // Generate recommendations
    const recommendationResult = await generateRecommendations(text, {
      includeExternal: includeExternal === 'true',
      maxCurated: parseInt(maxCurated),
      maxExternal: parseInt(maxExternal),
      sources: typeof sources === 'string' ? sources.split(',') : sources,
      minRating: parseFloat(minRating)
    });

    if (!recommendationResult.success) {
      return res.status(500).json({
        success: false,
        error: recommendationResult.error,
        fallback: 'Unable to generate recommendations for this content'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Recommendations generated successfully',
      data: {
        contentId,
        contentType,
        contentPreview: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        ...recommendationResult.data
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate content recommendations',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// TEXT-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations for arbitrary text
export const getTextRecommendations = async (req, res) => {
  try {
    const {
      text,
      includeExternal = true,
      maxCurated = 3,
      maxExternal = 2,
      sources = ['youtube'],
      minRating = 4.0
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required',
        example: {
          text: 'I want to learn JavaScript programming...',
          includeExternal: true,
          maxCurated: 3
        }
      });
    }

    if (text.length > 5000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long for analysis',
        limit: 5000,
        provided: text.length
      });
    }

    // Generate recommendations
    const recommendationResult = await generateRecommendations(text, {
      includeExternal,
      maxCurated,
      maxExternal,
      sources,
      minRating
    });

    res.status(200).json({
      success: true,
      message: 'Text recommendations generated successfully',
      data: recommendationResult.data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate text recommendations',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// TOPIC-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations by topic/category
export const getTopicRecommendations = async (req, res) => {
  try {
    const { topic } = req.params;
    const {
      difficulty = 'beginner',
      maxResults = 5,
      includeExternal = 'true',
      sources = 'youtube'
    } = req.query;

    const validTopics = ['programming', 'web-development', 'data-science', 'design', 'business', 'math'];
    if (!validTopics.includes(topic)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid topic',
        validTopics,
        provided: topic
      });
    }

    // Create mock content for topic analysis
    const topicTexts = {
      'programming': `Learn ${difficulty} programming concepts including algorithms, data structures, and coding best practices`,
      'web-development': `Master ${difficulty} web development with HTML, CSS, JavaScript, and modern frameworks`,
      'data-science': `Explore ${difficulty} data science techniques, analysis methods, and machine learning`,
      'design': `Discover ${difficulty} design principles, UI/UX concepts, and design tools`,
      'business': `Understand ${difficulty} business strategy, management, and leadership skills`,
      'math': `Study ${difficulty} mathematics including algebra, calculus, and statistics`
    };

    const text = topicTexts[topic];

    // Generate recommendations
    const recommendationResult = await generateRecommendations(text, {
      includeExternal: includeExternal === 'true',
      maxCurated: Math.ceil(maxResults / 2),
      maxExternal: Math.floor(maxResults / 2),
      sources: typeof sources === 'string' ? sources.split(',') : sources,
      minRating: 4.0
    });

    res.status(200).json({
      success: true,
      message: `${topic} recommendations generated successfully`,
      data: {
        topic,
        difficulty,
        ...recommendationResult.data
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Topic recommendation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate topic recommendations',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// USER INTERACTION TRACKING
// ===============================================

// Track user interaction with recommendations
export const trackInteraction = async (req, res) => {
  try {
    const {
      contentId,
      contentType,
      recommendationUrl,
      interactionType, // 'view', 'click', 'like', 'dislike'
      source
    } = req.body;

    const userId = req.user?.id || req.user?.user_id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required'
      });
    }

    const validInteractions = ['view', 'click', 'like', 'dislike', 'bookmark'];
    if (!validInteractions.includes(interactionType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid interaction type',
        validTypes: validInteractions,
        provided: interactionType
      });
    }

    // Track the interaction
    const result = await trackRecommendationInteraction({
      userId,
      contentId,
      contentType,
      recommendationUrl,
      interactionType,
      source
    });

    res.status(200).json({
      success: true,
      message: 'Interaction tracked successfully',
      data: {
        userId,
        contentId,
        interactionType,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Interaction tracking error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to track interaction',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// RECOMMENDATION ANALYTICS
// ===============================================

// Get recommendation analytics
export const getAnalytics = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const userId = req.user?.id || req.user?.user_id;

    const analytics = await getRecommendationAnalytics({
      userId,
      days: parseInt(days)
    });

    res.status(200).json({
      success: true,
      message: 'Recommendation analytics retrieved',
      data: analytics,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get analytics',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BULK RECOMMENDATIONS
// ===============================================

// Get recommendations for multiple content items
export const getBulkRecommendations = async (req, res) => {
  try {
    const { items, options = {} } = req.body; // items: [{type, id}]

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
        example: {
          items: [
            { type: 'teaching', id: '1' },
            { type: 'chat', id: '2' }
          ]
        }
      });
    }

    if (items.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Too many items for bulk recommendations',
        limit: 10,
        provided: items.length
      });
    }

    const results = [];
    const errors = [];

    // Process each item
    for (const item of items) {
      try {
        const { type, id } = item;
        
        // Fetch content
        let text = '';
        
        switch (type) {
          case 'chat':
            const chats = await getAllChats({ id });
            const chat = chats[0];
            text = [chat?.title, chat?.description, chat?.content].filter(Boolean).join(' ');
            break;

          case 'teaching':
            const teachings = await getAllTeachings({ id });
            const teaching = teachings[0];
            text = [teaching?.topic, teaching?.description, teaching?.content].filter(Boolean).join(' ');
            break;

          case 'comment':
            const comments = await getAllComments({ id });
            const comment = comments[0];
            text = comment?.comment || '';
            break;

          default:
            throw new Error(`Invalid content type: ${type}`);
        }

        if (!text) {
          errors.push({ id, type, error: 'Content not found' });
          continue;
        }

        // Generate recommendations
        const recommendationResult = await generateRecommendations(text, {
          ...options,
          maxCurated: 2, // Limit for bulk operations
          maxExternal: 1
        });

        results.push({
          id,
          type,
          recommendations: recommendationResult.data,
          success: recommendationResult.success
        });

      } catch (error) {
        errors.push({ id: item.id, type: item.type, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk recommendations completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        results,
        errors,
        stats: {
          total: items.length,
          successful: results.length,
          failed: errors.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk recommendations error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bulk recommendations failed',
      timestamp: new Date().toISOString()
    });
  }
};

export default {
  getContentRecommendations,
  getTextRecommendations,
  getTopicRecommendations,
  trackInteraction,
  getAnalytics,
  getBulkRecommendations
};