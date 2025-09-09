@echo off
echo Getting recent logs...

echo === API LOGS ===
aws logs get-log-events --log-group-name /ecs/ikoota-api --log-stream-name "ecs/ikoota-api/b21464ee298c4bf5ac6dd9532a8c4480" --start-time 1725892800000 --query "events[-10:].{Time:timestamp,Message:message}"

echo.
echo === CLIENT LOGS ===
aws logs get-log-events --log-group-name /ecs/ikoota-client --log-stream-name "ecs/ikoota-client/d45707ad65ae491290269b3dbc6ff236" --start-time 1725892800000 --query "events[-10:].{Time:timestamp,Message:message}"