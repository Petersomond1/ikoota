#!/bin/bash

# AWS Infrastructure Setup Script for Ikoota
# Run this script to set up your AWS infrastructure

set -e

# Configuration
AWS_REGION="us-east-1"
CLUSTER_NAME="ikoota-production"
SERVICE_API="ikoota-api"
SERVICE_CLIENT="ikoota-client"

echo "🚀 Setting up Ikoota AWS Infrastructure..."

# 1. Create ECR repositories
echo "📦 Creating ECR repositories..."
aws ecr create-repository --repository-name $SERVICE_API --region $AWS_REGION || echo "Repository already exists"
aws ecr create-repository --repository-name $SERVICE_CLIENT --region $AWS_REGION || echo "Repository already exists"

# 2. Create ECS Cluster
echo "🏗️ Creating ECS cluster..."
aws ecs create-cluster --cluster-name $CLUSTER_NAME --capacity-providers EC2 FARGATE || echo "Cluster already exists"

# 3. Create RDS MySQL instance
echo "🗄️ Creating RDS MySQL instance..."
aws rds create-db-instance \
    --db-instance-identifier ikoota-db \
    --db-instance-class db.t3.micro \
    --engine mysql \
    --engine-version 8.0.35 \
    --master-username admin \
    --master-user-password $(openssl rand -base64 32) \
    --allocated-storage 20 \
    --storage-type gp2 \
    --vpc-security-group-ids $(aws ec2 describe-security-groups --group-names default --query 'SecurityGroups[0].GroupId' --output text) \
    --backup-retention-period 7 \
    --storage-encrypted || echo "Database already exists"

# 4. Create S3 bucket for uploads
echo "📁 Creating S3 bucket..."
BUCKET_NAME="ikoota-uploads-$(date +%s)"
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION

# Set bucket policy
aws s3api put-bucket-cors --bucket $BUCKET_NAME --cors-configuration file://s3-cors-policy.json

# 5. Create Application Load Balancer
echo "⚖️ Creating Application Load Balancer..."
aws elbv2 create-load-balancer \
    --name ikoota-alb \
    --subnets $(aws ec2 describe-subnets --query 'Subnets[*].SubnetId' --output text) \
    --security-groups $(aws ec2 describe-security-groups --group-names default --query 'SecurityGroups[0].GroupId' --output text) || echo "Load balancer already exists"

# 6. Create task definitions
echo "📋 Creating ECS task definitions..."
aws ecs register-task-definition --cli-input-json file://task-definition-api.json
aws ecs register-task-definition --cli-input-json file://task-definition-client.json

# 7. Create ECS services
echo "🏃 Creating ECS services..."
aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_API \
    --task-definition ikoota-api:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$(aws ec2 describe-subnets --query 'Subnets[0].SubnetId' --output text)],securityGroups=[$(aws ec2 describe-security-groups --group-names default --query 'SecurityGroups[0].GroupId' --output text)],assignPublicIp=ENABLED}" || echo "Service already exists"

aws ecs create-service \
    --cluster $CLUSTER_NAME \
    --service-name $SERVICE_CLIENT \
    --task-definition ikoota-client:1 \
    --desired-count 2 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$(aws ec2 describe-subnets --query 'Subnets[0].SubnetId' --output text)],securityGroups=[$(aws ec2 describe-security-groups --group-names default --query 'SecurityGroups[0].GroupId' --output text)],assignPublicIp=ENABLED}" || echo "Service already exists"

echo "✅ AWS Infrastructure setup complete!"
echo "📝 Next steps:"
echo "1. Update your GitHub secrets with AWS credentials"
echo "2. Update the S3 bucket name in your environment variables"
echo "3. Configure your domain name with Route 53"
echo "4. Run your first deployment with GitHub Actions"

echo ""
echo "🔗 Useful commands:"
echo "aws ecs list-clusters"
echo "aws ecs list-services --cluster $CLUSTER_NAME"
echo "aws rds describe-db-instances --db-instance-identifier ikoota-db"
echo "aws s3 ls s3://$BUCKET_NAME"