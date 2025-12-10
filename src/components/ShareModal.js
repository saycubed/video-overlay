import React, { useState, useRef, useEffect } from 'react';
import './ShareModal.css';

function ShareModal({ generateUrl, onClose }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const loadUrl = async () => {
      try {
        const generatedUrl = await generateUrl();
        setUrl(generatedUrl);
        setLoading(false);
      } catch (err) {
        console.error('Error generating share URL:', err);
        setError('Failed to generate share link. Please try again.');
        setLoading(false);
      }
    };
    loadUrl();
  }, [generateUrl]);

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

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Generating share link...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button className="retry-btn" onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : (
          <>
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
              <p>💡 Your overlays are saved securely - share anywhere!</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ShareModal;
