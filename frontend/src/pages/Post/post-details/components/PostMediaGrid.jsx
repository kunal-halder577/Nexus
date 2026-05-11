import React, { useState, useMemo } from 'react';
import { PlayCircle } from 'lucide-react';
import MediaLightbox from '@/components/shared/MediaLightbox.jsx';

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

  const gridClass = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-2',
    4: 'grid-cols-2',
  }[Math.min(count, 4)] ?? 'grid-cols-2';

  return (
    <>
      <div className={`grid gap-1 rounded-2xl overflow-hidden ${gridClass}`}>
        {media.slice(0, 4).map((item, idx) => {
          const isVideo = item.type === 'Video';
          const src     = isVideo ? item.thumbnailUrl : item.url;
          const isWide  = count === 3 && idx === 0;

          return (
            // 3. Semantic button — keyboard-focusable and screen-reader friendly
            <button
              key={idx}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              aria-label={`Open media ${idx + 1}`}
              className={`relative bg-muted/50 group/tile cursor-pointer overflow-hidden
                ${isWide ? 'col-span-2 aspect-video' : 'aspect-square sm:aspect-[4/3]'}`}
            >
              {/* 4. Absolute image so it never bleeds out of the aspect-ratio box */}
              <img
                src={src}
                alt={`Post media ${idx + 1}`}
                className="absolute inset-0 w-full h-full object-cover
                  transition-transform duration-300 group-hover/tile:scale-105"
              />

              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center
                  bg-black/25 group-hover/tile:bg-indigo-950/40 transition-colors">
                  <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                </div>
              )}

              {idx === 3 && count > 4 && (
                <div className="absolute inset-0 bg-black/55 backdrop-blur-sm
                  flex items-center justify-center">
                  <span className="text-white font-bold text-2xl">+{count - 4}</span>
                </div>
              )}

              {!isVideo && !(idx === 3 && count > 4) && (
                <div className="absolute inset-0 bg-black/0 group-hover/tile:bg-black/15 transition-colors" />
              )}
            </button>
          );
        })}
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