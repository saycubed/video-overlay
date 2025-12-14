import React, { useState, useEffect, useCallback } from 'react';
import VideoPlayer from './components/VideoPlayer';
import OverlayCanvas from './components/OverlayCanvas';
import Timeline from './components/Timeline';
import Toolbar from './components/Toolbar';
import ShareModal from './components/ShareModal';
import SharedViewControls from './components/SharedViewControls';
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
  const [textFont, setTextFont] = useState('Syne');
  const [showShareModal, setShowShareModal] = useState(false);
  const [playerRef, setPlayerRef] = useState(null);
  const [isSharedView, setIsSharedView] = useState(false);
  const [showEditControls, setShowEditControls] = useState(false);
  const [copiedOverlay, setCopiedOverlay] = useState(null);

  // Load from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareId = params.get('s');
    if (shareId) {
      setIsSharedView(true);
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

  // Handle keyboard shortcuts for copy/paste
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts if not typing in an input field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      // Copy overlay (Ctrl+C or Cmd+C)
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && activeOverlayId) {
        e.preventDefault();
        const overlayToCopy = overlays.find(o => o.id === activeOverlayId);
        if (overlayToCopy) {
          setCopiedOverlay(overlayToCopy);
        }
      }

      // Paste overlay (Ctrl+V or Cmd+V)
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedOverlay) {
        e.preventDefault();
        const newOverlay = {
          ...copiedOverlay,
          id: Date.now().toString()
        };
        setOverlays(prev => [...prev, newOverlay]);
        setActiveOverlayId(newOverlay.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeOverlayId, overlays, copiedOverlay]);

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
            {isSharedView && (
              <SharedViewControls
                showEditControls={showEditControls}
                onToggleEdit={() => setShowEditControls(!showEditControls)}
                onNewVideo={() => {
                  setVideoLoaded(false);
                  setVideoUrl('');
                  setOverlays([]);
                  setIsSharedView(false);
                  setShowEditControls(false);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
              />
            )}

            {(!isSharedView || showEditControls) && (
              <Toolbar
                tool={tool}
                setTool={setTool}
                brushColor={brushColor}
                setBrushColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                textFont={textFont}
                setTextFont={setTextFont}
                onShare={() => setShowShareModal(true)}
                onNewVideo={() => {
                  setVideoLoaded(false);
                  setVideoUrl('');
                  setOverlays([]);
                  window.history.replaceState({}, '', window.location.pathname);
                }}
                hasOverlays={overlays.length > 0}
              />
            )}
            
            <div className="video-area">
              <div
                className="video-wrapper"
                onClick={(e) => {
                  // Only toggle play/pause if clicking the video wrapper itself
                  if (e.target.classList.contains('video-wrapper') ||
                      e.target.closest('.video-player')) {
                    if (tool === 'select') {
                      setIsPlaying(!isPlaying);
                    }
                  }
                }}
              >
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
                  textFont={textFont}
                  setBrushColor={setBrushColor}
                  setBrushSize={setBrushSize}
                  setTextFont={setTextFont}
                  visibleOverlays={getVisibleOverlays()}
                  onAddOverlay={addOverlay}
                  isPlaying={isPlaying}
                  activeOverlayId={activeOverlayId}
                  onUpdateOverlay={updateOverlay}
                  onSelectOverlay={setActiveOverlayId}
                  onTogglePlayPause={() => setIsPlaying(!isPlaying)}
                  showOutlines={!isSharedView || showEditControls}
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

            {(!isSharedView || showEditControls) && (
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
            )}
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
