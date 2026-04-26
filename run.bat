@echo off
echo Starting Digital Outpass System Backend...
start cmd /k "cd backend && npm run dev"

echo Starting Digital Outpass System Frontend...
echo Frontend will be served using npx serve. If you don't have it installed, you can simply open index.html in your browser.
start cmd /k "cd frontend && npx serve -p 8080"

echo Both servers are starting up!
echo Backend: http://localhost:5000
echo Frontend: http://localhost:8080 (or open index.html directly)
