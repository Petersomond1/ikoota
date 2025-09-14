# 🔧 Ikoota System - Admin & Technical Reference

## 📋 Quick System Overview

### Architecture Summary
- **12 Core Subsystems** with 250+ API endpoints
- **74 Database Tables** with complex relationships
- **4 User Privilege Levels** with granular permissions
- **Privacy-First Design** with dual-layer encryption

### Key Technologies
- **Backend**: Node.js + Express + MySQL
- **Frontend**: React.js + Context API
- **Security**: JWT + AES-256-GCM + HTTPS
- **Storage**: AWS S3 + Redis caching
- **Deployment**: ECS + ALB + CloudWatch

---

## 🏗️ System Architecture Map

### API Endpoint Structure
```
/api/
├── auth/                    # Authentication & JWT
├── users/                   # User management
│   └── admin/              # User administration
├── membership/             # Membership applications
│   └── admin/              # Membership administration  
├── content/                # Multi-format content (chats/teachings/comments)
│   └── admin/              # Content moderation
├── classes/                # Class management
│   └── admin/              # Class administration
├── survey/                 # Independent survey system
│   └── admin/              # Survey administration
├── communication/          # Email/SMS/notifications
├── search/                 # AI-powered search & recommendations
└── system/                 # Health monitoring & configuration
```

### Database Schema Overview
```sql
-- Core Identity Chain
users (id, email, real_name, phone)
  → converse_ids (id, user_id, converse_id, avatar_data)
    → mentor_ids (id, user_id, mentor_level, capacity)

-- Content Relationships
chats (id, converse_id, title, content, status, approval_date)
teachings (id, user_id, title, modules, assessments)
comments (id, converse_id, parent_id, content, thread_level)

-- Membership System
membership_applications (id, user_id, application_type, status, ticket_number)
application_reviews (id, application_id, reviewer_id, decision, feedback)

-- Class System  
classes (id, class_code, title, instructor_id, enrollment_type)
user_class_memberships (id, user_id, class_id, role, status)

-- Survey System
survey_questions (id, question_text, question_type, required)
survey_responses (id, user_id, survey_id, response_data, completed_at)
```

---

## 👥 User Management System

### User Roles & Permissions

#### **Guest** (Unauthenticated)
```javascript
permissions: {
  view: ['public_content', 'landing_page'],
  create: ['registration'],
  access: ['basic_search']
}
```

#### **User** (Authenticated)
```javascript
permissions: {
  view: ['member_content', 'classes', 'surveys'],
  create: ['content_draft', 'survey_responses', 'class_enrollment'],
  edit: ['own_profile', 'own_content'],
  access: ['advanced_search', 'messaging']
}
```

#### **Admin**
```javascript
permissions: {
  view: ['all_content', 'user_analytics', 'system_logs'],
  create: ['admin_content', 'classes', 'surveys'],
  edit: ['user_profiles', 'content_moderation', 'system_settings'],
  delete: ['inappropriate_content', 'spam_accounts'],
  access: ['admin_dashboard', 'moderation_queue', 'analytics']
}
```

#### **Super Admin**
```javascript
permissions: {
  inherit: 'admin_permissions',
  additional: {
    unmask: ['emergency_identity_reveal'],
    system: ['database_access', 'security_config', 'user_deletion'],
    compliance: ['audit_trails', 'data_export', 'legal_holds']
  }
}
```

### Identity Management

#### Converse ID Generation
```javascript
function generateConverseId() {
  const prefix = 'OTO#';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const suffix = Array.from({length: 6}, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
  return prefix + suffix; // OTO#ABC123
}
```

#### Identity Encryption
```javascript
const crypto = require('crypto');

function encryptIdentity(userData, encryptionKey) {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, encryptionKey);
  
  let encrypted = cipher.update(JSON.stringify(userData), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    encryptedData: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}
```

---

## 📊 Administrative Dashboards

### User Administration Dashboard

#### Key Metrics
- **Total Users**: Active, pending, suspended counts
- **Membership Pipeline**: Applications in each stage
- **Identity Status**: Masked/unmasked user counts
- **Activity Levels**: Daily/weekly/monthly engagement

#### Administrative Actions
```javascript
// User management operations
userAdmin.actions = {
  // User lifecycle
  approveApplication: (applicationId, reviewNotes) => {},
  suspendUser: (userId, reason, duration) => {},
  deleteUser: (userId, confirmationCode) => {},
  
  // Identity management
  regenerateConverseId: (userId, reason) => {},
  emergencyUnmask: (userId, justification, approverLevel) => {},
  
  // Bulk operations
  bulkEmailUsers: (userGroup, template, customization) => {},
  massStatusUpdate: (userIds, newStatus, reason) => {},
}
```

### Content Moderation Dashboard

#### Approval Queue Management
```javascript
// Content approval workflow
contentModeration = {
  queueStats: {
    pending: 42,
    inReview: 8,
    approved: 1247,
    rejected: 156
  },
  
  actions: {
    approveContent: (contentId, moderatorNotes) => {},
    rejectContent: (contentId, reason, feedback) => {},
    requestRevision: (contentId, suggestions) => {},
    flagForReview: (contentId, concerns) => {}
  },
  
  automatedChecks: {
    spamDetection: true,
    inappropriateContent: true,
    privacyViolations: true,
    qualityStandards: true
  }
}
```

### Membership Administration

#### Application Processing
```javascript
// Membership application workflow
membershipAdmin = {
  processingQueue: {
    initialApplications: 23,
    fullMembershipApps: 7,
    appealRequests: 3
  },
  
  reviewProcess: {
    autoScreening: (application) => {
      // Automatic validation checks
      return {
        emailValid: true,
        phoneVerified: true,
        duplicateCheck: false,
        flaggedContent: false
      };
    },
    
    humanReview: (application, screening) => {
      // Manual review by admins
      return {
        decision: 'approved|rejected|pending',
        feedback: 'Detailed reviewer notes',
        nextSteps: 'Actions for applicant'
      };
    }
  }
}
```

---

## 🔍 System Monitoring & Analytics

### Performance Monitoring

#### Key Performance Indicators
```javascript
systemMetrics = {
  performance: {
    apiResponseTime: '< 200ms average',
    databaseQueryTime: '< 50ms average',
    pageLoadTime: '< 2s average',
    uptime: '99.9%'
  },
  
  usage: {
    activeUsers: 'daily/weekly/monthly',
    contentCreation: 'submissions per day',
    classEnrollment: 'enrollments per week',
    searchQueries: 'searches per hour'
  },
  
  security: {
    loginAttempts: 'failed login tracking',
    suspiciousActivity: 'anomaly detection',
    privacyViolations: 'identity exposure attempts',
    dataBreachAlerts: 'security incident monitoring'
  }
}
```

#### Health Check Endpoints
```javascript
// System health monitoring
app.get('/api/health', async (req, res) => {
  const health = {
    success: true,
    message: 'API is healthy - ALL SYSTEMS ACTIVE!',
    database: 'connected',
    timestamp: new Date().toISOString(),
    
    // Subsystem status
    systems: {
      authentication: 'operational',
      contentManagement: 'operational',
      membershipSystem: 'operational',
      classManagement: 'operational',
      surveySystem: 'operational',
      searchEngine: 'operational',
      communicationSystem: 'operational',
      identityMasking: 'operational'
    },
    
    // Performance metrics
    metrics: {
      responseTime: await measureResponseTime(),
      databaseConnections: await getDatabaseStatus(),
      cacheHitRate: await getCacheMetrics(),
      activeUsers: await getActiveUserCount()
    }
  };
  
  res.json(health);
});
```

### Analytics & Reporting

#### User Analytics
# X Remember to change timestamp to camelCase "createdAt"
```sql
-- User engagement metrics
SELECT 
  DATE(created_at) as date,
  COUNT(*) as new_registrations,
  COUNT(CASE WHEN membership_status = 'pre_member' THEN 1 END) as pre_members,
  COUNT(CASE WHEN membership_status = 'full_member' THEN 1 END) as full_members
FROM users 
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at);

-- Content creation trends  
SELECT 
  content_type,
  DATE(created_at) as date,
  COUNT(*) as content_count,
  AVG(approval_time_hours) as avg_approval_time
FROM (
  SELECT 'chat' as content_type, created_at, 
         TIMESTAMPDIFF(HOUR, created_at, approval_date) as approval_time_hours
  FROM chats WHERE status = 'approved'
  UNION ALL
  SELECT 'teaching' as content_type, created_at,
         TIMESTAMPDIFF(HOUR, created_at, approval_date) as approval_time_hours  
  FROM teachings WHERE status = 'approved'
) content_metrics
GROUP BY content_type, DATE(created_at);
```

---

## 🔒 Security & Privacy Management

### Identity Masking Administration

#### Emergency Unmasking Protocol
```javascript
// Super Admin only - Emergency identity reveal
emergencyUnmask = {
  protocol: {
    step1: 'Verify Super Admin credentials',
    step2: 'Document emergency justification',
    step3: 'Log unmasking request with timestamp',
    step4: 'Decrypt identity with master key',
    step5: 'Provide limited-time access to real identity',
    step6: 'Auto-revoke access after time limit',
    step7: 'Generate audit report for compliance'
  },
  
  implementation: async (userId, justification, superAdminId) => {
    // Verify super admin permissions
    const adminVerified = await verifySuperAdmin(superAdminId);
    if (!adminVerified) throw new Error('Unauthorized access');
    
    // Log the unmasking request
    await auditLog.create({
      action: 'EMERGENCY_UNMASK',
      target_user: userId,
      admin_user: superAdminId,
      justification: justification,
      timestamp: new Date(),
      ip_address: req.ip
    });
    
    // Decrypt identity temporarily
    const decryptedIdentity = await decryptUserIdentity(userId);
    
    // Set auto-revoke timer (30 minutes)
    setTimeout(() => {
      revokeTemporaryAccess(userId, superAdminId);
    }, 30 * 60 * 1000);
    
    return {
      identity: decryptedIdentity,
      accessExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
      auditId: auditLog.lastInsertId
    };
  }
}
```

### Security Incident Response

#### Automated Threat Detection
```javascript
securityMonitoring = {
  threatDetection: {
    // Multiple failed login attempts
    suspiciousLogins: {
      threshold: 5,
      timeWindow: '15 minutes',
      action: 'temporary_account_lock'
    },
    
    // Identity exposure attempts  
    privacyViolations: {
      personalInfoInContent: 'automatic_content_flag',
      realNameInMessages: 'message_quarantine',
      identityGuessing: 'user_warning'
    },
    
    // Unusual activity patterns
    anomalyDetection: {
      massContentCreation: 'rate_limit_enforcement',
      suspiciousSearchPatterns: 'activity_monitoring',
      unusualAccessTimes: 'location_verification'
    }
  },
  
  incidentResponse: {
    severity1: 'immediate_lockdown_notify_admins',
    severity2: 'enhanced_monitoring_admin_alert',
    severity3: 'automatic_mitigation_log_event',
    severity4: 'log_for_review'
  }
}
```

---

## 🚀 Deployment & DevOps

### Environment Configuration

#### Environment Variables
# X variables must be masked before this Documentation gets to any secondhand Admin.
# X It should be privy to only SuperAdmin.
```bash
# Database Configuration
DB_HOST=ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com
DB_USER=Petersomond
DB_PASSWORD=[ENCRYPTED]
DB_NAME=ikoota_db
DB_PORT=3306

# Security Keys
JWT_SECRET=[SECURE_SECRET]
IDENTITY_ENCRYPTION_KEY=[256_BIT_KEY]
VAULT_ENCRYPTION_KEY=[256_BIT_KEY]

# AWS Configuration
AWS_REGION=us-east-1
S3_BUCKET_NAME=ikoota

# Application URLs
FRONTEND_URL=https://ikoota.com
PUBLIC_CLIENT_URL=https://ikoota.com
STAGING_URL=http://staging.ikoota.com

# Communication
# X Need to make functional the site communication mailbox.
MAIL_SERVICE=gmail
MAIL_USER=petersomond@gmail.com
MAIL_PASS=[APP_PASSWORD]
SUPPORT_EMAIL=support@ikoota.com
```

#### Deployment Architecture
```yaml
Production Environment:
  - Domain: https://ikoota.com (HTTPS/SSL)
  - API: https://api.ikoota.com:8443 (HTTPS/SSL)
  - CDN: AWS CloudFront for static assets
  - Database: AWS RDS MySQL (Multi-AZ)
  - Storage: AWS S3 for media files
  - Caching: Redis for session management

Staging Environment:
  - Domain: http://staging.ikoota.com (HTTP)
  - API: http://api.staging.ikoota.com:8080 (HTTP)
  - Database: Shared with production
  - Storage: Separate S3 bucket for testing
  - Purpose: Pre-production testing and validation
```

### CI/CD Pipeline

#### Deployment Process
```yaml
# GitHub Actions Workflow
name: Deploy to AWS

trigger:
  - push to main branch

stages:
  1. test-and-build:
     - Run linting and tests
     - Build React client
     - Security audits
     
  2. deploy-staging:
     - Build Docker images (staging config)
     - Deploy to ECS staging cluster
     - Run health checks
     - Verify staging endpoints
     
  3. deploy-production:
     - Build Docker images (production config)
     - Deploy to ECS production cluster  
     - Run health checks
     - Verify production endpoints
     - Notify deployment success

rollback:
  - Automatic on deployment failure
  - Manual rollback commands available
  - Previous task definition restoration
```

### Monitoring & Alerts

#### CloudWatch Metrics
```javascript
monitoringConfig = {
  // Application metrics
  applicationMetrics: {
    'API Response Time': { threshold: 500, unit: 'ms' },
    'Database Query Time': { threshold: 100, unit: 'ms' },
    'Error Rate': { threshold: 1, unit: 'percent' },
    'Active Users': { threshold: 0, unit: 'count', alert: 'too_low' }
  },
  
  // Infrastructure metrics
  infrastructureMetrics: {
    'CPU Utilization': { threshold: 80, unit: 'percent' },
    'Memory Utilization': { threshold: 85, unit: 'percent' },
    'Disk Space': { threshold: 90, unit: 'percent' },
    'Network Throughput': { threshold: 1000, unit: 'mbps' }
  },
  
  // Security metrics
  securityMetrics: {
    'Failed Login Attempts': { threshold: 50, unit: 'count', window: '5min' },
    'Privacy Violations': { threshold: 1, unit: 'count', alert: 'immediate' },
    'Suspicious Activity': { threshold: 10, unit: 'count', window: '1hour' }
  }
}
```

---

## 📞 Administrative Support Procedures
## X Need to setup the needed means/channels of communication and the Command & Control Room.

### Escalation Matrix

#### Issue Severity Levels
```javascript
supportEscalation = {
  severity1: {
    description: 'System down, security breach, data loss',
    response: 'Immediate (< 15 minutes)',
    team: 'On-call engineer + Super Admin',
    notification: 'SMS + Email + Slack'
  },
  
  severity2: {
    description: 'Major feature broken, performance degraded',
    response: 'Priority (< 2 hours)',
    team: 'Development team + Admin',
    notification: 'Email + Slack'
  },
  
  severity3: {
    description: 'Minor feature issues, user complaints',
    response: 'Standard (< 24 hours)',
    team: 'Support team',
    notification: 'Email'
  },
  
  severity4: {
    description: 'Enhancement requests, documentation',
    response: 'Planned (< 1 week)',
    team: 'Development backlog',
    notification: 'Ticket system'
  }
}
```

### Common Administrative Tasks
# X Noticed timestamp case that needs amend.
# X Verify what's 'CURDATE'

#### Daily Operations
```bash
# System health check
curl https://api.ikoota.com:8443/api/health

# Review moderation queue
SELECT COUNT(*) FROM chats WHERE status = 'pending_approval';
SELECT COUNT(*) FROM teachings WHERE status = 'pending_approval';

# Check user registration trends
SELECT DATE(created_at), COUNT(*) FROM users 
WHERE created_at >= CURDATE() - INTERVAL 7 DAY 
GROUP BY DATE(created_at);

# Monitor error logs
aws logs get-log-events --log-group-name /ecs/ikoota-api --log-stream-name [latest]
```

#### Weekly Operations
```bash
# Database maintenance
OPTIMIZE TABLE users, chats, teachings, classes;

# Security audit
SELECT * FROM audit_logs WHERE created_at >= CURDATE() - INTERVAL 7 DAY;

# Performance review
SELECT AVG(response_time) FROM api_metrics WHERE created_at >= CURDATE() - INTERVAL 7 DAY;

# Backup verification
aws s3 ls s3://ikoota-backups/weekly/
```

---

## 🔧 Troubleshooting Guide

### Common Issues & Solutions

#### Database Connection Issues
```bash
# Check database connectivity
mysql -h ikootadb.cvugpfnl4vcp.us-east-1.rds.amazonaws.com -u Petersomond -p

# Verify environment variables
echo $DB_HOST $DB_USER $DB_NAME

# Check connection pool status
SELECT * FROM INFORMATION_SCHEMA.PROCESSLIST;
```

#### ECS Deployment Failures
```bash
# Check service status
aws ecs describe-services --cluster ikoota-production --services ikoota-api-production

# View task failures
aws ecs describe-tasks --cluster ikoota-production --tasks [task-id]

# Check CloudWatch logs
aws logs get-log-events --log-group-name /ecs/ikoota-api --log-stream-name [stream-name]
```

#### SSL Certificate Issues
```bash
# Check certificate status
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:701333809618:certificate/9ef88943-b0e7-4714-953d-112b39083beb

# Verify DNS records
nslookup ikoota.com
nslookup api.ikoota.com

# Test SSL configuration
curl -I https://ikoota.com
openssl s_client -connect ikoota.com:443 -servername ikoota.com
```

#### Performance Issues
```bash
# Check system resources
aws cloudwatch get-metric-statistics --namespace AWS/ECS --metric-name CPUUtilization

# Database performance
SHOW PROCESSLIST;
SHOW ENGINE INNODB STATUS;

# Application metrics
curl https://api.ikoota.com:8443/api/health | jq '.metrics'
```

---

## 📚 Reference Links

### Internal Documentation
- `/DEVELOPMENT_WORKFLOW.md` - Development and deployment procedures
- `/QUICK_REFERENCE.md` - Daily development commands
- `/README.md` - Project overview and setup instructions

### External Resources
- **AWS ECS Documentation**: Container service management
- **MySQL Documentation**: Database optimization and maintenance
- **React Documentation**: Frontend development best practices
- **Node.js Documentation**: Backend development guidelines

### Support Contacts
- **Technical Issues**: support@ikoota.com
- **Security Concerns**: security@ikoota.com
- **Emergency Contact**: [Available to administrators]

---

*This technical reference is maintained alongside the system and updated with each major release.*


*First Produced: $(09102025)*
*Last updated: $(date)*  September 2025 • Version: 1.0*
