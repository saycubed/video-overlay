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
  setPlayerRef 
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
