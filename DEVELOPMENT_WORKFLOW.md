# 🚀 Ikoota.com Development Workflow & CI/CD Guide

## 📋 Table of Contents
1. [Development Environment Setup](#development-environment-setup)
2. [Making Code Changes](#making-code-changes)
3. [Testing Before Commit](#testing-before-commit)
4. [Commit & Push Process](#commit--push-process)
5. [CI/CD Pipeline Understanding](#cicd-pipeline-understanding)
6. [Deployment Environments](#deployment-environments)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Emergency Procedures](#emergency-procedures)

---

## 🛠️ Development Environment Setup

### Local Development URLs
- **API**: `http://localhost:3000`
- **Client**: `http://localhost:5173` (Vite dev server)

### Environment Files
```bash
# API Environment
ikootaapi/.env          # Local development settings
ikootaapi/.env.example  # Template for team members
```

### Running Locally
```bash
# Terminal 1 - API Server
cd ikootaapi
npm install
npm start

# Terminal 2 - Client Dev Server  
cd ikootaclient
npm install
npm run dev
```

---

## 📝 Making Code Changes

### Safe Development Practices

#### 1. **Always Work on Feature Branches** (Recommended)
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make your changes
# ... edit files ...

# Commit changes
git add .
git commit -m "Add new feature: description"

# Push feature branch
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Review → Merge to main when ready
```

#### 2. **Direct Main Branch** (Current setup)
```bash
# Make changes
# ... edit files ...

# Test locally first!
cd ikootaapi && npm start  # Test API
cd ikootaclient && npm run dev  # Test client

# Commit and push
git add .
git commit -m "Description of changes"
git push origin main
```

---

## 🧪 Testing Before Commit

### **ALWAYS TEST LOCALLY FIRST!**

#### API Testing Checklist
```bash
cd ikootaapi
npm start

# Test in browser or curl:
curl http://localhost:3000/api/health
```

#### Client Testing Checklist  
```bash
cd ikootaclient
npm run build  # Ensure build works
npm run dev     # Test in development mode

# Check in browser:
# - All pages load
# - API calls work
# - No console errors
```

#### Linting & Code Quality
```bash
# API
cd ikootaapi
npm run lint    # Fix any linting errors

# Client
cd ikootaclient  
npm run lint    # Fix any linting errors
npm run build   # Must build successfully
```

---

## 🔄 Commit & Push Process

### Commit Message Best Practices
```bash
# Good commit messages:
git commit -m "Fix user authentication bug in login form"
git commit -m "Add new membership dashboard with real-time updates"
git commit -m "Update API health check endpoint with more details"

# Bad commit messages:
git commit -m "fix"
git commit -m "update stuff"  
git commit -m "changes"
```

### Pre-Commit Checklist
- [ ] **Code works locally** (API + Client)
- [ ] **No console errors** in browser
- [ ] **Linting passes** (`npm run lint`)
- [ ] **Build succeeds** (`npm run build`)
- [ ] **Commit message is descriptive**

### The Push Process
```bash
# 1. Stage your changes
git add .

# 2. Commit with descriptive message
git commit -m "Your descriptive message"

# 3. Push to main (triggers CI/CD)
git push origin main
```

**⚠️ CRITICAL: Pushing to `main` immediately triggers deployment!**

---

## 🤖 CI/CD Pipeline Understanding

### What Happens When You Push to Main

#### **Phase 1: Test and Build** (2-3 minutes)
```yaml
✅ Checkout code from GitHub
✅ Setup Node.js environment
✅ Install API dependencies (npm ci)
✅ Run API linting and tests  
✅ Install Client dependencies (npm ci)
✅ Run Client linting
✅ Build React client (npm run build)
✅ Security audits
```

**❌ If this fails:** Deployment stops. Fix issues and push again.

#### **Phase 2: Deploy to Staging** (5-8 minutes)
```yaml
🔄 Build Docker images:
   - API image: latest code
   - Client image: with staging nginx config
🔄 Push images to AWS ECR
🔄 Deploy to staging ECS cluster
🔄 Wait for services to stabilize
🔄 Health checks:
   ✅ http://api.staging.ikoota.com:8080/api/health
   ✅ http://staging.ikoota.com/
```

**❌ If this fails:** Check ECS logs, fix issues, push again.

#### **Phase 3: Deploy to Production** (5-8 minutes)
```yaml
🔄 Build production Docker images:
   - API image: same as staging
   - Client image: with HTTPS nginx config  
🔄 Push to ECR with -production tags
🔄 Deploy to production ECS cluster
🔄 Wait for services to stabilize
🔄 Health checks:
   ✅ https://api.ikoota.com:8443/api/health
   ✅ https://ikoota.com/
   ✅ https://www.ikoota.com/
```

**✅ Success:** Your changes are live in production!

### Monitoring Deployment Progress
1. **GitHub Actions Tab**: `https://github.com/Petersomond1/ikoota/actions`
2. **Watch the workflow**: Real-time progress updates
3. **Check logs**: If anything fails, click on the failed step

---

## 🌐 Deployment Environments

### **Staging Environment** (Development & Testing)
- **Purpose**: Test changes before production
- **URLs**: 
  - Client: `http://staging.ikoota.com`
  - API: `http://api.staging.ikoota.com:8080/api/health`
- **Database**: Same as production (shared)
- **SSL**: No HTTPS (faster development)

### **Production Environment** (Live Site)
- **Purpose**: Live site for real users
- **URLs**: 
  - Client: `https://ikoota.com` and `https://www.ikoota.com`
  - API: `https://api.ikoota.com:8443/api/health`
- **Database**: Production database
- **SSL**: Full HTTPS encryption
- **Caching**: Optimized for performance

---

## 🚨 Troubleshooting Guide

### **Common Issues & Solutions**

#### 1. **Build Fails in GitHub Actions**
```bash
# Problem: Linting errors or build failures
# Solution: Run locally first
cd ikootaclient
npm run lint    # Fix all linting errors
npm run build   # Must succeed
```

#### 2. **ECS Services Won't Stabilize**
```bash
# Problem: Containers crash on startup
# Check CloudWatch logs:
aws logs get-log-events --log-group-name /ecs/ikoota-api --log-stream-name [latest]
aws logs get-log-events --log-group-name /ecs/ikoota-client --log-stream-name [latest]
```

#### 3. **Health Checks Fail**
```bash
# Staging health checks:
curl http://api.staging.ikoota.com:8080/api/health
curl http://staging.ikoota.com/

# Production health checks:
curl https://api.ikoota.com:8443/api/health
curl https://ikoota.com/
```

#### 4. **Database Connection Issues**
```bash
# Check environment variables in ECS task definition
# Ensure DB_HOST, DB_USER, DB_PASSWORD are correct
```

#### 5. **SSL Certificate Issues**
```bash
# Check certificate status:
aws acm describe-certificate --certificate-arn arn:aws:acm:us-east-1:701333809618:certificate/9ef88943-b0e7-4714-953d-112b39083beb
```

### **How to Debug Failed Deployments**

1. **Check GitHub Actions**: 
   - Go to Actions tab
   - Click on failed workflow
   - Expand failed step to see error logs

2. **Check AWS ECS Console**:
   - Services: Check task status
   - Tasks: Look for failed tasks
   - Logs: CloudWatch logs for errors

3. **Check Load Balancer**:
   - Target Groups: Are targets healthy?
   - Health Checks: Are they passing?

---

## 🆘 Emergency Procedures

### **Rolling Back a Bad Deployment**

#### Option 1: Revert Git Commit
```bash
# Find the last good commit
git log --oneline

# Revert to previous commit
git revert HEAD
git push origin main
# This triggers a new deployment with the reverted code
```

#### Option 2: Manual ECS Rollback
```bash
# Get previous task definition
aws ecs describe-services --cluster ikoota-production --services ikoota-api-production

# Update to previous task definition
aws ecs update-service \
  --cluster ikoota-production \
  --service ikoota-api-production \
  --task-definition ikoota-api:[previous-revision]
```

### **Taking Site Offline (Emergency)**
```bash
# Scale down production services to 0
aws ecs update-service --cluster ikoota-production --service ikoota-api-production --desired-count 0
aws ecs update-service --cluster ikoota-production --service ikoota-client-production --desired-count 0
```

### **Bringing Site Back Online**
```bash
# Scale services back to 1
aws ecs update-service --cluster ikoota-production --service ikoota-api-production --desired-count 1
aws ecs update-service --cluster ikoota-production --service ikoota-client-production --desired-count 1
```

---

## 💡 Best Practices Summary

### **DO's** ✅
- ✅ Always test locally before pushing
- ✅ Write descriptive commit messages
- ✅ Monitor GitHub Actions after pushing
- ✅ Use staging environment for testing
- ✅ Check health endpoints after deployment
- ✅ Keep commits focused and atomic
- ✅ Run linting and builds locally first

### **DON'Ts** ❌
- ❌ Never push untested code to main
- ❌ Don't ignore build failures
- ❌ Don't commit sensitive data (passwords, keys)
- ❌ Don't make huge changes in one commit
- ❌ Don't ignore ECS deployment failures
- ❌ Don't skip local testing
- ❌ Don't push Friday afternoons (Murphy's Law!)

---

## 🔧 Quick Reference Commands

### Local Development
```bash
# Start API
cd ikootaapi && npm start

# Start Client  
cd ikootaclient && npm run dev

# Build & Test
npm run lint && npm run build
```

### Git Workflow
```bash
# Safe deployment flow
git add .
git commit -m "Descriptive message"
git push origin main
# → Watch GitHub Actions
# → Test staging: http://staging.ikoota.com
# → Confirm production: https://ikoota.com
```

### Monitoring
```bash
# Health checks
curl http://api.staging.ikoota.com:8080/api/health      # Staging
curl https://api.ikoota.com:8443/api/health             # Production

# GitHub Actions
https://github.com/Petersomond1/ikoota/actions
```

---

## 📞 Support

If you encounter issues:
1. **Check this guide first**
2. **Review GitHub Actions logs**  
3. **Check AWS CloudWatch logs**
4. **Test locally to reproduce**
5. **Use staging environment for debugging**

**Remember**: Every push to main goes live in production within 15 minutes. Test thoroughly! 🚀

---
*First Produced: $(09102025)*
*Last updated: $(date)*
*Generated with Claude Code*