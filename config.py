"""Configuration for the Voice Clone Singing App."""

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Upload and output directories
UPLOAD_FOLDER = os.path.join(BASE_DIR, "static", "uploads")
MODELS_FOLDER = os.path.join(BASE_DIR, "static", "models")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "static", "outputs")

# Audio settings
SAMPLE_RATE = 44100
CHANNELS = 1
ALLOWED_AUDIO_EXTENSIONS = {"wav", "mp3", "flac", "ogg", "m4a", "webm"}

# Voice cloning settings
MIN_RECORDING_SECONDS = 30  # Minimum voice recording length for cloning
RECOMMENDED_RECORDING_SECONDS = 180  # Recommended recording length
MAX_UPLOAD_SIZE_MB = 100

# Model training settings
TRAINING_EPOCHS = 50
BATCH_SIZE = 8
LEARNING_RATE = 1e-4

# Ensure directories exist
for folder in [UPLOAD_FOLDER, MODELS_FOLDER, OUTPUT_FOLDER]:
    os.makedirs(folder, exist_ok=True)
