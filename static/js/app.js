/**
 * Transcend - Voice Clone Singing App
 * Frontend application logic
 */

(function () {
  "use strict";

  // ─── State ──────────────────────────────────────────────────────────────
  const state = {
    currentStep: 1,
    recordings: [],        // { file_path, duration, file_id }
    totalDuration: 0,
    profileName: "my_voice",
    profileTrained: false,
    song: null,            // { song_id, file_path, duration, filename }
    vocalsPath: null,
    instrumentalPath: null,
    convertId: null,
    outputPath: null,
  };

  // ─── DOM References ─────────────────────────────────────────────────────
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // Recorder
  let mediaRecorder = null;
  let audioChunks = [];
  let recordingStartTime = null;
  let recordingTimer = null;
  let audioContext = null;
  let analyser = null;
  let animationFrame = null;

  // ─── Initialization ─────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    initStepNav();
    initRecorder();
    initFileUploads();
    initTraining();
    initSongUpload();
    initConversion();
    initSliders();
    loadStatus();
  });

  // ─── Step Navigation ────────────────────────────────────────────────────
  function initStepNav() {
    $$(".step-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const step = parseInt(btn.dataset.step);
        if (canGoToStep(step)) {
          goToStep(step);
        }
      });
    });

    $("#btnToStep2").addEventListener("click", () => goToStep(2));
    $("#btnToStep3").addEventListener("click", () => goToStep(3));
    $("#btnToStep4").addEventListener("click", () => goToStep(4));
    $("#btnBackTo1").addEventListener("click", () => goToStep(1));
    $("#btnBackTo2").addEventListener("click", () => goToStep(2));
    $("#btnBackTo3").addEventListener("click", () => goToStep(3));
  }

  function canGoToStep(step) {
    if (step === 1) return true;
    if (step === 2) return state.recordings.length > 0;
    if (step === 3) return state.profileTrained;
    if (step === 4) return state.vocalsPath !== null;
    return false;
  }

  function goToStep(step) {
    state.currentStep = step;

    $$(".step-panel").forEach((p) => p.classList.remove("active"));
    $(`#step-${step}`).classList.add("active");

    $$(".step-btn").forEach((btn) => {
      const s = parseInt(btn.dataset.step);
      btn.classList.remove("active", "completed");
      if (s === step) btn.classList.add("active");
      else if (s < step) btn.classList.add("completed");
    });

    // Update step 2 info when navigating there
    if (step === 2) {
      $("#trainRecCount").textContent = state.recordings.length;
      $("#trainDuration").textContent = formatDuration(state.totalDuration);
      $("#trainProfileName").textContent = state.profileName;
    }
  }

  // ─── Voice Recorder ────────────────────────────────────────────────────
  function initRecorder() {
    const btnRecord = $("#btnRecord");
    const btnStop = $("#btnStop");

    btnRecord.addEventListener("click", startRecording);
    btnStop.addEventListener("click", stopRecording);
    $("#profileName").addEventListener("input", (e) => {
      state.profileName = e.target.value.replace(/[^a-zA-Z0-9_-]/g, "_") || "my_voice";
    });
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      // Set up audio context for visualization
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      source.connect(analyser);

      // Determine supported MIME type
      let mimeType = "audio/webm;codecs=opus";
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = "audio/webm";
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = "audio/ogg;codecs=opus";
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = "";  // Let browser pick default
          }
        }
      }

      const options = mimeType ? { mimeType } : {};
      mediaRecorder = new MediaRecorder(stream, options);
      audioChunks = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        cancelAnimationFrame(animationFrame);

        const blob = new Blob(audioChunks, { type: mimeType || "audio/webm" });
        await uploadRecordingBlob(blob);
      };

      mediaRecorder.start(250); // Collect data every 250ms
      recordingStartTime = Date.now();

      // UI updates
      $("#btnRecord").classList.add("recording");
      $("#btnRecord").disabled = true;
      $("#btnStop").disabled = false;

      // Start timer
      recordingTimer = setInterval(updateRecordingTime, 100);

      // Start waveform visualization
      drawWaveform();
    } catch (err) {
      alert("Microphone access denied. Please allow microphone access and try again.");
      console.error("Recording error:", err);
    }
  }

  function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    clearInterval(recordingTimer);

    $("#btnRecord").classList.remove("recording");
    $("#btnRecord").disabled = false;
    $("#btnStop").disabled = true;
    $("#recordingTime").textContent = "0:00";
  }

  function updateRecordingTime() {
    if (!recordingStartTime) return;
    const elapsed = (Date.now() - recordingStartTime) / 1000;
    const mins = Math.floor(elapsed / 60);
    const secs = Math.floor(elapsed % 60);
    $("#recordingTime").textContent = `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  function drawWaveform() {
    if (!analyser) return;
    const canvas = $("#waveformCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = canvas.offsetWidth * 2;
    canvas.height = canvas.offsetHeight * 2;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function draw() {
      animationFrame = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = "#7c5cff";
      ctx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
        x += sliceWidth;
      }

      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();
    }

    draw();
  }

  async function uploadRecordingBlob(blob) {
    try {
      const profileName = state.profileName;
      const resp = await fetch(
        `/api/record/blob?profile_name=${encodeURIComponent(profileName)}`,
        { method: "POST", body: blob }
      );
      const data = await resp.json();

      if (data.error) {
        alert("Upload error: " + data.error);
        return;
      }

      addRecording(data);
    } catch (err) {
      alert("Failed to upload recording: " + err.message);
    }
  }

  // ─── File Uploads (voice samples) ──────────────────────────────────────
  function initFileUploads() {
    $("#voiceFileUpload").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const formData = new FormData();
      formData.append("audio", file);
      formData.append("profile_name", state.profileName);

      try {
        const resp = await fetch("/api/record", {
          method: "POST",
          body: formData,
        });
        const data = await resp.json();

        if (data.error) {
          alert("Upload error: " + data.error);
          return;
        }

        addRecording(data);
      } catch (err) {
        alert("Upload failed: " + err.message);
      }

      e.target.value = "";
    });
  }

  function addRecording(data) {
    state.recordings.push({
      file_path: data.file_path,
      duration: data.duration,
      file_id: data.file_id,
    });

    state.totalDuration += data.duration;
    updateRecordingsList();
    $("#btnToStep2").disabled = state.recordings.length === 0;
  }

  function removeRecording(index) {
    state.totalDuration -= state.recordings[index].duration;
    state.recordings.splice(index, 1);
    updateRecordingsList();
    $("#btnToStep2").disabled = state.recordings.length === 0;
  }

  function updateRecordingsList() {
    const container = $("#recordingsItems");

    if (state.recordings.length === 0) {
      container.innerHTML = '<p class="empty-state">No recordings yet. Hit Record or upload a file.</p>';
      $("#totalDuration").textContent = "0s";
      return;
    }

    container.innerHTML = state.recordings
      .map(
        (rec, i) => `
      <div class="recording-item">
        <span class="rec-name">Recording ${i + 1}</span>
        <span class="rec-duration">${rec.duration}s</span>
        <button class="rec-remove" onclick="window.__removeRec(${i})" title="Remove">&times;</button>
      </div>
    `
      )
      .join("");

    $("#totalDuration").textContent = formatDuration(state.totalDuration);
  }

  // Expose remove function globally for onclick handlers
  window.__removeRec = removeRecording;

  // ─── Training ───────────────────────────────────────────────────────────
  function initTraining() {
    $("#btnTrain").addEventListener("click", trainModel);
  }

  async function trainModel() {
    if (state.recordings.length === 0) return;

    const progressEl = $("#trainingProgress");
    const resultEl = $("#trainingResult");
    const btnTrain = $("#btnTrain");

    progressEl.style.display = "block";
    resultEl.style.display = "none";
    btnTrain.disabled = true;

    // Animate progress bar
    const fill = $("#progressFill");
    const texts = [
      "Analyzing voice characteristics...",
      "Extracting pitch and timbre...",
      "Learning spectral envelope...",
      "Building voice profile...",
    ];
    let progress = 0;

    const progressInterval = setInterval(() => {
      progress = Math.min(progress + Math.random() * 15, 90);
      fill.style.width = progress + "%";
      const textIndex = Math.min(Math.floor(progress / 25), texts.length - 1);
      $("#progressText").textContent = texts[textIndex];
    }, 500);

    try {
      const resp = await fetch("/api/profile/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_name: state.profileName,
          recordings: state.recordings.map((r) => r.file_path),
        }),
      });
      const data = await resp.json();

      clearInterval(progressInterval);

      if (data.error) {
        fill.style.width = "0%";
        progressEl.style.display = "none";
        btnTrain.disabled = false;
        alert("Training failed: " + data.error);
        return;
      }

      fill.style.width = "100%";
      $("#progressText").textContent = "Complete!";

      // Show results
      state.profileTrained = true;

      setTimeout(() => {
        progressEl.style.display = "none";
        resultEl.style.display = "block";

        if (data.pitch_mean) {
          $("#resultPitch").textContent = Math.round(data.pitch_mean) + " Hz";
        } else {
          $("#resultPitch").textContent = "N/A";
        }

        if (data.pitch_range) {
          $("#resultRange").textContent =
            Math.round(data.pitch_range[0]) + " - " + Math.round(data.pitch_range[1]) + " Hz";
        } else {
          $("#resultRange").textContent = "N/A";
        }

        $("#resultEngine").textContent = data.backend || "signal";
        $("#btnToStep3").disabled = false;
        btnTrain.disabled = false;
      }, 800);
    } catch (err) {
      clearInterval(progressInterval);
      fill.style.width = "0%";
      progressEl.style.display = "none";
      btnTrain.disabled = false;
      alert("Training error: " + err.message);
    }
  }

  // ─── Song Upload ────────────────────────────────────────────────────────
  function initSongUpload() {
    const uploadZone = $("#uploadZone");
    const fileInput = $("#songFileUpload");

    uploadZone.addEventListener("click", () => fileInput.click());

    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.classList.add("drag-over");
    });

    uploadZone.addEventListener("dragleave", () => {
      uploadZone.classList.remove("drag-over");
    });

    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.classList.remove("drag-over");
      const file = e.dataTransfer.files[0];
      if (file) uploadSong(file);
    });

    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) uploadSong(file);
      e.target.value = "";
    });

    $("#btnSeparate").addEventListener("click", separateVocals);
  }

  async function uploadSong(file) {
    const formData = new FormData();
    formData.append("song", file);

    try {
      const resp = await fetch("/api/song/upload", {
        method: "POST",
        body: formData,
      });
      const data = await resp.json();

      if (data.error) {
        alert("Upload error: " + data.error);
        return;
      }

      state.song = {
        song_id: data.song_id,
        file_path: data.file_path,
        duration: data.duration,
        filename: data.filename,
      };

      // Update UI
      $("#uploadZone").style.display = "none";
      $("#songInfo").style.display = "block";
      $("#songName").textContent = data.filename;
      $("#songDuration").textContent = formatDuration(data.duration);

      const preview = $("#songPreview");
      preview.src = data.file_path;
    } catch (err) {
      alert("Upload failed: " + err.message);
    }
  }

  async function separateVocals() {
    if (!state.song) return;

    $("#btnSeparate").disabled = true;
    $("#separationProgress").style.display = "block";

    try {
      const resp = await fetch("/api/song/separate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          song_path: state.song.file_path,
          song_id: state.song.song_id,
        }),
      });
      const data = await resp.json();

      if (data.error) {
        alert("Separation failed: " + data.error);
        $("#btnSeparate").disabled = false;
        $("#separationProgress").style.display = "none";
        return;
      }

      state.vocalsPath = data.vocals_path;
      state.instrumentalPath = data.instrumental_path;

      // Show separated tracks
      $("#separationProgress").style.display = "none";
      $("#separatedTracks").style.display = "grid";

      $("#vocalsPreview").src = data.vocals_path;
      $("#instrumentalPreview").src = data.instrumental_path;

      $("#btnToStep4").disabled = false;
    } catch (err) {
      alert("Separation error: " + err.message);
      $("#btnSeparate").disabled = false;
      $("#separationProgress").style.display = "none";
    }
  }

  // ─── Voice Conversion ──────────────────────────────────────────────────
  function initConversion() {
    $("#btnConvert").addEventListener("click", convertVoice);
    $("#btnDownload").addEventListener("click", downloadOutput);
    $("#btnConvertAgain").addEventListener("click", () => {
      $("#outputSection").style.display = "none";
      $("#convertProgress").style.display = "none";
    });
  }

  function initSliders() {
    const sliders = [
      { id: "pitchShift", display: "pitchShiftValue", format: (v) => parseInt(v) },
      { id: "vocalVolume", display: "vocalVolumeValue", format: (v) => parseFloat(v).toFixed(1) },
      { id: "instrVolume", display: "instrVolumeValue", format: (v) => parseFloat(v).toFixed(1) },
    ];

    sliders.forEach(({ id, display, format }) => {
      const input = $(`#${id}`);
      const value = $(`#${display}`);
      input.addEventListener("input", () => {
        value.textContent = format(input.value);
      });
    });
  }

  async function convertVoice() {
    if (!state.vocalsPath || !state.profileName) return;

    $("#btnConvert").disabled = true;
    $("#convertProgress").style.display = "block";
    $("#outputSection").style.display = "none";

    const pitchShift = parseInt($("#pitchShift").value);
    const vocalVolume = parseFloat($("#vocalVolume").value);
    const instrVolume = parseFloat($("#instrVolume").value);

    try {
      const resp = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_name: state.profileName,
          vocals_path: state.vocalsPath,
          instrumental_path: state.instrumentalPath,
          pitch_shift: pitchShift,
          vocal_volume: vocalVolume,
          instrumental_volume: instrVolume,
        }),
      });
      const data = await resp.json();

      if (data.error) {
        alert("Conversion failed: " + data.error);
        $("#btnConvert").disabled = false;
        $("#convertProgress").style.display = "none";
        return;
      }

      state.convertId = data.convert_id;
      state.outputPath = data.output_path;

      // Show output
      $("#convertProgress").style.display = "none";
      $("#outputSection").style.display = "block";

      $("#outputPreview").src = data.output_path;
      $("#btnConvert").disabled = false;
    } catch (err) {
      alert("Conversion error: " + err.message);
      $("#btnConvert").disabled = false;
      $("#convertProgress").style.display = "none";
    }
  }

  function downloadOutput() {
    if (!state.convertId) return;
    window.location.href = `/api/download/${state.convertId}`;
  }

  // ─── System Status ─────────────────────────────────────────────────────
  async function loadStatus() {
    try {
      const resp = await fetch("/api/status");
      const data = await resp.json();

      $("#statusEngine").textContent = `Voice Engine: ${data.voice_backend}`;
      $("#statusSeparator").textContent = `Separator: ${data.separator_backend}`;

      // Load existing profiles
      if (data.profiles && data.profiles.length > 0) {
        state.profileName = data.profiles[0];
        state.profileTrained = true;
        $("#profileName").value = state.profileName;
      }
    } catch {
      $("#statusEngine").textContent = "Engine: offline";
      $("#statusSeparator").textContent = "Server not running";
    }
  }

  // ─── Utilities ──────────────────────────────────────────────────────────
  function formatDuration(seconds) {
    if (seconds < 60) return Math.round(seconds) + "s";
    const mins = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${mins}m ${secs}s`;
  }
})();
