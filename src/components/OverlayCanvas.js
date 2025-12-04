import React, { useRef, useEffect, useState, useCallback } from 'react';
import './OverlayCanvas.css';

function OverlayCanvas({
  tool,
  brushColor,
  brushSize,
  visibleOverlays,
  onAddOverlay,
  isPlaying,
  activeOverlayId
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState({ show: false, x: 0, y: 0, value: '' });

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
      if (overlay.type === 'drawing' && overlay.data.paths) {
        overlay.data.paths.forEach(path => {
          if (path.points.length < 2) return;
          
          ctx.beginPath();
          ctx.strokeStyle = path.color;
          ctx.lineWidth = path.size;
          ctx.moveTo(path.points[0].x, path.points[0].y);
          
          for (let i = 1; i < path.points.length; i++) {
            ctx.lineTo(path.points[i].x, path.points[i].y);
          }
          ctx.stroke();
        });
      } else if (overlay.type === 'text' && overlay.data.text) {
        ctx.font = `${overlay.data.size || 24}px 'Syne', sans-serif`;
        ctx.fillStyle = overlay.data.color;
        ctx.fillText(overlay.data.text, overlay.data.x, overlay.data.y);
      }
    });
  }, [visibleOverlays]);

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

  const startDrawing = useCallback((e) => {
    if (isPlaying || tool === 'select') return;
    
    const coords = getCoordinates(e);
    
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
  }, [isPlaying, tool, brushColor, brushSize, getCoordinates]);

  const draw = useCallback((e) => {
    if (!isDrawing || tool !== 'draw') return;
    
    const coords = getCoordinates(e);
    setCurrentPath(prev => [...prev, coords]);
    
    const ctx = contextRef.current;
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, tool, getCoordinates]);

  const stopDrawing = useCallback(() => {
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
      }]
    });
    
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, brushColor, brushSize, onAddOverlay]);

  const handleTextSubmit = useCallback(() => {
    if (textInput.value.trim()) {
      onAddOverlay({
        text: textInput.value,
        x: textInput.x,
        y: textInput.y,
        color: brushColor,
        size: brushSize * 6
      });
    }
    setTextInput({ show: false, x: 0, y: 0, value: '' });
  }, [textInput, brushColor, brushSize, onAddOverlay]);

  const getCursor = () => {
    if (isPlaying) return 'default';
    switch (tool) {
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
          style={{ left: textInput.x, top: textInput.y }}
        >
          <input
            type="text"
            value={textInput.value}
            onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTextSubmit();
              if (e.key === 'Escape') setTextInput({ show: false, x: 0, y: 0, value: '' });
            }}
            onBlur={handleTextSubmit}
            autoFocus
            placeholder="Type and press Enter"
            style={{ color: brushColor }}
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
