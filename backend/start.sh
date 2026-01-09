#!/bin/bash
# Start the BLVQ backend server
PORT=8987
echo "🚀 Starting BLVQ Backend..."
echo "================================"

# Activate virtual environment
source venv/bin/activate

# Start server
echo "✓ Starting FastAPI server at http://localhost:$PORT"
echo "✓ API Documentation at http://localhost:$PORT/docs"
echo ""
echo "📝 Default Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press CTRL+C to stop"
echo "================================"
echo ""

uv run uvicorn app.main:app --reload --host 0.0.0.0 --port $PORT
