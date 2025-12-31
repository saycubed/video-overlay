import React, { useRef, useEffect, useState, useCallback } from 'react';
import './OverlayCanvas.css';

function OverlayCanvas({
  tool,
  brushColor,
  brushSize,
  textFont,
  setBrushColor,
  setBrushSize,
  setTextFont,
  visibleOverlays,
  onAddOverlay,
  isPlaying,
  activeOverlayId,
  onUpdateOverlay,
  onSelectOverlay,
  onTogglePlayPause,
  showOutlines = true,
  onTextInputChange,
  onFinalizeTextRef,
  onDrawingSessionChange,
  onFinalizeDrawingRef,
  onCancelDrawingRef,
  onUndoStrokeRef
}) {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState([]);
  const [textInput, setTextInput] = useState({
    show: false,
    x: 0,
    y: 0,
    value: '',
    editingId: null
  });
  const textInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(true);
  const [drawingSession, setDrawingSession] = useState({
    active: false,
    paths: [],
    startTime: null
  });
  const sessionTimeoutRef = useRef(null);
  const lastClickTimeRef = useRef(0);
  const lastClickIdRef = useRef(null);

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

  // Cursor blinking animation
  useEffect(() => {
    if (!textInput.show) return;

    const interval = setInterval(() => {
      setCursorVisible(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [textInput.show]);

  // Focus text input when it appears (for mobile keyboard)
  useEffect(() => {
    if (textInput.show && textInputRef.current) {
      // Lock body scroll when typing
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
      document.body.style.height = '100%';

      // Use setTimeout to ensure the textarea is fully mounted and visible
      const focusTimeout = setTimeout(() => {
        if (textInputRef.current) {
          textInputRef.current.focus({ preventScroll: true });
          // Force focus on mobile
          textInputRef.current.click();
        }
      }, 100);

      return () => {
        clearTimeout(focusTimeout);
        // Unlock body scroll when done
        document.body.style.overflow = '';
        document.body.style.position = '';
        document.body.style.width = '';
        document.body.style.height = '';
      };
    }
  }, [textInput.show]);

  // Finalize text function
  const finalizeText = useCallback(() => {
    if (textInput.value.trim()) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();

      if (textInput.editingId) {
        // Update existing overlay with current toolbar settings
        const existingOverlay = visibleOverlays.find(o => o.id === textInput.editingId);
        if (existingOverlay && onUpdateOverlay) {
          onUpdateOverlay(textInput.editingId, {
            data: {
              ...existingOverlay.data,
              text: textInput.value,
              color: brushColor,
              size: brushSize * 6,
              font: textFont
            }
          });
        }
      } else {
        // Create new overlay
        onAddOverlay({
          text: textInput.value,
          x: textInput.x / rect.width,
          y: textInput.y / rect.height,
          color: brushColor,
          size: brushSize * 6,
          font: textFont,
          offsetX: 0,
          offsetY: 0
        });
      }
    }
    setTextInput({
      show: false,
      x: 0,
      y: 0,
      value: '',
      editingId: null
    });
  }, [textInput, brushColor, brushSize, textFont, onAddOverlay, onUpdateOverlay, visibleOverlays]);

  // Drawing session management functions
  const finalizeDrawingSession = useCallback(() => {
    if (!drawingSession.active || drawingSession.paths.length === 0) {
      setDrawingSession({ active: false, paths: [], startTime: null });
      return;
    }

    // Save all paths as a single overlay
    onAddOverlay({
      paths: drawingSession.paths,
      offsetX: 0,
      offsetY: 0
    });

    setDrawingSession({ active: false, paths: [], startTime: null });
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, [drawingSession, onAddOverlay]);

  const cancelDrawingSession = useCallback(() => {
    setDrawingSession({ active: false, paths: [], startTime: null });
    if (sessionTimeoutRef.current) {
      clearTimeout(sessionTimeoutRef.current);
      sessionTimeoutRef.current = null;
    }
  }, []);

  const undoLastStroke = useCallback(() => {
    if (drawingSession.paths.length > 0) {
      setDrawingSession(prev => ({
        ...prev,
        paths: prev.paths.slice(0, -1)
      }));
    }
  }, [drawingSession.paths.length]);

  // Notify parent of text input state changes
  useEffect(() => {
    if (onTextInputChange) {
      onTextInputChange(textInput);
    }
  }, [textInput, onTextInputChange]);

  // Expose finalize function to parent
  useEffect(() => {
    if (onFinalizeTextRef) {
      onFinalizeTextRef.current = finalizeText;
    }
  }, [finalizeText, onFinalizeTextRef]);

  // Notify parent of drawing session state changes
  useEffect(() => {
    if (onDrawingSessionChange) {
      onDrawingSessionChange(drawingSession);
    }
  }, [drawingSession, onDrawingSessionChange]);

  // Expose drawing control functions to parent
  useEffect(() => {
    if (onFinalizeDrawingRef) {
      onFinalizeDrawingRef.current = finalizeDrawingSession;
    }
    if (onCancelDrawingRef) {
      onCancelDrawingRef.current = cancelDrawingSession;
    }
    if (onUndoStrokeRef) {
      onUndoStrokeRef.current = undoLastStroke;
    }
  }, [finalizeDrawingSession, cancelDrawingSession, undoLastStroke, onFinalizeDrawingRef, onCancelDrawingRef, onUndoStrokeRef]);

  // Handle keyboard input for text
  useEffect(() => {
    if (!textInput.show) return;

    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input field or textarea
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        // Add newline instead of finalizing
        setTextInput(prev => ({ ...prev, value: prev.value + '\n' }));
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setTextInput({
          show: false,
          x: 0,
          y: 0,
          value: '',
          editingId: null
        });
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        setTextInput(prev => ({ ...prev, value: prev.value.slice(0, -1) }));
      } else if (e.key.length === 1) {
        e.preventDefault();
        setTextInput(prev => ({ ...prev, value: prev.value + e.key }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [textInput.show, textInput.value, textInput.editingId, brushColor, brushSize, textFont, onAddOverlay, onUpdateOverlay, visibleOverlays]);

  // Redraw visible overlays
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = contextRef.current;
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);

    visibleOverlays.forEach(overlay => {
      // Skip rendering if this overlay is being edited
      if (textInput.editingId === overlay.id) return;

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
        if (isActive && showOutlines) {
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
        const fontFamily = overlay.data.font || 'Syne';
        ctx.font = `${fontSize}px '${fontFamily}', sans-serif`;

        // Add drop shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        ctx.fillStyle = overlay.data.color;

        // Convert relative position to absolute
        const textX = (overlay.data.x || 0) * rect.width + offsetX;
        const textY = (overlay.data.y || 0) * rect.height + offsetY;

        // Support multi-line text
        const lines = overlay.data.text.split('\n');
        const lineHeight = fontSize * 1.2;
        lines.forEach((line, index) => {
          ctx.fillText(line, textX, textY + (index * lineHeight));
        });

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Draw selection box for active text
        if (isActive && showOutlines) {
          const maxWidth = Math.max(...lines.map(line => ctx.measureText(line).width));
          const totalHeight = lines.length * lineHeight;
          ctx.strokeStyle = '#ff3366';
          ctx.lineWidth = 2;
          ctx.setLineDash([5, 5]);
          ctx.strokeRect(
            textX - 5,
            textY - fontSize - 5,
            maxWidth + 10,
            totalHeight + 10
          );
          ctx.setLineDash([]);
        }
      }
    });

    // Draw text being typed
    if (textInput.show) {
      // Use current toolbar values for both creating and editing
      const fontSize = (brushSize * 6) * (rect.width / 800);
      ctx.font = `${fontSize}px '${textFont}', sans-serif`;

      // Add drop shadow
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillStyle = brushColor;

      // Support multi-line text in preview
      const lines = textInput.value.split('\n');
      const lineHeight = fontSize * 1.2;
      lines.forEach((line, index) => {
        ctx.fillText(line, textInput.x, textInput.y + (index * lineHeight));
      });

      // Reset shadow for cursor
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Draw cursor at end of last line
      if (cursorVisible) {
        const lastLine = lines[lines.length - 1];
        const textWidth = ctx.measureText(lastLine).width;
        const cursorY = textInput.y + ((lines.length - 1) * lineHeight);
        ctx.fillRect(textInput.x + textWidth, cursorY - fontSize, 2, fontSize);
      }
    }

    // Draw current path being drawn (live preview)
    if (isDrawing && currentPath.length > 1) {
      ctx.beginPath();
      ctx.strokeStyle = brushColor;
      ctx.lineWidth = (brushSize || 4) * (rect.width / 800);

      ctx.moveTo(currentPath[0].x, currentPath[0].y);
      for (let i = 1; i < currentPath.length; i++) {
        ctx.lineTo(currentPath[i].x, currentPath[i].y);
      }
      ctx.stroke();
    }

    // Draw active drawing session paths with semi-transparent border
    if (drawingSession.active && drawingSession.paths.length > 0) {
      drawingSession.paths.forEach(path => {
        if (path.points.length < 2) return;

        ctx.beginPath();
        ctx.strokeStyle = path.color;
        ctx.lineWidth = (path.size || 4) * (rect.width / 800);

        const firstPoint = {
          x: path.points[0].x * rect.width,
          y: path.points[0].y * rect.height
        };
        ctx.moveTo(firstPoint.x, firstPoint.y);

        for (let i = 1; i < path.points.length; i++) {
          const point = {
            x: path.points[i].x * rect.width,
            y: path.points[i].y * rect.height
          };
          ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
      });

      // Draw dashed border around the entire session
      const bounds = getDrawingBounds(drawingSession.paths, 0, 0);
      ctx.strokeStyle = '#00ffaa';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(bounds.x - 5, bounds.y - 5, bounds.width + 10, bounds.height + 10);
      ctx.setLineDash([]);
    }
  }, [visibleOverlays, activeOverlayId, showOutlines, textInput, brushColor, brushSize, textFont, cursorVisible, drawingSession, isDrawing, currentPath]);

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

    let x, y;
    if (e.touches) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }

    return { x, y };
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
      const fontFamily = overlay.data.font || 'Syne';
      ctx.font = `${fontSize}px '${fontFamily}', sans-serif`;
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

  // Detect tool change when drawing session is active - auto-finalize
  useEffect(() => {
    if (drawingSession.active && tool !== 'draw') {
      // Auto-finalize when switching tools
      finalizeDrawingSession();
    }
  }, [tool, drawingSession.active, finalizeDrawingSession]);

  // Auto-finalize when video starts playing
  useEffect(() => {
    if (drawingSession.active && isPlaying) {
      finalizeDrawingSession();
    }
  }, [isPlaying, drawingSession.active, finalizeDrawingSession]);

  const startDrawing = useCallback((e) => {
    // Prevent default touch behavior (scrolling) on mobile
    if (e.touches) {
      e.preventDefault();
    }

    const coords = getCoordinates(e);

    if (tool === 'select') {
      // Check if clicking on an overlay
      const clickedOverlay = [...visibleOverlays].reverse().find(overlay =>
        checkOverlayHit(coords, overlay)
      );

      if (clickedOverlay) {
        // Detect double-click for text editing
        const now = Date.now();
        const isDoubleClick =
          now - lastClickTimeRef.current < 300 &&
          lastClickIdRef.current === clickedOverlay.id;

        lastClickTimeRef.current = now;
        lastClickIdRef.current = clickedOverlay.id;

        // If double-clicking on a text overlay, enter edit mode
        if (isDoubleClick && clickedOverlay.type === 'text' && clickedOverlay.data.text) {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const rect = canvas.getBoundingClientRect();

          const offsetX = (clickedOverlay.data.offsetX || 0) * rect.width;
          const offsetY = (clickedOverlay.data.offsetY || 0) * rect.height;
          const textX = (clickedOverlay.data.x || 0) * rect.width + offsetX;
          const textY = (clickedOverlay.data.y || 0) * rect.height + offsetY;

          // Sync toolbar to match overlay's properties
          if (clickedOverlay.data.color && setBrushColor) {
            setBrushColor(clickedOverlay.data.color);
          }
          if (clickedOverlay.data.size && setBrushSize) {
            setBrushSize(clickedOverlay.data.size / 6);
          }
          if (clickedOverlay.data.font && setTextFont) {
            setTextFont(clickedOverlay.data.font);
          }

          setTextInput({
            show: true,
            x: textX,
            y: textY,
            value: clickedOverlay.data.text,
            editingId: clickedOverlay.id
          });
          onSelectOverlay(clickedOverlay.id);
        } else {
          // Single click: select and enable dragging for both text and drawing
          onSelectOverlay(clickedOverlay.id);
          setIsDragging(true);
          setDragStart(coords);
        }
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
    }
  }, [isPlaying, tool, brushColor, brushSize, getCoordinates, visibleOverlays, checkOverlayHit, onSelectOverlay, onTogglePlayPause, setBrushColor, setBrushSize, setTextFont]);

  const draw = useCallback((e) => {
    // Prevent default touch behavior (scrolling) on mobile
    if (e.touches) {
      e.preventDefault();
    }

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

    const newPath = {
      points: relativePath,
      color: brushColor,
      size: brushSize
    };

    // Always use drawing session mode (both mobile and desktop)
    setDrawingSession(prev => ({
      active: true,
      paths: [...prev.paths, newPath],
      startTime: prev.startTime || Date.now()
    }));

    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, brushColor, brushSize, isDragging]);

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

      {isPlaying && (
        <div className="playing-indicator">
          <span>Playing - pause to edit</span>
        </div>
      )}

      {/* Drawing controls moved to toolbar */}

      {textInput.show && (
        <textarea
          ref={textInputRef}
          value={textInput.value}
          onChange={(e) => setTextInput(prev => ({ ...prev, value: e.target.value }))}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault();
              setTextInput({ show: false, x: 0, y: 0, value: '', editingId: null });
            }
            // Enter key now creates line breaks naturally in textarea
          }}
          onFocus={(e) => {
            // Prevent scroll on focus
            e.preventDefault();
            window.scrollTo(0, 0);
          }}
          onBlur={(e) => {
            // Prevent blur - keep keyboard open
            e.preventDefault();
            if (textInputRef.current && textInput.show) {
              setTimeout(() => {
                if (textInputRef.current) {
                  textInputRef.current.focus({ preventScroll: true });
                }
              }, 0);
            }
          }}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onTouchStart={(e) => {
            e.stopPropagation();
          }}
          onTouchMove={(e) => {
            e.stopPropagation();
          }}
          className="mobile-text-input"
          placeholder=""
          autoFocus
          aria-label="Text input"
          inputMode="text"
        />
      )}
    </div>
  );
}

export default OverlayCanvas;
