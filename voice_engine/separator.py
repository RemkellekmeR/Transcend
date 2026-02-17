"""Vocal separation - splits a song into vocals and instrumentals."""

import os
import numpy as np
import librosa
import soundfile as sf


class VocalSeparator:
    """Separates vocals from instrumental tracks.

    Uses multiple strategies:
    1. Demucs (high quality, requires demucs package)
    2. Spleeter (good quality, requires spleeter package)
    3. Spectral subtraction fallback (basic, no extra deps)
    """

    def __init__(self, output_dir="static/outputs"):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        self._backend = self._detect_backend()

    def _detect_backend(self):
        """Detect which separation backend is available."""
        try:
            import demucs
            return "demucs"
        except ImportError:
            pass
        try:
            import spleeter
            return "spleeter"
        except ImportError:
            pass
        return "spectral"

    def separate(self, input_path, song_id):
        """Separate a song into vocals and instrumentals.

        Returns dict with paths to vocal and instrumental files.
        """
        if self._backend == "demucs":
            return self._separate_demucs(input_path, song_id)
        elif self._backend == "spleeter":
            return self._separate_spleeter(input_path, song_id)
        else:
            return self._separate_spectral(input_path, song_id)

    def _separate_demucs(self, input_path, song_id):
        """Use Demucs for high-quality source separation."""
        import subprocess

        out_dir = os.path.join(self.output_dir, song_id)
        os.makedirs(out_dir, exist_ok=True)

        cmd = [
            "python", "-m", "demucs",
            "--two-stems", "vocals",
            "-o", out_dir,
            input_path
        ]
        subprocess.run(cmd, check=True, capture_output=True)

        # Demucs outputs to a subdirectory
        model_name = "htdemucs"
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        demucs_dir = os.path.join(out_dir, model_name, base_name)

        vocals_path = os.path.join(out_dir, f"{song_id}_vocals.wav")
        instrumental_path = os.path.join(out_dir, f"{song_id}_instrumental.wav")

        os.rename(os.path.join(demucs_dir, "vocals.wav"), vocals_path)
        os.rename(os.path.join(demucs_dir, "no_vocals.wav"), instrumental_path)

        return {"vocals": vocals_path, "instrumental": instrumental_path}

    def _separate_spleeter(self, input_path, song_id):
        """Use Spleeter for source separation."""
        from spleeter.separator import Separator

        out_dir = os.path.join(self.output_dir, song_id)
        os.makedirs(out_dir, exist_ok=True)

        separator = Separator("spleeter:2stems")
        separator.separate_to_file(input_path, out_dir)

        base_name = os.path.splitext(os.path.basename(input_path))[0]
        spleeter_dir = os.path.join(out_dir, base_name)

        vocals_path = os.path.join(out_dir, f"{song_id}_vocals.wav")
        instrumental_path = os.path.join(out_dir, f"{song_id}_instrumental.wav")

        os.rename(os.path.join(spleeter_dir, "vocals.wav"), vocals_path)
        os.rename(os.path.join(spleeter_dir, "accompaniment.wav"), instrumental_path)

        return {"vocals": vocals_path, "instrumental": instrumental_path}

    def _separate_spectral(self, input_path, song_id):
        """Fallback spectral-based vocal separation using REPET-SIM."""
        audio, sr = librosa.load(input_path, sr=44100, mono=False)

        if audio.ndim == 1:
            audio = np.stack([audio, audio])

        # Use librosa's REPET-SIM method for vocal separation
        # Compute the STFT for each channel
        S_left = librosa.stft(audio[0])
        S_right = librosa.stft(audio[1])

        # Compute the magnitude spectrograms
        mag_left = np.abs(S_left)
        mag_right = np.abs(S_right)

        # The vocal signal tends to be centered (similar in both channels)
        # The instrumental tends to differ between channels
        # Use a soft mask based on spectral similarity
        S_sum = mag_left + mag_right + 1e-10
        vocal_mask = np.minimum(mag_left, mag_right) / (S_sum / 2)
        vocal_mask = np.clip(vocal_mask * 2, 0, 1)

        # Also use median filtering to separate repeating (instrumental)
        # from non-repeating (vocal) components
        S_mono = librosa.stft(librosa.to_mono(audio))
        S_mag = np.abs(S_mono)

        # Median filter along time axis for background estimation
        from scipy.ndimage import median_filter
        S_background = median_filter(S_mag, size=(1, 31))
        S_foreground = S_mag - S_background
        S_foreground = np.maximum(S_foreground, 0)

        # Create masks
        total = S_background + S_foreground + 1e-10
        mask_vocal = S_foreground / total
        mask_instrumental = S_background / total

        # Apply masks
        S_vocal = S_mono * mask_vocal
        S_instrumental = S_mono * mask_instrumental

        # Reconstruct audio
        vocals = librosa.istft(S_vocal)
        instrumental = librosa.istft(S_instrumental)

        out_dir = os.path.join(self.output_dir, song_id)
        os.makedirs(out_dir, exist_ok=True)

        vocals_path = os.path.join(out_dir, f"{song_id}_vocals.wav")
        instrumental_path = os.path.join(out_dir, f"{song_id}_instrumental.wav")

        sf.write(vocals_path, vocals, sr)
        sf.write(instrumental_path, instrumental, sr)

        return {"vocals": vocals_path, "instrumental": instrumental_path}

    @property
    def backend_name(self):
        return self._backend
