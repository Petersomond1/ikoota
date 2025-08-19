// Enhanced ID Generation with collision detection and survey system support
// ikootaapi/utils/idGenerator.js

import crypto from 'crypto';
import db from '../config/db.js';

// ===============================================
// CORE ID GENERATION FUNCTIONS
// ===============================================

/**
 * Generates a cryptographically secure 6-character alphanumeric ID (for use with prefixes)
 * @returns {string} A random 6-character alphanumeric ID
 */
export const generateSecureRandomId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.randomBytes for better security
    const bytes = crypto.randomBytes(6);
    
    for (let i = 0; i < 6; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
};

/**
 * Generates a cryptographically secure 4-character alphanumeric ID (legacy support)
 * @returns {string} A random 4-character alphanumeric ID
 */
export const generateSecureRandomId4 = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.randomBytes for better security
    const bytes = crypto.randomBytes(4);
    
    for (let i = 0; i < 4; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
};

/**
 * Generates a cryptographically secure 8-character alphanumeric ID (for survey system)
 * @returns {string} A random 8-character alphanumeric ID
 */
export const generateSecureRandomId8 = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    
    // Use crypto.randomBytes for better security
    const bytes = crypto.randomBytes(8);
    
    for (let i = 0; i < 8; i++) {
        result += chars[bytes[i] % chars.length];
    }
    
    return result;
};

// ===============================================
// USER & CLASS ID GENERATION
// ===============================================

/**
 * Generates a unique converse ID for users/persons with OTO# prefix
 * Format: OTO#XXXXXX (where XXXXXX is 6 alphanumeric characters)
 * Total length: 10 characters
 * @returns {string} A unique converse ID like "OTO#123ABC"
 */
export const generateUniqueConverseId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = generateSecureRandomId();
        const converseId = `OTO#${randomPart}`;
        
        // Check if this ID already exists
        const existing = await db.query(
            'SELECT converse_id FROM users WHERE converse_id = ?', 
            [converseId]
        );
        
        if (existing.length === 0) {
            return converseId;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique converse ID after maximum attempts');
};

/**
 * Generates a unique class ID for demographic classes with OTU# prefix
 * Format: OTU#XXXXXX (where XXXXXX is 6 alphanumeric characters)
 * Total length: 10 characters
 * @returns {string} A unique class ID like "OTU#A1B2C3"
 */
export const generateUniqueClassId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = generateSecureRandomId();
        const classId = `OTU#${randomPart}`;
        
        const existing = await db.query(
            'SELECT class_id FROM classes WHERE class_id = ?', 
            [classId]
        );
        
        if (existing.length === 0) {
            return classId;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique class ID after maximum attempts');
};

// ===============================================
// SURVEY SYSTEM ID GENERATION
// ===============================================

/**
 * Generates a unique survey ID with SUR# prefix
 * Format: SUR#XXXXXXXX (where XXXXXXXX is 8 alphanumeric characters)
 * Total length: 12 characters
 * @returns {string} A unique survey ID like "SUR#ABC12345"
 */
export const generateUniqueSurveyId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = generateSecureRandomId8();
        const surveyId = `SUR#${randomPart}`;
        
        try {
            const existing = await db.query(
                'SELECT id FROM surveylog WHERE survey_id = ?', 
                [surveyId]
            );
            
            if (existing.length === 0) {
                return surveyId;
            }
        } catch (error) {
            // If surveylog table doesn't exist or doesn't have survey_id column,
            // just return the generated ID
            console.warn('Survey ID uniqueness check failed, proceeding with generated ID:', error.message);
            return surveyId;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique survey ID after maximum attempts');
};

/**
 * Generates a unique draft ID with DRF# prefix
 * Format: DRF#XXXXXXXX (where XXXXXXXX is 8 alphanumeric characters)
 * Total length: 12 characters
 * @returns {string} A unique draft ID like "DRF#XYZ98765"
 */
export const generateUniqueDraftId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = generateSecureRandomId8();
        const draftId = `DRF#${randomPart}`;
        
        try {
            const existing = await db.query(
                'SELECT id FROM survey_drafts WHERE draft_id = ?', 
                [draftId]
            );
            
            if (existing.length === 0) {
                return draftId;
            }
        } catch (error) {
            // If survey_drafts table doesn't exist, just return the generated ID
            console.warn('Draft ID uniqueness check failed, proceeding with generated ID:', error.message);
            return draftId;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique draft ID after maximum attempts');
};

/**
 * Generates a unique question ID with QST# prefix
 * Format: QST#XXXXXX (where XXXXXX is 6 alphanumeric characters)
 * Total length: 10 characters
 * @returns {string} A unique question ID like "QST#DEF456"
 */
export const generateUniqueQuestionId = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = generateSecureRandomId();
        const questionId = `QST#${randomPart}`;
        
        try {
            const existing = await db.query(
                'SELECT id FROM survey_questions WHERE question_id = ?', 
                [questionId]
            );
            
            if (existing.length === 0) {
                return questionId;
            }
        } catch (error) {
            // If survey_questions table doesn't exist or doesn't have question_id column,
            // just return the generated ID
            console.warn('Question ID uniqueness check failed, proceeding with generated ID:', error.message);
            return questionId;
        }
        
        attempts++;
    }
    
    throw new Error('Unable to generate unique question ID after maximum attempts');
};

// ===============================================
// GENERAL UNIQUE ID GENERATION
// ===============================================

/**
 * Generates a unique ID for any entity type with collision detection
 * @param {string} entityType - Type of entity ('user', 'class', 'survey', 'draft', 'question')
 * @param {string} prefix - Custom prefix (optional, will use default based on type)
 * @param {number} length - Length of random part (optional, will use default based on type)
 * @returns {Promise<string>} A unique ID for the specified entity type
 */
export const generateUniqueId = async (entityType, prefix = null, length = null) => {
    try {
        console.log(`🔧 Generating unique ID for entity type: ${entityType}`);
        
        switch (entityType.toLowerCase()) {
            case 'user':
            case 'converse':
                return await generateUniqueConverseId();
                
            case 'class':
                return await generateUniqueClassId();
                
            case 'survey':
                return await generateUniqueSurveyId();
                
            case 'draft':
                return await generateUniqueDraftId();
                
            case 'question':
                return await generateUniqueQuestionId();
                
            case 'generic':
            case 'custom':
                if (!prefix) {
                    throw new Error('Prefix is required for generic/custom entity types');
                }
                return await generateCustomUniqueId(prefix, length || 6);
                
            default:
                throw new Error(`Unsupported entity type: ${entityType}. Supported types: user, class, survey, draft, question, generic`);
        }
    } catch (error) {
        console.error(`❌ Error generating unique ID for ${entityType}:`, error);
        throw error;
    }
};

/**
 * Generates a custom unique ID with specified prefix and length
 * @param {string} prefix - Custom prefix (e.g., 'TMP#', 'LOG#')
 * @param {number} length - Length of random part
 * @param {string} tableName - Table to check for uniqueness (optional)
 * @param {string} columnName - Column to check for uniqueness (optional)
 * @returns {Promise<string>} A unique custom ID
 */
export const generateCustomUniqueId = async (prefix, length = 6, tableName = null, columnName = null) => {
    let attempts = 0;
    const maxAttempts = 10;
    
    while (attempts < maxAttempts) {
        const randomPart = length === 4 ? generateSecureRandomId4() : 
                          length === 8 ? generateSecureRandomId8() : 
                          generateSecureRandomId();
        const customId = `${prefix}${randomPart}`;
        
        // If table and column are specified, check for uniqueness
        if (tableName && columnName) {
            try {
                const existing = await db.query(
                    `SELECT ${columnName} FROM ${tableName} WHERE ${columnName} = ?`, 
                    [customId]
                );
                
                if (existing.length === 0) {
                    return customId;
                }
            } catch (error) {
                console.warn(`Custom ID uniqueness check failed for ${tableName}.${columnName}:`, error.message);
                return customId;
            }
        } else {
            // No uniqueness check requested, return the generated ID
            return customId;
        }
        
        attempts++;
    }
    
    throw new Error(`Unable to generate unique custom ID with prefix ${prefix} after maximum attempts`);
};

// ===============================================
// PREVIEW & TEMPORARY ID GENERATION
// ===============================================

/**
 * Generates a temporary/preview converse ID for frontend display
 * @returns {string} A sample converse ID like "OTO#123ABC"
 */
export const generatePreviewConverseId = () => {
    const randomPart = generateSecureRandomId();
    return `OTO#${randomPart}`;
};

/**
 * Generates a temporary/preview class ID for frontend display
 * @returns {string} A sample class ID like "OTU#A1B2C3"
 */
export const generatePreviewClassId = () => {
    const randomPart = generateSecureRandomId();
    return `OTU#${randomPart}`;
};

/**
 * Generates a temporary/preview survey ID for frontend display
 * @returns {string} A sample survey ID like "SUR#ABC12345"
 */
export const generatePreviewSurveyId = () => {
    const randomPart = generateSecureRandomId8();
    return `SUR#${randomPart}`;
};

/**
 * Generates a temporary/preview draft ID for frontend display
 * @returns {string} A sample draft ID like "DRF#XYZ98765"
 */
export const generatePreviewDraftId = () => {
    const randomPart = generateSecureRandomId8();
    return `DRF#${randomPart}`;
};

// ===============================================
// LEGACY COMPATIBILITY FUNCTIONS
// ===============================================

/**
 * Legacy function for backward compatibility
 * @param {number} length - Length of the random ID
 * @returns {string} Random alphanumeric ID
 */
export const generateRandomId = (length = 6) => {
    if (length === 4) {
        return generateSecureRandomId4();
    } else if (length === 8) {
        return generateSecureRandomId8();
    } else {
        return generateSecureRandomId();
    }
};

/**
 * Generate class ID (legacy compatibility)
 */
export const generateClassId = () => {
    return `OTU#${generateSecureRandomId()}`;
};

/**
 * Generate user ID (legacy compatibility)
 */
export const generateUserId = () => {
    return `OTO#${generateSecureRandomId()}`;
};

/**
 * Generate prefixed content ID (legacy compatibility)
 */
export const generateContentId = (type, numericId) => {
    const prefix = type === 'teaching' ? 't' : 'c';
    return `${prefix}${numericId}`;
};

// ===============================================
// ID VALIDATION FUNCTIONS
// ===============================================

/**
 * Validates if an ID follows the correct format
 * @param {string} id - The ID to validate
 * @param {string} type - Entity type ('user', 'class', 'survey', 'draft', 'question')
 * @returns {boolean} True if valid format
 */
export const validateIdFormat = (id, type = 'user') => {
    if (!id || typeof id !== 'string') return false;
    
    switch (type.toLowerCase()) {
        case 'user':
        case 'converse':
            // Should be OTO# followed by 6 alphanumeric characters (total 10 chars)
            return /^OTO#[A-Z0-9]{6}$/.test(id);
            
        case 'class':
            // Should be OTU# followed by 6 alphanumeric characters (total 10 chars)
            return /^OTU#[A-Z0-9]{6}$/.test(id);
            
        case 'survey':
            // Should be SUR# followed by 8 alphanumeric characters (total 12 chars)
            return /^SUR#[A-Z0-9]{8}$/.test(id);
            
        case 'draft':
            // Should be DRF# followed by 8 alphanumeric characters (total 12 chars)
            return /^DRF#[A-Z0-9]{8}$/.test(id);
            
        case 'question':
            // Should be QST# followed by 6 alphanumeric characters (total 10 chars)
            return /^QST#[A-Z0-9]{6}$/.test(id);
            
        case 'content':
            // Should be t123 for teaching or c123 for chat
            return /^[tc][0-9]+$/.test(id);
            
        default:
            return false;
    }
};

/**
 * Extracts the prefix from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} The prefix or null if invalid
 */
export const getIdPrefix = (id) => {
    if (!id || typeof id !== 'string' || id.length < 4) return null;
    
    const prefix = id.substring(0, 4);
    const validPrefixes = ['OTO#', 'OTU#', 'SUR#', 'DRF#', 'QST#'];
    return validPrefixes.includes(prefix) ? prefix : null;
};

/**
 * Determines the entity type from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} Entity type or null if invalid
 */
export const getEntityTypeFromId = (id) => {
    const prefix = getIdPrefix(id);
    
    switch (prefix) {
        case 'OTO#': return 'user';
        case 'OTU#': return 'class';
        case 'SUR#': return 'survey';
        case 'DRF#': return 'draft';
        case 'QST#': return 'question';
        default: return null;
    }
};

/**
 * Extracts the random part from an ID (removes prefix)
 * @param {string} id - The ID to analyze
 * @returns {string|null} The random part or null if invalid
 */
export const getRandomPart = (id) => {
    const entityType = getEntityTypeFromId(id);
    if (!entityType) return null;
    
    return id.substring(4); // Remove the 4-character prefix
};

/**
 * Creates a formatted display version of an ID
 * @param {string} id - The ID to format
 * @returns {string} Formatted ID for display
 */
export const formatIdForDisplay = (id) => {
    const entityType = getEntityTypeFromId(id);
    
    switch (entityType) {
        case 'user': return `User ${id}`;
        case 'class': return `Class ${id}`;
        case 'survey': return `Survey ${id}`;
        case 'draft': return `Draft ${id}`;
        case 'question': return `Question ${id}`;
        default: return id;
    }
};

// ===============================================
// BULK ID GENERATION
// ===============================================

/**
 * Generates multiple unique IDs of the same type
 * @param {string} type - Entity type
 * @param {number} count - Number of IDs to generate
 * @returns {Promise<string[]>} Array of unique IDs
 */
export const generateMultipleUniqueIds = async (type, count) => {
    if (count > 50) {
        throw new Error('Cannot generate more than 50 IDs at once');
    }
    
    const ids = [];
    
    for (let i = 0; i < count; i++) {
        const id = await generateUniqueId(type);
        ids.push(id);
    }
    
    return ids;
};

// ===============================================
// ID STATISTICS & UTILITIES
// ===============================================

/**
 * Get ID generation statistics
 * @returns {object} Statistics about ID generation
 */
export const getIdGenerationStats = () => {
    return {
        supported_types: [
            { type: 'user', prefix: 'OTO#', length: 10, random_length: 6 },
            { type: 'class', prefix: 'OTU#', length: 10, random_length: 6 },
            { type: 'survey', prefix: 'SUR#', length: 12, random_length: 8 },
            { type: 'draft', prefix: 'DRF#', length: 12, random_length: 8 },
            { type: 'question', prefix: 'QST#', length: 10, random_length: 6 }
        ],
        security: 'Cryptographically secure using crypto.randomBytes',
        collision_detection: 'Database uniqueness verification with retry logic',
        max_attempts: 10,
        character_set: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 (36 characters)',
        entropy: {
            six_chars: Math.pow(36, 6).toLocaleString() + ' possible combinations',
            eight_chars: Math.pow(36, 8).toLocaleString() + ' possible combinations'
        }
    };
};

/**
 * Test ID generation system
 * @returns {Promise<object>} Test results
 */
export const testIdGeneration = async () => {
    try {
        console.log('🧪 Testing ID generation system...');
        
        const results = {
            user_id: await generateUniqueConverseId(),
            class_id: await generateUniqueClassId(),
            survey_id: await generateUniqueSurveyId(),
            draft_id: await generateUniqueDraftId(),
            question_id: await generateUniqueQuestionId(),
            preview_ids: {
                user: generatePreviewConverseId(),
                class: generatePreviewClassId(),
                survey: generatePreviewSurveyId(),
                draft: generatePreviewDraftId()
            }
        };
        
        // Validate all generated IDs
        const validations = {
            user_id_valid: validateIdFormat(results.user_id, 'user'),
            class_id_valid: validateIdFormat(results.class_id, 'class'),
            survey_id_valid: validateIdFormat(results.survey_id, 'survey'),
            draft_id_valid: validateIdFormat(results.draft_id, 'draft'),
            question_id_valid: validateIdFormat(results.question_id, 'question')
        };
        
        const allValid = Object.values(validations).every(v => v === true);
        
        console.log('✅ ID generation test completed');
        
        return {
            success: allValid,
            generated_ids: results,
            validations: validations,
            test_passed: allValid,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('❌ ID generation test failed:', error);
        return {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
        };
    }
};