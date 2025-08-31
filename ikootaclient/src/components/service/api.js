//ikootaclient\src\components\service\api.js - REPLACE YOUR EXISTING FILE WITH THIS
import axios from 'axios';

// ✅ CRITICAL CHANGE: Use /api instead of full URL to use proxy
const api = axios.create({
  baseURL: 'http://localhost:3000/api', // This will use the Vite proxy to forward to localhost:3000/api
  timeout: 15000,
  withCredentials: true, // Important for session cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// ✅ SIMPLIFIED: Single request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    console.log('🔍 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      hasToken: !!token,
      headers: config.headers
    });
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// ✅ ENHANCED: Response interceptor with better error handling
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Response Error:', {
      status: error.response?.status,
      url: error.config?.url,
      data: error.response?.data,
      message: error.message
    });
    
    // ✅ SPECIFIC: Check for HTML response (routing issue)
    if (error.response?.data && typeof error.response.data === 'string' && error.response.data.includes('<!doctype')) {
      console.error('❌ Received HTML instead of JSON - this is a routing/proxy issue');
      console.error('Full HTML response:', error.response.data.substring(0, 200));
    }
    
    // Handle authentication errors
    if (error.response?.status === 401) {
      console.log('🔐 Unauthorized - removing token');
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
    }
    
    // Enhance error object with useful info
    const enhancedError = {
      ...error,
      message: error.response?.data?.message || 
               error.response?.data?.error || 
               error.message || 
               'Network Error',
      status: error.response?.status,
      url: error.config?.url
    };
    
    return Promise.reject(enhancedError);
  }
);

export default api;



