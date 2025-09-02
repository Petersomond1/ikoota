// Enhanced Converse Identity System - Complete Implementation
// Advanced privacy protection with video/audio masking capabilities

import crypto from 'crypto';
import db from '../config/db.js';
import { generateUniqueConverseId, validateIdFormat } from '../utils/idGenerator.js';
import CustomError from '../utils/CustomError.js';
import fs from 'fs/promises';
import path from 'path';

class EnhancedConverseIdService {
    constructor() {
        // CRITICAL: Require encryption keys
        if (!process.env.IDENTITY_ENCRYPTION_KEY) {
            throw new Error('IDENTITY_ENCRYPTION_KEY environment variable is required');
        }
        if (!process.env.VAULT_ENCRYPTION_KEY) {
            throw new Error('VAULT_ENCRYPTION_KEY environment variable is required');
        }
        
        this.encryptionKey = Buffer.from(process.env.IDENTITY_ENCRYPTION_KEY, 'hex');
        this.vaultKey = Buffer.from(process.env.VAULT_ENCRYPTION_KEY, 'hex');
        this.algorithm = 'aes-256-gcm';
        
        // External vault configuration
        this.vaultBasePath = process.env.IDENTITY_VAULT_PATH || './secure_vault/identities';
        this.initializeVault();
        
        // Avatar configuration
        this.avatarTypes = ['cartoon', 'abstract', 'animal', 'robot', 'geometric'];
        this.voiceModifiers = ['pitch_up', 'pitch_down', 'robotic', 'echo', 'whisper'];
    }

    async initializeVault() {
        try {
            await fs.mkdir(this.vaultBasePath, { recursive: true });
            console.log('✅ Identity vault initialized at:', this.vaultBasePath);
        } catch (error) {
            console.error('❌ Failed to initialize identity vault:', error);
        }
    }

    /**
     * Complete identity masking upon membership grant
     * @param {number} userId - User's database ID
     * @returns {object} Masked identity result
     */
    async maskUserIdentity(userId) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 1. Fetch user's real identity
            const [users] = await connection.query(
                'SELECT * FROM users WHERE id = ? AND is_identity_masked = 0',
                [userId]
            );
            
            if (!users.length) {
                throw new CustomError('User not found or already masked', 404);
            }
            
            const user = users[0];
            
            // 2. Generate unique converse ID if not exists
            let converseId = user.converse_id;
            if (!converseId) {
                converseId = await generateUniqueConverseId();
            }
            
            // 3. Generate avatar configuration
            const avatarConfig = await this.generateAvatarConfig(userId);
            
            // 4. Encrypt sensitive data
            const encryptedData = {
                username: this.encrypt(user.username),
                email: this.encrypt(user.email),
                phone: user.phone ? this.encrypt(user.phone) : null,
                real_name: user.real_name ? this.encrypt(user.real_name) : null,
                address: user.address ? this.encrypt(user.address) : null
            };
            
            // 5. Store encrypted data in external vault
            const vaultId = await this.storeInVault(userId, {
                original_data: encryptedData,
                masked_at: new Date().toISOString(),
                converse_id: converseId,
                membership_stage: user.membership_stage
            });
            
            // 6. Create anonymized username
            const anonymizedUsername = `User_${converseId.substring(4)}`;
            
            // 7. Update user table with masked data
            await connection.query(`
                UPDATE users SET 
                    converse_id = ?,
                    username = ?,
                    email = CONCAT('masked_', id, '@private.ikoota'),
                    phone = NULL,
                    real_name = NULL,
                    address = NULL,
                    is_identity_masked = 1,
                    avatar_config = ?,
                    identity_masked_at = NOW()
                WHERE id = ?
            `, [converseId, anonymizedUsername, JSON.stringify(avatarConfig), userId]);
            
            // 8. Store encrypted data reference in user_profiles
            await connection.query(`
                INSERT INTO user_profiles (
                    user_id, vault_id, encrypted_username, encrypted_email, 
                    encrypted_phone, avatar_type, voice_modifier
                ) VALUES (?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    vault_id = VALUES(vault_id),
                    encrypted_username = VALUES(encrypted_username),
                    encrypted_email = VALUES(encrypted_email),
                    encrypted_phone = VALUES(encrypted_phone),
                    avatar_type = VALUES(avatar_type),
                    voice_modifier = VALUES(voice_modifier)
            `, [
                userId, 
                vaultId,
                JSON.stringify(encryptedData.username),
                JSON.stringify(encryptedData.email),
                encryptedData.phone ? JSON.stringify(encryptedData.phone) : null,
                avatarConfig.type,
                avatarConfig.voice_modifier
            ]);
            
            // 9. Log the masking operation
            await this.logIdentityOperation(connection, {
                user_id: userId,
                operation: 'MASK',
                converse_id: converseId,
                performed_by: 'SYSTEM',
                details: 'Identity masked upon membership grant'
            });
            
            await connection.commit();
            
            return {
                success: true,
                converse_id: converseId,
                avatar_config: avatarConfig,
                message: 'Identity successfully masked',
                vault_id: vaultId
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error masking identity:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Unmask user identity (super admin only)
     * @param {number} targetUserId - User to unmask
     * @param {number} adminUserId - Admin performing the operation
     * @param {string} reason - Reason for unmasking
     * @returns {object} Unmasked identity data
     */
    async unmaskUserIdentity(targetUserId, adminUserId, reason) {
        const connection = await db.getConnection();
        
        try {
            await connection.beginTransaction();
            
            // 1. Verify admin permissions
            const [admins] = await connection.query(
                'SELECT role FROM users WHERE id = ?',
                [adminUserId]
            );
            
            if (!admins.length || admins[0].role !== 'super_admin') {
                throw new CustomError('Unauthorized: Super admin access required', 403);
            }
            
            // 2. Fetch masked user data
            const [users] = await connection.query(`
                SELECT u.*, up.vault_id, up.encrypted_username, 
                       up.encrypted_email, up.encrypted_phone
                FROM users u
                LEFT JOIN user_profiles up ON u.id = up.user_id
                WHERE u.id = ? AND u.is_identity_masked = 1
            `, [targetUserId]);
            
            if (!users.length) {
                throw new CustomError('User not found or not masked', 404);
            }
            
            const user = users[0];
            
            // 3. Retrieve from vault
            const vaultData = await this.retrieveFromVault(user.vault_id);
            
            // 4. Decrypt original data
            const decryptedData = {
                username: this.decrypt(vaultData.original_data.username),
                email: this.decrypt(vaultData.original_data.email),
                phone: vaultData.original_data.phone ? 
                    this.decrypt(vaultData.original_data.phone) : null,
                real_name: vaultData.original_data.real_name ? 
                    this.decrypt(vaultData.original_data.real_name) : null
            };
            
            // 5. Log the unmasking operation
            await this.logIdentityOperation(connection, {
                user_id: targetUserId,
                operation: 'UNMASK',
                converse_id: user.converse_id,
                performed_by: adminUserId,
                reason: reason,
                details: `Identity unmasked by admin ${adminUserId}`
            });
            
            await connection.commit();
            
            // Return decrypted data without updating database
            return {
                success: true,
                user_id: targetUserId,
                converse_id: user.converse_id,
                original_identity: decryptedData,
                unmasked_by: adminUserId,
                timestamp: new Date().toISOString(),
                reason: reason
            };
            
        } catch (error) {
            await connection.rollback();
            console.error('❌ Error unmasking identity:', error);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Generate avatar configuration for user
     * @param {number} userId - User's database ID
     * @returns {object} Avatar configuration
     */
    async generateAvatarConfig(userId) {
        // Generate deterministic but unique avatar based on user ID
        const hash = crypto.createHash('sha256').update(String(userId)).digest('hex');
        
        return {
            type: this.avatarTypes[parseInt(hash.substring(0, 2), 16) % this.avatarTypes.length],
            color_scheme: `#${hash.substring(2, 8)}`,
            pattern: hash.substring(8, 16),
            voice_modifier: this.voiceModifiers[parseInt(hash.substring(16, 18), 16) % this.voiceModifiers.length],
            video_filter: this.generateVideoFilter(hash),
            audio_preset: this.generateAudioPreset(hash)
        };
    }

    /**
     * Generate video filter configuration for live streaming
     * @param {string} hash - User hash for deterministic generation
     * @returns {object} Video filter configuration
     */
    generateVideoFilter(hash) {
        return {
            type: 'avatar_overlay',
            blur_background: true,
            face_replacement: {
                model: 'cartoon_face_v2',
                tracking: 'mediapipe_facemesh',
                smoothing: 0.8
            },
            body_pose: {
                enabled: true,
                model: 'posenet',
                skeleton_only: false
            },
            filters: [
                { type: 'gaussian_blur', intensity: 0.3 },
                { type: 'pixelate', block_size: 8 },
                { type: 'color_shift', hue: parseInt(hash.substring(20, 22), 16) }
            ]
        };
    }

    /**
     * Generate audio preset for voice modification
     * @param {string} hash - User hash for deterministic generation
     * @returns {object} Audio preset configuration
     */
    generateAudioPreset(hash) {
        const pitchShift = (parseInt(hash.substring(24, 26), 16) % 25) - 12; // -12 to +12 semitones
        
        return {
            pitch_shift: pitchShift,
            formant_shift: pitchShift * 0.5,
            reverb: {
                enabled: true,
                room_size: 0.3,
                damping: 0.5
            },
            effects: [
                { type: 'compressor', threshold: -20, ratio: 4 },
                { type: 'equalizer', preset: 'voice_mask' },
                { type: 'noise_gate', threshold: -40 }
            ],
            voice_synthesis: {
                enabled: false, // Can be enabled for complete voice replacement
                model: 'neural_voice_v1',
                speaker_id: hash.substring(26, 30)
            }
        };
    }

    /**
     * Store encrypted data in external vault
     * @param {number} userId - User's database ID
     * @param {object} data - Data to store
     * @returns {string} Vault ID
     */
    async storeInVault(userId, data) {
        const vaultId = crypto.randomBytes(16).toString('hex');
        const vaultPath = path.join(this.vaultBasePath, `${vaultId}.vault`);
        
        // Double encrypt for vault storage
        const vaultData = this.encryptWithVaultKey(JSON.stringify(data));
        
        await fs.writeFile(vaultPath, JSON.stringify({
            vault_id: vaultId,
            user_id: userId,
            created_at: new Date().toISOString(),
            data: vaultData
        }));
        
        return vaultId;
    }

    /**
     * Retrieve data from external vault
     * @param {string} vaultId - Vault ID
     * @returns {object} Decrypted vault data
     */
    async retrieveFromVault(vaultId) {
        const vaultPath = path.join(this.vaultBasePath, `${vaultId}.vault`);
        
        const vaultContent = await fs.readFile(vaultPath, 'utf8');
        const vaultData = JSON.parse(vaultContent);
        
        // Double decrypt from vault storage
        const decryptedData = this.decryptWithVaultKey(vaultData.data);
        
        return JSON.parse(decryptedData);
    }

    /**
     * Encrypt data with standard key
     * @param {string} data - Data to encrypt
     * @returns {object} Encrypted data
     */
    encrypt(data) {
        if (!data) return null;
        
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);
        
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
     * Decrypt data with standard key
     * @param {object} encryptedData - Encrypted data object
     * @returns {string} Decrypted data
     */
    decrypt(encryptedData) {
        if (!encryptedData) return null;
        
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipheriv(
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
     * Encrypt with vault key for external storage
     * @param {string} data - Data to encrypt
     * @returns {object} Encrypted data
     */
    encryptWithVaultKey(data) {
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(this.algorithm, this.vaultKey, iv);
        
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
     * Decrypt with vault key from external storage
     * @param {object} encryptedData - Encrypted data object
     * @returns {string} Decrypted data
     */
    decryptWithVaultKey(encryptedData) {
        const { encrypted, iv, authTag } = encryptedData;
        
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.vaultKey,
            Buffer.from(iv, 'hex')
        );
        decipher.setAuthTag(Buffer.from(authTag, 'hex'));
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    }

    /**
     * Apply real-time video masking for live streaming
     * @param {object} videoStream - Input video stream
     * @param {number} userId - User's database ID
     * @returns {object} Masked video stream configuration
     */
    async applyVideoMasking(videoStream, userId) {
        const [avatarConfig] = await db.query(
            'SELECT avatar_config FROM users WHERE id = ?',
            [userId]
        );
        
        if (!avatarConfig.length) {
            throw new CustomError('Avatar configuration not found', 404);
        }
        
        const config = JSON.parse(avatarConfig[0].avatar_config);
        
        return {
            input_stream: videoStream,
            output_config: {
                face_detection: {
                    model: 'blazeface',
                    backend: 'webgl',
                    max_faces: 1
                },
                avatar_overlay: {
                    type: config.type,
                    model: `avatar_${config.type}_v2`,
                    color_scheme: config.color_scheme,
                    tracking_smoothing: 0.7
                },
                background: {
                    blur: true,
                    blur_radius: 15,
                    virtual_background: false
                },
                performance: {
                    fps: 30,
                    resolution: '720p',
                    hardware_acceleration: true
                }
            },
            fallback: {
                use_static_avatar: true,
                show_audio_visualizer: true
            }
        };
    }

    /**
     * Apply real-time audio masking for voice chat
     * @param {object} audioStream - Input audio stream
     * @param {number} userId - User's database ID
     * @returns {object} Masked audio stream configuration
     */
    async applyAudioMasking(audioStream, userId) {
        const [avatarConfig] = await db.query(
            'SELECT avatar_config FROM users WHERE id = ?',
            [userId]
        );
        
        if (!avatarConfig.length) {
            throw new CustomError('Avatar configuration not found', 404);
        }
        
        const config = JSON.parse(avatarConfig[0].avatar_config);
        const audioPreset = config.audio_preset;
        
        return {
            input_stream: audioStream,
            processing_chain: [
                {
                    type: 'pitch_shifter',
                    semitones: audioPreset.pitch_shift,
                    preserve_formants: true
                },
                {
                    type: 'formant_shifter',
                    shift: audioPreset.formant_shift
                },
                {
                    type: 'reverb',
                    ...audioPreset.reverb
                },
                ...audioPreset.effects
            ],
            output_config: {
                sample_rate: 48000,
                bit_depth: 16,
                channels: 'mono',
                codec: 'opus',
                bitrate: 64000
            },
            voice_synthesis: audioPreset.voice_synthesis.enabled ? {
                model: audioPreset.voice_synthesis.model,
                speaker_id: audioPreset.voice_synthesis.speaker_id,
                emotion: 'neutral',
                speed: 1.0
            } : null
        };
    }

    /**
     * Log identity operations for audit trail
     * @param {object} connection - Database connection
     * @param {object} operation - Operation details
     */
    async logIdentityOperation(connection, operation) {
        await connection.query(`
            INSERT INTO identity_masking_audit (
                user_id, operation_type, converse_id, 
                performed_by, reason, details, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, NOW())
        `, [
            operation.user_id,
            operation.operation,
            operation.converse_id,
            operation.performed_by,
            operation.reason || null,
            operation.details || null
        ]);
    }

    /**
     * Get user's public profile (always shows masked data)
     * @param {string} converseId - User's converse ID
     * @returns {object} Public profile data
     */
    async getPublicProfile(converseId) {
        if (!validateIdFormat(converseId, 'converse')) {
            throw new CustomError('Invalid converse ID format', 400);
        }
        
        const [users] = await db.query(`
            SELECT 
                converse_id,
                avatar_config,
                membership_stage,
                is_member,
                class_id,
                mentor_id,
                created_at
            FROM users
            WHERE converse_id = ? AND is_identity_masked = 1
        `, [converseId]);
        
        if (!users.length) {
            throw new CustomError('User not found', 404);
        }
        
        const user = users[0];
        const avatarConfig = JSON.parse(user.avatar_config);
        
        return {
            converse_id: user.converse_id,
            display_name: `User_${converseId.substring(4)}`,
            avatar: {
                type: avatarConfig.type,
                color_scheme: avatarConfig.color_scheme,
                pattern: avatarConfig.pattern
            },
            membership_level: user.membership_stage,
            is_member: user.is_member,
            class_affiliation: user.class_id,
            mentor_status: !!user.mentor_id,
            member_since: user.created_at
        };
    }

    /**
     * Batch mask identities for multiple users
     * @param {array} userIds - Array of user IDs to mask
     * @returns {object} Batch operation result
     */
    async batchMaskIdentities(userIds) {
        const results = {
            successful: [],
            failed: [],
            total: userIds.length
        };
        
        for (const userId of userIds) {
            try {
                const result = await this.maskUserIdentity(userId);
                results.successful.push({
                    user_id: userId,
                    converse_id: result.converse_id
                });
            } catch (error) {
                results.failed.push({
                    user_id: userId,
                    error: error.message
                });
            }
        }
        
        return results;
    }

    /**
     * Get identity masking statistics
     * @returns {object} Statistics
     */
    async getIdentityStats() {
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total_users,
                SUM(is_identity_masked) as masked_users,
                SUM(is_identity_masked = 0) as unmasked_users,
                COUNT(DISTINCT converse_id) as unique_converse_ids
            FROM users
        `);
        
        const [auditStats] = await db.query(`
            SELECT 
                operation_type,
                COUNT(*) as count
            FROM identity_masking_audit
            WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY operation_type
        `);
        
        return {
            users: stats[0],
            recent_operations: auditStats,
            vault_status: {
                location: this.vaultBasePath,
                encrypted: true,
                double_encryption: true
            }
        };
    }
}

export default new EnhancedConverseIdService();