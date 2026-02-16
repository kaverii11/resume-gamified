#!/bin/bash
# Quick deployment script for pixel-city-resume

echo "🎮 Pixel-Art City Resume - Deployment Helper"
echo "=============================================="
echo ""

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "❌ Error: Please run this script from the pixel-city-resume directory"
    exit 1
fi

echo "Choose deployment method:"
echo "1) Local server (Python)"
echo "2) Local server (Node.js)"
echo "3) Deploy to Vercel"
echo "4) Open in browser (file://)"
echo ""
read -p "Enter choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Starting Python server on http://localhost:8000"
        python3 -m http.server 8000
        ;;
    2)
        echo "🚀 Starting Node.js server..."
        npx -y serve -p 8000
        ;;
    3)
        echo "🚀 Deploying to Vercel..."
        npx vercel
        ;;
    4)
        echo "🌐 Opening in browser..."
        open index.html 2>/dev/null || xdg-open index.html 2>/dev/null || start index.html
        ;;
    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac
