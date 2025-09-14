# Converse Identity System - Administrator Documentation

## Overview

The Converse Identity System provides comprehensive privacy protection through identity masking, real-time video/audio anonymization, and secure vault storage. This documentation covers all administrative functions, emergency procedures, and system monitoring.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Initial Setup](#initial-setup)
3. [Identity Management Operations](#identity-management-operations)
4. [Live Masking Administration](#live-masking-administration)
5. [Emergency Procedures](#emergency-procedures)
6. [Monitoring & Analytics](#monitoring--analytics)
7. [API Reference](#api-reference)
8. [Troubleshooting](#troubleshooting)
9. [Security & Compliance](#security--compliance)

## System Architecture

### Core Components

- **Enhanced Converse ID Service**: Handles identity masking/unmasking operations
- **Realtime Masking Service**: Processes live video/audio streams
- **Identity Vault**: Encrypted external storage for real user data
- **Avatar System**: Generates dynamic avatars for masked users
- **Audit Trail**: Comprehensive logging for all identity operations

### Database Schema

The system adds 10+ new tables to support identity operations:

```sql
-- Key tables created by enhance_converse_identity.sql
- user_profiles (encrypted data storage)
- identity_masking_audit (complete audit trail)
- avatar_configurations (avatar settings)
- voice_presets (voice modification settings)
- masking_sessions (live stream sessions)
- user_privacy_settings (privacy controls)
- emergency_unmask_requests (legal compliance)
```

## Initial Setup

### 1. Database Migration

Run the database migration to create required tables:

```bash
cd database_migrations
mysql -u your_username -p your_database < enhance_converse_identity.sql
```

### 2. Environment Configuration

Add these variables to your `.env` file:

```env
# Identity System Configuration
IDENTITY_VAULT_PATH=/secure/vault/identities
IDENTITY_ENCRYPTION_KEY=your-32-character-encryption-key
IDENTITY_VAULT_ENCRYPTION_KEY=your-vault-encryption-key
TENSORFLOW_MODEL_PATH=./models
FACE_API_MODEL_PATH=./models/face

# WebRTC Configuration
WEBRTC_STUN_SERVERS=stun:stun.l.google.com:19302
WEBRTC_TURN_SERVER=turn:your-turn-server.com
WEBRTC_TURN_USERNAME=your-username
WEBRTC_TURN_CREDENTIAL=your-credential
```

### 3. Model Setup

Download required ML models:

```bash
# Create models directory
mkdir -p models/face models/posenet models/avatar-gan

# Download face detection models (example URLs)
wget -P models/face/ https://github.com/justadudewhohacks/face-api.js-models/raw/master/tiny_face_detector_model-weights_manifest.json
wget -P models/face/ https://github.com/justadudewhohacks/face-api.js-models/raw/master/face_landmark_68_model-weights_manifest.json

# Note: Actual model files need to be obtained from appropriate sources
```

### 4. Vault Directory Setup

```bash
# Create secure vault directory
sudo mkdir -p /secure/vault/identities
sudo chown www-data:www-data /secure/vault/identities
sudo chmod 700 /secure/vault/identities
```

## Identity Management Operations

### Masking a User Identity

**Automatic Masking** (triggers when user becomes member):

```javascript
// Automatically handled by membership grant
const membership = await classServices.grantMembership(userId, classId);
// Identity automatically masked if user wasn't already masked
```

**Manual Masking** via API:

```bash
curl -X POST http://localhost:3001/api/users/identity/mask/USER_ID \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json"
```

**Response:**
```json
{
  "success": true,
  "converseId": "OTO#A1B2C3",
  "vaultId": "vault_12345678",
  "avatarConfig": {
    "type": "cartoon",
    "color_scheme": "#6B46C1",
    "pattern": "abstract_pattern_hash"
  }
}
```

### Unmasking a User Identity (Admin Only)

**Emergency Unmask:**

```bash
curl -X POST http://localhost:3001/api/users/admin/unmask-identity \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "targetUserId": 123,
    "reason": "Legal compliance - Court Order #2024-001"
  }'
```

**Response:**
```json
{
  "success": true,
  "unmaskedData": {
    "userId": 123,
    "realUsername": "john_doe_real",
    "realEmail": "john.doe@email.com",
    "realName": "John Doe"
  },
  "auditId": "audit_987654321"
}
```

### Viewing Masked Users

Access the admin interface at `/admin/identity-manager` or use the API:

```bash
curl -X GET http://localhost:3001/api/users/admin/masked-users \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "maskedUsers": [
    {
      "id": 123,
      "converse_id": "OTO#A1B2C3",
      "identity_masked_at": "2024-01-15T10:30:00Z",
      "avatar_type": "cartoon",
      "allow_unmask_requests": false
    }
  ],
  "total": 1
}
```

## Live Masking Administration

### Starting a Masking Session

**Video Stream Masking:**

```bash
curl -X POST http://localhost:3001/api/masking/start-video \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "converseId": "OTO#A1B2C3",
    "streamConfig": {
      "resolution": "720p",
      "framerate": 30
    }
  }'
```

**Audio Stream Masking:**

```bash
curl -X POST http://localhost:3001/api/masking/start-audio \
  -H "Authorization: Bearer USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "converseId": "OTO#A1B2C3",
    "voicePreset": "pitch_down_formant_shift"
  }'
```

### Monitoring Active Sessions

```bash
curl -X GET http://localhost:3001/api/masking/active-sessions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "activeSessions": {
    "total": 5,
    "sessions": [
      {
        "sessionId": "session_abc123",
        "converseId": "OTO#A1B2C3",
        "type": "video",
        "startTime": "2024-01-15T14:30:00Z",
        "duration": 1800
      }
    ]
  }
}
```

## Emergency Procedures

### Legal Compliance Unmask

When law enforcement or legal orders require identity revelation:

1. **Create Emergency Request:**

```sql
INSERT INTO emergency_unmask_requests (
    request_id, target_user_id, requested_by, reason, urgency_level,expiresAt
) VALUES (
    'LEGAL_2024_001', 123, 1, 'Court Order #2024-001 - Investigation XYZ', 'critical', 
    DATE_ADD(NOW(), INTERVAL 24 HOUR)
);
```

2. **Review and Approve:**

```bash
curl -X POST http://localhost:3001/api/users/admin/approve-emergency-unmask \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "LEGAL_2024_001",
    "reviewNotes": "Verified court order authenticity. Proceeding with unmask."
  }'
```

3. **Execute Unmask:**

```bash
curl -X POST http://localhost:3001/api/users/admin/execute-emergency-unmask \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "LEGAL_2024_001"
  }'
```

### Data Breach Response

If the system is compromised:

1. **Immediate Actions:**

```bash
# Stop all active masking sessions
curl -X POST http://localhost:3001/api/masking/emergency-stop-all \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Rotate encryption keys
curl -X POST http://localhost:3001/api/admin/rotate-encryption-keys \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
```

2. **Audit Trail Export:**

```sql
-- Export all identity operations for forensics
SELECT * FROM identity_masking_audit 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
INTO OUTFILE '/secure/audit_export_$(date +%Y%m%d).csv'
FIELDS TERMINATED BY ',' 
ENCLOSED BY '"' 
LINES TERMINATED BY '\n';
```

## Monitoring & Analytics

### System Statistics

```bash
# Get identity system stats
curl -X GET http://localhost:3001/api/admin/identity-stats \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

**Response:**
```json
{
  "totalUsers": 1000,
  "maskedUsers": 750,
  "maskingPercentage": 75.0,
  "activeSessions": 15,
  "dailyMaskingOperations": 45,
  "vaultStorageUsed": "2.3GB"
}
```

### Performance Monitoring

Key metrics to monitor:

- **Database Performance:**
```sql
-- Check slow queries related to identity operations
SELECT * FROM information_schema.PROCESSLIST 
WHERE INFO LIKE '%identity%' AND TIME > 5;

-- Monitor table sizes
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.TABLES 
WHERE table_schema = 'your_database'
AND table_name IN ('identity_masking_audit', 'masking_sessions', 'user_profiles');
```

- **Vault Storage:**
```bash
# Check vault directory size
du -sh /secure/vault/identities/

# Monitor vault access patterns
tail -f /var/log/nginx/access.log | grep "vault"
```

### Audit Reports

**Daily Operations Report:**

```sql
SELECT 
    DATE(created_at) as operation_date,
    operation_type,
    COUNT(*) as count,
    COUNT(DISTINCT user_id) as unique_users
FROM identity_masking_audit 
WHERE created_at >= CURDATE() - INTERVAL 7 DAY
GROUP BY DATE(created_at), operation_type
ORDER BY operation_date DESC;
```

**Privacy Compliance Report:**

```sql
SELECT 
    u.converse_id,
    u.identity_masked_at,
    ups.allow_unmask_requests,
    COUNT(ima.id) as audit_entries,
    MAX(ima.created_at) as last_activity
FROM users u
LEFT JOIN user_privacy_settings ups ON u.id = ups.user_id
LEFT JOIN identity_masking_audit ima ON u.id = ima.user_id
WHERE u.is_identity_masked = 1
GROUP BY u.id
ORDER BY u.identity_masked_at DESC;
```

## API Reference

### Identity Management Endpoints

| Endpoint | Method | Description | Auth Level |
|----------|--------|-------------|------------|
| `/api/users/identity/status/:userId` | GET | Get user's identity status | User/Admin |
| `/api/users/identity/mask/:userId` | POST | Mask user identity | Admin |
| `/api/users/admin/unmask-identity` | POST | Unmask user identity | Super Admin |
| `/api/users/admin/masked-users` | GET | List all masked users | Admin |
| `/api/users/privacy-settings/:userId` | GET/PUT | Manage privacy settings | User/Admin |

### Masking Session Endpoints

| Endpoint | Method | Description | Auth Level |
|----------|--------|-------------|------------|
| `/api/masking/start-video` | POST | Start video masking session | User |
| `/api/masking/start-audio` | POST | Start audio masking session | User |
| `/api/masking/stop-session/:sessionId` | POST | Stop masking session | User |
| `/api/masking/active-sessions` | GET | List active sessions | Admin |

### Admin Endpoints

| Endpoint | Method | Description | Auth Level |
|----------|--------|-------------|------------|
| `/api/admin/identity-stats` | GET | System statistics | Admin |
| `/api/admin/audit-report` | GET | Audit trail report | Admin |
| `/api/admin/emergency-unmask-requests` | GET | List emergency requests | Super Admin |
| `/api/admin/rotate-encryption-keys` | POST | Rotate system keys | Super Admin |

## Troubleshooting

### Common Issues

**1. Converse ID Generation Fails**

```bash
# Check database constraints
SELECT COUNT(*) FROM users WHERE converse_id LIKE 'OTO#%';

# Verify unique constraint
SHOW CREATE TABLE users;
```

**Fix:**
```sql
-- If duplicate IDs exist, regenerate
UPDATE users SET converse_id = NULL WHERE converse_id = 'problematic_id';
```

**2. Vault Storage Issues**

```bash
# Check vault permissions
ls -la /secure/vault/identities/

# Test vault write access
echo "test" > /secure/vault/identities/test.txt
```

**Fix:**
```bash
sudo chown -R www-data:www-data /secure/vault/identities/
sudo chmod 700 /secure/vault/identities/
```

**3. Face Detection Model Loading**

Check model files exist:
```bash
ls -la models/face/
```

Verify model loading in logs:
```bash
tail -f logs/application.log | grep "masking models"
```

**4. Audio Processing Issues**

Check Web Audio API support:
```javascript
// In browser console
console.log('AudioContext supported:', typeof AudioContext !== 'undefined');
console.log('getUserMedia supported:', navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
```

### Debug Commands

**Enable Debug Logging:**

```bash
# Set environment variable
export DEBUG=identity:*,masking:*

# Or in .env file
DEBUG=identity:*,masking:*
```

**Test Identity Operations:**

```bash
# Test encryption/decryption
node -e "
const service = require('./ikootaapi/services/enhancedConverseIdService.js');
const testData = { username: 'test', email: 'test@example.com' };
const encrypted = service.encryptUserData(testData);
console.log('Encrypted:', encrypted);
const decrypted = service.decryptUserData(encrypted);
console.log('Decrypted:', decrypted);
"
```

**Validate Database Schema:**

```sql
-- Check all identity-related tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'your_database' 
AND table_name IN (
    'user_profiles', 'identity_masking_audit', 'avatar_configurations',
    'voice_presets', 'masking_sessions', 'user_privacy_settings'
);
```

## Security & Compliance

### Security Measures

1. **Encryption:** Dual-layer AES-256-GCM encryption
2. **Key Management:** Separate keys for database and vault storage
3. **Access Control:** Role-based permissions for all operations
4. **Audit Trail:** Complete logging of all identity operations
5. **Data Isolation:** Real identities stored in separate encrypted vault

### Compliance Features

**GDPR Compliance:**
- Right to erasure via secure vault deletion
- Data portability through encrypted exports
- Privacy by design with automatic masking
- Consent management through privacy settings

**CCPA Compliance:**
- Data disclosure tracking via audit trail
- Opt-out mechanisms through privacy controls
- Consumer rights fulfillment via admin interface

### Best Practices

1. **Regular Key Rotation:**
```bash
# Rotate every 90 days
curl -X POST http://localhost:3001/api/admin/rotate-encryption-keys
```

2. **Audit Trail Monitoring:**
```sql
-- Monitor for suspicious activity
SELECT * FROM identity_masking_audit 
WHERE operation_type = 'UNMASK' 
AND created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

3. **Backup Procedures:**
```bash
# Backup vault directory
tar -czf vault_backup_$(date +%Y%m%d).tar.gz /secure/vault/identities/

# Backup identity-related tables
mysqldump --single-transaction your_database \
  user_profiles identity_masking_audit avatar_configurations \
  voice_presets masking_sessions user_privacy_settings \
  > identity_backup_$(date +%Y%m%d).sql
```

## Support & Maintenance

### Regular Maintenance Tasks

**Daily:**
- Monitor active masking sessions
- Check audit trail for anomalies
- Verify vault storage space

**Weekly:**
- Review emergency unmask requests
- Generate compliance reports
- Update ML models if available

**Monthly:**
- Rotate encryption keys
- Archive old audit logs
- Performance optimization review

**Quarterly:**
- Security audit of the entire system
- Update dependencies and models
- Review and update documentation

### Contact Information

For system issues or emergencies:
- **System Admin:** admin@yourorg.com
- **Security Team:** security@yourorg.com  
- **Legal Compliance:** legal@yourorg.com

---

*This documentation covers the complete administration of the Converse Identity System. For technical implementation details, refer to the source code and inline comments.*

**Last Updated:** January 2024  
**Version:** 1.0.0