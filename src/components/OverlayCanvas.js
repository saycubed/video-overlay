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
      // Convert relative offsets to absolute
      const offsetX = (overlay.data.offsetX || 0) * rect.width;
      const offsetY = (overlay.data.offsetY || 0) * rect.height;
      const isActive = overlay.id === activeOverlayId;

      if (overlay.type === 'drawing' && overlay.data.paths) {
        overlay.data.paths.forEach(path => {
          if (path.points.length < 2) return;

          ctx.beginPath();
          ctx.strokeStyle = path.color;
          // Scale line width relative to canvas size
          ctx.lineWidth = (path.size || 4) * (rect.width / 800);

          // Convert first point from relative to absolute
          const firstPoint = {
            x: path.points[0].x * rect.width + offsetX,
            y: path.points[0].y * rect.height + offsetY
          };
          ctx.moveTo(firstPoint.x, firstPoint.y);

          for (let i = 1; i < path.points.length; i++) {
            const point = {
              x: path.points[i].x * rect.width + offsetX,
              y: path.points[i].y * rect.height + offsetY
            };
            ctx.lineTo(point.x, point.y);
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
        // Scale font size relative to canvas size
        const fontSize = (overlay.data.size || 24) * (rect.width / 800);
        ctx.font = `${fontSize}px 'Syne', sans-serif`;
        ctx.fillStyle = overlay.data.color;

        // Convert relative position to absolute
        const textX = (overlay.data.x || 0) * rect.width + offsetX;
        const textY = (overlay.data.y || 0) * rect.height + offsetY;
        ctx.fillText(overlay.data.text, textX, textY);

        // Draw selection box for active text
        if (isActive) {
          const metrics = ctx.measureText(overlay.data.text);
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            textX - 5,
            textY - fontSize - 5,
            metrics.width + 10,
            fontSize + 10
          );
          ctx.setLineDash([]);
        }
      }
    });
  }, [visibleOverlays, activeOverlayId]);

  const getDrawingBounds = (paths, offsetX, offsetY) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, width: 0, height: 0 };
    const rect = canvas.getBoundingClientRect();

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    paths.forEach(path => {
      path.points.forEach(point => {
        // Convert relative to absolute coordinates
        const absX = point.x * rect.width + offsetX;
        const absY = point.y * rect.height + offsetY;
        minX = Math.min(minX, absX);
        minY = Math.min(minY, absY);
        maxX = Math.max(maxX, absX);
        maxY = Math.max(maxY, absY);
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
    const canvas = canvasRef.current;
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();

    const offsetX = (overlay.data.offsetX || 0) * rect.width;
    const offsetY = (overlay.data.offsetY || 0) * rect.height;

    if (overlay.type === 'text' && overlay.data.text) {
      const ctx = contextRef.current;
      const fontSize = (overlay.data.size || 24) * (rect.width / 800);
      ctx.font = `${fontSize}px 'Syne', sans-serif`;
      const metrics = ctx.measureText(overlay.data.text);
      const x = (overlay.data.x || 0) * rect.width + offsetX;
      const y = (overlay.data.y || 0) * rect.height + offsetY;

      return coords.x >= x - 5 &&
             coords.x <= x + metrics.width + 5 &&
             coords.y >= y - fontSize - 5 &&
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Convert pixel delta to relative delta
      const deltaX = (coords.x - dragStart.x) / rect.width;
      const deltaY = (coords.y - dragStart.y) / rect.height;

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

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();

    // Convert absolute path coordinates to relative
    const relativePath = currentPath.map(point => ({
      x: point.x / rect.width,
      y: point.y / rect.height
    }));

    onAddOverlay({
      paths: [{
        points: relativePath,
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
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      // Convert absolute coordinates to relative
      onAddOverlay({
        text: textInput.value,
        x: textInput.x / rect.width,
        y: textInput.y / rect.height,
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
