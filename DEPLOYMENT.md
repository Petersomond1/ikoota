# Ikoota Deployment Guide

## 🚀 Quick Local Setup

### 1. Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for development)
- Git

### 2. Local Development
```bash
# Clone and setup
git clone https://github.com/Petersomond1/ikoota.git
cd ikoota

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
# - Database passwords
# - JWT secret
# - AWS S3 credentials
# - Twilio credentials
# - SMTP settings

# Start all services
docker-compose up -d

# Check services
docker-compose ps

# View logs
docker-compose logs -f ikootaapi
```

Your app will be available at:
- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Database**: localhost:3306

## ☁️ AWS Production Deployment

### 1. AWS Setup
```bash
# Make setup script executable
chmod +x aws-infrastructure/setup.sh

# Run AWS infrastructure setup
./aws-infrastructure/setup.sh
```

### 2. GitHub Setup
Add these secrets to your GitHub repository:

```
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
```

### 3. Deploy
```bash
# Push to main branch triggers deployment
git push origin main
```

## 💰 Cost Estimate (Monthly)

### Budget Option (~$25/month)
- **EC2 t3.micro**: $8.50
- **RDS t4g.micro**: $12.50  
- **S3 + CloudFront**: $5

### Professional Option (~$70/month)
- **ECS Fargate**: $25
- **RDS t3.micro**: $15
- **Application Load Balancer**: $20
- **S3 + CloudFront**: $10

## 📊 Monitoring

### Health Checks
- **API Health**: `/api/health`
- **Communication Test**: `/api/communication/test`
- **System Status**: `/api/system/status`

### Logs
```bash
# Docker logs
docker-compose logs -f

# AWS logs  
aws logs tail /ecs/ikoota-api --follow
```

## 🔄 Updates

### Local Updates
```bash
# Pull latest code
git pull origin main

# Rebuild containers
docker-compose down
docker-compose up --build -d
```

### Production Updates
```bash
# Push to main branch
git push origin main

# GitHub Actions will:
# 1. Test code
# 2. Build Docker images
# 3. Deploy to staging
# 4. Deploy to production
# 5. Run health checks
```

## 🛡️ Security

### Environment Variables
Never commit `.env` files. Use:
- **Local**: `.env` file
- **Production**: AWS Parameter Store

### Database
- **Local**: Docker MySQL with volume
- **Production**: RDS with automated backups

### File Uploads
- **Local**: Local filesystem
- **Production**: AWS S3 with CORS policy

## 📱 Features Ready for Deployment

✅ **Working Features:**
- User authentication & registration
- Real-time messaging (Socket.IO)
- File uploads (images, audio, video)
- Class management system
- Admin dashboard
- Membership system
- Converse identity system
- Audio/video masking backend

⚠️ **Post-Deployment Additions:**
- WebRTC video/audio calls (infrastructure ready)
- Real-time video masking (backend complete)
- Advanced analytics

## 🆘 Troubleshooting

### Common Issues

**Database connection failed:**
```bash
# Check MySQL container
docker-compose logs mysql

# Reset database
docker-compose down -v
docker-compose up -d
```

**Build failures:**
```bash
# Clear Docker cache
docker system prune -a

# Rebuild from scratch
docker-compose build --no-cache
```

**GitHub Actions failing:**
- Check AWS credentials in secrets
- Verify ECR repositories exist
- Check ECS cluster status

### Support Commands
```bash
# Check all containers
docker-compose ps

# Restart specific service
docker-compose restart ikootaapi

# View resource usage
docker stats

# Clean up
docker-compose down
docker system prune -a
```

---

## 🎯 Next Steps After Deployment

1. **Configure domain name** with Route 53
2. **Set up SSL certificate** with Certificate Manager
3. **Add monitoring** with CloudWatch
4. **Scale resources** based on usage
5. **Implement WebRTC** for video calls
6. **Add backup strategy**

**Your Ikoota communication platform is ready for production! 🚀**