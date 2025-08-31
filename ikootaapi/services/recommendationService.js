// External Content Recommendation Engine
// Helps learners discover relevant external resources

import axios from 'axios';

// ===============================================
// RECOMMENDATION SOURCES CONFIGURATION
// ===============================================

const RECOMMENDATION_SOURCES = {
  // Educational platforms
  coursera: {
    name: 'Coursera',
    baseUrl: 'https://api.coursera.org/api/courses.v1',
    apiKey: process.env.COURSERA_API_KEY,
    searchEndpoint: '/search',
    enabled: false, // Enable when API key is available
    categories: ['programming', 'data-science', 'business', 'design']
  },
  
  udemy: {
    name: 'Udemy',
    baseUrl: 'https://www.udemy.com/api-2.0',
    apiKey: process.env.UDEMY_API_KEY,
    searchEndpoint: '/courses/',
    enabled: false, // Enable when API key is available
    categories: ['development', 'design', 'marketing', 'business']
  },

  // Free educational resources
  khanAcademy: {
    name: 'Khan Academy',
    baseUrl: 'https://www.khanacademy.org/api/v1',
    searchEndpoint: '/topic',
    enabled: true, // Public API
    categories: ['math', 'science', 'programming', 'economics']
  },

  // Documentation and tutorials
  mdn: {
    name: 'MDN Web Docs',
    baseUrl: 'https://developer.mozilla.org/api/v1',
    searchEndpoint: '/search',
    enabled: true,
    categories: ['web-development', 'javascript', 'css', 'html']
  },

  // Video content
  youtube: {
    name: 'YouTube Educational',
    baseUrl: 'https://www.googleapis.com/youtube/v3',
    apiKey: process.env.YOUTUBE_API_KEY,
    searchEndpoint: '/search',
    enabled: !!process.env.YOUTUBE_API_KEY,
    categories: ['tutorials', 'lectures', 'courses']
  }
};

// ===============================================
// BUILT-IN CURATED RECOMMENDATIONS
// ===============================================

const CURATED_RECOMMENDATIONS = {
  programming: [
    {
      title: 'freeCodeCamp - Learn to Code for Free',
      url: 'https://www.freecodecamp.org',
      description: 'Free coding bootcamp with interactive lessons and projects',
      type: 'interactive',
      difficulty: 'beginner',
      tags: ['javascript', 'python', 'web-development'],
      rating: 4.8,
      community_recommended: 95
    },
    {
      title: 'The Odin Project - Full Stack Curriculum',
      url: 'https://www.theodinproject.com',
      description: 'Free full-stack curriculum with hands-on projects',
      type: 'curriculum',
      difficulty: 'intermediate',
      tags: ['full-stack', 'ruby', 'javascript'],
      rating: 4.7,
      community_recommended: 87
    }
  ],

  'data-science': [
    {
      title: 'Kaggle Learn - Micro-Courses',
      url: 'https://www.kaggle.com/learn',
      description: 'Free micro-courses on data science and machine learning',
      type: 'course',
      difficulty: 'intermediate',
      tags: ['python', 'machine-learning', 'data-analysis'],
      rating: 4.6,
      community_recommended: 89
    }
  ],

  design: [
    {
      title: 'Google Design - Resources and Tools',
      url: 'https://design.google',
      description: 'Design principles, tools, and resources from Google',
      type: 'resources',
      difficulty: 'intermediate',
      tags: ['ui-design', 'material-design', 'prototyping'],
      rating: 4.5,
      community_recommended: 78
    }
  ]
};

// ===============================================
// CONTENT ANALYSIS AND MATCHING
// ===============================================

// Extract topics and keywords from content
export const analyzeContent = (content) => {
  if (!content || typeof content !== 'string') {
    return { topics: [], keywords: [], difficulty: 'beginner' };
  }

  const text = content.toLowerCase();
  
  // Topic detection
  const topicPatterns = {
    'programming': ['code', 'programming', 'development', 'software', 'algorithm', 'function'],
    'web-development': ['html', 'css', 'javascript', 'react', 'vue', 'angular', 'web', 'frontend', 'backend'],
    'data-science': ['data', 'analysis', 'statistics', 'machine learning', 'ai', 'python', 'pandas'],
    'design': ['design', 'ui', 'ux', 'interface', 'visual', 'prototype', 'figma'],
    'business': ['business', 'marketing', 'strategy', 'management', 'leadership'],
    'math': ['math', 'mathematics', 'calculus', 'algebra', 'geometry', 'statistics']
  };

  const topics = [];
  const keywords = [];

  // Find matching topics
  for (const [topic, patterns] of Object.entries(topicPatterns)) {
    const matches = patterns.filter(pattern => text.includes(pattern));
    if (matches.length > 0) {
      topics.push(topic);
      keywords.push(...matches);
    }
  }

  // Determine difficulty level
  const difficultPatterns = {
    'beginner': ['basic', 'intro', 'beginner', 'start', 'learn', 'fundamentals'],
    'intermediate': ['intermediate', 'advanced', 'complex', 'deep', 'detailed'],
    'advanced': ['expert', 'professional', 'master', 'advanced', 'senior']
  };

  let difficulty = 'beginner';
  for (const [level, patterns] of Object.entries(difficultPatterns)) {
    if (patterns.some(pattern => text.includes(pattern))) {
      difficulty = level;
      break;
    }
  }

  return {
    topics: [...new Set(topics)],
    keywords: [...new Set(keywords)],
    difficulty,
    wordCount: content.split(' ').length
  };
};

// ===============================================
// RECOMMENDATION GENERATION
// ===============================================

// Get curated recommendations based on content analysis
export const getCuratedRecommendations = (contentAnalysis, options = {}) => {
  const { maxResults = 5, minRating = 4.0 } = options;
  const { topics, difficulty, keywords } = contentAnalysis;

  let recommendations = [];

  // Get recommendations for each identified topic
  topics.forEach(topic => {
    if (CURATED_RECOMMENDATIONS[topic]) {
      recommendations.push(...CURATED_RECOMMENDATIONS[topic]);
    }
  });

  // Score recommendations based on relevance
  recommendations = recommendations.map(rec => {
    let score = rec.rating * 10; // Base score from rating

    // Bonus for matching difficulty
    if (rec.difficulty === difficulty) score += 20;
    else if (Math.abs(['beginner', 'intermediate', 'advanced'].indexOf(rec.difficulty) - 
                     ['beginner', 'intermediate', 'advanced'].indexOf(difficulty)) === 1) score += 10;

    // Bonus for matching keywords
    const keywordMatches = keywords.filter(keyword => 
      rec.tags.some(tag => tag.includes(keyword) || keyword.includes(tag))
    );
    score += keywordMatches.length * 5;

    // Bonus for community recommendation
    score += (rec.community_recommended / 100) * 15;

    return { ...rec, relevanceScore: score };
  });

  // Remove duplicates and sort by relevance
  const uniqueRecommendations = recommendations
    .filter((rec, index, self) => 
      index === self.findIndex(r => r.url === rec.url)
    )
    .filter(rec => rec.rating >= minRating)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);

  return uniqueRecommendations;
};

// Get external API recommendations (when available)
export const getExternalRecommendations = async (contentAnalysis, options = {}) => {
  const { source = 'youtube', maxResults = 3 } = options;
  const { topics, keywords } = contentAnalysis;

  const sourceConfig = RECOMMENDATION_SOURCES[source];
  if (!sourceConfig || !sourceConfig.enabled) {
    console.warn(`Recommendation source ${source} not available or not enabled`);
    return [];
  }

  try {
    // Build search query from topics and keywords
    const searchQuery = [...topics, ...keywords.slice(0, 3)].join(' ');

    let recommendations = [];

    if (source === 'youtube' && process.env.YOUTUBE_API_KEY) {
      const response = await axios.get(`${sourceConfig.baseUrl}/search`, {
        params: {
          key: sourceConfig.apiKey,
          q: searchQuery + ' tutorial',
          part: 'snippet',
          type: 'video',
          maxResults: maxResults,
          order: 'relevance',
          videoDuration: 'medium' // Prefer medium-length tutorials
        }
      });

      recommendations = response.data.items.map(item => ({
        title: item.snippet.title,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
        description: item.snippet.description.substring(0, 200) + '...',
        type: 'video',
        thumbnail: item.snippet.thumbnails.default.url,
        channel: item.snippet.channelTitle,
        publishedAt: item.snippet.publishedAt,
        source: 'youtube'
      }));
    }

    return recommendations;

  } catch (error) {
    console.error(`External recommendation error (${source}):`, error.message);
    return [];
  }
};

// ===============================================
// USER RECOMMENDATION TRACKING
// ===============================================

// Track user interactions with recommendations
export const trackRecommendationInteraction = async (recommendationData) => {
  const {
    userId,
    contentId,
    contentType,
    recommendationUrl,
    interactionType, // 'view', 'click', 'like', 'dislike'
    source
  } = recommendationData;

  // This would typically save to a database
  // For now, just log the interaction
  console.log('📊 Recommendation interaction tracked:', {
    userId,
    contentId,
    contentType,
    recommendationUrl,
    interactionType,
    source,
    timestamp: new Date().toISOString()
  });

  return {
    success: true,
    message: 'Interaction tracked successfully'
  };
};

// Get recommendation analytics
export const getRecommendationAnalytics = async (options = {}) => {
  const { userId, days = 30 } = options;

  // Mock analytics data - would come from database
  const analytics = {
    period: `${days} days`,
    totalRecommendations: 89,
    clickThroughRate: 0.34,
    mostPopularSources: [
      { name: 'YouTube Educational', clicks: 45, ctr: 0.42 },
      { name: 'freeCodeCamp', clicks: 23, ctr: 0.38 },
      { name: 'Khan Academy', clicks: 21, ctr: 0.29 }
    ],
    topCategories: [
      { category: 'programming', recommendations: 34 },
      { category: 'web-development', recommendations: 28 },
      { category: 'data-science', recommendations: 19 }
    ],
    userFeedback: {
      helpful: 67,
      notHelpful: 8,
      rating: 4.2
    }
  };

  return analytics;
};

// ===============================================
// MAIN RECOMMENDATION FUNCTION
// ===============================================

export const generateRecommendations = async (content, options = {}) => {
  const {
    includeExternal = true,
    maxCurated = 3,
    maxExternal = 2,
    sources = ['youtube'],
    minRating = 4.0
  } = options;

  try {
    // Analyze content
    const analysis = analyzeContent(content);

    // Get curated recommendations
    const curatedRecommendations = getCuratedRecommendations(analysis, {
      maxResults: maxCurated,
      minRating
    });

    let externalRecommendations = [];

    // Get external recommendations if enabled
    if (includeExternal && sources.length > 0) {
      for (const source of sources) {
        try {
          const sourceRecs = await getExternalRecommendations(analysis, {
            source,
            maxResults: Math.ceil(maxExternal / sources.length)
          });
          externalRecommendations.push(...sourceRecs);
        } catch (error) {
          console.warn(`Failed to get recommendations from ${source}:`, error.message);
        }
      }
    }

    return {
      success: true,
      data: {
        analysis,
        curated: curatedRecommendations,
        external: externalRecommendations,
        total: curatedRecommendations.length + externalRecommendations.length
      }
    };

  } catch (error) {
    console.error('Recommendation generation error:', error);
    return {
      success: false,
      error: error.message,
      data: {
        analysis: { topics: [], keywords: [], difficulty: 'beginner' },
        curated: [],
        external: [],
        total: 0
      }
    };
  }
};

export default {
  analyzeContent,
  getCuratedRecommendations,
  getExternalRecommendations,
  generateRecommendations,
  trackRecommendationInteraction,
  getRecommendationAnalytics
};