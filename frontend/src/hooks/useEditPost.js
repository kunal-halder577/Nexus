import { useState, useCallback } from 'react';
import { useUpdatePostMutation } from '@/features/post/api/postApi.js';
import { toast } from 'sonner';

/**
 * Reusable hook for post editing logic.
 * Works identically in FeedPost, PostDetail, or any other consumer.
 *
 * @param {object} post - The post object from the feed/detail
 * @returns {{ isOpen, openEditor, closeEditor, submitEdit, isLoading }}
 */
export const useEditPost = (post) => {
  const [isOpen, setIsOpen] = useState(false);
  const [updatePost, { isLoading }] = useUpdatePostMutation();

  const openEditor  = useCallback(() => setIsOpen(true),  []);
  const closeEditor = useCallback(() => setIsOpen(false), []);

  /**
   * @param {{ caption: string }} changes
   */
  const submitEdit = useCallback(async ({ caption }) => {
    try {
      await updatePost({ id: post._id, caption }).unwrap();
      toast.success('Post updated.');
      closeEditor();
    } catch {
      toast.error('Failed to update post. Please try again.');
    }
  }, [post._id, updatePost, closeEditor]);

  return { isOpen, openEditor, closeEditor, submitEdit, isLoading };
};
