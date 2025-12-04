import React, { useRef, useCallback } from 'react';
import './Timeline.css';

function Timeline({
  duration,
  currentTime,
  overlays,
  activeOverlayId,
  onSeek,
  onSelectOverlay,
  onUpdateOverlay,
  onDeleteOverlay
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
    draggingRef.current = { overlay, edge };
    
    const handleMove = (moveEvent) => {
      if (!timelineRef.current || !draggingRef.current) return;
      
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
    
    const handleUp = () => {
      draggingRef.current = null;
      document.removeEventListener('mousemove', handleMove);
      document.removeEventListener('mouseup', handleUp);
    };
    
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleUp);
  }, [duration, onUpdateOverlay]);

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  return (
    <div className="timeline-container">
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
          
          return (
            <div
              key={overlay.id}
              className={`timeline-overlay ${activeOverlayId === overlay.id ? 'active' : ''}`}
              style={{ left: `${left}%`, width: `${width}%` }}
              onClick={(e) => {
                e.stopPropagation();
                onSelectOverlay(overlay.id);
              }}
            >
              <div 
                className="overlay-handle handle-start"
                onMouseDown={(e) => handleOverlayDrag(e, overlay, 'start')}
              />
              <div 
                className="overlay-content"
                onMouseDown={(e) => handleOverlayDrag(e, overlay, 'middle')}
              >
                <span className="overlay-type">
                  {overlay.type === 'text' ? 'T' : '✎'}
                </span>
              </div>
              <div 
                className="overlay-handle handle-end"
                onMouseDown={(e) => handleOverlayDrag(e, overlay, 'end')}
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
                <label>
                  Start:
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max={overlay.endTime - 0.5}
                    value={overlay.startTime.toFixed(1)}
                    onChange={(e) => onUpdateOverlay(overlay.id, { 
                      startTime: Math.max(0, parseFloat(e.target.value) || 0) 
                    })}
                  />
                </label>
                <label>
                  End:
                  <input
                    type="number"
                    step="0.1"
                    min={overlay.startTime + 0.5}
                    max={duration}
                    value={overlay.endTime.toFixed(1)}
                    onChange={(e) => onUpdateOverlay(overlay.id, { 
                      endTime: Math.min(duration, parseFloat(e.target.value) || 0) 
                    })}
                  />
                </label>
              </div>
              <button 
                className="delete-btn"
                onClick={() => onDeleteOverlay(overlay.id)}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Timeline;
