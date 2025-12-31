import React, { useState } from 'react';
import './Toolbar.css';

const COLORS = [
  '#ff3366', // Pink
  '#00ffaa', // Mint
  '#ffaa00', // Orange
  '#3366ff', // Blue
  '#ffffff', // White
  '#ffff00', // Yellow
  '#000000', // Black
];

const FONTS = [
  { name: 'Syne', label: 'Default' },
  { name: 'Pacifico', label: 'Script' },
  { name: 'Space Mono', label: 'Mono' },
];

function Toolbar({
  tool,
  setTool,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  textFont,
  setTextFont,
  onShare,
  onNewVideo,
  hasOverlays,
  className = '',
  style = {},
  textInputState,
  onFinalizeText,
  drawingSessionState,
  onFinalizeDrawing,
  onCancelDrawing,
  onUndoStroke
}) {
  const [showFontDropdown, setShowFontDropdown] = useState(false);
  const [showColorDropdown, setShowColorDropdown] = useState(false);

  return (
    <div className={`toolbar ${className}`} style={style}>
      <div className="toolbar-section">
        <div className="tool-buttons">
          <button
            className={`tool-btn ${tool === 'select' ? 'active' : ''}`}
            onClick={() => setTool('select')}
            title="Select"
          >
            ↖
          </button>
          <button
            className={`tool-btn ${tool === 'draw' ? 'active' : ''}`}
            onClick={() => setTool('draw')}
            title="Draw"
          >
            ✎
          </button>
          <div className="text-tool-wrapper">
            <button
              className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
              onClick={() => {
                setTool('text');
                setShowFontDropdown(!showFontDropdown);
              }}
              title="Text"
            >
              T
            </button>
            {tool === 'text' && showFontDropdown && (
              <div className="font-dropdown-menu">
                {FONTS.map(font => (
                  <button
                    key={font.name}
                    className={`font-option ${textFont === font.name ? 'active' : ''}`}
                    onClick={() => {
                      setTextFont(font.name);
                      setShowFontDropdown(false);
                    }}
                    style={{ fontFamily: font.name }}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="toolbar-section">
        <div className="color-picker-wrapper">
          <button
            className="rainbow-wheel-btn"
            onClick={() => setShowColorDropdown(!showColorDropdown)}
            title="Color picker"
            style={{
              borderColor: brushColor,
              boxShadow: brushColor === '#000000' ? '0 0 0 1px white' : 'none'
            }}
          >
            <div className="rainbow-wheel"></div>
          </button>
          {showColorDropdown && (
            <div className="color-dropdown-menu">
              {COLORS.map(color => (
                <button
                  key={color}
                  className={`color-option ${brushColor === color ? 'active' : ''} ${color === '#000000' ? 'black-color' : ''}`}
                  style={{ background: color }}
                  onClick={() => {
                    setBrushColor(color);
                    setShowColorDropdown(false);
                  }}
                  title={color}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="toolbar-section">
        <input
          type="range"
          min="1"
          max="20"
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
          className="size-slider"
        />
        <span className="size-value">{brushSize}px</span>
      </div>

      {textInputState && textInputState.show && (
        <div className="toolbar-section toolbar-finalize-inline">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">Finalize text</span>
          <button
            className="finalize-btn-inline"
            onClick={onFinalizeText}
            title="Finalize text (saves the text to timeline)"
          >
            Done
          </button>
        </div>
      )}

      {drawingSessionState && drawingSessionState.active && drawingSessionState.paths && drawingSessionState.paths.length > 0 && (
        <div className="toolbar-section toolbar-drawing">
          <span className="warning-icon">⚠</span>
          <span className="warning-text">
            {drawingSessionState.paths.length} stroke{drawingSessionState.paths.length !== 1 ? 's' : ''}
          </span>
          <button
            className="drawing-btn undo-btn"
            onClick={onUndoStroke}
            disabled={drawingSessionState.paths.length === 0}
            title="Undo last stroke"
          >
            ↶
          </button>
          <button
            className="drawing-btn cancel-btn"
            onClick={onCancelDrawing}
            title="Cancel drawing"
          >
            ✕
          </button>
          <button
            className="drawing-btn done-btn"
            onClick={onFinalizeDrawing}
            title="Finish drawing"
          >
            ✓
          </button>
        </div>
      )}

      <div className="toolbar-section toolbar-actions">
        <button
          className="action-btn share-btn"
          onClick={onShare}
          disabled={!hasOverlays}
          title={hasOverlays ? 'Share your creation' : 'Add overlays first'}
        >
          Share
        </button>
        <button
          className="action-btn new-btn"
          onClick={onNewVideo}
        >
          New
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
