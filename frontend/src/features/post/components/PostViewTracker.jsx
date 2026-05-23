import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../auth/authSlice';
import { markPostAsViewedLocally } from '../utils/viewTracker';
import { useViewPostMutation } from '../api/postApi';

const PostViewTracker = ({ postId, children }) => {
  const containerRef = useRef(null);
  const [viewPost] = useViewPostMutation();
  const currentUser = useSelector(selectCurrentUser);
  const userId = currentUser?._id;

  useEffect(() => {
    // Safety check for SSR or older browsers
    if (!containerRef.current || typeof IntersectionObserver === 'undefined') return;

    let viewTimeout = null;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Post is at least 50% visible, start the 1 second timer
            viewTimeout = setTimeout(() => {
              // 1. Check local storage utility
              const alreadyViewed = markPostAsViewedLocally(postId, userId);

              if (alreadyViewed) {
                // Instantly disconnect if already viewed to save memory
                observer.unobserve(entry.target);
                observer.disconnect();
                return;
              }

              // 2. New view: Fire background POST request using RTK Query
              viewPost(postId).catch((err) => {
                // Handle API errors silently without disrupting the user
                console.error('Failed to record post view:', err);
              });

              // 3. Instantly unobserve to prevent multiple triggers in this component lifecycle
              observer.unobserve(entry.target);
              observer.disconnect();
            }, 1000); // 1000ms = 1 second
          } else {
            // If the user scrolls past the post before 1 second, cancel the timer
            if (viewTimeout) {
              clearTimeout(viewTimeout);
              viewTimeout = null;
            }
          }
        });
      },
      {
        threshold: 0.5, // The post must be 50% visible on screen to count as a view
      }
    );

    observer.observe(containerRef.current);

    // Clean memory management: unobserve on unmount and clear timeout
    return () => {
      if (viewTimeout) clearTimeout(viewTimeout);
      observer.disconnect();
    };
  }, [postId, viewPost, userId]);

  // Wrapper div maintains layout neutrality but captures ref
  return (
    <div ref={containerRef} className="post-view-tracker" style={{ width: '100%', height: '100%' }}>
      {children}
    </div>
  );
};

export default PostViewTracker;
