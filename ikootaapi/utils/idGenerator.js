// Enhanced ID Generation with collision detection
// ikootaapi/utils/idGenerator.js

import crypto from 'crypto';
import db from '../config/db.js';

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
 * Legacy function for backward compatibility
 * Now generates with OTO# prefix for user contexts
 * @returns {string} A converse ID with OTO# prefix
 */
export const generateRandomId = () => {
    const randomPart = generateSecureRandomId();
    return `OTO#${randomPart}`;
};

/**
 * Validates if an ID follows the correct format
 * @param {string} id - The ID to validate
 * @param {string} type - Either 'user' or 'class'
 * @returns {boolean} True if valid format
 */
export const validateIdFormat = (id, type = 'user') => {
    if (!id || typeof id !== 'string') return false;
    
    if (type === 'user') {
        // Should be OTO# followed by 6 alphanumeric characters (total 10 chars)
        return /^OTO#[A-Z0-9]{6}$/.test(id);
    } else if (type === 'class') {
        // Should be OTU# followed by 6 alphanumeric characters (total 10 chars)
        return /^OTU#[A-Z0-9]{6}$/.test(id);
    }
    
    return false;
};

/**
 * Extracts the prefix from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} The prefix ('OTO#' or 'OTU#') or null if invalid
 */
export const getIdPrefix = (id) => {
    if (!id || typeof id !== 'string' || id.length < 4) return null;
    
    const prefix = id.substring(0, 4);
    return ['OTO#', 'OTU#'].includes(prefix) ? prefix : null;
};

/**
 * Determines the entity type from an ID
 * @param {string} id - The ID to analyze
 * @returns {string|null} 'user', 'class', or null if invalid
 */
export const getEntityTypeFromId = (id) => {
    const prefix = getIdPrefix(id);
    
    if (prefix === 'OTO#') return 'user';
    if (prefix === 'OTU#') return 'class';
    
    return null;
};

/**
 * Extracts the random part from an ID (removes prefix)
 * @param {string} id - The ID to analyze
 * @returns {string|null} The 6-character random part or null if invalid
 */
export const getRandomPart = (id) => {
    if (!validateIdFormat(id, 'user') && !validateIdFormat(id, 'class')) {
        return null;
    }
    
    return id.substring(4); // Remove the 4-character prefix (OTO# or OTU#)
};

/**
 * Creates a formatted display version of an ID
 * @param {string} id - The ID to format
 * @returns {string} Formatted ID for display
 */
export const formatIdForDisplay = (id) => {
    const entityType = getEntityTypeFromId(id);
    
    if (entityType === 'user') {
        return `User ${id}`;
    } else if (entityType === 'class') {
        return `Class ${id}`;
    }
    
    return id; // Fallback to original ID
};

/**
 * Generates multiple unique IDs of the same type
 * @param {string} type - Either 'user' or 'class'
 * @param {number} count - Number of IDs to generate
 * @returns {Promise<string[]>} Array of unique IDs
 */
export const generateMultipleUniqueIds = async (type, count) => {
    if (count > 50) {
        throw new Error('Cannot generate more than 50 IDs at once');
    }
    
    const ids = [];
    
    for (let i = 0; i < count; i++) {
        if (type === 'user') {
            ids.push(await generateUniqueConverseId());
        } else if (type === 'class') {
            ids.push(await generateUniqueClassId());
        } else {
            throw new Error('Invalid type. Must be "user" or "class"');
        }
    }
    
    return ids;
};