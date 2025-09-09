@echo off
echo Creating ALB Listeners...

echo Creating HTTP listener for Client (port 80)...
aws elbv2 create-listener ^
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:701333809618:loadbalancer/app/ikoota-alb/f460f6c717371439 ^
  --protocol HTTP ^
  --port 80 ^
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:701333809618:targetgroup/ikoota-client-tg/99690254442183cd

echo.
echo Creating HTTP listener for API (port 8080)...
aws elbv2 create-listener ^
  --load-balancer-arn arn:aws:elasticloadbalancing:us-east-1:701333809618:loadbalancer/app/ikoota-alb/f460f6c717371439 ^
  --protocol HTTP ^
  --port 8080 ^
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:us-east-1:701333809618:targetgroup/ikoota-api-tg/0b9649da0b73fd0c

echo Listeners created!