// Enhanced search hooks for backend API integration
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import api from '../components/service/api';

// ===============================================
// INDIVIDUAL SEARCH HOOKS
// ===============================================

// Search teachings with backend API
export const useSearchTeachings = (searchOptions) => {
  const { query, filters = {}, enabled = true } = searchOptions;
  
  return useQuery({
    queryKey: ['search', 'teachings', query, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      
      console.log('🔍 Searching teachings:', { query, filters });
      const response = await api.get(`/content/teachings/search?${params}`);
      return response.data.data || [];
    },
    enabled: enabled && query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

// Search chats with backend API
export const useSearchChats = (searchOptions) => {
  const { query, filters = {}, enabled = true } = searchOptions;
  
  return useQuery({
    queryKey: ['search', 'chats', query, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      
      console.log('🔍 Searching chats:', { query, filters });
      const response = await api.get(`/content/chats/search?${params}`);
      return response.data.data || [];
    },
    enabled: enabled && query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

// Search comments with backend API
export const useSearchComments = (searchOptions) => {
  const { query, filters = {}, enabled = true } = searchOptions;
  
  return useQuery({
    queryKey: ['search', 'comments', query, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return [];
      
      const params = new URLSearchParams({
        q: query,
        ...filters
      });
      
      console.log('🔍 Searching comments:', { query, filters });
      const response = await api.get(`/content/comments/search?${params}`);
      return response.data.data || [];
    },
    enabled: enabled && query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

// ===============================================
// GLOBAL SEARCH HOOK
// ===============================================

// Global search across all content types
export const useGlobalSearch = (searchOptions) => {
  const { query, types = 'all', filters = {}, enabled = true } = searchOptions;
  
  return useQuery({
    queryKey: ['search', 'global', query, types, filters],
    queryFn: async () => {
      if (!query || query.length < 2) return { chats: [], teachings: [], comments: [], total: 0 };
      
      const params = new URLSearchParams({
        q: query,
        types,
        ...filters
      });
      
      console.log('🌐 Global search:', { query, types, filters });
      const response = await api.get(`/content/search/global?${params}`);
      return response.data.data || { chats: [], teachings: [], comments: [], total: 0 };
    },
    enabled: enabled && query && query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
    retry: 2
  });
};

// ===============================================
// SMART SEARCH HOOK (ADAPTIVE)
// ===============================================

// Adaptive search that switches between client-side and server-side based on data size
export const useSmartSearch = (searchOptions) => {
  const { 
    query, 
    contentType = 'teachings', // 'teachings', 'chats', 'comments', 'all'
    localData = [], 
    useServerSearch = true,
    filters = {},
    enabled = true 
  } = searchOptions;

  // Choose appropriate search hook based on content type
  const hookMap = {
    teachings: useSearchTeachings,
    chats: useSearchChats,  
    comments: useSearchComments,
    all: useGlobalSearch
  };

  const searchHook = hookMap[contentType] || useSearchTeachings;

  // Use server search if enabled, otherwise return local filtered data
  const serverSearch = searchHook({ 
    query, 
    filters, 
    enabled: enabled && useServerSearch 
  });

  // Client-side fallback for small datasets
  const clientResults = useMemo(() => {
    if (!query || !localData || localData.length === 0) return [];
    
    const searchLower = query.toLowerCase();
    return localData.filter(item => {
      const searchFields = [
        item.topic || item.title || '',
        item.content || item.text || item.comment || '',
        item.description || item.summary || '',
        item.author || item.user_id || '',
        `${item.id}` || ''
      ];
      
      return searchFields.some(field => 
        field && field.toString().toLowerCase().includes(searchLower)
      );
    });
  }, [query, localData]);

  // Return server results if available, otherwise client results
  return {
    data: useServerSearch ? (serverSearch.data || []) : clientResults,
    isLoading: useServerSearch ? serverSearch.isLoading : false,
    error: useServerSearch ? serverSearch.error : null,
    refetch: useServerSearch ? serverSearch.refetch : () => {},
    searchMethod: useServerSearch ? 'server' : 'client'
  };
};

export default {
  useSearchTeachings,
  useSearchChats,
  useSearchComments,
  useGlobalSearch,
  useSmartSearch
};