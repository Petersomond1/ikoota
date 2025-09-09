@echo off
echo Getting latest log streams...

echo API logs:
aws logs describe-log-streams --log-group-name /ecs/ikoota-api --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text

echo.
echo Client logs:
aws logs describe-log-streams --log-group-name /ecs/ikoota-client --order-by LastEventTime --descending --max-items 1 --query "logStreams[0].logStreamName" --output text