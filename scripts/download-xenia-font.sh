#!/bin/bash

# Script to download and set up Xenia font for Typostry

set -e

echo "🔤 Downloading Xenia font family..."

# Create fonts directory if it doesn't exist
mkdir -p public/fonts/xenia

# Base URL for downloading fonts from GitHub
BASE_URL="https://raw.githubusercontent.com/Loretta1982/xenia/main/fonts/ttf"

# Array of font weights to download
declare -a FONTS=(
    "xenia-light.ttf"
    "xenia-regular.ttf"
    "xenia-medium.ttf"
    "xenia-semibold.ttf"
    "xenia-bold.ttf"
)

# Download each font file
for font in "${FONTS[@]}"; do
    echo "  Downloading $font..."
    # Try different possible naming conventions
    if curl -f -L -o "public/fonts/xenia/$font" "$BASE_URL/$font" 2>/dev/null; then
        echo "  ✓ Downloaded $font"
    elif curl -f -L -o "public/fonts/xenia/$font" "$BASE_URL/Xenia-${font#xenia-}" 2>/dev/null; then
        echo "  ✓ Downloaded $font (from Xenia-${font#xenia-})"
    elif curl -f -L -o "public/fonts/xenia/$font" "$BASE_URL/xenia_${font#xenia-}" 2>/dev/null; then
        echo "  ✓ Downloaded $font (from xenia_${font#xenia-})"
    else
        echo "  ✗ Failed to download $font"
        echo "    Tried: $BASE_URL/$font"
        echo "    Tried: $BASE_URL/Xenia-${font#xenia-}"
        echo "    Tried: $BASE_URL/xenia_${font#xenia-}"
    fi
done

echo ""
echo "✅ Xenia font family installation complete!"
echo ""
echo "Font files are located in: public/fonts/xenia/"
echo ""
ls -lh public/fonts/xenia/
echo ""
echo "You can now run 'npm run dev' to see the fonts in action."
