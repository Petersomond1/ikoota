// 2. BACKEND MIDDLEWARE (ikootaapi/middleware/tracingMiddleware.js)
// ============================================================================

export const tracingMiddleware = (req, res, next) => {
  const traceId = req.headers['x-trace-id'] || `server_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Attach trace info to request
  req.traceId = traceId;
  req.traceStart = Date.now();
  
  // Log incoming request
  console.log('🔄 BACKEND TRACE START:', {
    traceId,
    method: req.method,
    url: req.originalUrl,
    headers: req.headers,
    body: req.body,
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  });

  // Override res.json to capture response
  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - req.traceStart;
    
    console.log('✅ BACKEND TRACE END:', {
      traceId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      responseData: data,
      timestamp: new Date().toISOString()
    });
    
    return originalJson.call(this, data);
  };

  next();
};