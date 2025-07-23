//ikootaapi/services/questionLabelsService.js
import db from '../config/db.js';
import CustomError from '../utils/CustomError.js';

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

// Get all question labels
export const fetchQuestionLabels = async () => {
  try {
    console.log('🔍 Fetching question labels...');
    
    const query = `
      SELECT field_name, label_text, is_active 
      FROM question_labels 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `;
    
    const result = await db.query(query);
    
    // Handle different database result formats
    let rows;
    if (Array.isArray(result) && result.length > 0) {
      if (Array.isArray(result[0]) && typeof result[0][0] === 'object') {
        rows = result[0]; // MySQL2 format
      } else if (typeof result[0] === 'object' && result[0].field_name) {
        rows = result; // Direct array format
      } else {
        rows = [];
      }
    } else {
      rows = [];
    }
    
    // Convert to object format
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
    // Fallback to defaults on error
    return DEFAULT_QUESTION_LABELS;
  }
};

// Update question labels
export const updateQuestionLabels = async (labels) => {
  try {
    console.log('🔍 Updating question labels:', Object.keys(labels).length, 'labels');
    
    if (!labels || typeof labels !== 'object') {
      throw new CustomError('Labels object is required', 400);
    }
    
    // Start transaction
    await db.query('START TRANSACTION');
    
    try {
      // Clear existing labels
      await db.query('DELETE FROM question_labels');
      console.log('✅ Cleared existing labels');
      
      // Insert new labels
      let displayOrder = 1;
      for (const [fieldName, labelText] of Object.entries(labels)) {
        if (labelText && labelText.trim()) {
          const insertQuery = `
            INSERT INTO question_labels (field_name, label_text, display_order, is_active) 
            VALUES (?, ?, ?, 1)
          `;
          await db.query(insertQuery, [fieldName, labelText.trim(), displayOrder]);
          console.log(`✅ Inserted label ${displayOrder}: ${fieldName} = "${labelText}"`);
          displayOrder++;
        }
      }
      
      // Commit transaction
      await db.query('COMMIT');
      console.log('✅ Question labels updated successfully');
      
    } catch (insertError) {
      await db.query('ROLLBACK');
      throw insertError;
    }
    
  } catch (error) {
    console.error('❌ Error updating question labels:', error);
    throw new CustomError(`Failed to update question labels: ${error.message}`, 500);
  }
};

// Initialize default labels in database (run once)
export const initializeDefaultLabels = async () => {
  try {
    console.log('🔍 Initializing default question labels...');
    
    // Check if labels already exist
    const existingCount = await db.query('SELECT COUNT(*) as count FROM question_labels');
    const count = existingCount[0]?.count || existingCount?.count || 0;
    
    if (count > 0) {
      console.log('✅ Question labels already exist, skipping initialization');
      return;
    }
    
    // Insert default labels
    await updateQuestionLabels(DEFAULT_QUESTION_LABELS);
    console.log('✅ Default question labels initialized successfully');
    
  } catch (error) {
    console.error('❌ Error initializing default labels:', error);
    // Don't throw error - this is initialization
  }
};