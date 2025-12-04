import React, { useState, useRef } from 'react';
import './ShareModal.css';

function ShareModal({ url, onClose }) {
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      if (inputRef.current) {
        inputRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <div className="share-icon">🔗</div>
          <h2>Share Your Creation</h2>
          <p>Anyone with this link can view your annotated video</p>
        </div>
        
        <div className="share-url-container">
          <input
            ref={inputRef}
            type="text"
            value={url}
            readOnly
            className="share-url-input"
          />
          <button 
            className={`copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
          >
            {copied ? '✓ Copied!' : 'Copy'}
          </button>
        </div>
        
        <div className="share-note">
          <p>💡 The overlays are encoded in the URL itself - no account needed!</p>
        </div>
      </div>
    </div>
  );
}

export default ShareModal;
