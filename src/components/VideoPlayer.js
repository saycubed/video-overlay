import React, { useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import './VideoPlayer.css';

function VideoPlayer({
  url,
  playing,
  onTimeUpdate,
  onDuration,
  onPlay,
  onPause,
  setPlayerRef,
  onVideoReady
}) {
  const playerRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (setPlayerRef && playerRef.current) {
      setPlayerRef(playerRef.current);
    }
  }, [setPlayerRef]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        if (playerRef.current) {
          const time = playerRef.current.getCurrentTime();
          if (time !== null) {
            onTimeUpdate(time);
          }
        }
      }, 100);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [playing, onTimeUpdate]);

  const handleReady = () => {
    const player = playerRef.current;
    if (!player) return;

    // Get internal player to access video element
    const internalPlayer = player.getInternalPlayer();

    if (internalPlayer && internalPlayer.videoWidth && internalPlayer.videoHeight) {
      const aspectRatio = internalPlayer.videoWidth / internalPlayer.videoHeight;

      // Call parent callback with aspect ratio
      if (onVideoReady) {
        onVideoReady({
          width: internalPlayer.videoWidth,
          height: internalPlayer.videoHeight,
          aspectRatio
        });
      }
    }
  };

  return (
    <div className="video-player">
      <ReactPlayer
        ref={playerRef}
        url={url}
        playing={playing}
        width="100%"
        height="100%"
        onDuration={onDuration}
        onPlay={onPlay}
        onPause={onPause}
        onReady={handleReady}
        onProgress={({ playedSeconds }) => onTimeUpdate(playedSeconds)}
        progressInterval={100}
        config={{
          youtube: {
            playerVars: {
              modestbranding: 1,
              rel: 0,
              controls: 0
            }
          },
          vimeo: {
            playerOptions: {
              controls: false
            }
          }
        }}
      />
    </div>
  );
}

export default VideoPlayer;
