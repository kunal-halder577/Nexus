const VIEWED_POSTS_KEY = 'viewed_posts';

/**
 * Utility to track viewed posts in localStorage to prevent duplicate API calls
 * during the same session.
 */
export const markPostAsViewedLocally = (postId, userId) => {
  if (!userId) return false;
  const key = `${VIEWED_POSTS_KEY}_${userId}`;
  
  try {
    const viewedPostsJson = localStorage.getItem(key);
    const viewedPosts = viewedPostsJson ? JSON.parse(viewedPostsJson) : [];

    // Check if we've already tracked this post in the current browser session/storage
    if (viewedPosts.includes(postId)) {
      return true; // Already viewed
    }

    // New view, append and update storage
    viewedPosts.push(postId);
    localStorage.setItem(key, JSON.stringify(viewedPosts));
    
    return false; // Not viewed before, newly marked
  } catch (error) {
    // Fail gracefully (e.g., if localStorage is restricted by browser privacy settings)
    console.warn('Error accessing localStorage for view tracking:', error);
    // Assume not viewed so the API call can still be attempted if needed
    return false; 
  }
};
