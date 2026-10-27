@echo off
setlocal
cd /d "%~dp0"
where java >nul 2>&1 || goto missing
where javac >nul 2>&1 || goto missing
where node >nul 2>&1 || goto missing
where npm >nul 2>&1 || goto missing
where mvn >nul 2>&1 || goto missing
cd frontend
call npm ci --no-fund --no-audit || goto failed
call npm run lint || goto failed
call npm test || goto failed
call npm run build || goto failed
cd ..\backend
call mvn -B -ntp clean verify || goto failed
echo.
echo When the server starts, open http://localhost:8080
echo Keep this window open. Press Ctrl+C to stop.
java -jar target\fleetdesk.jar
goto end
:missing
echo Install JDK 17+, Node.js 24 and Maven 3.9.x, then reopen this script.
echo Check that JAVA_HOME points to your JDK and that their bin folders are on PATH.
goto end
:failed
echo.
echo The build stopped. Read the error above before trying again.
:end
pause
