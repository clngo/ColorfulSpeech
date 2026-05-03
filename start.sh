#!/bin/bash
# Start backend and frontend in parallel

echo "Starting ColorfulSpeech..."

# Backend
cd backend
pip install -r requirements.txt -q
uvicorn main:app --reload --port 8000 &
BACKEND_PID=$!

# Frontend
cd ../frontend
npm install -q
npm run dev &
FRONTEND_PID=$!

echo "Backend PID: $BACKEND_PID  |  Frontend PID: $FRONTEND_PID"
echo "Backend:  http://localhost:8000"
echo "Frontend: http://localhost:5173"

wait
