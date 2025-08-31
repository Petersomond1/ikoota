// External Content Recommendation Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import api from '../components/service/api';

// ===============================================
// CONTENT-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations for specific content
export const useContentRecommendations = (contentType, contentId, options = {}) => {
  const { 
    includeExternal = true,
    maxCurated = 3,
    maxExternal = 2,
    sources = 'youtube',
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['recommendations', contentType, contentId, { includeExternal, maxCurated, maxExternal, sources }],
    queryFn: async () => {
      if (!contentType || !contentId) return null;
      
      const params = new URLSearchParams({
        includeExternal: includeExternal.toString(),
        maxCurated: maxCurated.toString(),
        maxExternal: maxExternal.toString(),
        sources
      });
      
      const response = await api.get(`/content/recommendations/${contentType}/${contentId}?${params}`);
      return response.data.data;
    },
    enabled: enabled && !!contentType && !!contentId,
    staleTime: 15 * 60 * 1000, // 15 minutes
    cacheTime: 60 * 60 * 1000, // 1 hour
    retry: 2
  });
};

// ===============================================
// TEXT-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations for arbitrary text
export const useTextRecommendations = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      text, 
      includeExternal = true, 
      maxCurated = 3, 
      maxExternal = 2, 
      sources = ['youtube'] 
    }) => {
      const response = await api.post('/content/recommendations/text', {
        text,
        includeExternal,
        maxCurated,
        maxExternal,
        sources
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Cache the result for potential reuse
      const textHash = variables.text.substring(0, 50);
      queryClient.setQueryData(['recommendations', 'text', textHash], data);
    }
  });
};

// ===============================================
// TOPIC-BASED RECOMMENDATIONS
// ===============================================

// Get recommendations by topic/category
export const useTopicRecommendations = (topic, difficulty = 'beginner', options = {}) => {
  const { 
    maxResults = 5,
    includeExternal = true,
    sources = 'youtube',
    enabled = true
  } = options;

  return useQuery({
    queryKey: ['recommendations', 'topic', topic, difficulty, { maxResults, includeExternal, sources }],
    queryFn: async () => {
      if (!topic) return null;
      
      const params = new URLSearchParams({
        difficulty,
        maxResults: maxResults.toString(),
        includeExternal: includeExternal.toString(),
        sources
      });
      
      const response = await api.get(`/content/recommendations/topic/${topic}?${params}`);
      return response.data.data;
    },
    enabled: enabled && !!topic,
    staleTime: 30 * 60 * 1000, // 30 minutes
    cacheTime: 2 * 60 * 60 * 1000, // 2 hours
    retry: 2
  });
};

// ===============================================
// BULK RECOMMENDATIONS
// ===============================================

// Get recommendations for multiple content items
export const useBulkRecommendations = () => {
  return useMutation({
    mutationFn: async ({ items, options = {} }) => {
      const response = await api.post('/content/recommendations/bulk', {
        items, // Array of {type, id} objects
        options
      });
      return response.data.data;
    }
  });
};

// ===============================================
// INTERACTION TRACKING
// ===============================================

// Track user interaction with recommendations
export const useRecommendationTracking = () => {
  return useMutation({
    mutationFn: async ({ 
      contentId, 
      contentType, 
      recommendationUrl, 
      interactionType, 
      source 
    }) => {
      const response = await api.post('/content/recommendations/track', {
        contentId,
        contentType,
        recommendationUrl,
        interactionType, // 'view', 'click', 'like', 'dislike'
        source
      });
      return response.data.data;
    },
    onSuccess: () => {
      // Optionally refresh analytics
      console.log('📊 Recommendation interaction tracked');
    }
  });
};

// ===============================================
// RECOMMENDATION ANALYTICS
// ===============================================

// Get recommendation usage analytics
export const useRecommendationAnalytics = (days = 30) => {
  return useQuery({
    queryKey: ['recommendations', 'analytics', days],
    queryFn: async () => {
      const response = await api.get(`/content/recommendations/analytics?days=${days}`);
      return response.data.data;
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
};

// ===============================================
// SMART RECOMMENDATION SYSTEM
// ===============================================

// Automatic recommendations based on content analysis
export const useSmartRecommendations = (content, contentType = 'general') => {
  const [recommendations, setRecommendations] = useState([]);
  const textRecommendations = useTextRecommendations();
  const tracking = useRecommendationTracking();
  
  const generateRecommendations = (options = {}) => {
    if (!content || content.length < 50) return;
    
    const includeExternal = content.length > 500; // Use external for longer content
    const maxCurated = contentType === 'teaching' ? 4 : 3;
    const maxExternal = contentType === 'teaching' ? 3 : 2;
    
    textRecommendations.mutate({
      text: content,
      includeExternal,
      maxCurated,
      maxExternal,
      sources: ['youtube'],
      ...options
    });
  };

  const trackInteraction = (recommendationUrl, interactionType, source = 'curated') => {
    tracking.mutate({
      contentId: null, // Will be set by context
      contentType: contentType,
      recommendationUrl,
      interactionType,
      source
    });
  };

  useEffect(() => {
    if (textRecommendations.data) {
      setRecommendations(textRecommendations.data);
    }
  }, [textRecommendations.data]);

  return {
    recommendations,
    generateRecommendations,
    trackInteraction,
    isLoading: textRecommendations.isLoading,
    error: textRecommendations.error,
    isSuccess: textRecommendations.isSuccess
  };
};

// ===============================================
// LEARNING PATH RECOMMENDATIONS
// ===============================================

// Recommend next steps in learning journey
export const useLearningPathRecommendations = (userProgress, currentTopic) => {
  const [learningPath, setLearningPath] = useState([]);
  const topicRecommendations = useTopicRecommendations(currentTopic);
  
  useEffect(() => {
    if (topicRecommendations.data && userProgress) {
      // Analyze user's current level and suggest next steps
      const difficulty = determineDifficultyLevel(userProgress);
      const nextTopics = suggestNextTopics(currentTopic, userProgress);
      
      setLearningPath({
        currentLevel: difficulty,
        nextTopics,
        recommendations: topicRecommendations.data
      });
    }
  }, [topicRecommendations.data, userProgress, currentTopic]);
  
  return {
    learningPath,
    isLoading: topicRecommendations.isLoading,
    error: topicRecommendations.error,
    refetch: topicRecommendations.refetch
  };
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

// Determine user's difficulty level based on progress
const determineDifficultyLevel = (progress) => {
  if (!progress) return 'beginner';
  
  const completionRate = progress.completed / (progress.total || 1);
  if (completionRate > 0.8) return 'advanced';
  if (completionRate > 0.4) return 'intermediate';
  return 'beginner';
};

// Suggest next topics based on current topic and progress
const suggestNextTopics = (currentTopic, progress) => {
  const topicProgression = {
    'programming': ['web-development', 'data-science'],
    'web-development': ['design', 'business'],
    'data-science': ['math', 'business'],
    'design': ['web-development', 'business'],
    'math': ['data-science', 'programming'],
    'business': ['design', 'programming']
  };
  
  return topicProgression[currentTopic] || [];
};

// Auto-generate recommendations when content becomes available
export const useAutoRecommendations = (content, contentType, enabled = true) => {
  const smartRecs = useSmartRecommendations(content, contentType);
  
  useEffect(() => {
    if (enabled && content && content.length > 100) {
      smartRecs.generateRecommendations();
    }
  }, [content, enabled]);
  
  return smartRecs;
};

export default {
  useContentRecommendations,
  useTextRecommendations,
  useTopicRecommendations,
  useBulkRecommendations,
  useRecommendationTracking,
  useRecommendationAnalytics,
  useSmartRecommendations,
  useLearningPathRecommendations,
  useAutoRecommendations
};