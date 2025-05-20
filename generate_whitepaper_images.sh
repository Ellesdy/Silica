#!/bin/bash

echo "Silica Whitepaper Image Generator"
echo "=================================="
echo "This script will help you generate the images needed for the whitepaper."
echo ""
echo "Instructions:"
echo "1. Choose how you want to open the generator:"
echo "   a) Open in your default browser (recommended)"
echo "   b) Get the file path to open manually"
echo ""

IMAGES_DIR="$(dirname "$0")/docs/images_temp"
INDEX_FILE="$IMAGES_DIR/index.html"

echo "Generator index location: $INDEX_FILE"
echo ""

read -p "Do you want to open the generator in your browser now? (y/n): " OPEN_BROWSER

if [[ "$OPEN_BROWSER" == "y" || "$OPEN_BROWSER" == "Y" ]]; then
    # Try to open the browser based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open "$INDEX_FILE"
        echo "Browser opened! Follow the instructions on the page."
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open "$INDEX_FILE"
        echo "Browser opened! Follow the instructions on the page."
    elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        # Windows with Git Bash or similar
        start "$INDEX_FILE"
        echo "Browser opened! Follow the instructions on the page."
    else
        echo "Could not automatically open browser for your operating system."
        echo "Please open this file in your browser: $INDEX_FILE"
    fi
else
    echo "To open the generator manually, open this file in your browser:"
    echo "$INDEX_FILE"
fi

echo ""
echo "After generating and downloading all three images, place them in the docs/images/ directory."
echo "The whitepaper will reference them from that location."