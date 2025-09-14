// ikootaapi/services/converseIdServices.js
// CONVERSE ID SERVICES - User Identity Privacy Management
// Renamed from identityMaskingService.js with enhanced functionality

import crypto from 'crypto';
import db from '../config/db.js';  
import { generateUniqueConverseId, validateIdFormat } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';

class ConverseIdServices {
    constructor() {
        // CRITICAL: Require encryption key to be set
        if (!process.env.IDENTITY_ENCRYPTION_KEY) {
            throw new Error('IDENTITY_ENCRYPTION_KEY environment variable is required');
        }
        this.encryptionKey = Buffer.from(process.env.IDENTITY_ENCRYPTION_KEY, 'hex');
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Encrypts sensitive user data with AES-256-GCM
     * @param {string} data - Data to encrypt
     * @returns {object} Encrypted data with iv and authTag
     */
    encrypt(data) {
        if (!data) return null;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipherGCM(this.algorithm, this.encryptionKey, iv);
        
        let encrypted = cipher.update(data, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        const authTag = cipher.getAuthTag();
        
        return {
            encrypted,
            iv: iv.toString('hex'),
            authTag: authTag.toString('hex')
        };
    }

    /**
     * Decrypts sensitive user data
     * @param {object} encryptedData - Object with encrypted, iv, and authTag
     * @returns {string} Decrypted data
     */
    decrypt(encryptedData) {
        if (!encryptedData) return null;
        
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipherGCM(
            this.algorithm, 
            this.encryptionKey, 
            Buffer.from(iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Get user's identity status (for their own view - shows real identity)
     * @param {number} userId - User's database ID
     * @returns {object} Identity status with real user data
     */
    async getUserIdentityStatus(userId) {
        try {
            const userRows = await db.query(`
                SELECT u.id, u.username, u.email, u.phone, u.avatar, u.converse_id, 
                       u.mentor_id, u.class_id, u.is_identity_masked, u.membership_stage,
                       u.membership_stage, u.createdAt,
                       up.encrypted_username, up.encrypted_email, up.encrypted_phone
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ?
            `, [userId]);
            
            if (!userRows.length) {
                throw new CustomError('User not found', 404);
            }
            
            const user = userRows[0];
            
            // If identity is masked, show original data to the user themselves
            let realUsername = user.username;
            let realEmail = user.email;
            let realPhone = user.phone;
            
            if (user.is_identity_masked && user.encrypted_username) {
                try {
                    realUsername = this.decrypt(JSON.parse(user.encrypted_username));
                    realEmail = this.decrypt(JSON.parse(user.encrypted_email));
                    realPhone = user.encrypted_phone ? this.decrypt(JSON.parse(user.encrypted_phone)) : null;
                } catch (decryptError) {
                    console.error('❌ Decryption error for user', userId, decryptError);
                    // Fall back to current values if decryption fails
                }
            }
            
            return {
                hasMaskedIdentity: Boolean(user.is_identity_masked),
                membershipStage: user.membership_stage,
                isMember: user.membership_stage === 'member',
                hasAssignedMentor: Boolean(user.mentor_id),
                hasAssignedClass: Boolean(user.class_id),
                // Always show real identity to user themselves
                realUsername,
                realEmail,
                realPhone,
                realAvatar: user.avatar,
                memberSince: user.createdAt
            };
        } catch (error) {
            throw new CustomError(`Failed to get user identity status: ${error.message}`, 500);
        }
    }

    /**
     * Generate converse ID for a user (Admin operation)
     * @param {number} targetUserId - User to generate converse ID for
     * @param {number} adminId - Admin performing the operation
     * @returns {object} Generated converse ID result
     */
    async generateConverseIdForUser(targetUserId, adminId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Check if user already has converse ID
            const existingRows = await connection.query(
                'SELECT converse_id, is_identity_masked FROM users WHERE id = ?',
                [targetUserId]
            );
            
            if (!existingRows.length) {
                throw new CustomError('Target user not found', 404);
            }
            
            const existing = existingRows[0];
            if (existing.converse_id && existing.is_identity_masked) {
                throw new CustomError('User already has a converse ID', 409);
            }
            
            // Generate unique converse ID
            const converseId = await generateUniqueConverseId();
            const converseAvatar = this.generateConverseAvatar(converseId);
            
            // Update user with converse ID (but don't mask yet)
            await connection.query(`
                UPDATE users SET 
                    converse_id = ?,
                    converse_avatar = ?
                WHERE id = ?
            `, [converseId, converseAvatar, targetUserId]);
            
            // Log the generation
            await connection.query(`
                INSERT INTO id_generation_log 
                (generated_id, id_type, generated_by, purpose) 
                VALUES (?, 'user', ?, 'Converse ID generation')
            `, [converseId, adminId]);
            
            await connection.commit();
            
            return {
                converseId,
                converseAvatar,
                generatedBy: adminId
            };
            
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Update user's identity settings (privacy, communication preferences)
     * @param {number} userId - User's database ID
     * @param {object} settings - New settings
     * @returns {object} Updated settings
     */
    async updateUserIdentitySettings(userId, settings) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // Update communication preferences if provided
            if (settings.communication) {
                await connection.query(`
                    INSERT INTO user_communication_preferences 
                    (user_id, email_notifications, sms_notifications, marketing_emails, 
                     marketing_sms, survey_notifications, content_notifications, 
                     admin_notifications, preferred_language, timezone)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON DUPLICATE KEY UPDATE
                    email_notifications = VALUES(email_notifications),
                    sms_notifications = VALUES(sms_notifications),
                    marketing_emails = VALUES(marketing_emails),
                    marketing_sms = VALUES(marketing_sms),
                    survey_notifications = VALUES(survey_notifications),
                    content_notifications = VALUES(content_notifications),
                    admin_notifications = VALUES(admin_notifications),
                    preferred_language = VALUES(preferred_language),
                    timezone = VALUES(timezone)
                `, [
                    userId,
                    settings.communication.emailNotifications ?? 1,
                    settings.communication.smsNotifications ?? 0,
                    settings.communication.marketingEmails ?? 1,
                    settings.communication.marketingSms ?? 0,
                    settings.communication.surveyNotifications ?? 1,
                    settings.communication.contentNotifications ?? 1,
                    settings.communication.adminNotifications ?? 1,
                    settings.communication.preferredLanguage || 'en',
                    settings.communication.timezone || 'UTC'
                ]);
            }
            
            await connection.commit();
            
            return {
                settings: settings,
                updatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            await connection.rollback();
            throw new CustomError(`Failed to update identity settings: ${error.message}`, 500);
        } finally {
            connection.release();
        }
    }

    /**
     * Request identity removal (user can request, requires admin approval)
     * @param {number} userId - User requesting removal
     * @param {string} reason - Reason for removal request
     * @returns {object} Request details
     */
    async requestIdentityRemoval(userId, reason) {
        try {
            // Create removal request in audit log
            const result = await db.query(`
                INSERT INTO audit_logs 
                (user_id, action, resource, details, ip_address)
                VALUES (?, 'identity_removal_request', 'user_identity', ?, ?)
            `, [
                userId, 
                JSON.stringify({ 
                    reason: reason || 'User requested identity removal',
                    status: 'pending_admin_review',
                    requestedAt: new Date().toISOString()
                }),
                null // IP will be filled by middleware if available
            ]);
            
            return {
                requestId: result.insertId,
                status: 'pending_admin_review',
                reason
            };
        } catch (error) {
            throw new CustomError(`Failed to request identity removal: ${error.message}`, 500);
        }
    }

    /**
     * Get class members for a requesting user (shows only converse identities)
     * @param {string} classId - Class identifier
     * @param {number} requestingUserId - User making the request
     * @returns {array} Array of class members with converse data only
     */
    async getClassMembersForUser(classId, requestingUserId) {
        try {
            // Verify requesting user has access to this class
            const accessRows = await db.query(`
                SELECT ucm.membership_status 
                FROM user_class_memberships ucm
                WHERE ucm.user_id = ? AND ucm.class_id = ? AND ucm.membership_status = 'active'
            `, [requestingUserId, classId]);
            
            if (!accessRows.length) {
                throw new CustomError('Access denied: User not a member of this class', 403);
            }
            
            // Get class members (converse data only)
            const memberRows = await db.query(`
                SELECT u.converse_id, u.converse_avatar, u.class_id,
                       CONCAT('User_', u.converse_id) as display_name,
                       ucm.joinedAt, ucm.role_in_class
                FROM users u
                JOIN user_class_memberships ucm ON u.id = ucm.user_id
                WHERE ucm.class_id = ? AND u.is_identity_masked = 1 
                AND u.membership_stage = 'member' AND ucm.membership_status = 'active'
                ORDER BY ucm.joinedAt DESC
            `, [classId]);
            
            return memberRows;
        } catch (error) {
            throw new CustomError(`Failed to get class members: ${error.message}`, 500);
        }
    }

    /**
     * Get public profile by converse ID (what others see)
     * @param {string} converseId - Converse ID to look up
     * @returns {object} Public profile data
     */
    async getPublicProfileByConverseId(converseId) {
        try {
            if (!validateIdFormat(converseId, 'user')) {
                throw new CustomError('Invalid converse ID format', 400);
            }
            
            const profileRows = await db.query(`
                SELECT u.converse_id, u.converse_avatar, u.class_id, u.createdAt,
                       CONCAT('User_', u.converse_id) as display_name,
                       c.class_name, c.public_name as class_public_name
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.class_id
                WHERE u.converse_id = ? AND u.is_identity_masked = 1 AND u.membership_stage = 'member'
            `, [converseId]);
            
            if (!profileRows.length) {
                throw new CustomError('Profile not found or not accessible', 404);
            }
            
            const profile = profileRows[0];
            
            return {
                converseId: profile.converse_id,
                displayName: profile.display_name,
                converseAvatar: profile.converse_avatar,
                classId: profile.class_id,
                className: profile.class_public_name || profile.class_name,
                memberSince: profile.createdAt,
                // Never expose real identity data
                bio: 'Community member' // Placeholder - could be expanded
            };
        } catch (error) {
            throw new CustomError(`Failed to get public profile: ${error.message}`, 500);
        }
    }

    /**
     * Search converse identities (returns only converse data)
     * @param {string} query - Search query
     * @param {string} classId - Optional class filter
     * @param {number} limit - Result limit
     * @returns {array} Search results with converse data only
     */
    async searchConverseIdentities(query, classId = null, limit = 20) {
        try {
            let sqlQuery = `
                SELECT u.converse_id, u.converse_avatar, u.class_id, u.createdAt,
                       CONCAT('User_', u.converse_id) as display_name,
                       c.public_name as class_name
                FROM users u
                LEFT JOIN classes c ON u.class_id = c.class_id
                WHERE u.is_identity_masked = 1 AND u.membership_stage = 'member'
                AND (u.converse_id LIKE ? OR CONCAT('User_', u.converse_id) LIKE ?)
            `;
            
            const queryParams = [`%${query}%`, `%${query}%`];
            
            if (classId) {
                sqlQuery += ' AND u.class_id = ?';
                queryParams.push(classId);
            }
            
            sqlQuery += ' ORDER BY u.createdAt DESC LIMIT ?';
            queryParams.push(limit);
            
            const searchRows = await db.query(sqlQuery, queryParams);
            
            return searchRows.map(row => ({
                converse_id: row.converse_id,
                display_name: row.display_name,
                converse_avatar: row.converse_avatar,
                class_id: row.class_id,
                class_name: row.class_name,
                memberSince: row.createdAt
                // Never expose real identity in search results
            }));
        } catch (error) {
            throw new CustomError(`Failed to search converse identities: ${error.message}`, 500);
        }
    }

    /**
     * Get user's privacy settings
     * @param {number} userId - User's database ID
     * @returns {object} Privacy settings
     */
    async getUserPrivacySettings(userId) {
        try {
            const settingsRows = await db.query(`
                SELECT email_notifications, sms_notifications, content_notifications,
                       survey_notifications, admin_notifications, preferred_language, timezone
                FROM user_communication_preferences
                WHERE user_id = ?
            `, [userId]);
            
            if (!settingsRows.length) {
                // Return default settings if none exist
                return {
                    allowDirectMessages: true,
                    allowClassMessages: true,
                    allowMentorContact: true,
                    showOnlineStatus: true,
                    allowProfileViewing: true
                };
            }
            
            const settings = settingsRows[0];
            
            return {
                allowDirectMessages: Boolean(settings.email_notifications),
                allowClassMessages: Boolean(settings.content_notifications),
                allowMentorContact: Boolean(settings.admin_notifications),
                showOnlineStatus: Boolean(settings.content_notifications),
                allowProfileViewing: Boolean(settings.content_notifications)
            };
        } catch (error) {
            throw new CustomError(`Failed to get privacy settings: ${error.message}`, 500);
        }
    }

    /**
     * Update user's privacy settings
     * @param {number} userId - User's database ID
     * @param {object} privacySettings - New privacy settings
     * @returns {object} Updated settings
     */
    async updateUserPrivacySettings(userId, privacySettings) {
        try {
            await db.query(`
                INSERT INTO user_communication_preferences 
                (user_id, email_notifications, content_notifications, admin_notifications)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                content_notifications = VALUES(content_notifications),
                admin_notifications = VALUES(admin_notifications)
            `, [
                userId,
                privacySettings.allowDirectMessages ? 1 : 0,
                privacySettings.allowClassMessages ? 1 : 0,
                privacySettings.allowMentorContact ? 1 : 0
            ]);
            
            return {
                settings: privacySettings,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new CustomError(`Failed to update privacy settings: ${error.message}`, 500);
        }
    }

    /**
     * Get user's communication preferences
     * @param {number} userId - User's database ID
     * @returns {object} Communication preferences
     */
    async getUserCommunicationPreferences(userId) {
        try {
            const prefRows = await db.query(`
                SELECT email_notifications, sms_notifications, marketing_emails,
                       marketing_sms, survey_notifications, content_notifications,
                       admin_notifications, preferred_language, timezone
                FROM user_communication_preferences
                WHERE user_id = ?
            `, [userId]);
            
            if (!prefRows.length) {
                // Return default preferences
                return {
                    emailNotifications: true,
                    smsNotifications: false,
                    contentNotifications: true,
                    surveyNotifications: true,
                    adminNotifications: true,
                    preferredLanguage: 'en',
                    timezone: 'UTC'
                };
            }
            
            const prefs = prefRows[0];
            
            return {
                emailNotifications: Boolean(prefs.email_notifications),
                smsNotifications: Boolean(prefs.sms_notifications),
                contentNotifications: Boolean(prefs.content_notifications),
                surveyNotifications: Boolean(prefs.survey_notifications),
                adminNotifications: Boolean(prefs.admin_notifications),
                preferredLanguage: prefs.preferred_language || 'en',
                timezone: prefs.timezone || 'UTC'
            };
        } catch (error) {
            throw new CustomError(`Failed to get communication preferences: ${error.message}`, 500);
        }
    }

    /**
     * Update user's communication preferences
     * @param {number} userId - User's database ID
     * @param {object} preferences - New preferences
     * @returns {object} Updated preferences
     */
    async updateUserCommunicationPreferences(userId, preferences) {
        try {
            await db.query(`
                INSERT INTO user_communication_preferences 
                (user_id, email_notifications, sms_notifications, marketing_emails,
                 marketing_sms, survey_notifications, content_notifications,
                 admin_notifications, preferred_language, timezone)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                email_notifications = VALUES(email_notifications),
                sms_notifications = VALUES(sms_notifications),
                marketing_emails = VALUES(marketing_emails),
                marketing_sms = VALUES(marketing_sms),
                survey_notifications = VALUES(survey_notifications),
                content_notifications = VALUES(content_notifications),
                admin_notifications = VALUES(admin_notifications),
                preferred_language = VALUES(preferred_language),
                timezone = VALUES(timezone)
            `, [
                userId,
                preferences.emailNotifications ? 1 : 0,
                preferences.smsNotifications ? 1 : 0,
                preferences.marketingEmails ? 1 : 0,
                preferences.marketingSms ? 1 : 0,
                preferences.surveyNotifications ? 1 : 0,
                preferences.contentNotifications ? 1 : 0,
                preferences.adminNotifications ? 1 : 0,
                preferences.preferredLanguage || 'en',
                preferences.timezone || 'UTC'
            ]);
            
            return {
                preferences,
                updatedAt: new Date().toISOString()
            };
        } catch (error) {
            throw new CustomError(`Failed to update communication preferences: ${error.message}`, 500);
        }
    }

    /**
     * Generates a converse avatar based on converse ID
     * @param {string} converseId - User's converse ID
     * @returns {string} Avatar URL
     */
    generateConverseAvatar(converseId) {
        const avatarSeed = converseId.toLowerCase().replace('#', '');
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}&backgroundColor=random`;
    }

    /**
     * Get all content posted by a converse ID (for user's own view)
     * @param {number} userId - User's database ID
     * @param {string} contentType - 'chats', 'teachings', 'comments', or 'all'
     * @returns {array} User's own content
     */
    async getUserOwnContent(userId, contentType = 'all') {
        try {
            const content = { chats: [], teachings: [], comments: [] };
            
            if (contentType === 'all' || contentType === 'chats') {
                const chatRows = await db.query(`
                    SELECT id, title, audience, summary, approval_status, createdAt, updatedAt
                    FROM chats
                    WHERE user_id = (SELECT converse_id FROM users WHERE id = ?)
                    ORDER BY createdAt DESC
                `, [userId]);
                content.chats = chatRows;
            }
            
            if (contentType === 'all' || contentType === 'teachings') {
                const teachingRows = await db.query(`
                    SELECT id, topic, description, lessonNumber, subjectMatter, 
                           audience, approval_status, createdAt, updatedAt
                    FROM teachings
                    WHERE user_id = ?
                    ORDER BY createdAt DESC
                `, [userId]);
                content.teachings = teachingRows;
            }
            
            if (contentType === 'all' || contentType === 'comments') {
                const commentRows = await db.query(`
                    SELECT id, chat_id, teaching_id, comment, createdAt, updatedAt
                    FROM comments
                    WHERE user_id = (SELECT converse_id FROM users WHERE id = ?)
                    ORDER BY createdAt DESC
                `, [userId]);
                content.comments = commentRows;
            }
            
            return content;
        } catch (error) {
            throw new CustomError(`Failed to get user content: ${error.message}`, 500);
        }
    }
}

export default new ConverseIdServices();