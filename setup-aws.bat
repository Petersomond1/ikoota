@echo off
echo Setting up AWS Infrastructure for Ikoota...
echo.

REM Check if AWS CLI is installed
aws --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo AWS CLI not found. Please install AWS CLI first:
    echo https://aws.amazon.com/cli/
    pause
    exit /b 1
)

echo Creating ECR repositories...
aws ecr create-repository --repository-name ikoota-api --region us-east-1 2>nul
aws ecr create-repository --repository-name ikoota-client --region us-east-1 2>nul

echo.
echo Creating ECS cluster...
aws ecs create-cluster --cluster-name ikoota-production --capacity-providers FARGATE --region us-east-1

echo.
echo AWS Infrastructure setup initiated!
echo Next: Configure GitHub secrets and deploy
pause