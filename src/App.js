import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import OverlayCanvas from './components/OverlayCanvas';
import Timeline from './components/Timeline';
import Toolbar from './components/Toolbar';
import ShareModal from './components/ShareModal';
import { saveOverlayData, loadOverlayData } from './firebase';
import './App.css';

function App() {
  const [videoUrl, setVideoUrl] = useState('');
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [overlays, setOverlays] = useState([]);
  const [activeOverlayId, setActiveOverlayId] = useState(null);
  const [tool, setTool] = useState('select'); // select, draw, text, erase
  const [brushColor, setBrushColor] = useState('#ff3366');
  const [brushSize, setBrushSize] = useState(4);
  const [showShareModal, setShowShareModal] = useState(false);
  const [playerRef, setPlayerRef] = useState(null);

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('s');
    if (shareId) {
      loadOverlayData(shareId)
        .then(data => {
          if (data.videoUrl) setVideoUrl(data.videoUrl);
          if (data.overlays) setOverlays(data.overlays);
          if (data.videoUrl) setVideoLoaded(true);
        })
        .catch(error => {
          console.error('Failed to load shared data:', error);
          alert('Failed to load shared overlay. The link may be invalid or expired.');
        });
    }
  }, []);

  const cleanYouTubeUrl = (url) => {
    // Extract video ID from various YouTube URL formats
    let videoId = null;

    // Check for youtu.be format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    }

    // Check for youtube.com format
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) {
      videoId = longMatch[1];
    }

    // If we found a video ID, return clean URL
    if (videoId) {
      return `https://www.youtube.com/watch?v=${videoId}`;
    }

    // Otherwise return original URL (might be Vimeo or other)
    return url;
  };

  const handleVideoLoad = useCallback((url) => {
    const cleanUrl = cleanYouTubeUrl(url);
    setVideoUrl(cleanUrl);
    setVideoLoaded(true);
    setOverlays([]);
    setCurrentTime(0);
  }, []);

  const handleTimeUpdate = useCallback((time) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((dur) => {
    setDuration(dur);
  }, []);

  const addOverlay = useCallback((overlayData) => {
    const newOverlay = {
      id: Date.now().toString(),
      startTime: currentTime,
      endTime: Math.min(currentTime + 5, duration),
      data: overlayData,
      type: tool === 'text' ? 'text' : 'drawing'
    };
    setOverlays(prev => [...prev, newOverlay]);
    setActiveOverlayId(newOverlay.id);
  }, [currentTime, duration, tool]);

  const updateOverlay = useCallback((id, updates) => {
    setOverlays(prev => prev.map(o => 
      o.id === id ? { ...o, ...updates } : o
    ));
  }, []);

  const deleteOverlay = useCallback((id) => {
    setOverlays(prev => prev.filter(o => o.id !== id));
    if (activeOverlayId === id) setActiveOverlayId(null);
  }, [activeOverlayId]);

  const getVisibleOverlays = useCallback(() => {
    return overlays.filter(o => 
      currentTime >= o.startTime && currentTime <= o.endTime
    );
  }, [overlays, currentTime]);

  const generateShareUrl = useCallback(async () => {
    try {
      const shareId = await saveOverlayData(videoUrl, overlays);
      return `${window.location.origin}${window.location.pathname}?s=${shareId}`;
    } catch (error) {
      console.error('Error generating share URL:', error);
      throw error;
    }
  }, [videoUrl, overlays]);

  const seekTo = useCallback((time) => {
    if (playerRef && playerRef.seekTo) {
      playerRef.seekTo(time, 'seconds');
    }
  }, [playerRef]);

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="logo">
          <span className="logo-icon">▶</span>
          OverlayTV
        </h1>
        <p className="tagline">Draw on videos. Share the fun.</p>
      </header>

      <main className="app-main">
        {!videoLoaded ? (
          <div className="url-input-container">
            <div className="url-input-card">
              <h2>Paste a YouTube URL to get started</h2>
              <div className="url-input-wrapper">
                <input
                  type="text"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && videoUrl) {
                      handleVideoLoad(videoUrl);
                    }
                  }}
                  className="url-input"
                />
                <button 
                  onClick={() => handleVideoLoad(videoUrl)}
                  disabled={!videoUrl}
                  className="load-btn"
                >
                  Load Video
                </button>
              </div>
              <p className="hint">Supports YouTube, Vimeo, and more</p>
            </div>
          </div>
        ) : (
          <div className="editor-container">
            <Toolbar
              tool={tool}
              setTool={setTool}
              brushColor={brushColor}
              setBrushColor={setBrushColor}
              brushSize={brushSize}
              setBrushSize={setBrushSize}
              onShare={() => setShowShareModal(true)}
              onNewVideo={() => {
                setVideoLoaded(false);
                setVideoUrl('');
                setOverlays([]);
                window.history.replaceState({}, '', window.location.pathname);
              }}
              hasOverlays={overlays.length > 0}
            />
            
            <div className="video-area">
              <div className="video-wrapper">
                <VideoPlayer
                  url={videoUrl}
                  playing={isPlaying}
                  onTimeUpdate={handleTimeUpdate}
                  onDuration={handleDurationChange}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  setPlayerRef={setPlayerRef}
                />
                <OverlayCanvas
                  tool={tool}
                  brushColor={brushColor}
                  brushSize={brushSize}
                  visibleOverlays={getVisibleOverlays()}
                  onAddOverlay={addOverlay}
                  isPlaying={isPlaying}
                  activeOverlayId={activeOverlayId}
                  onUpdateOverlay={updateOverlay}
                  onSelectOverlay={setActiveOverlayId}
                />
              </div>
              
              <div className="video-controls">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="play-btn"
                >
                  {isPlaying ? '❚❚' : '▶'}
                </button>
                <span className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>

            <Timeline
              duration={duration}
              currentTime={currentTime}
              overlays={overlays}
              activeOverlayId={activeOverlayId}
              onSeek={seekTo}
              onSelectOverlay={setActiveOverlayId}
              onUpdateOverlay={updateOverlay}
              onDeleteOverlay={deleteOverlay}
            />
          </div>
        )}
      </main>

      {showShareModal && (
        <ShareModal
          generateUrl={generateShareUrl}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <footer className="app-footer">
        <p>Made with ♥ for creative video annotations</p>
      </footer>
    </div>
  );
}

function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export default App;
