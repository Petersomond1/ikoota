// VideoRecorder.jsx - Full-length teaching video recording component
// Supports videos up to 1.5+ hours with S3 upload

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Play, Square, Pause, Video, Clock, HardDrive, Shield, ShieldOff, Settings } from 'lucide-react';
import api from '../service/api';
import VideoMaskingSystem from './VideoMaskingSystem';

const VideoRecorder = ({ classId, onVideoUploaded }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  // Masking system state
  const [maskingEnabled, setMaskingEnabled] = useState(false);
  const [showMaskingControls, setShowMaskingControls] = useState(false);
  const [originalStream, setOriginalStream] = useState(null);
  const [maskedStream, setMaskedStream] = useState(null);
  const [currentMaskingSettings, setCurrentMaskingSettings] = useState(null);

  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const durationIntervalRef = useRef(null);

  // Format duration display
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Get file size in MB
  const getFileSizeMB = (blob) => {
    return (blob.size / (1024 * 1024)).toFixed(2);
  };

  // Start recording
  const startRecording = async () => {
    try {
      console.log('🎥 Starting video recording...');

      // Request camera and microphone access with high quality settings
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });

      streamRef.current = stream;
      setOriginalStream(stream);

      // Use masked stream if masking is enabled, otherwise use original
      const activeStream = maskingEnabled && maskedStream ? maskedStream : stream;
      videoRef.current.srcObject = activeStream;

      // Configure MediaRecorder for high quality, long recordings
      const options = {
        mimeType: 'video/webm;codecs=vp9,opus', // High efficiency codec
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
        audioBitsPerSecond: 128000   // 128 kbps for clear audio
      };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('🛑 Recording stopped, processing video...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);

        // Show preview
        const url = URL.createObjectURL(blob);
        videoRef.current.srcObject = null;
        videoRef.current.src = url;

        console.log(`📊 Video recorded: ${getFileSizeMB(blob)}MB, Duration: ${formatDuration(recordingDuration)}`);
      };

      // Start recording with data chunks every 10 seconds for large files
      mediaRecorderRef.current.start(10000);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('❌ Error starting recording:', error);
      alert('Failed to start recording. Please check camera/microphone permissions.');
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);

      // Stop duration timer
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      // Stop camera stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    }
  };

  // Pause/Resume recording
  const togglePause = () => {
    if (mediaRecorderRef.current) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        durationIntervalRef.current = setInterval(() => {
          setRecordingDuration(prev => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
        }
      }
      setIsPaused(!isPaused);
    }
  };

  // Upload video to S3
  const uploadVideo = async () => {
    if (!recordedBlob || !classId) return;

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Preparing upload...');

    try {
      // Create form data for large file upload
      const formData = new FormData();
      const timestamp = Date.now();
      const filename = `teaching-video-${timestamp}.webm`;

      formData.append('video', recordedBlob, filename);
      formData.append('classId', classId);
      formData.append('title', `Teaching Video - ${new Date().toLocaleDateString()}`);
      formData.append('duration', recordingDuration);
      formData.append('fileSize', recordedBlob.size);

      // Add masking information
      formData.append('maskingEnabled', maskingEnabled);
      if (maskingEnabled && currentMaskingSettings) {
        formData.append('maskingSettings', JSON.stringify(currentMaskingSettings));
        formData.append('voiceAltered', currentMaskingSettings.voicePitch !== 0 || currentMaskingSettings.voiceRobotic || currentMaskingSettings.voiceClown);
      }

      console.log(`🚀 Uploading video: ${filename} (${getFileSizeMB(recordedBlob)}MB)`);

      // Upload with progress tracking
      const response = await api.post('/upload/video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 300000, // 5 minutes timeout for large files
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgress(progress);
          setUploadStatus(`Uploading... ${progress}% (${(progressEvent.loaded / (1024 * 1024)).toFixed(1)}MB)`);
        }
      });

      console.log('✅ Video uploaded successfully:', response.data);
      setUploadStatus('Upload completed! Processing video...');

      // Notify parent component
      if (onVideoUploaded) {
        onVideoUploaded(response.data);
      }

      // Reset state
      setTimeout(() => {
        setRecordedBlob(null);
        setUploadProgress(0);
        setUploadStatus('');
        setIsUploading(false);
        setRecordingDuration(0);
      }, 3000);

    } catch (error) {
      console.error('❌ Video upload failed:', error);
      setUploadStatus('Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="video-recorder-container bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center gap-2">
          <Video className="w-6 h-6 text-blue-600" />
          Teaching Video Recorder
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          {/* Identity Protection Toggle */}
          <button
            onClick={() => setMaskingEnabled(!maskingEnabled)}
            className={`flex items-center gap-2 px-3 py-1 rounded-full transition-colors ${
              maskingEnabled
                ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={maskingEnabled ? 'Identity protection enabled' : 'Identity protection disabled'}
          >
            {maskingEnabled ? <Shield className="w-4 h-4" /> : <ShieldOff className="w-4 h-4" />}
            <span className="text-xs font-medium">
              {maskingEnabled ? 'Protected' : 'Unprotected'}
            </span>
          </button>

          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatDuration(recordingDuration)}</span>
          </div>
          {recordedBlob && (
            <div className="flex items-center gap-1">
              <HardDrive className="w-4 h-4" />
              <span>{getFileSizeMB(recordedBlob)}MB</span>
            </div>
          )}
        </div>
      </div>

      {/* Video Preview */}
      <div className="relative bg-black rounded-lg overflow-hidden mb-6" style={{ aspectRatio: '16/9' }}>
        <video
          ref={videoRef}
          autoPlay
          muted={isRecording}
          controls={!isRecording}
          className="w-full h-full object-cover"
          playsInline
        />

        {/* Recording Indicator */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">
              {isPaused ? 'PAUSED' : 'RECORDING'}
            </span>
          </div>
        )}

        {/* Duration Display */}
        {isRecording && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded">
            <span className="text-lg font-mono">{formatDuration(recordingDuration)}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Video className="w-5 h-5" />
            Start Recording
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              Stop
            </button>
          </>
        )}

        {/* Masking Controls Toggle */}
        {maskingEnabled && (
          <button
            onClick={() => setShowMaskingControls(!showMaskingControls)}
            className="flex items-center gap-2 bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            {showMaskingControls ? 'Hide' : 'Configure'} Identity Protection
          </button>
        )}

        {recordedBlob && !isRecording && (
          <button
            onClick={uploadVideo}
            disabled={isUploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            <Upload className="w-5 h-5" />
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        )}
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{uploadStatus}</span>
            <span className="text-sm font-medium">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Masking System Configuration */}
      {maskingEnabled && showMaskingControls && (
        <div className="mb-6">
          <VideoMaskingSystem
            videoStream={originalStream}
            onMaskedStream={(maskedStream) => {
              setMaskedStream(maskedStream);
              // Update video preview with masked stream
              if (videoRef.current && !isRecording) {
                videoRef.current.srcObject = maskedStream;
              }
            }}
            onSettingsChange={(settings) => {
              setCurrentMaskingSettings(settings);
            }}
            enabled={maskingEnabled}
          />
        </div>
      )}

      {/* Guidelines */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium mb-2">Recording Guidelines:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Recommended duration: Up to 1.5+ hours for comprehensive teaching</li>
          <li>• File size limit: Up to 5GB per video</li>
          <li>• Quality: 1080p recording with clear audio</li>
          <li>• Use pause/resume for natural breaks in teaching</li>
          <li>• Large files may take several minutes to upload</li>
          <li className="text-purple-600 font-medium">• Optional: Enable identity protection to mask face and alter voice</li>
          <li className="text-purple-600">• Choose from blur, pixelate, artistic, or clown masking styles</li>
          <li className="text-purple-600">• Voice alteration includes pitch shifting and robotic/clown effects</li>
        </ul>
      </div>
    </div>
  );
};

export default VideoRecorder;