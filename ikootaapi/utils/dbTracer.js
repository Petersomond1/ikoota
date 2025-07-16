// 3. DATABASE QUERY TRACER (ikootaapi/utils/dbTracer.js)
// ============================================================================

class DatabaseTracer {
  constructor(db) {
    this.db = db;
    this.setupQueryTracing();
  }

  setupQueryTracing() {
    // Wrap the query method
    const originalQuery = this.db.query;
    
    this.db.query = async (sql, params) => {
      const queryStart = Date.now();
      const traceId = this.getCurrentTraceId();
      
      console.log('🗄️ DATABASE QUERY START:', {
        traceId,
        sql: this.formatSQL(sql),
        params,
        timestamp: new Date().toISOString()
      });

      try {
        const result = await originalQuery.call(this.db, sql, params);
        const duration = Date.now() - queryStart;
        
        console.log('✅ DATABASE QUERY SUCCESS:', {
          traceId,
          sql: this.formatSQL(sql),
          rowsAffected: result[0]?.length || result.affectedRows || 0,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });

        return result;
      } catch (error) {
        const duration = Date.now() - queryStart;
        
        console.error('❌ DATABASE QUERY ERROR:', {
          traceId,
          sql: this.formatSQL(sql),
          error: error.message,
          duration: `${duration}ms`,
          timestamp: new Date().toISOString()
        });

        throw error;
      }
    };
  }

  getCurrentTraceId() {
    // Get trace ID from current request context
    // You might need to use async_hooks or similar for this
    return global.currentTraceId || 'unknown';
  }

  formatSQL(sql) {
    return sql.replace(/\s+/g, ' ').trim();
  }
}