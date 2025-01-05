import db from './db.js';

const dbQuery = async (sql, params = []) => {
  try {
    const [results] = await db.execute(sql, params); // Using mysql2's `execute` method for query parameterization
    return results;
  } catch (err) {
    // Here you can throw a custom error or handle logging if necessary
    throw new Error(`Database query failed: ${err.message}`);
  }
};

export default dbQuery;