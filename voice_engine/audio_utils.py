"""Audio processing utilities for format conversion, resampling, and manipulation."""

import io
import os
import numpy as np
import soundfile as sf
import librosa


def load_audio(file_path, sr=44100, mono=True):
    """Load an audio file and return numpy array + sample rate."""
    audio, orig_sr = librosa.load(file_path, sr=sr, mono=mono)
    return audio, sr


def save_audio(file_path, audio, sr=44100):
    """Save a numpy audio array to a WAV file."""
    sf.write(file_path, audio, sr)


def convert_to_wav(input_path, output_path, sr=44100):
    """Convert any supported audio format to WAV."""
    audio, _ = load_audio(input_path, sr=sr)
    save_audio(output_path, audio, sr=sr)
    return output_path


def normalize_audio(audio, target_db=-20.0):
    """Normalize audio to a target dB level."""
    rms = np.sqrt(np.mean(audio ** 2))
    if rms == 0:
        return audio
    target_rms = 10 ** (target_db / 20.0)
    gain = target_rms / rms
    return audio * gain


def trim_silence(audio, sr=44100, top_db=30):
    """Trim leading and trailing silence from audio."""
    trimmed, _ = librosa.effects.trim(audio, top_db=top_db)
    return trimmed


def split_into_chunks(audio, sr=44100, chunk_duration=10.0):
    """Split audio into fixed-duration chunks for training."""
    chunk_samples = int(chunk_duration * sr)
    chunks = []
    for i in range(0, len(audio), chunk_samples):
        chunk = audio[i:i + chunk_samples]
        if len(chunk) >= chunk_samples // 2:  # Keep chunks at least half-length
            chunks.append(chunk)
    return chunks


def get_audio_duration(file_path):
    """Get the duration of an audio file in seconds."""
    return librosa.get_duration(path=file_path)


def mix_audio(vocals, instrumental, vocal_gain=1.0, instrumental_gain=0.8):
    """Mix vocal and instrumental tracks together."""
    # Match lengths
    min_len = min(len(vocals), len(instrumental))
    vocals = vocals[:min_len]
    instrumental = instrumental[:min_len]

    mixed = (vocals * vocal_gain) + (instrumental * instrumental_gain)

    # Prevent clipping
    max_val = np.max(np.abs(mixed))
    if max_val > 1.0:
        mixed = mixed / max_val

    return mixed


def compute_mel_spectrogram(audio, sr=44100, n_mels=80, n_fft=2048, hop_length=512):
    """Compute mel spectrogram for voice analysis."""
    mel_spec = librosa.feature.melspectrogram(
        y=audio, sr=sr, n_mels=n_mels, n_fft=n_fft, hop_length=hop_length
    )
    mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
    return mel_spec_db


def extract_pitch(audio, sr=44100, fmin=50, fmax=800):
    """Extract pitch contour from audio using pyin."""
    f0, voiced_flag, voiced_probs = librosa.pyin(
        audio, fmin=fmin, fmax=fmax, sr=sr
    )
    return f0, voiced_flag


def shift_pitch(audio, sr=44100, n_steps=0):
    """Shift the pitch of audio by n semitones."""
    if n_steps == 0:
        return audio
    return librosa.effects.pitch_shift(y=audio, sr=sr, n_steps=n_steps)


def change_tempo(audio, sr=44100, rate=1.0):
    """Change the tempo of audio without changing pitch."""
    if rate == 1.0:
        return audio
    return librosa.effects.time_stretch(y=audio, rate=rate)


def webm_to_wav(webm_bytes, sr=44100):
    """Convert WebM audio bytes to WAV format using pydub."""
    from pydub import AudioSegment
    audio_segment = AudioSegment.from_file(io.BytesIO(webm_bytes), format="webm")
    audio_segment = audio_segment.set_frame_rate(sr).set_channels(1)

    wav_buffer = io.BytesIO()
    audio_segment.export(wav_buffer, format="wav")
    wav_buffer.seek(0)

    audio, _ = sf.read(wav_buffer)
    return audio.astype(np.float32)
