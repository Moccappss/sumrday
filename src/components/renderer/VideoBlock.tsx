import React, { useEffect, useRef } from 'react';

const getVideoPoster = (url) => {
  if (!url) return '';
  if (url.includes('cloudinary.com')) {
    let posterUrl = url.replace(/\.(mp4|webm|mov|avi|mkv|ogv|3gp)$/i, '.jpg');
    // Insert w_800,q_auto,so_0 (start offset 0) right after /video/upload/ to fetch the cover frame
    posterUrl = posterUrl.replace('/video/upload/', '/video/upload/w_800,q_auto,so_0/');
    return posterUrl;
  }
  return '';
};

const VideoBlock = React.memo(({ block }) => {
  const containerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      window.dispatchEvent(new CustomEvent('porto_block_active', {
        detail: { active: entry.isIntersecting, type: 'video', id: block.id, ref: containerRef.current }
      }));
    }, { threshold: 0.1 });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => {
      observer.disconnect();
      window.dispatchEvent(new CustomEvent('porto_block_active', {
        detail: { active: false, id: block.id }
      }));
    };
  }, [block.id, block.name, block.title]);

  const poster = block.coverUrl || getVideoPoster(block.url);

  return (
    <div 
      ref={containerRef}
      style={{ position: 'relative', width: '100%', cursor: 'pointer' }}
    >
      <video
        key={block.url}
        ref={videoRef}
        src={block.url}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
        className="pdf-hide-video"
        style={{ display: 'block', width: '100%', height: 'auto' }}
      />
      {poster && (
        <img
          src={poster}
          alt={block.altText || ''}
          className="pdf-show-poster"
          referrerPolicy="no-referrer"
          crossOrigin={block.url?.startsWith('data:') || block.url?.startsWith('blob:') ? undefined : "anonymous"}
          style={{ width: '100%', height: 'auto' }}
        />
      )}
    </div>
  );
});

export default VideoBlock;
