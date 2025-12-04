import React from 'react';
import './Toolbar.css';

const COLORS = [
  '#ff3366', // Pink
  '#00ffaa', // Mint
  '#ffaa00', // Orange
  '#3366ff', // Blue
  '#ffffff', // White
  '#ffff00', // Yellow
];

function Toolbar({
  tool,
  setTool,
  brushColor,
  setBrushColor,
  brushSize,
  setBrushSize,
  onShare,
  onNewVideo,
  hasOverlays
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <span className="toolbar-label">Tools</span>
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
          <button
            className={`tool-btn ${tool === 'text' ? 'active' : ''}`}
            onClick={() => setTool('text')}
            title="Text"
          >
            T
          </button>
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Color</span>
        <div className="color-buttons">
          {COLORS.map(color => (
            <button
              key={color}
              className={`color-btn ${brushColor === color ? 'active' : ''}`}
              style={{ background: color }}
              onClick={() => setBrushColor(color)}
              title={color}
            />
          ))}
        </div>
      </div>

      <div className="toolbar-section">
        <span className="toolbar-label">Size</span>
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
          New Video
        </button>
      </div>
    </div>
  );
}

export default Toolbar;
