// ClassroomVideoPlayer.jsx - Enhanced video player for teaching videos
// Supports full-length videos with progress tracking, chapters, and classroom features

import React, { useState, useRef, useEffect } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Maximize,
  Settings, Download, Clock, User, Calendar, FileVideo
} from 'lucide-react';

const ClassroomVideoPlayer = ({ videoData, onProgress, autoPlay = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showControls, setShowControls] = useState(true);

  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  // Format time display
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb > 1024) {
      return `${(mb / 1024).toFixed(1)}GB`;
    }
    return `${mb.toFixed(1)}MB`;
  };

  // Handle play/pause
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  // Handle time seeking
  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percentage = (e.clientX - rect.left) / rect.width;
    const newTime = percentage * duration;

    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  // Toggle mute
  const toggleMute = () => {
    if (videoRef.current) {
      if (isMuted) {
        videoRef.current.volume = volume;
        setIsMuted(false);
      } else {
        videoRef.current.volume = 0;
        setIsMuted(true);
      }
    }
  };

  // Skip forward/backward
  const skipTime = (seconds) => {
    if (videoRef.current) {
      const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Change playback speed
  const changePlaybackRate = (rate) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
      setPlaybackRate(rate);
    }
  };

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadedData = () => {
      setDuration(video.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Report progress to parent component
      if (onProgress && video.duration) {
        const progress = (video.currentTime / video.duration) * 100;
        onProgress({
          currentTime: video.currentTime,
          duration: video.duration,
          progress: progress
        });
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    // Auto-play if requested
    if (autoPlay && video.readyState >= 3) {
      video.play().catch(console.error);
    }

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [autoPlay, onProgress]);

  // Fullscreen change handler
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipTime(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipTime(10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!videoData) {
    return (
      <div className="video-player-container bg-gray-100 rounded-lg p-8 text-center">
        <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No video selected</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`video-player-container relative bg-black rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => setShowControls(true)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        src={videoData.url}
        preload="metadata"
        playsInline
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading video...</p>
          </div>
        </div>
      )}

      {/* Video Info Overlay */}
      <div className="absolute top-4 left-4 right-4">
        <div className="bg-black bg-opacity-75 rounded-lg p-3 text-white">
          <h3 className="font-semibold text-lg mb-2">{videoData.title}</h3>
          <div className="flex items-center gap-4 text-sm text-gray-300">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Duration: {formatTime(videoData.duration * 60)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileVideo className="w-4 h-4" />
              <span>{formatFileSize(videoData.fileSize)}</span>
            </div>
            {videoData.uploadedBy && (
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{videoData.uploadedBy}</span>
              </div>
            )}
            {videoData.uploadedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>{new Date(videoData.uploadedAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        {/* Progress Bar */}
        <div className="px-4 pb-2">
          <div
            className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
            onClick={handleSeek}
          >
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            ></div>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between px-4 pb-4">
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlayPause}
              className="text-white hover:text-blue-400 transition-colors"
            >
              {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8" />}
            </button>

            {/* Skip buttons */}
            <button
              onClick={() => skipTime(-10)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <SkipBack className="w-6 h-6" />
            </button>
            <button
              onClick={() => skipTime(10)}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <SkipForward className="w-6 h-6" />
            </button>

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="text-white hover:text-blue-400">
                {isMuted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 accent-blue-500"
              />
            </div>

            {/* Time Display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Playback Speed */}
            <select
              value={playbackRate}
              onChange={(e) => changePlaybackRate(parseFloat(e.target.value))}
              className="bg-gray-700 text-white text-sm rounded px-2 py-1"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>

            {/* Download */}
            <a
              href={videoData.url}
              download={videoData.title}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Download className="w-5 h-5" />
            </a>

            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-blue-400 transition-colors"
            >
              <Maximize className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Center Play Button */}
      {!isPlaying && !isLoading && (
        <button
          onClick={togglePlayPause}
          className="absolute inset-0 flex items-center justify-center text-white bg-black bg-opacity-30 hover:bg-opacity-50 transition-all"
        >
          <Play className="w-20 h-20" />
        </button>
      )}
    </div>
  );
};

export default ClassroomVideoPlayer;