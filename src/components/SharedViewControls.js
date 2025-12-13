import React from 'react';
import './SharedViewControls.css';

function SharedViewControls({ showEditControls, onToggleEdit, onNewVideo }) {
  return (
    <div className="shared-view-controls">
      <button
        className={`shared-control-btn ${showEditControls ? 'active' : ''}`}
        onClick={onToggleEdit}
        title={showEditControls ? 'Hide editing tools' : 'Show editing tools'}
      >
        Overlays
      </button>
      <button
        className="shared-control-btn"
        onClick={onNewVideo}
        title="Create a new video"
      >
        New Video
      </button>
    </div>
  );
}

export default SharedViewControls;
