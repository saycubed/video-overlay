import React, { useRef, useCallback, useState, useEffect } from 'react';
import './Timeline.css';

function TimeInput({ value, onChange, min = 0, max = Infinity, label, position = 'left' }) {
  const [isHolding, setIsHolding] = useState(false);
  const holdTimerRef = useRef(null);
  const intervalRef = useRef(null);
  const speedUpTimerRef = useRef(null);
  const [speed, setSpeed] = useState(100); // ms between increments

  const increment = useCallback(() => {
    onChange(Math.min(max, value + 0.1));
  }, [value, max, onChange]);

  const decrement = useCallback(() => {
    onChange(Math.max(min, value - 0.1));
  }, [value, min, onChange]);

  const startHold = useCallback((direction) => {
    setIsHolding(true);
    setSpeed(100);

    // Initial action
    if (direction === 'up') {
      increment();
    } else {
      decrement();
    }

    // Start repeating after short delay
    holdTimerRef.current = setTimeout(() => {
      intervalRef.current = setInterval(() => {
        if (direction === 'up') {
          increment();
        } else {
          decrement();
        }
      }, speed);

      // Speed up after 1 second
      speedUpTimerRef.current = setTimeout(() => {
        setSpeed(50);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(() => {
            if (direction === 'up') {
              increment();
            } else {
              decrement();
            }
          }, 50);
        }
      }, 1000);
    }, 300);
  }, [increment, decrement, speed]);

  const stopHold = useCallback(() => {
    setIsHolding(false);
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (speedUpTimerRef.current) clearTimeout(speedUpTimerRef.current);
    setSpeed(100);
  }, []);

  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (speedUpTimerRef.current) clearTimeout(speedUpTimerRef.current);
    };
  }, []);

  return (
    <div className={`time-input-wrapper time-input-${position}`}>
      {position === 'left' && (
        <div className="time-arrows">
          <button
            className="time-arrow time-arrow-up"
            onMouseDown={() => startHold('up')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('up')}
            onTouchEnd={stopHold}
          >
            ▲
          </button>
          <button
            className="time-arrow time-arrow-down"
            onMouseDown={() => startHold('down')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('down')}
            onTouchEnd={stopHold}
          >
            ▼
          </button>
        </div>
      )}
      <label className="time-label">
        <span className="time-value">{value.toFixed(1)}s</span>
        <span className="time-label-text">{label}</span>
      </label>
      {position === 'right' && (
        <div className="time-arrows">
          <button
            className="time-arrow time-arrow-up"
            onMouseDown={() => startHold('up')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('up')}
            onTouchEnd={stopHold}
          >
            ▲
          </button>
          <button
            className="time-arrow time-arrow-down"
            onMouseDown={() => startHold('down')}
            onMouseUp={stopHold}
            onMouseLeave={stopHold}
            onTouchStart={() => startHold('down')}
            onTouchEnd={stopHold}
          >
            ▼
          </button>
        </div>
      )}
    </div>
  );
}

function Timeline({
  duration,
  currentTime,
  overlays,
  activeOverlayId,
  onSeek,
  onSelectOverlay,
  onUpdateOverlay,
  onDeleteOverlay,
  className = '',
  style = {}
}) {
  const timelineRef = useRef(null);
  const draggingRef = useRef(null);

  const handleTimelineClick = useCallback((e) => {
    if (!timelineRef.current || !duration) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    onSeek(Math.max(0, Math.min(duration, time)));
  }, [duration, onSeek]);

  const handleOverlayDrag = useCallback((e, overlay, edge) => {
    e.stopPropagation();
    e.preventDefault();

    // Capture the pointer for better drag tracking
    if (e.target.setPointerCapture) {
      e.target.setPointerCapture(e.pointerId);
    }

    draggingRef.current = { overlay, edge, pointerId: e.pointerId };

    const handleMove = (moveEvent) => {
      if (!timelineRef.current || !draggingRef.current) return;
      // Only handle events from the same pointer
      if (moveEvent.pointerId !== draggingRef.current.pointerId) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const time = (x / rect.width) * duration;
      const clampedTime = Math.max(0, Math.min(duration, time));

      const { overlay: dragOverlay, edge: dragEdge } = draggingRef.current;

      if (dragEdge === 'start') {
        if (clampedTime < dragOverlay.endTime - 0.5) {
          onUpdateOverlay(dragOverlay.id, { startTime: clampedTime });
        }
      } else if (dragEdge === 'end') {
        if (clampedTime > dragOverlay.startTime + 0.5) {
          onUpdateOverlay(dragOverlay.id, { endTime: clampedTime });
        }
      } else {
        // Moving the whole overlay
        const overlayDuration = dragOverlay.endTime - dragOverlay.startTime;
        const newStart = Math.max(0, Math.min(duration - overlayDuration, clampedTime - overlayDuration / 2));
        onUpdateOverlay(dragOverlay.id, {
          startTime: newStart,
          endTime: newStart + overlayDuration
        });
      }
    };

    const handleUp = (upEvent) => {
      if (!draggingRef.current) return;
      // Only handle events from the same pointer
      if (upEvent.pointerId !== draggingRef.current.pointerId) return;

      // Release pointer capture
      if (upEvent.target.releasePointerCapture) {
        upEvent.target.releasePointerCapture(upEvent.pointerId);
      }

      draggingRef.current = null;
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
      document.removeEventListener('pointercancel', handleUp);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    document.addEventListener('pointercancel', handleUp);
  }, [duration, onUpdateOverlay]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const analyzeOverlayColors = (overlay) => {
    // Text overlays: return single color
    if (overlay.type === 'text') {
      return [{ color: overlay.data?.color || '#00ffaa', percentage: 100 }];
    }

    // Drawing overlays: analyze paths
    if (overlay.type === 'drawing' && overlay.data?.paths) {
      const paths = overlay.data.paths;

      // Count occurrences of each color
      const colorCounts = {};
      paths.forEach(path => {
        const color = path.color || '#00ffaa';
        colorCounts[color] = (colorCounts[color] || 0) + 1;
      });

      // Calculate percentages
      const totalPaths = paths.length;
      const colorDistribution = Object.entries(colorCounts).map(([color, count]) => ({
        color,
        percentage: (count / totalPaths) * 100
      }));

      // Sort by percentage (largest first) for consistent rendering
      return colorDistribution.sort((a, b) => b.percentage - a.percentage);
    }

    // Fallback
    return [{ color: '#00ffaa', percentage: 100 }];
  };

  const generateColorBlockStyle = (colorDistribution) => {
    // Single color: solid background
    if (colorDistribution.length === 1) {
      return { backgroundColor: colorDistribution[0].color };
    }

    // Multiple colors: horizontal layers with hard stops (top to bottom)
    let gradientStops = [];
    let cumulativePercent = 0;

    colorDistribution.forEach((item) => {
      const startPercent = cumulativePercent;
      const endPercent = cumulativePercent + item.percentage;

      // Hard stops create distinct color layers
      gradientStops.push(`${item.color} ${startPercent}%`);
      gradientStops.push(`${item.color} ${endPercent}%`);

      cumulativePercent = endPercent;
    });

    return {
      background: `linear-gradient(to bottom, ${gradientStops.join(', ')})`
    };
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`timeline-container ${className}`} style={style}>
      <div className="timeline-header">
        <h3>Timeline</h3>
        <span className="overlay-count">{overlays.length} overlay{overlays.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div 
        className="timeline-track"
        ref={timelineRef}
        onClick={handleTimelineClick}
      >
        <div 
          className="timeline-progress"
          style={{ width: `${progressPercent}%` }}
        />
        
        <div 
          className="timeline-playhead"
          style={{ left: `${progressPercent}%` }}
        />
        
        {overlays.map(overlay => {
          const left = (overlay.startTime / duration) * 100;
          const width = ((overlay.endTime - overlay.startTime) / duration) * 100;

          // Analyze colors used in overlay
          const colorDistribution = analyzeOverlayColors(overlay);
          const colorStyle = generateColorBlockStyle(colorDistribution);

          // Get text preview for text overlays
          const textPreview = overlay.type === 'text' && overlay.data?.text
            ? overlay.data.text
            : null;

          return (
            <div
              key={overlay.id}
              className={`timeline-overlay ${activeOverlayId === overlay.id ? 'active' : ''}`}
              style={{
                left: `${left}%`,
                width: `${width}%`,
                ...colorStyle,
                zIndex: activeOverlayId === overlay.id ? 5 : 1
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectOverlay(overlay.id);
              }}
            >
              <div
                className="overlay-handle handle-start"
                onPointerDown={(e) => handleOverlayDrag(e, overlay, 'start')}
              />
              <div
                className="overlay-content"
                onPointerDown={(e) => handleOverlayDrag(e, overlay, 'middle')}
              >
                {textPreview ? (
                  <span className="overlay-text-preview" title={textPreview}>
                    {textPreview}
                  </span>
                ) : (
                  <span className="overlay-type">
                    {overlay.type === 'text' ? 'T' : '✎'}
                  </span>
                )}
              </div>
              <div
                className="overlay-handle handle-end"
                onPointerDown={(e) => handleOverlayDrag(e, overlay, 'end')}
              />
            </div>
          );
        })}
        
        <div className="timeline-ticks">
          {duration > 0 && Array.from({ length: 11 }).map((_, i) => (
            <div key={i} className="tick" style={{ left: `${i * 10}%` }}>
              <span>{formatTime((i / 10) * duration)}</span>
            </div>
          ))}
        </div>
      </div>
      
      {activeOverlayId && (
        <div className="overlay-editor">
          {overlays.filter(o => o.id === activeOverlayId).map(overlay => (
            <div key={overlay.id} className="overlay-details">
              <div className="time-inputs">
                <TimeInput
                  label="Start:"
                  value={overlay.startTime}
                  onChange={(val) => onUpdateOverlay(overlay.id, { startTime: val })}
                  min={0}
                  max={overlay.endTime - 0.5}
                  position="left"
                />
                <TimeInput
                  label="End:"
                  value={overlay.endTime}
                  onChange={(val) => onUpdateOverlay(overlay.id, { endTime: val })}
                  min={overlay.startTime + 0.5}
                  max={duration}
                  position="right"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Timeline;
