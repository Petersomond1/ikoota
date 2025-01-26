import pool from "../config/db.js";
import CustomError from "../utils/CustomError.js";

export const createCommentService = async ({ user_id, chat_id, comment, media }) => {
  const connection = await pool.getConnection();
  try {
    // Start transaction
    await connection.beginTransaction();

    // Insert comment into the database
    const [result] = await connection.query(
      `
      INSERT INTO comments (user_id, chat_id, comment, media_url1, media_type1, media_url2, media_type2, media_url3, media_type3)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        user_id,
        chat_id,
        comment,
        media[0]?.url || null,
        media[0]?.type || null,
        media[1]?.url || null,
        media[1]?.type || null,
        media[2]?.url || null,
        media[2]?.type || null,
      ]
    );

    // Commit transaction
    await connection.commit();

    return { id: result.insertId };
  } catch (error) {
    // Rollback transaction on error
    await connection.rollback();
    throw new CustomError(error.message);
  } finally {
    connection.release();
  }
};

export const uploadCommentService = async (files) => {
  try {
    // Process files here if needed, for example:
    const uploadedFiles = files.map((file) => ({
      url: file.location, // S3 URL
      type: file.mimetype,
    }));

    return uploadedFiles;
  } catch (error) {
    throw new CustomError(error.message);
  }
};
