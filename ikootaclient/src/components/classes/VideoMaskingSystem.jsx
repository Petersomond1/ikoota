// VideoMaskingSystem.jsx - Comprehensive converse/masking system for teaching videos
// Implements facial alteration, voice modification, and identity protection

import React, { useState, useRef, useEffect } from 'react';
import {
  Users, Eye, EyeOff, Volume2, VolumeX, Palette, Sliders,
  RefreshCw, Save, Settings, User, Shield, Mic, UserCheck
} from 'lucide-react';

const VideoMaskingSystem = ({ videoStream, onMaskedStream, onSettingsChange, enabled = true }) => {
  // Masking state
  const [maskingEnabled, setMaskingEnabled] = useState(true);
  const [faceDetected, setFaceDetected] = useState(false);
  const [maskingSettings, setMaskingSettings] = useState({
    // Facial masking options
    faceBlur: 5,
    faceDistortion: 3,
    colorShift: 2,
    eyeMask: true,
    mouthMask: true,

    // Voice alteration
    voicePitch: -2, // Lower pitch
    voiceSpeed: 0.9, // Slight speed change
    voiceRobotic: false,
    voiceClown: false,

    // Advanced options
    realTimeProcessing: true,
    qualityMode: 'balanced', // 'performance', 'balanced', 'quality'
    maskStyle: 'blur' // 'blur', 'pixelate', 'artistic', 'clown'
  });

  // Refs
  const canvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const gainNodeRef = useRef(null);
  const faceDetectorRef = useRef(null);

  // Initialize face detection
  useEffect(() => {
    if (typeof window !== 'undefined' && window.FaceDetector) {
      faceDetectorRef.current = new window.FaceDetector({
        maxDetectedFaces: 1,
        fastMode: true
      });
    }
  }, []);

  // Initialize audio processing
  useEffect(() => {
    if (videoStream && maskingSettings.realTimeProcessing) {
      setupAudioProcessing();
    }
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [videoStream, maskingSettings]);

  // Setup audio context for voice alteration
  const setupAudioProcessing = async () => {
    try {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(videoStream);

      // Create audio processing chain
      gainNodeRef.current = audioContextRef.current.createGain();
      analyserRef.current = audioContextRef.current.createAnalyser();

      // Apply voice effects
      applyVoiceEffects(source);

    } catch (error) {
      console.warn('Audio processing not available:', error);
    }
  };

  // Apply voice alteration effects
  const applyVoiceEffects = (source) => {
    if (!audioContextRef.current) return;

    const { voicePitch, voiceSpeed, voiceRobotic, voiceClown } = maskingSettings;

    // Pitch shifting (simplified implementation)
    if (voicePitch !== 0) {
      const pitchShifter = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      pitchShifter.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        // Simple pitch shifting by sample rate manipulation
        const pitchFactor = Math.pow(2, voicePitch / 12);
        for (let i = 0; i < input.length; i++) {
          const sourceIndex = Math.floor(i / pitchFactor);
          output[i] = sourceIndex < input.length ? input[sourceIndex] : 0;
        }
      };
      source.connect(pitchShifter);
      pitchShifter.connect(gainNodeRef.current);
    }

    // Robotic voice effect
    if (voiceRobotic) {
      const roboticProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      roboticProcessor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        // Add robotic effect (bit crushing and modulation)
        for (let i = 0; i < input.length; i++) {
          let sample = input[i];
          sample = Math.sign(sample) * Math.pow(Math.abs(sample), 0.5); // Compress
          sample *= (1 + 0.3 * Math.sin(i * 0.01)); // Modulate
          output[i] = sample;
        }
      };
      source.connect(roboticProcessor);
      roboticProcessor.connect(gainNodeRef.current);
    }

    // Clown voice effect
    if (voiceClown) {
      const clownProcessor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      clownProcessor.onaudioprocess = (event) => {
        const input = event.inputBuffer.getChannelData(0);
        const output = event.outputBuffer.getChannelData(0);

        // High-pitched, exaggerated effect
        for (let i = 0; i < input.length; i++) {
          let sample = input[i];
          sample *= 1.5; // Amplify
          sample = Math.tanh(sample * 2); // Distort
          output[i] = sample;
        }
      };
      source.connect(clownProcessor);
      clownProcessor.connect(gainNodeRef.current);
    }

    gainNodeRef.current.connect(audioContextRef.current.destination);
  };

  // Process video frame with facial masking
  const processVideoFrame = async (video, canvas, ctx) => {
    if (!video || !canvas || !ctx) return;

    const { videoWidth, videoHeight } = video;
    canvas.width = videoWidth;
    canvas.height = videoHeight;

    // Draw original frame
    ctx.drawImage(video, 0, 0, videoWidth, videoHeight);

    if (!maskingEnabled) return;

    try {
      // Detect faces
      const faces = await detectFaces(canvas);

      if (faces && faces.length > 0) {
        setFaceDetected(true);

        // Apply masking to each detected face
        faces.forEach(face => {
          applyFacialMasking(ctx, face, videoWidth, videoHeight);
        });
      } else {
        setFaceDetected(false);
      }
    } catch (error) {
      console.warn('Face detection failed:', error);
      // Fallback: apply global blur if face detection fails
      applyGlobalMasking(ctx, videoWidth, videoHeight);
    }
  };

  // Detect faces in the frame
  const detectFaces = async (canvas) => {
    if (!faceDetectorRef.current) {
      // Fallback: assume face in center area
      return [{
        boundingBox: {
          x: canvas.width * 0.25,
          y: canvas.height * 0.2,
          width: canvas.width * 0.5,
          height: canvas.height * 0.6
        }
      }];
    }

    try {
      return await faceDetectorRef.current.detect(canvas);
    } catch (error) {
      console.warn('Face detection error:', error);
      return [];
    }
  };

  // Apply facial masking effects
  const applyFacialMasking = (ctx, face, width, height) => {
    const { boundingBox } = face;
    const { faceBlur, faceDistortion, colorShift, maskStyle } = maskingSettings;

    const x = boundingBox.x;
    const y = boundingBox.y;
    const w = boundingBox.width;
    const h = boundingBox.height;

    // Expand mask area slightly
    const expandedX = Math.max(0, x - w * 0.1);
    const expandedY = Math.max(0, y - h * 0.1);
    const expandedW = Math.min(width - expandedX, w * 1.2);
    const expandedH = Math.min(height - expandedY, h * 1.2);

    switch (maskStyle) {
      case 'blur':
        applyBlurMask(ctx, expandedX, expandedY, expandedW, expandedH, faceBlur);
        break;
      case 'pixelate':
        applyPixelateMask(ctx, expandedX, expandedY, expandedW, expandedH);
        break;
      case 'artistic':
        applyArtisticMask(ctx, expandedX, expandedY, expandedW, expandedH, colorShift);
        break;
      case 'clown':
        applyClownMask(ctx, expandedX, expandedY, expandedW, expandedH);
        break;
    }

    // Apply specific eye and mouth masking
    if (maskingSettings.eyeMask) {
      applyEyeMask(ctx, x, y + h * 0.3, w, h * 0.3);
    }
    if (maskingSettings.mouthMask) {
      applyMouthMask(ctx, x, y + h * 0.6, w, h * 0.3);
    }
  };

  // Blur masking effect
  const applyBlurMask = (ctx, x, y, w, h, intensity) => {
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    // Simple box blur
    const blurRadius = Math.max(1, intensity);
    for (let i = 0; i < data.length; i += 4) {
      const pixel = Math.floor(i / 4);
      const pixelX = pixel % w;
      const pixelY = Math.floor(pixel / w);

      if (pixelX % blurRadius === 0 && pixelY % blurRadius === 0) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Apply blur to surrounding pixels
        for (let dx = 0; dx < blurRadius && pixelX + dx < w; dx++) {
          for (let dy = 0; dy < blurRadius && pixelY + dy < h; dy++) {
            const targetIndex = ((pixelY + dy) * w + (pixelX + dx)) * 4;
            if (targetIndex < data.length) {
              data[targetIndex] = r;
              data[targetIndex + 1] = g;
              data[targetIndex + 2] = b;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  };

  // Pixelate masking effect
  const applyPixelateMask = (ctx, x, y, w, h) => {
    const pixelSize = 15;
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    for (let px = 0; px < w; px += pixelSize) {
      for (let py = 0; py < h; py += pixelSize) {
        const sourceIndex = (py * w + px) * 4;
        const r = data[sourceIndex];
        const g = data[sourceIndex + 1];
        const b = data[sourceIndex + 2];

        // Fill pixel block
        for (let dx = 0; dx < pixelSize && px + dx < w; dx++) {
          for (let dy = 0; dy < pixelSize && py + dy < h; dy++) {
            const targetIndex = ((py + dy) * w + (px + dx)) * 4;
            if (targetIndex < data.length) {
              data[targetIndex] = r;
              data[targetIndex + 1] = g;
              data[targetIndex + 2] = b;
            }
          }
        }
      }
    }

    ctx.putImageData(imageData, x, y);
  };

  // Artistic color-shift mask
  const applyArtisticMask = (ctx, x, y, w, h, intensity) => {
    const imageData = ctx.getImageData(x, y, w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      // Shift colors dramatically
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      data[i] = Math.min(255, b + intensity * 20); // Red from blue
      data[i + 1] = Math.min(255, r + intensity * 15); // Green from red
      data[i + 2] = Math.min(255, g + intensity * 25); // Blue from green
    }

    ctx.putImageData(imageData, x, y);
  };

  // Clown mask effect
  const applyClownMask = (ctx, x, y, w, h) => {
    ctx.save();

    // Draw colorful clown features
    ctx.fillStyle = 'rgba(255, 0, 0, 0.6)'; // Red nose area
    ctx.fillRect(x + w * 0.4, y + h * 0.4, w * 0.2, h * 0.15);

    ctx.fillStyle = 'rgba(0, 255, 255, 0.4)'; // Cyan cheeks
    ctx.fillRect(x + w * 0.1, y + h * 0.3, w * 0.25, h * 0.3);
    ctx.fillRect(x + w * 0.65, y + h * 0.3, w * 0.25, h * 0.3);

    ctx.fillStyle = 'rgba(255, 255, 0, 0.5)'; // Yellow mouth
    ctx.fillRect(x + w * 0.3, y + h * 0.65, w * 0.4, h * 0.2);

    ctx.restore();
  };

  // Apply eye masking
  const applyEyeMask = (ctx, x, y, w, h) => {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(x + w * 0.15, y, w * 0.7, h);
    ctx.restore();
  };

  // Apply mouth masking
  const applyMouthMask = (ctx, x, y, w, h) => {
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(x + w * 0.2, y, w * 0.6, h);
    ctx.restore();
  };

  // Apply global masking when face detection fails
  const applyGlobalMasking = (ctx, width, height) => {
    // Apply light blur to entire upper portion of frame
    applyBlurMask(ctx, 0, 0, width, height * 0.7, 2);
  };

  // Update masking settings
  const updateSetting = (key, value) => {
    const newSettings = {
      ...maskingSettings,
      [key]: value
    };
    setMaskingSettings(newSettings);

    // Notify parent component of settings changes
    if (onSettingsChange) {
      onSettingsChange(newSettings);
    }
  };

  // Preset configurations
  const applyPreset = (preset) => {
    const presets = {
      light: {
        faceBlur: 2,
        faceDistortion: 1,
        colorShift: 1,
        voicePitch: -1,
        maskStyle: 'blur'
      },
      medium: {
        faceBlur: 5,
        faceDistortion: 3,
        colorShift: 2,
        voicePitch: -2,
        maskStyle: 'pixelate'
      },
      heavy: {
        faceBlur: 8,
        faceDistortion: 5,
        colorShift: 4,
        voicePitch: -3,
        voiceRobotic: true,
        maskStyle: 'artistic'
      },
      clown: {
        faceBlur: 3,
        colorShift: 5,
        voiceClown: true,
        voicePitch: 2,
        maskStyle: 'clown'
      }
    };

    setMaskingSettings(prev => ({
      ...prev,
      ...presets[preset]
    }));
  };

  return (
    <div className="video-masking-system bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Shield className="w-6 h-6 text-purple-600" />
          Converse Identity Masking
        </h3>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${faceDetected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
            <Eye className="w-4 h-4" />
            {faceDetected ? 'Face Detected' : 'Scanning...'}
          </div>
          <button
            onClick={() => setMaskingEnabled(!maskingEnabled)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              maskingEnabled
                ? 'bg-purple-600 hover:bg-purple-700 text-white'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            }`}
          >
            <Users className="w-4 h-4" />
            {maskingEnabled ? 'Masking ON' : 'Masking OFF'}
          </button>
        </div>
      </div>

      {/* Quick Presets */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Quick Presets:</h4>
        <div className="flex gap-2 flex-wrap">
          {['light', 'medium', 'heavy', 'clown'].map(preset => (
            <button
              key={preset}
              onClick={() => applyPreset(preset)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium transition-colors capitalize"
            >
              {preset} Masking
            </button>
          ))}
        </div>
      </div>

      {/* Facial Masking Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-6">
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <User className="w-4 h-4" />
            Facial Masking
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Mask Style:</label>
              <select
                value={maskingSettings.maskStyle}
                onChange={(e) => updateSetting('maskStyle', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg"
              >
                <option value="blur">Blur Effect</option>
                <option value="pixelate">Pixelate</option>
                <option value="artistic">Artistic Color Shift</option>
                <option value="clown">Clown Mask</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Blur Intensity: {maskingSettings.faceBlur}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={maskingSettings.faceBlur}
                onChange={(e) => updateSetting('faceBlur', parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Color Shift: {maskingSettings.colorShift}
              </label>
              <input
                type="range"
                min="0"
                max="5"
                value={maskingSettings.colorShift}
                onChange={(e) => updateSetting('colorShift', parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={maskingSettings.eyeMask}
                  onChange={(e) => updateSetting('eyeMask', e.target.checked)}
                  className="accent-purple-600"
                />
                <span className="text-sm">Eye Mask</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={maskingSettings.mouthMask}
                  onChange={(e) => updateSetting('mouthMask', e.target.checked)}
                  className="accent-purple-600"
                />
                <span className="text-sm">Mouth Mask</span>
              </label>
            </div>
          </div>
        </div>

        {/* Voice Alteration Controls */}
        <div>
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <Mic className="w-4 h-4" />
            Voice Alteration
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Voice Pitch: {maskingSettings.voicePitch > 0 ? '+' : ''}{maskingSettings.voicePitch}
              </label>
              <input
                type="range"
                min="-5"
                max="5"
                value={maskingSettings.voicePitch}
                onChange={(e) => updateSetting('voicePitch', parseInt(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Voice Speed: {maskingSettings.voiceSpeed}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={maskingSettings.voiceSpeed}
                onChange={(e) => updateSetting('voiceSpeed', parseFloat(e.target.value))}
                className="w-full accent-purple-600"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={maskingSettings.voiceRobotic}
                  onChange={(e) => updateSetting('voiceRobotic', e.target.checked)}
                  className="accent-purple-600"
                />
                <span className="text-sm">Robotic Voice</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={maskingSettings.voiceClown}
                  onChange={(e) => updateSetting('voiceClown', e.target.checked)}
                  className="accent-purple-600"
                />
                <span className="text-sm">Clown Voice</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Processing Canvas (Hidden) */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />

      {/* Status Information */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
        <p className="mb-1">
          <strong>Status:</strong> {maskingEnabled ? 'Identity protection active' : 'Identity protection disabled'}
        </p>
        <p className="mb-1">
          <strong>Processing:</strong> {maskingSettings.realTimeProcessing ? 'Real-time' : 'Post-processing'}
        </p>
        <p>
          <strong>Quality Mode:</strong> {maskingSettings.qualityMode}
        </p>
      </div>
    </div>
  );
};

export default VideoMaskingSystem;