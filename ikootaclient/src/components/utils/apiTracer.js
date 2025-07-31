// 1. FRONTEND INTERCEPTOR (ikootaclient/src/utils/apiTracer.js)
// ============================================================================

import axios from 'axios';

class APITracer {
  constructor() {
    this.traces = new Map();
    this.setupInterceptors();
  }

  generateTraceId() {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use(
      (config) => {
        const traceId = this.generateTraceId();
        config.headers['X-Trace-Id'] = traceId;
        
        const trace = {
          traceId,
          method: config.method.toUpperCase(),
          url: config.url,
          baseURL: config.baseURL,
          fullUrl: `${config.baseURL || ''}${config.url}`,
          headers: config.headers,
          data: config.data,
          params: config.params,
          timestamp: new Date().toISOString(),
          stages: []
        };

        // Add frontend stage
        trace.stages.push({
          stage: 'FRONTEND_REQUEST',
          timestamp: new Date().toISOString(),
          location: this.getCallerLocation(),
          data: {
            method: config.method,
            url: config.url,
            headers: config.headers,
            payload: config.data
          }
        });

        this.traces.set(traceId, trace);
        
        console.log('🚀 API TRACE STARTED:', {
          traceId,
          method: config.method.toUpperCase(),
          url: config.url,
          timestamp: trace.timestamp
        });

        return config;
      },
      (error) => {
        console.error('❌ REQUEST INTERCEPTOR ERROR:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    axios.interceptors.response.use(
      (response) => {
        const traceId = response.config.headers['X-Trace-Id'];
        const trace = this.traces.get(traceId);

        if (trace) {
          trace.stages.push({
            stage: 'FRONTEND_RESPONSE',
            timestamp: new Date().toISOString(),
            data: {
              status: response.status,
              statusText: response.statusText,
              headers: response.headers,
              data: response.data
            }
          });

          trace.completed = true;
          trace.completedAt = new Date().toISOString();
          trace.duration = Date.now() - new Date(trace.timestamp).getTime();

          this.logCompleteTrace(trace);
        }

        return response;
      },
      (error) => {
        const traceId = error.config?.headers['X-Trace-Id'];
        const trace = this.traces.get(traceId);

        if (trace) {
          trace.stages.push({
            stage: 'FRONTEND_ERROR',
            timestamp: new Date().toISOString(),
            data: {
              error: error.message,
              status: error.response?.status,
              statusText: error.response?.statusText,
              responseData: error.response?.data
            }
          });

          trace.error = true;
          trace.completedAt = new Date().toISOString();
          trace.duration = Date.now() - new Date(trace.timestamp).getTime();

          this.logCompleteTrace(trace);
        }

        return Promise.reject(error);
      }
    );
  }

  getCallerLocation() {
    const stack = new Error().stack;
    const lines = stack.split('\n');
    // Find the line that contains the actual caller (not interceptor)
    for (let i = 2; i < lines.length; i++) {
      if (!lines[i].includes('interceptor') && !lines[i].includes('apiTracer')) {
        return lines[i].trim();
      }
    }
    return 'Unknown location';
  }

  logCompleteTrace(trace) {
    console.group(`📊 COMPLETE API TRACE: ${trace.traceId}`);
    console.log('🎯 Request:', `${trace.method} ${trace.fullUrl}`);
    console.log('⏱️ Duration:', `${trace.duration}ms`);
    console.log('📍 Stages:', trace.stages.length);
    
    trace.stages.forEach((stage, index) => {
      console.group(`${index + 1}. ${stage.stage}`);
      console.log('⏰ Timestamp:', stage.timestamp);
      console.log('📄 Data:', stage.data);
      if (stage.location) console.log('📍 Location:', stage.location);
      console.groupEnd();
    });
    
    console.groupEnd();

    // Store for debugging
    window.apiTraces = window.apiTraces || [];
    window.apiTraces.push(trace);
  }

  getTrace(traceId) {
    return this.traces.get(traceId);
  }

  getAllTraces() {
    return Array.from(this.traces.values());
  }
}

// Initialize tracer
const apiTracer = new APITracer();
export default apiTracer;