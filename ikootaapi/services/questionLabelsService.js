// ikootaapi/services/questionLabelsService.js
// ===============================================
// QUESTION LABELS SERVICE - Dynamic form label management
// Handles survey form labels, validation, and dynamic form structure
// Enhanced version for survey system reorganization
// ===============================================

import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';
import logger from '../utils/logger.js';

// Default question labels that match your current Applicationsurvey.jsx
const DEFAULT_QUESTION_LABELS = {
  // Personal Information
  fullName: 'Full Name',
  dateOfBirth: 'Date of Birth',
  nationality: 'Nationality',
  currentLocation: 'Current Location',
  phoneNumber: 'Phone Number',
  
  // Educational Background
  highestEducation: 'Highest Level of Education',
  fieldOfStudy: 'Field of Study',
  currentInstitution: 'Current/Most Recent Institution',
  graduationYear: 'Graduation Year',
  
  // Professional Background
  currentOccupation: 'Current Occupation',
  workExperience: 'Years of Work Experience',
  professionalSkills: 'Professional Skills',
  careerGoals: 'Career Goals',
  
  // Interest in Ikoota
  howDidYouHear: 'How did you hear about Ikoota?',
  reasonForJoining: 'Why do you want to join Ikoota?',
  expectedContributions: 'How do you plan to contribute to the community?',
  educationalGoals: 'What are your educational goals?',
  
  // Additional Information
  previousMemberships: 'Previous Memberships',
  specialSkills: 'Special Skills',
  languagesSpoken: 'Languages Spoken',
  availabilityForEvents: 'Availability for Events',
  
  // Agreements
  agreeToTerms: 'I agree to the Terms and Conditions',
  agreeToCodeOfConduct: 'I agree to follow the Community Code of Conduct',
  agreeToDataProcessing: 'I consent to processing of my personal data'
};

// ===============================================
// FETCH FUNCTIONS
// ===============================================

/**
 * Get all question labels from database
 * @returns {Object} Labels object with field_name as keys
 */
export const fetchQuestionLabels = async () => {
  try {
    console.log('🔍 Fetching question labels from database...');
    
    const query = `
      SELECT field_name, label_text, display_order, is_active 
      FROM question_labels 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `;
    
    const result = await db.query(query);
    
    // Handle different database result formats (MySQL2 compatibility)
    let rows;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && typeof result[0][0] === 'object') {
        rows = result[0]; // MySQL2 format [rows, fields]
      } else if (typeof result[0] === 'object' && result[0].field_name) {
        rows = result; // Direct array format
      } else {
        rows = [];
      }
    } else {
      rows = [];
    }
    
    // Convert to object format for easy access
    const labels = {};
    rows.forEach(row => {
      labels[row.field_name] = row.label_text;
    });
    
    // If no labels in database, return defaults
    if (Object.keys(labels).length === 0) {
      console.log('📝 No labels in database, returning defaults');
      return DEFAULT_QUESTION_LABELS;
    }
    
    // Merge with defaults for any missing fields
    const finalLabels = { ...DEFAULT_QUESTION_LABELS, ...labels };
    
    console.log(`✅ Successfully fetched ${Object.keys(finalLabels).length} question labels`);
    return finalLabels;
    
  } catch (error) {
    console.error('❌ Error fetching question labels:', error);
    if (logger?.error) {
      logger.error('Question labels fetch error:', error);
    }
    // Fallback to defaults on error
    return DEFAULT_QUESTION_LABELS;
  }
};

/**
 * Get labels for specific fields only
 * @param {Array} fieldNames - Array of field names to fetch
 * @returns {Object} Labels object with requested fields
 */
export const fetchSpecificLabels = async (fieldNames = []) => {
  try {
    if (!Array.isArray(fieldNames) || fieldNames.length === 0) {
      return {};
    }
    
    const placeholders = fieldNames.map(() => '?').join(',');
    const query = `
      SELECT field_name, label_text 
      FROM question_labels 
      WHERE field_name IN (${placeholders}) AND is_active = 1
    `;
    
    const [rows] = await db.query(query, fieldNames);
    
    const labels = {};
    rows.forEach(row => {
      labels[row.field_name] = row.label_text;
    });
    
    return labels;
    
  } catch (error) {
    console.error('❌ Error fetching specific labels:', error);
    return {};
  }
};

// ===============================================
// UPDATE FUNCTIONS
// ===============================================

/**
 * Update question labels in database
 * @param {Object} labels - Object with field_name as keys and label_text as values
 */
export const updateQuestionLabels = async (labels) => {
  const connection = await db.getConnection();
  
  try {
    console.log('🔍 Updating question labels:', Object.keys(labels).length, 'labels');
    
    if (!labels || typeof labels !== 'object') {
      throw new CustomError('Labels object is required', 400);
    }
    
    await connection.beginTransaction();
    
    try {
      // Clear existing labels (optional - you might want to keep and update instead)
      await connection.query('DELETE FROM question_labels');
      console.log('✅ Cleared existing labels');
      
      // Insert new labels with proper display order
      let displayOrder = 1;
      for (const [fieldName, labelText] of Object.entries(labels)) {
        if (labelText && labelText.trim()) {
          const insertQuery = `
            INSERT INTO question_labels 
            (field_name, label_text, display_order, is_active, createdAt, updatedAt) 
            VALUES (?, ?, ?, 1, NOW(), NOW())
          `;
          await connection.query(insertQuery, [fieldName, labelText.trim(), displayOrder]);
          console.log(`✅ Inserted label ${displayOrder}: ${fieldName} = "${labelText}"`);
          displayOrder++;
        }
      }
      
      await connection.commit();
      console.log('✅ Question labels updated successfully');
      
    } catch (insertError) {
      await connection.rollback();
      throw insertError;
    }
    
  } catch (error) {
    console.error('❌ Error updating question labels:', error);
    throw new CustomError(`Failed to update question labels: ${error.message}`, 500);
  } finally {
    connection.release();
  }
};

/**
 * Update a single question label
 * @param {string} fieldName - Field name to update
 * @param {string} labelText - New label text
 */
export const updateSingleLabel = async (fieldName, labelText) => {
  try {
    const query = `
      UPDATE question_labels 
      SET label_text = ?, updatedAt = NOW() 
      WHERE field_name = ?
    `;
    
    const [result] = await db.query(query, [labelText, fieldName]);
    
    if (result.affectedRows === 0) {
      // If doesn't exist, insert it
      await db.query(
        'INSERT INTO question_labels (field_name, label_text, display_order, is_active) VALUES (?, ?, ?, 1)',
        [fieldName, labelText, 999] // High display order for new fields
      );
    }
    
    return { success: true, fieldName, labelText };
    
  } catch (error) {
    console.error('❌ Error updating single label:', error);
    throw new CustomError(`Failed to update label: ${error.message}`, 500);
  }
};

// ===============================================
// INITIALIZATION FUNCTIONS
// ===============================================

/**
 * Initialize default labels in database (run once during setup)
 */
export const initializeDefaultLabels = async () => {
  try {
    console.log('🔍 Initializing default question labels...');
    
    // Check if labels already exist
    const [existingCount] = await db.query('SELECT COUNT(*) as count FROM question_labels');
    const count = existingCount[0]?.count || existingCount?.count || 0;
    
    if (count > 0) {
      console.log('✅ Question labels already exist, skipping initialization');
      return { message: 'Labels already initialized', count };
    }
    
    // Insert default labels
    await updateQuestionLabels(DEFAULT_QUESTION_LABELS);
    console.log('✅ Default question labels initialized successfully');
    
    return { 
      message: 'Default labels initialized successfully', 
      count: Object.keys(DEFAULT_QUESTION_LABELS).length 
    };
    
  } catch (error) {
    console.error('❌ Error initializing default labels:', error);
    // Don't throw error - this is initialization
    return { error: error.message };
  }
};

/**
 * Reset labels to defaults
 */
export const resetToDefaultLabels = async () => {
  try {
    console.log('🔄 Resetting question labels to defaults...');
    
    await updateQuestionLabels(DEFAULT_QUESTION_LABELS);
    
    return {
      success: true,
      message: 'Labels reset to defaults',
      count: Object.keys(DEFAULT_QUESTION_LABELS).length
    };
    
  } catch (error) {
    console.error('❌ Error resetting labels:', error);
    throw new CustomError(`Failed to reset labels: ${error.message}`, 500);
  }
};

// ===============================================
// UTILITY FUNCTIONS
// ===============================================

/**
 * Validate label structure
 * @param {Object} labels - Labels object to validate
 * @returns {boolean} Whether labels are valid
 */
export const validateLabels = (labels) => {
  if (!labels || typeof labels !== 'object') {
    return false;
  }
  
  // Check that all default fields are present
  const requiredFields = Object.keys(DEFAULT_QUESTION_LABELS);
  for (const field of requiredFields) {
    if (!labels[field]) {
      console.warn(`⚠️ Missing required field: ${field}`);
      return false;
    }
  }
  
  return true;
};

/**
 * Get label statistics
 */
export const getLabelStatistics = async () => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total_labels,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_labels,
        MIN(createdAt) as first_created,
        MAX(updatedAt) as last_updated
      FROM question_labels
    `);
    
    return stats[0] || {
      total_labels: 0,
      active_labels: 0,
      first_created: null,
      last_updated: null
    };
    
  } catch (error) {
    console.error('❌ Error getting label statistics:', error);
    return null;
  }
};

/**
 * Export labels as JSON (for backup)
 */
export const exportLabelsAsJSON = async () => {
  try {
    const labels = await fetchQuestionLabels();
    
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      labels,
      count: Object.keys(labels).length
    };
    
  } catch (error) {
    console.error('❌ Error exporting labels:', error);
    throw new CustomError(`Failed to export labels: ${error.message}`, 500);
  }
};

/**
 * Import labels from JSON
 * @param {Object} jsonData - JSON data containing labels
 */
export const importLabelsFromJSON = async (jsonData) => {
  try {
    if (!jsonData.labels || typeof jsonData.labels !== 'object') {
      throw new CustomError('Invalid JSON format - labels object required', 400);
    }
    
    await updateQuestionLabels(jsonData.labels);
    
    return {
      success: true,
      message: 'Labels imported successfully',
      count: Object.keys(jsonData.labels).length
    };
    
  } catch (error) {
    console.error('❌ Error importing labels:', error);
    throw error;
  }
};

// ===============================================
// EXPORTS
// ===============================================

export default {
  // Fetch functions
  fetchQuestionLabels,
  fetchSpecificLabels,
  
  // Update functions
  updateQuestionLabels,
  updateSingleLabel,
  
  // Initialization
  initializeDefaultLabels,
  resetToDefaultLabels,
  
  // Utilities
  validateLabels,
  getLabelStatistics,
  exportLabelsAsJSON,
  importLabelsFromJSON,
  
  // Constants
  DEFAULT_QUESTION_LABELS
};