import React, { useRef, useEffect, useState, useCallback } from 'react';
import './OverlayCanvas.css';

function OverlayCanvas({
  tool,
  brushColor,
  brushSize,
  visibleOverlays,
  onAddOverlay,
  isPlaying,
  activeOverlayId,
  onUpdateOverlay,
  onSelectOverlay,
  onTogglePlayPause
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    contextRef.current = ctx;
  }, []);

  // Redraw visible overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    visibleOverlays.forEach(overlay => {
      const offsetX = overlay.data.offsetX || 0;
      const offsetY = overlay.data.offsetY || 0;
      const isActive = overlay.id === activeOverlayId;

      if (overlay.type === 'drawing' && overlay.data.paths) {
        overlay.data.paths.forEach(path => {
          if (path.points.length < 2) return;

          ctx.beginPath();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size;
          ctx.moveTo(path.points[0].x + offsetX, path.points[0].y + offsetY);

          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x + offsetX, path.points[i].y + offsetY);
          }
          ctx.stroke();
        });

        // Draw selection box for active overlay
        if (isActive) {
          const bounds = getDrawingBounds(overlay.data.paths, offsetX, offsetY);
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
          ctx.setLineDash([]);
        }
      } else if (overlay.type === 'text' && overlay.data.text) {
        ctx.font = `${overlay.data.size || 24}px 'Syne', sans-serif`;
        ctx.fillStyle = overlay.data.color;
        ctx.fillText(overlay.data.text, overlay.data.x + offsetX, overlay.data.y + offsetY);

        // Draw selection box for active text
        if (isActive) {
          const metrics = ctx.measureText(overlay.data.text);
          const textHeight = overlay.data.size || 24;
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            overlay.data.x + offsetX - 5,
            overlay.data.y + offsetY - textHeight - 5,
            metrics.width + 10,
            textHeight + 10
          );
          ctx.setLineDash([]);
        }
      }
    });
  }, [visibleOverlays, activeOverlayId]);

  const getDrawingBounds = (paths, offsetX, offsetY) => {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(path => {
      path.points.forEach(point => {
        minX = Math.min(minX, point.x + offsetX);
        minY = Math.min(minY, point.y + offsetY);
        maxX = Math.max(maxX, point.x + offsetX);
        maxY = Math.max(maxY, point.y + offsetY);
      });
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  };

  const getCoordinates = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    if (e.touches) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }, []);

  const checkOverlayHit = useCallback((coords, overlay) => {
    const offsetX = overlay.data.offsetX || 0;
    const offsetY = overlay.data.offsetY || 0;

    if (overlay.type === 'text' && overlay.data.text) {
      const ctx = contextRef.current;
      ctx.font = `${overlay.data.size || 24}px 'Syne', sans-serif`;
      const metrics = ctx.measureText(overlay.data.text);
      const textHeight = overlay.data.size || 24;
      const x = overlay.data.x + offsetX;
      const y = overlay.data.y + offsetY;

      return coords.x >= x - 5 &&
             coords.x <= x + metrics.width + 5 &&
             coords.y >= y - textHeight - 5 &&
             coords.y <= y + 5;
    } else if (overlay.type === 'drawing' && overlay.data.paths) {
      const bounds = getDrawingBounds(overlay.data.paths, offsetX, offsetY);
      return coords.x >= bounds.x - 5 &&
             coords.x <= bounds.x + bounds.width + 5 &&
             coords.y >= bounds.y - 5 &&
             coords.y <= bounds.y + bounds.height + 5;
    }
    return false;
  }, []);

  const startDrawing = useCallback((e) => {
    const coords = getCoordinates(e);

    if (tool === 'select') {
      // Check if clicking on an overlay
      const clickedOverlay = [...visibleOverlays].reverse().find(overlay =>
        checkOverlayHit(coords, overlay)
      );

      if (clickedOverlay) {
        onSelectOverlay(clickedOverlay.id);
        setIsDragging(true);
        setDragStart(coords);
      } else {
        onSelectOverlay(null);
        // Toggle play/pause when clicking empty area with select tool
        if (onTogglePlayPause) {
          onTogglePlayPause();
        }
      }
      return;
    }

    if (isPlaying) return;

    if (tool === 'text') {
      setTextInput({ show: true, x: coords.x, y: coords.y, value: '' });
      return;
    }

    if (tool === 'draw') {
      setIsDrawing(true);
      setCurrentPath([coords]);

      const ctx = contextRef.current;
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = brushSize;
      ctx.moveTo(coords.x, coords.y);
    }
  }, [isPlaying, tool, brushColor, brushSize, getCoordinates, visibleOverlays, checkOverlayHit, onSelectOverlay, onTogglePlayPause]);

  const draw = useCallback((e) => {
    const coords = getCoordinates(e);

    // Handle dragging
    if (isDragging && tool === 'select' && activeOverlayId) {
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      const activeOverlay = visibleOverlays.find(o => o.id === activeOverlayId);
      if (activeOverlay && onUpdateOverlay) {
        onUpdateOverlay(activeOverlayId, {
          data: {
            ...activeOverlay.data,
            offsetX: (activeOverlay.data.offsetX || 0) + deltaX,
            offsetY: (activeOverlay.data.offsetY || 0) + deltaY
          }
        });
      }
      setDragStart(coords);
      return;
    }

    // Handle drawing
    if (!isDrawing || tool !== 'draw') return;

    setCurrentPath(prev => [...prev, coords]);

    const ctx = contextRef.current;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, tool, getCoordinates, isDragging, activeOverlayId, dragStart, visibleOverlays, onUpdateOverlay]);

  const stopDrawing = useCallback(() => {
    // Stop dragging
    if (isDragging) {
      setIsDragging(false);
      return;
    }

    // Stop drawing
    if (!isDrawing || currentPath.length < 2) {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    onAddOverlay({
      paths: [{
        points: currentPath,
        color: brushColor,
        size: brushSize
      }],
      offsetX: 0,
      offsetY: 0
    });

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, brushColor, brushSize, onAddOverlay, isDragging]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      onAddOverlay({
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        color: brushColor,
        size: brushSize * 6,
        offsetX: 0,
        offsetY: 0
      });
    }
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  }, [textInput, brushColor, brushSize, onAddOverlay]);

  const getCursor = () => {
    if (isPlaying) return 'default';
    if (isDragging) return 'move';
    switch (tool) {
      case 'select': return activeOverlayId ? 'move' : 'default';
      case 'draw': return 'crosshair';
      case 'text': return 'text';
      case 'erase': return 'cell';
      default: return 'default';
    }
  };

  return (
    <div className="overlay-canvas-container">
      <canvas
        ref={canvasRef}
        className="overlay-canvas"
        style={{ cursor: getCursor() }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      
      {textInput.show && (
        <div
          className="text-input-overlay"
          style={{
            left: `${textInput.x}px`,
            top: `${textInput.y}px`
          }}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={textInput.value}
            onChange={(e) => {
              setTextInput(prev => ({ ...prev, value: e.target.value }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleTextSubmit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                setTextInput({ show: false, x: 0, y: 0, value: '' });
              }
            }}
            autoFocus
            placeholder="Type and press Enter"
            style={{
              color: brushColor,
              caretColor: brushColor
            }}
          />
        </div>
      )}
      
      {isPlaying && (
        <div className="playing-indicator">
          <span>Playing - pause to edit</span>
        </div>
      )}
    </div>
  );
}

export default OverlayCanvas;
