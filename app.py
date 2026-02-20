"""Transcend - Voice Clone Singing App

Record your voice, create a voice model, and use it to sing on your songs.
"""

import os
import uuid
import traceback
from flask import Flask, render_template, request, jsonify, send_file
from werkzeug.utils import secure_filename
from config import (
    UPLOAD_FOLDER, MODELS_FOLDER, OUTPUT_FOLDER,
    ALLOWED_AUDIO_EXTENSIONS, SAMPLE_RATE
)
from voice_engine.cloner import VoiceCloner
from voice_engine.separator import VocalSeparator
from voice_engine.audio_utils import (
    load_audio, save_audio, get_audio_duration, mix_audio,
    normalize_audio, convert_to_wav, webm_to_wav
)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024  # 100MB max upload

# Initialize engines
cloner = VoiceCloner(models_dir=MODELS_FOLDER)
separator = VocalSeparator(output_dir=OUTPUT_FOLDER)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_AUDIO_EXTENSIONS


# ─── Pages ───────────────────────────────────────────────────────────────────

@app.route("/")
def index():
    return render_template("index.html")


@app.route("/openclaw-guide")
def openclaw_guide():
    return render_template("openclaw_guide.html")


# ─── Voice Recording & Profile API ──────────────────────────────────────────

@app.route("/api/record", methods=["POST"])
def upload_recording():
    """Upload a voice recording for profile creation."""
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    file = request.files["audio"]
    profile_name = request.form.get("profile_name", "my_voice")
    profile_name = secure_filename(profile_name)

    # Generate unique filename
    file_id = str(uuid.uuid4())[:8]
    ext = file.filename.rsplit(".", 1)[1].lower() if "." in file.filename else "webm"

    # Save the raw upload
    raw_path = os.path.join(UPLOAD_FOLDER, f"{profile_name}_{file_id}.{ext}")
    file.save(raw_path)

    # Convert to WAV if needed
    wav_path = os.path.join(UPLOAD_FOLDER, f"{profile_name}_{file_id}.wav")
    if ext != "wav":
        try:
            convert_to_wav(raw_path, wav_path, sr=SAMPLE_RATE)
        except Exception:
            # Try pydub for webm/other formats
            try:
                with open(raw_path, "rb") as f:
                    audio_bytes = f.read()
                audio = webm_to_wav(audio_bytes, sr=SAMPLE_RATE)
                save_audio(wav_path, audio, sr=SAMPLE_RATE)
            except Exception as e:
                return jsonify({"error": f"Could not process audio: {str(e)}"}), 400
    else:
        wav_path = raw_path

    duration = get_audio_duration(wav_path)

    return jsonify({
        "status": "ok",
        "file_id": file_id,
        "file_path": wav_path,
        "duration": round(duration, 1),
        "profile_name": profile_name,
    })


@app.route("/api/record/blob", methods=["POST"])
def upload_recording_blob():
    """Upload a raw audio blob from the browser recorder."""
    profile_name = request.args.get("profile_name", "my_voice")
    profile_name = secure_filename(profile_name)

    audio_bytes = request.data
    if not audio_bytes:
        return jsonify({"error": "No audio data received"}), 400

    file_id = str(uuid.uuid4())[:8]

    # Save raw blob
    raw_path = os.path.join(UPLOAD_FOLDER, f"{profile_name}_{file_id}.webm")
    with open(raw_path, "wb") as f:
        f.write(audio_bytes)

    # Convert to WAV
    wav_path = os.path.join(UPLOAD_FOLDER, f"{profile_name}_{file_id}.wav")
    try:
        audio = webm_to_wav(audio_bytes, sr=SAMPLE_RATE)
        save_audio(wav_path, audio, sr=SAMPLE_RATE)
    except Exception as e:
        return jsonify({"error": f"Could not process audio: {str(e)}"}), 400

    duration = get_audio_duration(wav_path)

    return jsonify({
        "status": "ok",
        "file_id": file_id,
        "file_path": wav_path,
        "duration": round(duration, 1),
        "profile_name": profile_name,
    })


@app.route("/api/profile/create", methods=["POST"])
def create_voice_profile():
    """Create a voice profile from uploaded recordings."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    profile_name = data.get("profile_name", "my_voice")
    recording_paths = data.get("recordings", [])

    if not recording_paths:
        return jsonify({"error": "No recordings provided"}), 400

    # Verify all files exist
    valid_paths = [p for p in recording_paths if os.path.exists(p)]
    if not valid_paths:
        return jsonify({"error": "No valid recording files found"}), 400

    try:
        profile = cloner.create_profile(profile_name, valid_paths)
        return jsonify({
            "status": "ok",
            "profile_name": profile_name,
            "recordings_used": len(valid_paths),
            "pitch_mean": profile.pitch_mean,
            "pitch_range": profile.pitch_range,
            "backend": cloner.backend_name,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Failed to create profile: {str(e)}"}), 500


@app.route("/api/profiles", methods=["GET"])
def list_profiles():
    """List all available voice profiles."""
    profiles = cloner.list_profiles()
    return jsonify({"profiles": profiles})


@app.route("/api/profile/<name>", methods=["DELETE"])
def delete_profile(name):
    """Delete a voice profile."""
    cloner.delete_profile(name)
    return jsonify({"status": "ok"})


# ─── Song Upload & Processing API ───────────────────────────────────────────

@app.route("/api/song/upload", methods=["POST"])
def upload_song():
    """Upload a song file for voice conversion."""
    if "song" not in request.files:
        return jsonify({"error": "No song file provided"}), 400

    file = request.files["song"]
    if not file.filename or not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Supported: WAV, MP3, FLAC, OGG, M4A"}), 400

    song_id = str(uuid.uuid4())[:8]
    ext = file.filename.rsplit(".", 1)[1].lower()
    filename = f"song_{song_id}.{ext}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    # Convert to WAV if needed
    wav_path = os.path.join(UPLOAD_FOLDER, f"song_{song_id}.wav")
    if ext != "wav":
        try:
            convert_to_wav(filepath, wav_path, sr=SAMPLE_RATE)
        except Exception as e:
            return jsonify({"error": f"Could not process song: {str(e)}"}), 400
    else:
        wav_path = filepath

    duration = get_audio_duration(wav_path)

    return jsonify({
        "status": "ok",
        "song_id": song_id,
        "file_path": wav_path,
        "duration": round(duration, 1),
        "filename": file.filename,
    })


@app.route("/api/song/separate", methods=["POST"])
def separate_song():
    """Separate a song into vocals and instrumentals."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    song_path = data.get("song_path")
    song_id = data.get("song_id")

    if not song_path or not os.path.exists(song_path):
        return jsonify({"error": "Song file not found"}), 400

    try:
        result = separator.separate(song_path, song_id)
        return jsonify({
            "status": "ok",
            "vocals_path": result["vocals"],
            "instrumental_path": result["instrumental"],
            "backend": separator.backend_name,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Separation failed: {str(e)}"}), 500


# ─── Voice Conversion API ───────────────────────────────────────────────────

@app.route("/api/convert", methods=["POST"])
def convert_voice():
    """Convert vocals in a song to the cloned voice."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    profile_name = data.get("profile_name")
    vocals_path = data.get("vocals_path")
    instrumental_path = data.get("instrumental_path")
    pitch_shift = data.get("pitch_shift", 0)
    vocal_volume = data.get("vocal_volume", 1.0)
    instrumental_volume = data.get("instrumental_volume", 0.8)

    if not profile_name:
        return jsonify({"error": "No voice profile specified"}), 400
    if not vocals_path or not os.path.exists(vocals_path):
        return jsonify({"error": "Vocals file not found"}), 400

    try:
        # Load voice profile
        profile = cloner.load_profile(profile_name)

        # Convert vocals
        convert_id = str(uuid.uuid4())[:8]
        converted_vocals_path = os.path.join(OUTPUT_FOLDER, f"converted_{convert_id}.wav")
        cloner.convert_voice(vocals_path, profile, converted_vocals_path, pitch_shift=pitch_shift)

        # Mix with instrumental if provided
        if instrumental_path and os.path.exists(instrumental_path):
            converted_vocals, sr = load_audio(converted_vocals_path)
            instrumental, _ = load_audio(instrumental_path, sr=sr)

            mixed = mix_audio(
                converted_vocals, instrumental,
                vocal_gain=vocal_volume,
                instrumental_gain=instrumental_volume
            )

            final_path = os.path.join(OUTPUT_FOLDER, f"final_{convert_id}.wav")
            save_audio(final_path, mixed, sr=sr)
        else:
            final_path = converted_vocals_path

        duration = get_audio_duration(final_path)

        return jsonify({
            "status": "ok",
            "output_path": final_path,
            "vocals_only_path": converted_vocals_path,
            "duration": round(duration, 1),
            "convert_id": convert_id,
        })
    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": f"Voice conversion failed: {str(e)}"}), 500


@app.route("/api/download/<convert_id>")
def download_output(convert_id):
    """Download a converted song."""
    # Look for the final mix first, then vocals only
    final_path = os.path.join(OUTPUT_FOLDER, f"final_{convert_id}.wav")
    if not os.path.exists(final_path):
        final_path = os.path.join(OUTPUT_FOLDER, f"converted_{convert_id}.wav")
    if not os.path.exists(final_path):
        return jsonify({"error": "File not found"}), 404

    return send_file(final_path, as_attachment=True, download_name=f"transcend_{convert_id}.wav")


# ─── System Info API ─────────────────────────────────────────────────────────

@app.route("/api/status")
def system_status():
    """Get system status and capabilities."""
    return jsonify({
        "status": "running",
        "voice_backend": cloner.backend_name,
        "separator_backend": separator.backend_name,
        "profiles": cloner.list_profiles(),
    })


if __name__ == "__main__":
    print("\n🎤 Transcend - Voice Clone Singing App")
    print(f"   Voice Engine: {cloner.backend_name}")
    print(f"   Separator: {separator.backend_name}")
    print(f"   Open http://localhost:5000 in your browser\n")
    app.run(debug=True, host="0.0.0.0", port=5000)
