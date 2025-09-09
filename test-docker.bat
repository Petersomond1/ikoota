@echo off
echo ========================================
echo Ikoota Docker Deployment Test
echo ========================================
echo.

echo Step 1: Docker Login
echo Please ensure you're logged into Docker Hub
echo If not logged in, run: docker login
echo.
pause

echo.
echo Step 2: Building Docker images...
docker-compose build

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Build failed! Please check Docker login and try again.
    pause
    exit /b 1
)

echo.
echo Step 3: Starting services...
docker-compose up -d

echo.
echo Step 4: Waiting for services to start (30 seconds)...
timeout /t 30 /nobreak

echo.
echo Step 5: Checking service status...
docker-compose ps

echo.
echo Step 6: Testing API health endpoint...
curl -f http://localhost:3000/api/health && echo API is healthy! || echo API health check failed

echo.
echo Step 7: Testing Frontend...
curl -f http://localhost/ && echo Frontend is running! || echo Frontend check failed

echo.
echo ========================================
echo Deployment test complete!
echo ========================================
echo.
echo Useful commands:
echo - View logs: docker-compose logs -f
echo - Stop services: docker-compose down
echo - Restart services: docker-compose restart
echo.
pause