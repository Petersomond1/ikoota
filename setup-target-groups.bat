@echo off
echo Creating Target Groups...

echo Creating API Target Group...
aws elbv2 create-target-group ^
  --name ikoota-api-tg ^
  --protocol HTTP ^
  --port 3000 ^
  --vpc-id vpc-086e050328da73246 ^
  --target-type ip ^
  --health-check-path /api/health ^
  --health-check-interval-seconds 30 ^
  --health-check-timeout-seconds 5 ^
  --healthy-threshold-count 2 ^
  --unhealthy-threshold-count 3

echo.
echo Creating Client Target Group...
aws elbv2 create-target-group ^
  --name ikoota-client-tg ^
  --protocol HTTP ^
  --port 80 ^
  --vpc-id vpc-086e050328da73246 ^
  --target-type ip ^
  --health-check-path / ^
  --health-check-interval-seconds 30 ^
  --health-check-timeout-seconds 5 ^
  --healthy-threshold-count 2 ^
  --unhealthy-threshold-count 3

echo Target groups created!