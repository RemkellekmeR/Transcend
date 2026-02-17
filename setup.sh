#!/bin/bash
# Transcend - Voice Clone Singing App Setup
# Run this script to install everything you need.

set -e

echo ""
echo "  ♪ Transcend - Voice Clone Singing App"
echo "  ────────────────────────────────────────"
echo ""

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "ERROR: Python 3 is required but not installed."
    echo "Install it from https://www.python.org/downloads/"
    exit 1
fi

PYTHON=python3
echo "  Using: $($PYTHON --version)"

# Create virtual environment
if [ ! -d "venv" ]; then
    echo "  Creating virtual environment..."
    $PYTHON -m venv venv
fi

# Activate
source venv/bin/activate

# Install dependencies
echo "  Installing dependencies..."
pip install --upgrade pip -q
pip install -r requirements.txt -q

# Install ffmpeg check (needed by pydub)
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo "  NOTE: ffmpeg is recommended for full audio format support."
    echo "  Install it with:"
    echo "    macOS:   brew install ffmpeg"
    echo "    Ubuntu:  sudo apt install ffmpeg"
    echo "    Windows: Download from https://ffmpeg.org/download.html"
    echo ""
fi

# Optional: Install high-quality backends
echo ""
echo "  Optional: For higher quality voice cloning, you can install:"
echo "    pip install demucs     (better vocal separation)"
echo "    pip install torch      (neural voice conversion)"
echo ""

# Create directories
mkdir -p static/uploads static/models static/outputs

echo "  ────────────────────────────────────────"
echo "  Setup complete!"
echo ""
echo "  To start the app:"
echo "    source venv/bin/activate"
echo "    python app.py"
echo ""
echo "  Then open http://localhost:5000 in your browser."
echo ""
