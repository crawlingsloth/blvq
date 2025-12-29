#!/bin/bash
# Start the BLVQ backend server

echo "🚀 Starting BLVQ Backend..."
echo "================================"

# Activate virtual environment
source venv/bin/activate

# Start server
echo "✓ Starting FastAPI server at http://localhost:8000"
echo "✓ API Documentation at http://localhost:8000/docs"
echo ""
echo "📝 Default Admin Login:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "Press CTRL+C to stop"
echo "================================"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
