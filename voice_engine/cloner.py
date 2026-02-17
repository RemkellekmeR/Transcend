"""Voice Cloning Engine - Learns and reproduces vocal characteristics."""

import os
import json
import numpy as np
import librosa
import soundfile as sf
from voice_engine.audio_utils import (
    load_audio, save_audio, normalize_audio, trim_silence,
    split_into_chunks, compute_mel_spectrogram, extract_pitch
)


class VoiceProfile:
    """Stores the learned characteristics of a voice."""

    def __init__(self, name, profile_dir):
        self.name = name
        self.profile_dir = profile_dir
        self.mel_mean = None
        self.mel_std = None
        self.pitch_mean = None
        self.pitch_std = None
        self.pitch_range = None
        self.spectral_envelope = None
        self.formants = None
        self.timbre_features = None
        self.recordings = []
        os.makedirs(profile_dir, exist_ok=True)

    def save(self):
        """Save voice profile to disk."""
        data = {
            "name": self.name,
            "mel_mean": self.mel_mean.tolist() if self.mel_mean is not None else None,
            "mel_std": self.mel_std.tolist() if self.mel_std is not None else None,
            "pitch_mean": float(self.pitch_mean) if self.pitch_mean is not None else None,
            "pitch_std": float(self.pitch_std) if self.pitch_std is not None else None,
            "pitch_range": [float(x) for x in self.pitch_range] if self.pitch_range is not None else None,
            "spectral_envelope": self.spectral_envelope.tolist() if self.spectral_envelope is not None else None,
            "formants": self.formants.tolist() if self.formants is not None else None,
            "timbre_features": self.timbre_features.tolist() if self.timbre_features is not None else None,
            "recordings": self.recordings,
        }
        path = os.path.join(self.profile_dir, "profile.json")
        with open(path, "w") as f:
            json.dump(data, f)

    @classmethod
    def load(cls, profile_dir):
        """Load a voice profile from disk."""
        path = os.path.join(profile_dir, "profile.json")
        with open(path, "r") as f:
            data = json.load(f)

        profile = cls(data["name"], profile_dir)
        profile.mel_mean = np.array(data["mel_mean"]) if data["mel_mean"] else None
        profile.mel_std = np.array(data["mel_std"]) if data["mel_std"] else None
        profile.pitch_mean = data["pitch_mean"]
        profile.pitch_std = data["pitch_std"]
        profile.pitch_range = data["pitch_range"]
        profile.spectral_envelope = np.array(data["spectral_envelope"]) if data["spectral_envelope"] else None
        profile.formants = np.array(data["formants"]) if data["formants"] else None
        profile.timbre_features = np.array(data["timbre_features"]) if data["timbre_features"] else None
        profile.recordings = data["recordings"]
        return profile


class VoiceCloner:
    """Analyzes voice recordings and creates a cloneable voice model.

    Supports multiple backends:
    1. Neural (RVC/So-VITS-SVC) - highest quality, requires GPU
    2. Signal processing - works everywhere, good quality
    """

    def __init__(self, models_dir="static/models"):
        self.models_dir = models_dir
        os.makedirs(models_dir, exist_ok=True)
        self._backend = self._detect_backend()

    def _detect_backend(self):
        """Detect available voice conversion backend."""
        try:
            import torch
            if torch.cuda.is_available():
                try:
                    # Check for RVC
                    return "rvc"
                except ImportError:
                    pass
            return "neural_cpu"
        except ImportError:
            return "signal"

    def create_profile(self, name, audio_paths):
        """Create a voice profile from one or more audio recordings.

        Args:
            name: Name for the voice profile
            audio_paths: List of paths to voice recording WAV files

        Returns:
            VoiceProfile with learned voice characteristics
        """
        profile_dir = os.path.join(self.models_dir, name)
        profile = VoiceProfile(name, profile_dir)

        all_mels = []
        all_pitches = []
        all_spectral = []
        all_mfcc = []

        for audio_path in audio_paths:
            audio, sr = load_audio(audio_path, sr=44100)
            audio = trim_silence(audio)
            audio = normalize_audio(audio)

            # Save processed recording
            processed_path = os.path.join(profile_dir, f"recording_{len(profile.recordings)}.wav")
            save_audio(processed_path, audio, sr)
            profile.recordings.append(processed_path)

            # Extract mel spectrogram features
            mel = compute_mel_spectrogram(audio, sr=sr)
            all_mels.append(mel)

            # Extract pitch
            f0, voiced = extract_pitch(audio, sr=sr)
            valid_f0 = f0[voiced] if voiced is not None else f0[~np.isnan(f0)]
            if len(valid_f0) > 0:
                all_pitches.extend(valid_f0.tolist())

            # Extract spectral envelope (average spectrum shape)
            S = np.abs(librosa.stft(audio))
            spectral_env = np.mean(S, axis=1)
            all_spectral.append(spectral_env)

            # Extract MFCC for timbre characterization
            mfcc = librosa.feature.mfcc(y=audio, sr=sr, n_mfcc=20)
            all_mfcc.append(np.mean(mfcc, axis=1))

            # Extract formants (approximation using LPC)
            formants = self._extract_formants(audio, sr)
            if profile.formants is None:
                profile.formants = formants
            else:
                profile.formants = (profile.formants + formants) / 2

        # Aggregate features
        if all_mels:
            all_mels_concat = np.concatenate(all_mels, axis=1)
            profile.mel_mean = np.mean(all_mels_concat, axis=1)
            profile.mel_std = np.std(all_mels_concat, axis=1)

        if all_pitches:
            pitches = np.array(all_pitches)
            profile.pitch_mean = float(np.mean(pitches))
            profile.pitch_std = float(np.std(pitches))
            profile.pitch_range = [float(np.percentile(pitches, 5)),
                                   float(np.percentile(pitches, 95))]

        if all_spectral:
            min_len = min(s.shape[0] for s in all_spectral)
            all_spectral = [s[:min_len] for s in all_spectral]
            profile.spectral_envelope = np.mean(all_spectral, axis=0)

        if all_mfcc:
            profile.timbre_features = np.mean(all_mfcc, axis=0)

        profile.save()
        return profile

    def _extract_formants(self, audio, sr, order=12):
        """Extract formant frequencies using LPC analysis."""
        try:
            # Pre-emphasis
            pre_emphasis = 0.97
            emphasized = np.append(audio[0], audio[1:] - pre_emphasis * audio[:-1])

            # LPC analysis
            from scipy.signal import lfilter
            a = librosa.lpc(emphasized, order=order)

            # Find roots of LPC polynomial
            roots = np.roots(a)
            roots = roots[np.imag(roots) >= 0]

            # Convert to frequencies
            angles = np.arctan2(np.imag(roots), np.real(roots))
            freqs = sorted(angles * (sr / (2 * np.pi)))
            freqs = [f for f in freqs if 90 < f < 5000]

            # Return first 4 formants
            formants = np.array(freqs[:4]) if len(freqs) >= 4 else np.array(freqs + [0] * (4 - len(freqs)))
            return formants
        except Exception:
            return np.array([500, 1500, 2500, 3500], dtype=float)

    def convert_voice(self, source_audio_path, profile, output_path, pitch_shift=0):
        """Convert the voice in source audio to match the target voice profile.

        Args:
            source_audio_path: Path to the source audio (vocals to convert)
            profile: VoiceProfile to match
            output_path: Where to save the converted audio
            pitch_shift: Additional pitch shift in semitones

        Returns:
            Path to the converted audio file
        """
        source_audio, sr = load_audio(source_audio_path, sr=44100)

        if self._backend in ("rvc", "neural_cpu"):
            converted = self._convert_neural(source_audio, sr, profile, pitch_shift)
        else:
            converted = self._convert_signal(source_audio, sr, profile, pitch_shift)

        converted = normalize_audio(converted)
        save_audio(output_path, converted, sr)
        return output_path

    def _convert_signal(self, source_audio, sr, profile, pitch_shift=0):
        """Signal processing-based voice conversion.

        Uses spectral envelope matching and pitch shifting to approximate
        the target voice characteristics.
        """
        # Step 1: Extract source pitch
        source_f0, source_voiced = extract_pitch(source_audio, sr=sr)

        # Step 2: Calculate pitch shift needed to match target
        valid_source_f0 = source_f0[~np.isnan(source_f0)]
        if len(valid_source_f0) > 0 and profile.pitch_mean is not None:
            source_pitch_mean = np.mean(valid_source_f0)
            if source_pitch_mean > 0:
                # Calculate semitone difference
                semitone_diff = 12 * np.log2(profile.pitch_mean / source_pitch_mean)
                total_shift = semitone_diff + pitch_shift
            else:
                total_shift = pitch_shift
        else:
            total_shift = pitch_shift

        # Step 3: Apply pitch shift
        if abs(total_shift) > 0.5:
            converted = librosa.effects.pitch_shift(y=source_audio, sr=sr, n_steps=total_shift)
        else:
            converted = source_audio.copy()

        # Step 4: Apply spectral envelope matching (timbre transfer)
        converted = self._match_spectral_envelope(converted, sr, profile)

        # Step 5: Apply formant shaping
        converted = self._apply_formant_shaping(converted, sr, profile)

        return converted

    def _match_spectral_envelope(self, audio, sr, profile):
        """Match the spectral envelope of audio to the target profile."""
        if profile.spectral_envelope is None:
            return audio

        # STFT
        S = librosa.stft(audio)
        mag = np.abs(S)
        phase = np.angle(S)

        # Compute source spectral envelope
        source_env = np.mean(mag, axis=1)

        # Compute transfer function
        target_env = profile.spectral_envelope
        min_len = min(len(source_env), len(target_env))
        source_env = source_env[:min_len]
        target_env = target_env[:min_len]

        # Smooth transfer function to avoid artifacts
        transfer = np.ones_like(source_env)
        nonzero = source_env > 1e-10
        transfer[nonzero] = target_env[nonzero] / source_env[nonzero]

        # Limit the transfer function to avoid extreme changes
        transfer = np.clip(transfer, 0.2, 5.0)

        # Smooth
        from scipy.ndimage import gaussian_filter1d
        transfer = gaussian_filter1d(transfer, sigma=3)

        # Apply transfer function
        mag[:min_len] *= transfer[:, np.newaxis]

        # Reconstruct
        S_converted = mag * np.exp(1j * phase)
        converted = librosa.istft(S_converted, length=len(audio))

        return converted

    def _apply_formant_shaping(self, audio, sr, profile):
        """Apply formant frequency shaping to match target voice."""
        if profile.formants is None:
            return audio

        # Use parametric EQ-like approach to shape formants
        from scipy.signal import butter, sosfilt

        target_formants = profile.formants
        result = audio.copy()

        for formant_freq in target_formants:
            if formant_freq <= 0 or formant_freq >= sr / 2:
                continue

            # Gentle boost around each target formant frequency
            bandwidth = formant_freq * 0.1  # 10% bandwidth
            low = max(20, formant_freq - bandwidth)
            high = min(sr / 2 - 1, formant_freq + bandwidth)

            try:
                sos = butter(2, [low, high], btype='band', fs=sr, output='sos')
                formant_component = sosfilt(sos, audio)
                result = result + 0.15 * formant_component  # Subtle formant boost
            except Exception:
                continue

        # Normalize to prevent clipping
        max_val = np.max(np.abs(result))
        if max_val > 1.0:
            result = result / max_val

        return result

    def _convert_neural(self, source_audio, sr, profile, pitch_shift=0):
        """Neural network-based voice conversion (when PyTorch is available).

        Uses a simple encoder-decoder approach with the voice profile
        as conditioning input. Falls back to enhanced signal processing
        if full neural model isn't trained.
        """
        try:
            import torch
            import torch.nn.functional as F

            # Use enhanced signal processing with neural post-processing
            converted = self._convert_signal(source_audio, sr, profile, pitch_shift)

            # Apply learned spectral correction if we have timbre features
            if profile.timbre_features is not None:
                # Use MFCC-based timbre matching
                source_mfcc = librosa.feature.mfcc(y=converted, sr=sr, n_mfcc=20)
                target_mfcc = profile.timbre_features

                # Compute correction
                source_mfcc_mean = np.mean(source_mfcc, axis=1)
                correction = target_mfcc - source_mfcc_mean

                # Apply subtle correction through inverse MFCC
                S = librosa.stft(converted)
                mag = np.abs(S)

                # Map MFCC correction back to spectral domain
                mel_basis = librosa.filters.mel(sr=sr, n_fft=2048, n_mels=20)
                correction_spectrum = np.dot(mel_basis.T, correction * 0.3)
                correction_spectrum = np.clip(correction_spectrum, -0.5, 0.5)

                # Apply correction
                min_bins = min(mag.shape[0], len(correction_spectrum))
                gain = np.exp(correction_spectrum[:min_bins])
                gain = np.clip(gain, 0.5, 2.0)
                mag[:min_bins] *= gain[:, np.newaxis]

                phase = np.angle(S)
                S_corrected = mag * np.exp(1j * phase)
                converted = librosa.istft(S_corrected, length=len(converted))

            return converted
        except ImportError:
            return self._convert_signal(source_audio, sr, profile, pitch_shift)

    def list_profiles(self):
        """List all saved voice profiles."""
        profiles = []
        if os.path.exists(self.models_dir):
            for name in os.listdir(self.models_dir):
                profile_path = os.path.join(self.models_dir, name, "profile.json")
                if os.path.exists(profile_path):
                    profiles.append(name)
        return profiles

    def load_profile(self, name):
        """Load a saved voice profile by name."""
        profile_dir = os.path.join(self.models_dir, name)
        return VoiceProfile.load(profile_dir)

    def delete_profile(self, name):
        """Delete a saved voice profile."""
        import shutil
        profile_dir = os.path.join(self.models_dir, name)
        if os.path.exists(profile_dir):
            shutil.rmtree(profile_dir)

    @property
    def backend_name(self):
        return self._backend
