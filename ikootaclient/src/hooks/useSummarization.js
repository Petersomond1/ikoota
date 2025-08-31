// Content Summarization Hooks
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../components/service/api';

// ===============================================
// INDIVIDUAL CONTENT SUMMARIZATION
// ===============================================

// Summarize specific content by type and ID
export const useContentSummarization = (contentType, contentId, options = {}) => {
  const { 
    method = 'auto', 
    maxLength = 200, 
    enabled = true,
    style = 'educational' 
  } = options;

  return useQuery({
    queryKey: ['summarize', contentType, contentId, method, maxLength],
    queryFn: async () => {
      if (!contentType || !contentId) return null;
      
      const params = new URLSearchParams({
        method,
        maxLength: maxLength.toString(),
        style
      });
      
      const response = await api.get(`/content/summarize/${contentType}/${contentId}?${params}`);
      return response.data.data;
    },
    enabled: enabled && !!contentType && !!contentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
};

// ===============================================
// TEXT SUMMARIZATION
// ===============================================

// Summarize arbitrary text
export const useTextSummarization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ text, method = 'auto', maxLength = 200, style = 'educational' }) => {
      const response = await api.post('/content/summarize/text', {
        text,
        method,
        maxLength,
        style
      });
      return response.data.data;
    },
    onSuccess: (data, variables) => {
      // Cache the result for potential reuse
      queryClient.setQueryData(
        ['summarize', 'text', variables.text.substring(0, 50)], 
        data
      );
    }
  });
};

// ===============================================
// BULK SUMMARIZATION
// ===============================================

// Summarize multiple content items
export const useBulkSummarization = () => {
  return useMutation({
    mutationFn: async ({ items, method = 'builtin', maxLength = 150 }) => {
      const response = await api.post('/content/summarize/bulk', {
        items, // Array of {type, id} objects
        method,
        maxLength
      });
      return response.data.data;
    }
  });
};

// ===============================================
// SUMMARIZATION ANALYTICS
// ===============================================

// Get summarization usage analytics
export const useSummarizationAnalytics = (days = 7) => {
  return useQuery({
    queryKey: ['summarize', 'analytics', days],
    queryFn: async () => {
      const response = await api.get(`/content/summarize/analytics?days=${days}`);
      return response.data.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000 // 15 minutes
  });
};

// ===============================================
// SMART SUMMARIZATION HOOK
// ===============================================

// Automatic summarization based on content length and type
export const useSmartSummarization = (content, contentType = 'general') => {
  const textSummarization = useTextSummarization();
  
  const shouldSummarize = content && content.length > 300;
  const isLongContent = content && content.length > 1000;
  
  const summarize = (options = {}) => {
    if (!content || !shouldSummarize) return null;
    
    const method = isLongContent ? 'ai' : 'auto';
    const maxLength = contentType === 'teaching' ? 250 : 200;
    const style = contentType === 'teaching' ? 'educational' : 'casual';
    
    return textSummarization.mutate({
      text: content,
      method,
      maxLength,
      style,
      ...options
    });
  };

  return {
    summarize,
    shouldSummarize,
    isLoading: textSummarization.isLoading,
    data: textSummarization.data,
    error: textSummarization.error,
    isSuccess: textSummarization.isSuccess
  };
};

// ===============================================
// UTILITY HOOKS
// ===============================================

// Check if content should be summarized
export const useSummarizationRecommendation = (content) => {
  if (!content) return { recommended: false, reason: 'No content' };
  
  const length = content.length;
  
  if (length < 200) return { recommended: false, reason: 'Content too short' };
  if (length < 500) return { recommended: true, method: 'builtin', reason: 'Quick summary' };
  if (length < 2000) return { recommended: true, method: 'auto', reason: 'Moderate content' };
  
  return { 
    recommended: true, 
    method: 'ai', 
    reason: 'Long content benefits from AI summarization' 
  };
};

// Auto-summarize content when it becomes available
export const useAutoSummarize = (content, contentType, enabled = true) => {
  const recommendation = useSummarizationRecommendation(content);
  const textSummarization = useTextSummarization();
  
  React.useEffect(() => {
    if (enabled && recommendation.recommended && content) {
      textSummarization.mutate({
        text: content,
        method: recommendation.method,
        maxLength: contentType === 'teaching' ? 250 : 200,
        style: contentType === 'teaching' ? 'educational' : 'casual'
      });
    }
  }, [content, enabled, recommendation.recommended]);
  
  return {
    summary: textSummarization.data,
    isLoading: textSummarization.isLoading,
    recommendation
  };
};

export default {
  useContentSummarization,
  useTextSummarization,
  useBulkSummarization,
  useSummarizationAnalytics,
  useSmartSummarization,
  useSummarizationRecommendation,
  useAutoSummarize
};