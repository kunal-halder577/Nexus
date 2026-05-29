import React, { useState, useMemo } from 'react';
import { PlayCircle } from 'lucide-react';
import MediaLightbox from '@/components/Shared/MediaLightBox.jsx';

const toLibItems = (mediaArr) =>
  mediaArr.map((item, i) => ({
    id:           `media-${i}`,
    name:         `media-${i + 1}`,
    size:         0,
    url:          item.url,
    thumbnailUrl: item.thumbnailUrl,
    type:         item.type === 'Video' ? 'video/mp4' : 'image/jpeg',
  }));

const PostMediaGrid = ({ media }) => {
  const [lightboxIndex, setLightboxIndex] = useState(null);

  // 1. Safety guard — nothing to render
  if (!media?.length) return null;

  const count = media.length;

  // 2. Memoised so MediaLightbox doesn't get a new array reference every render
  const libItems = useMemo(() => toLibItems(media), [media]);

  // Single Image Layout
  if (count === 1) {
    const item = media[0];
    const isVideo = item.type === 'Video';
    const src = isVideo ? item.thumbnailUrl : item.url;

    return (
      <>
        <button
          type="button"
          onClick={() => setLightboxIndex(0)}
          aria-label={`Open media 1`}
          className="relative flex items-center justify-center bg-muted/50 group/tile cursor-pointer overflow-hidden rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 w-full max-h-[600px] min-h-[250px]"
          style={{ maxHeight: '600px' }}
        >
          <div 
            className="absolute inset-[-10%] bg-cover bg-center blur-lg opacity-60 dark:opacity-40 transition-transform duration-300 group-hover/tile:scale-105 pointer-events-none will-change-transform"
            style={{ backgroundImage: `url(${src})` }}
          />
          <img
            src={src}
            alt={`Post media 1`}
            className="relative max-w-full max-h-[600px] object-contain transition-transform duration-300 group-hover/tile:scale-105"
            style={{ maxHeight: '600px' }}
          />

          {isVideo && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/tile:bg-indigo-950/40 transition-colors pointer-events-none">
              <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
            </div>
          )}
        </button>

        {lightboxIndex !== null && (
          <MediaLightbox
            items={libItems}
            startIndex={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />
        )}
      </>
    );
  }

  // Multiple Images Layout
  const firstItem = media[0];
  const firstSrc = firstItem.type === 'Video' ? firstItem.thumbnailUrl : firstItem.url;

  let gridContainerClass = "";
  let getItemClass = (idx) => "";

  if (count === 2) {
    gridContainerClass = "grid-cols-2 aspect-video";
  } else if (count === 3) {
    gridContainerClass = "grid-cols-2 grid-rows-2 aspect-video sm:aspect-[16/7]";
    getItemClass = (idx) => idx === 0 ? "row-span-2" : "";
  } else {
    gridContainerClass = "grid-cols-2 grid-rows-2 aspect-square sm:aspect-[4/3]";
  }

  return (
    <>
      <div className="relative rounded-2xl overflow-hidden border border-border/20 dark:border-border/10">
        {/* Outer Container Glassmorphism Glow */}
        <div 
          className="absolute inset-[-20%] bg-cover bg-center blur-2xl opacity-50 dark:opacity-30 pointer-events-none will-change-transform"
          style={{ backgroundImage: `url(${firstSrc})` }}
        />
        <div className="absolute inset-0 bg-background/50 dark:bg-background/60 backdrop-blur-xl pointer-events-none" />

        {/* Grid Container */}
        <div className="relative p-1.5 sm:p-2">
          <div className={`grid gap-[2px] bg-background dark:bg-black rounded-xl overflow-hidden shadow-sm ${gridContainerClass}`}>
            {media.slice(0, 4).map((item, idx) => {
              const isVideo = item.type === 'Video';
              const src     = isVideo ? item.thumbnailUrl : item.url;
              
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  aria-label={`Open media ${idx + 1}`}
                  className={`relative group/tile cursor-pointer overflow-hidden bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/70 w-full h-full ${getItemClass(idx)}`}
                >
                  <img
                    src={src}
                    alt={`Post media ${idx + 1}`}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/tile:scale-105"
                  />
                  {isVideo && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/25 group-hover/tile:bg-indigo-950/40 transition-colors pointer-events-none">
                      <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  )}
                  {idx === 3 && count > 4 && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-none">
                      <span className="text-white font-medium text-2xl">+{count - 4}</span>
                    </div>
                  )}
                  {!isVideo && !(idx === 3 && count > 4) && (
                    <div className="absolute inset-0 bg-black/0 group-hover/tile:bg-black/10 transition-colors pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {lightboxIndex !== null && (
        <MediaLightbox
          items={libItems}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
};

export default PostMediaGrid;