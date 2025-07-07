// Get pending applications with pagination and filtering
export const getPendingApplicationsWithPagination = async (options) => {
  try {
    const { page, limit, status, search, sortBy, sortOrder, stage } = options;
    const offset = (page - 1) * limit;
    const applicationType = stage === 'initial' ? 'initial_application' : 'full_membership';
    
    // Build search conditions (matching old version exactly)
    let searchClause = '';
    let searchParams = [];
    
    if (search) {
      searchClause = 'AND (u.username LIKE ? OR u.email LIKE ?)';
      searchParams = [`%${search}%`, `%${search}%`];
    }
    
    // Build the query with all fields from both versions
    const selectFields = `
      u.id as user_id,
      u.username,
      u.email,
      u.phone,
      u.membership_stage,
      sl.id as application_id,
      sl.answers,
      sl.createdAt as submitted_at,
      sl.application_ticket,
      sl.additional_data,
      sl.admin_notes,
      sl.approval_status as status,
      sl.application_type,
      DATEDIFF(NOW(), sl.createdAt) as days_pending,
      fma.first_accessed_at,
      fma.access_count
    `;
    
    // Main query with proper type casting
    const query = `
      SELECT ${selectFields}
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      LEFT JOIN full_membership_access fma ON u.id = fma.user_id
      WHERE sl.approval_status = ?
        AND sl.application_type = ?
        ${searchClause}
      ORDER BY ${sortBy === 'submitted_at' ? 'sl.createdAt' : sortBy} ${sortOrder}
      LIMIT ? OFFSET ?
    `;
    
    const queryParams = [status, applicationType, ...searchParams, parseInt(limit), offset];
    
    console.log('🔍 Executing query:', query.replace(/\s+/g, ' ').trim());
    
    const [applications] = await db.query(query, queryParams);
    
    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM surveylog sl
      JOIN users u ON CAST(sl.user_id AS UNSIGNED) = u.id
      WHERE sl.approval_status = ?
        AND sl.application_type = ?
        ${searchClause}
    `;
    
    const countParams = [status, applicationType, ...searchParams];
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0]?.total || 0;
    
    return {
      applications: applications || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        totalPages: Math.ceil(total / limit)
      }
    };
    
  } catch (error) {
    console.error('❌ Database error in getPendingApplicationsWithPagination:', error);
    throw new Error(`Failed to fetch pending applications: ${error.message}`);
  }
};

// Get all reports for admin panel
export const getAllReportsForAdmin = async () => {
  try {
    const [reports] = await db.query(`
      SELECT 
        id, reported_id, reporter_id, reason, status, createdAt
      FROM reports 
      ORDER BY createdAt DESC
    `);
    
    return reports;
  } catch (error) {
    console.error('❌ Database error in getAllReportsForAdmin:', error);
    throw new Error(`Failed to fetch reports: ${error.message}`);
  }
};

// Default export for backward compatibility
export default {
  getPendingApplicationsWithPagination,
  getAllReportsForAdmin
};