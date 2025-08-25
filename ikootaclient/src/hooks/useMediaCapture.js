// ikootaclient/src/hooks/useMediaCapture.js
import { useState, useRef, useCallback } from 'react';

export const useMediaCapture = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [mediaStream, setMediaStream] = useState(null);
  const [recordedBlobs, setRecordedBlobs] = useState([]);
  
  const mediaRecorderRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // 📸 Image Upload Handler
  const handleImageUpload = useCallback(() => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.multiple = true;
      
      input.onchange = (event) => {
        const files = Array.from(event.target.files);
        console.log('📁 Images selected:', files.map(f => f.name));
        resolve(files);
      };
      
      input.oncancel = () => {
        console.log('📁 Image upload cancelled');
        resolve([]);
      };
      
      input.click();
    });
  }, []);

  // 📹 Camera Capture Handler
  const startCameraCapture = useCallback(async () => {
    try {
      setIsCapturing(true);
      console.log('📹 Starting camera capture...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user' // Front camera by default
        }, 
        audio: true // Include audio for video recording
      });
      
      setMediaStream(stream);
      
      // If video ref exists, show preview
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      
      console.log('✅ Camera access granted');
      return stream;
    } catch (error) {
      console.error('❌ Camera access denied:', error);
      setIsCapturing(false);
      
      let errorMessage = 'Camera access denied. ';
      if (error.name === 'NotFoundError') {
        errorMessage += 'No camera found on this device.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow camera access and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage += 'Camera is already in use by another application.';
      } else {
        errorMessage += 'Please check your camera settings.';
      }
      
      alert(errorMessage);
      throw error;
    }
  }, []);

  // 📸 Take Photo
  const takePhoto = useCallback(() => {
    if (!mediaStream || !videoRef.current || !canvasRef.current) {
      console.error('❌ Camera not ready for photo capture');
      return null;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert canvas to blob
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `photo-${Date.now()}.jpg`, { 
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          console.log('📸 Photo captured:', file.name);
          resolve(file);
        } else {
          console.error('❌ Failed to capture photo');
          resolve(null);
        }
      }, 'image/jpeg', 0.9);
    });
  }, [mediaStream]);

  // 🎥 Start Video Recording
  const startVideoRecording = useCallback(() => {
    if (!mediaStream) {
      console.error('❌ No media stream for video recording');
      return;
    }

    try {
      setRecordedBlobs([]);
      
      const mediaRecorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9' // Try VP9 first
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedBlobs(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎥 Video recording stopped');
        setIsRecording(false);
      };

      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      console.log('🎥 Video recording started');
    } catch (error) {
      console.error('❌ Video recording failed:', error);
      alert('Video recording not supported on this device.');
    }
  }, [mediaStream]);

  // 🛑 Stop Video Recording
  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log('🛑 Stopping video recording...');
      
      // Return promise that resolves when blob is ready
      return new Promise((resolve) => {
        const checkBlobs = () => {
          if (recordedBlobs.length > 0) {
            const blob = new Blob(recordedBlobs, { type: 'video/webm' });
            const file = new File([blob], `video-${Date.now()}.webm`, { 
              type: 'video/webm',
              lastModified: Date.now()
            });
            console.log('🎥 Video file created:', file.name, file.size);
            resolve(file);
          } else {
            // Wait a bit more for blobs to be available
            setTimeout(checkBlobs, 100);
          }
        };
        checkBlobs();
      });
    }
    return null;
  }, [isRecording, recordedBlobs]);

  // 🎤 Audio Recording Handler
  const startAudioRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting audio recording...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        }
      });
      
      setMediaStream(stream);
      setRecordedBlobs([]);
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          setRecordedBlobs(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.onstop = () => {
        console.log('🎤 Audio recording stopped');
        setIsRecording(false);
        
        // Stop the microphone stream
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      console.log('✅ Audio recording started');
      
      return stream;
    } catch (error) {
      console.error('❌ Microphone access denied:', error);
      
      let errorMessage = 'Microphone access denied. ';
      if (error.name === 'NotFoundError') {
        errorMessage += 'No microphone found on this device.';
      } else if (error.name === 'NotAllowedError') {
        errorMessage += 'Please allow microphone access and try again.';
      } else {
        errorMessage += 'Please check your microphone settings.';
      }
      
      alert(errorMessage);
      throw error;
    }
  }, []);

  // 🛑 Stop Audio Recording
  const stopAudioRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      console.log('🛑 Stopping audio recording...');
      
      return new Promise((resolve) => {
        const checkBlobs = () => {
          if (recordedBlobs.length > 0) {
            const blob = new Blob(recordedBlobs, { type: 'audio/webm' });
            const file = new File([blob], `audio-${Date.now()}.webm`, { 
              type: 'audio/webm',
              lastModified: Date.now()
            });
            console.log('🎤 Audio file created:', file.name, file.size);
            resolve(file);
          } else {
            setTimeout(checkBlobs, 100);
          }
        };
        checkBlobs();
      });
    }
    return null;
  }, [isRecording, recordedBlobs]);

  // 🛑 Stop All Media Streams
  const stopAllStreams = useCallback(() => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => {
        track.stop();
        console.log(`🛑 Stopped ${track.kind} track`);
      });
      setMediaStream(null);
    }
    
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current = null;
    }
    
    setIsRecording(false);
    setIsCapturing(false);
    setRecordedBlobs([]);
    
    console.log('🛑 All media streams stopped');
  }, [mediaStream]);

  // 🔄 Switch Camera (front/back)
  const switchCamera = useCallback(async () => {
    if (!isCapturing) return;
    
    try {
      // Stop current stream
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      
      // Get current facing mode
      const currentTrack = mediaStream?.getVideoTracks()[0];
      const currentSettings = currentTrack?.getSettings();
      const currentFacingMode = currentSettings?.facingMode || 'user';
      const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
      
      // Start new stream with opposite camera
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: newFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: true
      });
      
      setMediaStream(newStream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
      
      console.log(`📹 Switched to ${newFacingMode} camera`);
    } catch (error) {
      console.error('❌ Failed to switch camera:', error);
    }
  }, [mediaStream, isCapturing]);

  return {
    // State
    isRecording,
    isCapturing,
    mediaStream,
    
    // Refs for components
    videoRef,
    canvasRef,
    
    // Image upload
    handleImageUpload,
    
    // Camera functions
    startCameraCapture,
    takePhoto,
    startVideoRecording,
    stopVideoRecording,
    switchCamera,
    
    // Audio functions
    startAudioRecording,
    stopAudioRecording,
    
    // Cleanup
    stopAllStreams,
  };
};