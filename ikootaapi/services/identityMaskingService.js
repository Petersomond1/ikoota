// ikootaapi/services/identityMaskingService.js
import crypto from 'crypto';
import db from '../config/db.js';  
import { generateUniqueConverseId } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';

class IdentityMaskingService {
    constructor() {
        // CRITICAL FIX: Require encryption key to be set
        if (!process.env.IDENTITY_ENCRYPTION_KEY) {
            throw new Error('IDENTITY_ENCRYPTION_KEY environment variable is required');
        }
        // CRITICAL FIX: Use Buffer.from for consistent key handling
        this.encryptionKey = Buffer.from(process.env.IDENTITY_ENCRYPTION_KEY, 'hex');
        this.algorithm = 'aes-256-gcm';
    }

    /**
     * Encrypts sensitive user data - SECURITY FIXED
     * @param {string} data - Data to encrypt
     * @returns {object} Encrypted data with iv and authTag
     */
    encrypt(data) {
        const iv = crypto.randomBytes(16);
        // CRITICAL FIX: Use createCipherGCM instead of deprecated createCipher
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
     * Decrypts sensitive user data - SECURITY FIXED
     * @param {object} encryptedData - Object with encrypted, iv, and authTag
     * @returns {string} Decrypted data
     */
    decrypt(encryptedData) {
        const { encrypted, iv, authTag } = encryptedData;
        
        // CRITICAL FIX: Use createDecipherGCM with proper IV handling
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
     * Masks user identity when membership is granted
     * @param {number} userId - Database user ID
     * @param {string} adminConverseId - Admin who granted membership
     * @param {string} mentorConverseId - Assigned mentor's converse ID
     * @param {string} classId - Assigned class ID
     * @returns {object} Masking result with converse ID
     */
    async maskUserIdentity(userId, adminConverseId, mentorConverseId = null, classId = null) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();

            // 1. Get user's current data
            const [user] = await connection.execute(
                'SELECT id, username, email, phone, avatar FROM users WHERE id = ? AND is_member = "applied"',
                [userId]
            );

            if (!user) {
                throw new CustomError('User not found or membership already processed', 404);
            }

            // 2. Generate unique converse ID
            const converseId = await generateUniqueConverseId();

            // 3. Generate converse avatar (placeholder system)
            const converseAvatar = this.generateConverseAvatar(converseId);

            // 4. Encrypt original identity data - NOW SECURE
            const encryptedUsername = this.encrypt(user.username);
            const encryptedEmail = this.encrypt(user.email);
            const encryptedPhone = user.phone ? this.encrypt(user.phone) : null;

            // 5. Store encrypted data in user_profiles
            await connection.execute(`
                INSERT INTO user_profiles 
                (user_id, encrypted_username, encrypted_email, encrypted_phone, encryption_key) 
                VALUES (?, ?, ?, ?, ?)
            `, [
                userId,
                JSON.stringify(encryptedUsername),
                JSON.stringify(encryptedEmail),
                encryptedPhone ? JSON.stringify(encryptedPhone) : null,
                this.encryptionKey.toString('hex')
            ]);

            // 6. Update user record with converse data
            await connection.execute(`
                UPDATE users SET 
                    converse_id = ?,
                    mentor_id = ?,
                    class_id = ?,
                    converse_avatar = ?,
                    is_member = 'granted',
                    is_identity_masked = 1,
                    username = ?,
                    email = ?,
                    phone = ?
                WHERE id = ?
            `, [
                converseId,
                mentorConverseId,
                classId,
                converseAvatar,
                `User_${converseId}`, // Generic public username
                `${converseId}@masked.local`, // Generic public email
                null, // Remove public phone
                userId
            ]);

            // 7. Create mentor relationship if specified
            if (mentorConverseId) {
                await connection.execute(`
                    INSERT INTO converse_relationships 
                    (mentor_converse_id, mentee_converse_id, relationship_type) 
                    VALUES (?, ?, 'mentor')
                `, [mentorConverseId, converseId]);
            }

            // 8. Create audit trail
            await connection.execute(`
                INSERT INTO identity_masking_audit 
                (user_id, converse_id, masked_by_admin_id, original_username, reason) 
                VALUES (?, ?, ?, ?, 'Membership granted - identity masked for privacy')
            `, [userId, converseId, adminConverseId, user.username]);

            await connection.commit();

            return {
                success: true,
                converseId,
                converseAvatar,
                mentorId: mentorConverseId,
                classId,
                message: 'User identity successfully masked'
            };

        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Unmasks user identity (super admin only)
     * @param {string} converseId - User's converse ID
     * @param {string} adminConverseId - Super admin's converse ID
     * @returns {object} Original user data
     */
    async unmaskUserIdentity(converseId, adminConverseId) {
        try {
            // Verify admin is super admin
            const admin = await db.query(
                'SELECT role FROM users WHERE converse_id = ?',
                [adminConverseId]
            );

            if (!admin || admin.role !== 'super_admin') {
                throw new CustomError('Unauthorized: Super admin access required', 403);
            }

            // Get user and encrypted profile
            const user = await db.query(`
                SELECT u.id, u.converse_id, up.encrypted_username, up.encrypted_email, 
                       up.encrypted_phone, up.encryption_key
                FROM users u
                JOIN user_profiles up ON u.id = up.user_id
                WHERE u.converse_id = ?
            `, [converseId]);

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            // Decrypt original data - NOW SECURE
            const originalUsername = this.decrypt(JSON.parse(user.encrypted_username));
            const originalEmail = this.decrypt(JSON.parse(user.encrypted_email));
            const originalPhone = user.encrypted_phone ? 
                this.decrypt(JSON.parse(user.encrypted_phone)) : null;

            return {
                converseId: user.converse_id,
                originalUsername,
                originalEmail,
                originalPhone,
                unmaskRequestedBy: adminConverseId,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            throw error;
        }
    }

    /**
     * Generates a converse avatar based on converse ID
     * @param {string} converseId - User's converse ID
     * @returns {string} Avatar URL or identifier
     */
    generateConverseAvatar(converseId) {
        // Simple avatar generation based on converse ID
        // In production, you might want to use a service like Gravatar alternatives
        const avatarSeed = converseId.toLowerCase();
        return `https://api.dicebear.com/7.x/identicon/svg?seed=${avatarSeed}&backgroundColor=random`;
    }

    /**
     * Get all users in a class (returns only converse data)
     * @param {string} classId - Class identifier
     * @returns {array} Array of users with converse data only
     */
    async getClassMembers(classId) {
        return await db.query(`
            SELECT converse_id, converse_avatar, mentor_id, 
                   CONCAT('User_', converse_id) as display_name
            FROM users 
            WHERE class_id = ? AND is_identity_masked = 1 AND is_member = 'granted'
            ORDER BY createdAt DESC
        `, [classId]);
    }

    /**
     * Get mentor-mentee relationships
     * @param {string} mentorConverseId - Mentor's converse ID
     * @returns {array} Array of mentees
     */
    async getMentees(mentorConverseId) {
        return await db.query(`
            SELECT u.converse_id, u.converse_avatar, u.class_id,
                   CONCAT('User_', u.converse_id) as display_name
            FROM users u
            WHERE u.mentor_id = ? AND u.is_identity_masked = 1
            ORDER BY u.createdAt DESC
        `, [mentorConverseId]);
    }
}

export default new IdentityMaskingService();