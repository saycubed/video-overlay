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
    if (!player) {
      console.log('No player ref');
      return;
    }

    // Get internal player to access video element
    const internalPlayer = player.getInternalPlayer();
    console.log('Internal player:', internalPlayer);

    // For YouTube, try to find the video element inside the iframe
    if (internalPlayer && internalPlayer.getVideoData) {
      const videoData = internalPlayer.getVideoData();
      console.log('YouTube video data:', videoData);

      // Try to access the iframe and find the video element
      const iframe = internalPlayer.getIframe && internalPlayer.getIframe();
      console.log('YouTube iframe:', iframe);

      if (iframe && iframe.contentWindow) {
        // Try to access video element after a short delay to ensure it's loaded
        const checkVideoElement = () => {
          try {
            const iframeDoc = iframe.contentWindow.document;
            const videoEl = iframeDoc.querySelector('video');
            console.log('Found video element:', videoEl);

            if (videoEl && videoEl.videoWidth && videoEl.videoHeight) {
              const aspectRatio = videoEl.videoWidth / videoEl.videoHeight;
              console.log('Video element dimensions:', videoEl.videoWidth, videoEl.videoHeight);
              console.log('Calculated aspect ratio from video element:', aspectRatio);

              if (onVideoReady) {
                onVideoReady({
                  width: videoEl.videoWidth,
                  height: videoEl.videoHeight,
                  aspectRatio
                });
              }
            } else {
              console.log('Video element found but dimensions not available yet');
            }
          } catch (err) {
            console.log('Cannot access iframe contents (CORS):', err.message);
            // Fallback: Try oEmbed API
            fetchYouTubeOEmbed(videoData.video_id);
          }
        };

        // Try immediately and with delays
        setTimeout(checkVideoElement, 100);
        setTimeout(checkVideoElement, 500);
        setTimeout(checkVideoElement, 1000);
      }

      return;
    }

    // For non-YouTube videos, try direct video element access
    if (internalPlayer && internalPlayer.videoWidth && internalPlayer.videoHeight) {
      const aspectRatio = internalPlayer.videoWidth / internalPlayer.videoHeight;
      console.log('Got dimensions from videoWidth/Height:', internalPlayer.videoWidth, internalPlayer.videoHeight);
      console.log('Calculated aspect ratio:', aspectRatio);

      if (onVideoReady) {
        onVideoReady({
          width: internalPlayer.videoWidth,
          height: internalPlayer.videoHeight,
          aspectRatio
        });
      }
    } else {
      console.log('Could not determine video dimensions');
    }
  };

  const fetchYouTubeOEmbed = (videoId) => {
    fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`)
      .then(res => res.json())
      .then(data => {
        console.log('YouTube oEmbed data:', data);

        // Check if this is a Short based on title or other heuristics
        const title = data.title || '';
        const isShort = title.toLowerCase().includes('shorts') ||
                       title.toLowerCase().includes('#short') ||
                       url.includes('/shorts/');

        console.log('Is YouTube Short?', isShort, 'Title:', title);

        let aspectRatio, width, height;

        if (isShort) {
          // YouTube Shorts are vertical (9:16)
          aspectRatio = 9 / 16;
          width = 1080;
          height = 1920;
          console.log('Detected as Short - using 9:16 portrait aspect ratio');
        } else {
          // Regular videos default to 16:9
          aspectRatio = 16 / 9;
          width = 1920;
          height = 1080;
          console.log('Detected as regular video - using 16:9 landscape aspect ratio');
        }

        if (onVideoReady) {
          onVideoReady({
            width,
            height,
            aspectRatio
          });
        }
      })
      .catch(err => {
        console.error('Failed to fetch YouTube oEmbed data:', err);
      });
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
