// Hybrid Content Summarization Service
// Combines built-in extractive summarization with optional external AI

import axios from 'axios';

// ===============================================
// BUILT-IN EXTRACTIVE SUMMARIZATION
// ===============================================

// Simple but effective extractive summarization
export const generateQuickSummary = (text, options = {}) => {
  const {
    maxSentences = 3,
    minSentenceLength = 10,
    maxSummaryLength = 200
  } = options;

  if (!text || text.trim().length === 0) {
    return { summary: '', method: 'empty', confidence: 0 };
  }

  try {
    // Clean and prepare text
    const cleanText = text
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?;:]/g, '')
      .trim();

    if (cleanText.length <= maxSummaryLength) {
      return { 
        summary: cleanText, 
        method: 'passthrough', 
        confidence: 1,
        originalLength: text.length
      };
    }

    // Split into sentences
    const sentences = cleanText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length >= minSentenceLength);

    if (sentences.length <= maxSentences) {
      return {
        summary: sentences.join('. ') + '.',
        method: 'extractive_simple',
        confidence: 0.7,
        originalLength: text.length
      };
    }

    // Score sentences based on multiple factors
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Position scoring (first and last sentences often important)
      if (index === 0) score += 2;
      if (index === sentences.length - 1) score += 1;
      
      // Length scoring (moderate length preferred)
      const wordCount = sentence.split(' ').length;
      if (wordCount >= 8 && wordCount <= 25) score += 1;
      
      // Keyword scoring (common important words)
      const keywords = ['important', 'key', 'main', 'primary', 'essential', 
                       'crucial', 'significant', 'major', 'conclusion', 'summary',
                       'learn', 'understand', 'teach', 'explain', 'discuss'];
      
      const lowerSentence = sentence.toLowerCase();
      keywords.forEach(keyword => {
        if (lowerSentence.includes(keyword)) score += 1;
      });
      
      // Question sentences often important
      if (sentence.includes('?')) score += 0.5;
      
      return { sentence, score, index };
    });

    // Select top sentences
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index) // Restore original order
      .map(item => item.sentence);

    const summary = topSentences.join('. ') + '.';
    
    return {
      summary: summary.length > maxSummaryLength ? 
               summary.substring(0, maxSummaryLength) + '...' : 
               summary,
      method: 'extractive_scored',
      confidence: 0.8,
      originalLength: text.length,
      compressionRatio: summary.length / text.length
    };

  } catch (error) {
    console.error('Quick summarization error:', error);
    return {
      summary: text.substring(0, maxSummaryLength) + '...',
      method: 'fallback_truncate',
      confidence: 0.3,
      originalLength: text.length,
      error: error.message
    };
  }
};

// ===============================================
// EXTERNAL AI SUMMARIZATION
// ===============================================

// Configuration for different AI providers
const AI_PROVIDERS = {
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    headers: {
      'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    model: 'gpt-3.5-turbo'
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/messages',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    model: 'claude-3-haiku-20240307'
  }
};

export const generateAISummary = async (text, options = {}) => {
  const {
    provider = 'openai', // 'openai' or 'anthropic'
    maxLength = 150,
    style = 'educational', // 'educational', 'technical', 'casual'
    focus = 'key_points' // 'key_points', 'action_items', 'overview'
  } = options;

  if (!text || text.trim().length === 0) {
    throw new Error('No text provided for summarization');
  }

  // Check if API key is available
  const config = AI_PROVIDERS[provider];
  if (!config) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  const apiKey = provider === 'openai' ? process.env.OPENAI_API_KEY : process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn(`${provider} API key not configured, falling back to built-in summarization`);
    return generateQuickSummary(text, { maxSummaryLength: maxLength });
  }

  try {
    // Prepare prompt based on style and focus
    const stylePrompts = {
      educational: "as if explaining to a student",
      technical: "focusing on technical details and specifics", 
      casual: "in a conversational, easy-to-understand way"
    };

    const focusPrompts = {
      key_points: "highlighting the main points and key takeaways",
      action_items: "focusing on actionable items and next steps",
      overview: "providing a general overview and context"
    };

    const prompt = `Please summarize the following text in approximately ${maxLength} characters, ${stylePrompts[style]}, ${focusPrompts[focus]}:\n\n${text}`;

    let requestData, response;

    if (provider === 'openai') {
      requestData = {
        model: config.model,
        messages: [
          { role: 'system', content: 'You are a helpful assistant that creates concise, clear summaries.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: Math.ceil(maxLength / 3), // Rough estimate for tokens
        temperature: 0.3
      };

      response = await axios.post(config.url, requestData, { headers: config.headers });
      
      return {
        summary: response.data.choices[0].message.content.trim(),
        method: 'openai_gpt',
        confidence: 0.9,
        originalLength: text.length,
        tokensUsed: response.data.usage?.total_tokens || 0,
        cost: estimateCost(response.data.usage?.total_tokens || 0, 'openai')
      };

    } else if (provider === 'anthropic') {
      requestData = {
        model: config.model,
        max_tokens: Math.ceil(maxLength / 3),
        messages: [
          { role: 'user', content: prompt }
        ]
      };

      response = await axios.post(config.url, requestData, { headers: config.headers });
      
      return {
        summary: response.data.content[0].text.trim(),
        method: 'anthropic_claude',
        confidence: 0.9,
        originalLength: text.length,
        tokensUsed: response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0,
        cost: estimateCost(response.data.usage?.input_tokens + response.data.usage?.output_tokens || 0, 'anthropic')
      };
    }

  } catch (error) {
    console.error(`${provider} API summarization failed:`, error.message);
    
    // Fallback to built-in summarization
    console.log('Falling back to built-in summarization');
    return {
      ...generateQuickSummary(text, { maxSummaryLength: maxLength }),
      fallback: true,
      fallbackReason: error.message
    };
  }
};

// ===============================================
// SMART SUMMARIZATION (HYBRID)
// ===============================================

export const smartSummarize = async (text, options = {}) => {
  const {
    preferredMethod = 'auto', // 'auto', 'builtin', 'ai'
    maxLength = 200,
    urgency = 'normal', // 'urgent', 'normal', 'detailed'
    contentType = 'general' // 'chat', 'teaching', 'comment', 'general'
  } = options;

  // Auto-select method based on content characteristics
  let method = preferredMethod;
  
  if (method === 'auto') {
    const textLength = text.length;
    
    if (urgency === 'urgent' || textLength < 500) {
      method = 'builtin';
    } else if (textLength > 2000 || contentType === 'teaching') {
      method = 'ai';
    } else {
      method = 'builtin';
    }
  }

  // Execute chosen method
  if (method === 'ai') {
    try {
      return await generateAISummary(text, { 
        maxLength, 
        style: contentType === 'teaching' ? 'educational' : 'casual',
        focus: contentType === 'chat' ? 'key_points' : 'overview'
      });
    } catch (error) {
      // Fallback to builtin
      return generateQuickSummary(text, { maxSummaryLength: maxLength });
    }
  } else {
    return generateQuickSummary(text, { maxSummaryLength: maxLength });
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Estimate API costs (rough estimates)
const estimateCost = (tokens, provider) => {
  const rates = {
    openai: 0.002 / 1000, // $0.002 per 1K tokens (rough average)
    anthropic: 0.25 / 1000000 // $0.25 per 1M tokens for Claude Haiku
  };
  
  return ((tokens || 0) * rates[provider]).toFixed(6);
};

// Check if content needs summarization
export const shouldSummarize = (text, threshold = 300) => {
  return text && text.length > threshold;
};

// Get summarization recommendations
export const getSummarizationRecommendation = (text, context = {}) => {
  const length = text?.length || 0;
  
  if (length < 200) return { recommended: false, reason: 'Content too short' };
  if (length < 500) return { recommended: true, method: 'builtin', reason: 'Quick summary sufficient' };
  if (length < 2000) return { recommended: true, method: 'auto', reason: 'Moderate length content' };
  
  return { 
    recommended: true, 
    method: 'ai', 
    reason: 'Long content benefits from AI summarization',
    urgency: context.realTime ? 'urgent' : 'normal'
  };
};

export default {
  generateQuickSummary,
  generateAISummary,
  smartSummarize,
  shouldSummarize,
  getSummarizationRecommendation
};