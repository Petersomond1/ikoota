# 🚀 Ikoota.com - Quick Reference Card

## 📍 Your Live URLs
- **🔐 Production**: https://ikoota.com and https://www.ikoota.com  
- **🔐 API**: https://api.ikoota.com:3000/api/health
- **🔓 Staging**: http://staging.ikoota.com (for testing)
- **🔧 Local Dev**: http://localhost:3000 (API) + http://localhost:5173 (Client)

## ⚡ Daily Development Flow

### 1. Make Changes
```bash
# Edit your code files
code .  # Open in VS Code
```

### 2. Test Locally (ALWAYS!)
```bash
# Terminal 1 - API
cd ikootaapi && npm start

# Terminal 2 - Client  
cd ikootaclient && npm run dev

# Terminal 3 - Test build
cd ikootaclient && npm run build
```

### 3. Deploy to Production
```bash
git add .
git commit -m "Your descriptive change message"
git push origin main
```
**⚠️ This immediately starts deployment to production!**

### 4. Monitor Deployment
- **GitHub Actions**: https://github.com/Petersomond1/ikoota/actions
- **Staging Test**: http://staging.ikoota.com (deploys first)
- **Production Test**: https://ikoota.com (deploys after staging succeeds)

## 🚨 Emergency Commands

### Rollback Bad Deployment
```bash
git revert HEAD
git push origin main
```

### Check If Site Is Working
```bash
curl https://api.ikoota.com:3000/api/health
curl https://ikoota.com/
```

## ✅ Pre-Commit Checklist
- [ ] Code works locally (API + Client)
- [ ] No console errors in browser
- [ ] `npm run build` succeeds
- [ ] Commit message describes the change

## 🎯 Key Files to Know
- `ikootaapi/app.js` - Main API server
- `ikootaapi/.env` - Environment variables  
- `ikootaclient/src/` - React app source
- `.github/workflows/deploy.yml` - CI/CD pipeline
- `ikootaclient/nginx.conf` - Staging config
- `ikootaclient/nginx.prod.conf` - Production config

## ⏱️ Deployment Timeline
- **Phase 1**: Tests & Build (2-3 min)
- **Phase 2**: Staging Deploy (5-8 min) 
- **Phase 3**: Production Deploy (5-8 min)
- **Total**: ~15 minutes to production

**Remember**: Test locally first, every push to main goes live! 🚀


*First Produced: $(09102025)*
*Last updated: $(date)*
*Generated with Claude Code*