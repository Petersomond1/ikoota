// Content Summarization Controller
// Handles all summarization requests for chats, teachings, comments

import { 
  smartSummarize, 
  generateQuickSummary, 
  generateAISummary,
  shouldSummarize,
  getSummarizationRecommendation
} from '../services/summarizationService.js';

import { getAllChats } from '../services/chatServices.js';
import { getAllTeachings } from '../services/teachingsServices.js';
import { getAllComments } from '../services/commentServices.js';

// ===============================================
// INDIVIDUAL CONTENT SUMMARIZATION
// ===============================================

// Summarize specific content by ID and type
export const summarizeContent = async (req, res) => {
  try {
    const { contentType, contentId } = req.params;
    const { 
      method = 'auto', // 'auto', 'builtin', 'ai'
      maxLength = 200,
      style = 'educational',
      urgency = 'normal'
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

    switch (contentType) {
      case 'chat':
        const chats = await getAllChats({ id: contentId });
        content = chats[0];
        text = [content?.title, content?.description, content?.content].filter(Boolean).join(' ');
        break;

      case 'teaching':
        const teachings = await getAllTeachings({ id: contentId });
        content = teachings[0];
        text = [content?.topic, content?.description, content?.content, content?.summary].filter(Boolean).join(' ');
        break;

      case 'comment':
        const comments = await getAllComments({ id: contentId });
        content = comments[0];
        text = content?.comment || '';
        break;
    }

    if (!content) {
      return res.status(404).json({
        success: false,
        error: `${contentType} not found`,
        id: contentId
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No content available for summarization',
        contentType,
        id: contentId
      });
    }

    // Check if summarization is recommended
    const recommendation = getSummarizationRecommendation(text, { 
      contentType, 
      realTime: urgency === 'urgent' 
    });

    if (!recommendation.recommended) {
      return res.status(200).json({
        success: true,
        message: 'Content does not require summarization',
        data: {
          original: text,
          summary: text,
          method: 'original',
          recommendation
        }
      });
    }

    // Generate summary
    const summaryResult = await smartSummarize(text, {
      preferredMethod: method,
      maxLength: parseInt(maxLength),
      urgency,
      contentType
    });

    res.status(200).json({
      success: true,
      message: 'Content summarized successfully',
      data: {
        contentId,
        contentType,
        original: text,
        originalLength: text.length,
        ...summaryResult,
        recommendation
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Content summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to summarize content',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// BULK SUMMARIZATION
// ===============================================

// Summarize multiple pieces of content
export const bulkSummarize = async (req, res) => {
  try {
    const { 
      items, // Array of {type, id} objects
      method = 'builtin', // For bulk operations, default to fast method
      maxLength = 150 
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Items array is required',
        example: { items: [{ type: 'chat', id: '1' }, { type: 'teaching', id: '2' }] }
      });
    }

    if (items.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Too many items for bulk summarization',
        limit: 50,
        provided: items.length
      });
    }

    const results = [];
    const errors = [];

    // Process each item
    for (const item of items) {
      try {
        const { type, id } = item;
        
        // Fetch content (similar to individual summarization)
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

        // Generate summary (using fast method for bulk)
        const summaryResult = method === 'ai' ? 
          await generateAISummary(text, { maxLength }) :
          generateQuickSummary(text, { maxSummaryLength: maxLength });

        results.push({
          id,
          type,
          summary: summaryResult.summary,
          method: summaryResult.method,
          originalLength: text.length,
          confidence: summaryResult.confidence
        });

      } catch (error) {
        errors.push({ id: item.id, type: item.type, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk summarization completed: ${results.length} successful, ${errors.length} failed`,
      data: {
        summaries: results,
        errors: errors,
        stats: {
          total: items.length,
          successful: results.length,
          failed: errors.length
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Bulk summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Bulk summarization failed',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// TEXT SUMMARIZATION (DIRECT)
// ===============================================

// Summarize arbitrary text (not tied to specific content)
export const summarizeText = async (req, res) => {
  try {
    const { 
      text,
      method = 'auto',
      maxLength = 200,
      style = 'educational',
      focus = 'key_points'
    } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Text content is required',
        example: { text: 'Your content here...' }
      });
    }

    if (text.length > 10000) {
      return res.status(400).json({
        success: false,
        error: 'Text too long for summarization',
        limit: 10000,
        provided: text.length
      });
    }

    // Generate summary
    const summaryResult = method === 'ai' ? 
      await generateAISummary(text, { maxLength, style, focus }) :
      method === 'builtin' ?
        generateQuickSummary(text, { maxSummaryLength: maxLength }) :
        await smartSummarize(text, { preferredMethod: method, maxLength });

    res.status(200).json({
      success: true,
      message: 'Text summarized successfully',
      data: {
        originalLength: text.length,
        ...summaryResult
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Text summarization error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Text summarization failed',
      timestamp: new Date().toISOString()
    });
  }
};

// ===============================================
// SUMMARIZATION ANALYTICS
// ===============================================

// Get summarization recommendations for content
export const getSummarizationAnalytics = async (req, res) => {
  try {
    const { contentType, days = 7 } = req.query;

    // This would typically fetch from a summarization logs table
    // For now, return mock analytics
    const analytics = {
      period: `${days} days`,
      totalSummarizations: 156,
      methodBreakdown: {
        builtin: 89,
        ai: 67,
        auto: 0
      },
      contentTypeBreakdown: {
        teaching: 78,
        chat: 45,
        comment: 33
      },
      averageCompressionRatio: 0.23,
      costAnalysis: {
        totalCost: 2.45,
        costPerSummary: 0.016,
        savedTime: '4.2 hours'
      },
      popularFeatures: [
        'Quick summaries for long teachings',
        'AI summaries for complex content',
        'Bulk summarization for content review'
      ]
    };

    res.status(200).json({
      success: true,
      message: 'Summarization analytics retrieved',
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

export default {
  summarizeContent,
  bulkSummarize,
  summarizeText,
  getSummarizationAnalytics
};