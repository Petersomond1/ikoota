// ikootaclient/src/components/service/useFetchTeachings.js
import { useQuery } from '@tanstack/react-query';
import api from './api';
import { normalizeTeachingsResponse, enhanceTeaching, debugApiResponse } from '../../components/utils/apiDebugHelper';

export const useFetchTeachings = () => {
  return useQuery({
    queryKey: ['teachings'],
    queryFn: async () => {
      try {
        console.log('🚀 Fetching teachings...');
        
      const response = await api.get('/content/teachings');
        
        // Debug the response
        debugApiResponse(response, '/teachings');
        
        // Normalize the response structure
        const teachingsData = normalizeTeachingsResponse(response);
        
        // Enhance each teaching with consistent structure
        const enhancedTeachings = teachingsData.map((teaching, index) => 
          enhanceTeaching(teaching, index)
        );
        
        // Sort by most recent first
        enhancedTeachings.sort((a, b) => {
          const aDate = new Date(a.display_date);
          const bDate = new Date(b.display_date);
          return bDate - aDate;
        });
        
        console.log(`✅ Successfully processed ${enhancedTeachings.length} teachings`);
        return enhancedTeachings;
        
      } catch (error) {
        console.error('❌ Error in useFetchTeachings:', error);
        
        // Enhanced error logging
        console.error('📋 Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          url: error.config?.url
        });
        
        // Throw the error for React Query to handle
        throw new Error(`Failed to fetch teachings: ${error.message}`);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      // Retry up to 3 times for network errors, but not for 4xx errors
      if (error.response?.status >= 400 && error.response?.status < 500) {
        return false; // Don't retry client errors
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (error) => {
      console.error('🚨 React Query error in useFetchTeachings:', error);
    },
    onSuccess: (data) => {
      console.log('🎉 useFetchTeachings success:', data?.length, 'teachings loaded');
    }
  });
};


// import { useMutation, useQuery } from "@tanstack/react-query";
// import axios from "axios";
// import api from "./api.js";

// // Fetch teachings
// export const useFetchTeachings = () => {
//   // console.log("this is the get request");

//   return useQuery({
//     queryKey: ["teachings"], // Corrected to use an array
//     queryFn: async () => {
//       const response = await api.get("/teachings");
//       return response.data;
//     },
//   });
// };