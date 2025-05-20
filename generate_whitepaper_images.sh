#!/bin/bash

echo "Silica Whitepaper Image Generator"
echo "=================================="
echo "This script will start a server to help you generate the images needed for the whitepaper."
echo ""
echo "Instructions:"
echo "1. Run this script"
echo "2. Open http://localhost:3030 in your web browser"
echo "3. Follow the instructions on the webpage to capture the images"
echo "4. Press Ctrl+C when done to stop the server"
echo ""
echo "Starting image generation server..."
echo ""

cd "$(dirname "$0")/frontend/public"
node generate_images.js