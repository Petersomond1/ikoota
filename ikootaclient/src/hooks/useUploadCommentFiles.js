// ikootaclient/src/hooks/useUploadCommentFiles.js - FIXED VERSION
import api from "../components/service/api"; // ✅ FIXED: Missing import

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadCommentFiles } from "../components/service/commentServices.js"; // ✅ Use service instead of direct API

export const useUploadCommentFiles = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // ✅ KEPT: Proper React Query v4/v5 syntax
    mutationKey: ['uploadCommentFiles'],
    mutationFn: async (files) => {
      console.log('🔄 useUploadCommentFiles: Uploading comment files via service:', files);
      
      if (!files || files.length === 0) {
        throw new Error('No files provided for upload');
      }

      // ✅ KEPT: File validation and array handling
      const fileArray = Array.isArray(files) ? files : [files];
      
      // ✅ ENHANCED: Log file details for debugging
      fileArray.forEach((file, index) => {
        if (file instanceof File) {
          console.log(`📁 File ${index + 1}:`, file.name, file.type, `${(file.size / 1024).toFixed(1)}KB`);
        }
      });

      try {
        // ✅ NEW: Use service function instead of direct API call
        const result = await uploadCommentFiles(fileArray);
        
        console.log('✅ Comment files uploaded successfully via service:', result);
        return result;
        
      } catch (error) {
        console.error('❌ Comment file upload failed:', error);
        
        // ✅ KEPT: Enhanced error handling with specific messages
        if (error.message.includes('413') || error.message.includes('large')) {
          throw new Error('Files too large. Please select smaller files.');
        } else if (error.message.includes('415') || error.message.includes('type')) {
          throw new Error('Unsupported file type. Please select valid media files.');
        } else if (error.message.includes('credentials') || error.message.includes('AWS')) {
          throw new Error('Upload service unavailable. Please try again later.');
        } else if (error.message) {
          throw new Error(error.message);
        } else {
          throw new Error('Failed to upload files. Please try again.');
        }
      }
    },
    
    onSuccess: (data) => {
      console.log('🎉 Upload mutation succeeded:', data);
      // ✅ KEPT: Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      queryClient.invalidateQueries({ queryKey: ['parentChatsAndTeachings'] });
      queryClient.invalidateQueries({ queryKey: ['combinedContent'] });
    },
    
    onError: (error) => {
      console.error('💥 Upload mutation failed:', error.message);
    },
    
    // ✅ KEPT: Configure retry behavior
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // ✅ KEPT: Enhanced file validation function
  const validateFiles = (files) => {
    if (!files || files.length === 0) {
      return "No files selected";
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const maxFiles = 3; // Max 3 files for comments
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg', 'video/mov',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg', 'audio/m4a'
    ];

    if (fileArray.length > maxFiles) {
      return `Too many files. Maximum ${maxFiles} files allowed for comments.`;
    }

    for (const file of fileArray) {
      if (!(file instanceof File)) {
        return "Invalid file object";
      }
      
      if (file.size > maxFileSize) {
        return `File "${file.name}" is too large. Maximum size is 10MB.`;
      }
      
      if (!allowedTypes.includes(file.type)) {
        return `File "${file.name}" has unsupported type: ${file.type}`;
      }
    }

    console.log(`✅ File validation passed for ${fileArray.length} comment files`);
    return true;
  };

  // ✅ KEPT: Helper methods for easier usage
  return { 
    mutation,
    validateFiles, 
    // Convenience methods
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending || mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data,
    reset: mutation.reset
  };
};

// ikootaclient/src/hooks/useUpload.js - FIXED VERSION  
//import { useMutation, useQueryClient } from "@tanstack/react-query";
//import api from "../components/service/api";

const useUpload = (endpoint) => {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    // ✅ FIXED: Proper React Query v4/v5 syntax with dynamic key
    mutationKey: ['upload', endpoint],
    mutationFn: async (formData) => {
      console.log(`🔄 Uploading to ${endpoint}:`, formData);

      if (!formData) {
        throw new Error('No form data provided for upload');
      }

      try {
        const response = await api.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        console.log(`✅ Upload to ${endpoint} successful:`, response.data);
        return response.data;
      } catch (error) {
        console.error(`❌ Upload to ${endpoint} failed:`, error);
        
        // Enhanced error handling
        if (error.response?.status === 413) {
          throw new Error('Upload too large. Please select smaller files.');
        } else if (error.response?.status === 415) {
          throw new Error('Unsupported file type. Please select valid files.');
        } else if (error.response?.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        } else if (error.response?.data?.message) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error('Upload failed. Please try again.');
        }
      }
    },
    onSuccess: (data) => {
      console.log(`🎉 ${endpoint} upload succeeded:`, data);
      // Invalidate related queries based on endpoint
      if (endpoint.includes('comments')) {
        queryClient.invalidateQueries({ queryKey: ['comments'] });
      } else if (endpoint.includes('chats')) {
        queryClient.invalidateQueries({ queryKey: ['chats'] });
      }
    },
    onError: (error) => {
      console.error(`💥 ${endpoint} upload failed:`, error.message);
    },
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  // Enhanced file validation
  const validateFiles = (files) => {
    if (!files || files.length === 0) {
      return "No files selected";
    }

    const fileArray = Array.isArray(files) ? files : [files];
    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
    const allowedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/webm', 'video/ogg',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mpeg'
    ];

    for (const file of fileArray) {
      if (!(file instanceof File)) {
        return "Invalid file object";
      }
      
      if (file.size > maxFileSize) {
        return `File "${file.name}" is too large. Maximum size is 10MB.`;
      }
      
      if (!allowedTypes.includes(file.type)) {
        return `File "${file.name}" has unsupported type: ${file.type}`;
      }
    }

    console.log(`✅ File validation passed for ${fileArray.length} files`);
    return true;
  };

  return { 
    validateFiles, 
    mutation,
    // Helper methods for easier usage
    upload: mutation.mutate,
    uploadAsync: mutation.mutateAsync,
    isLoading: mutation.isPending || mutation.isLoading,
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
    data: mutation.data
  };
};

export default useUpload;



