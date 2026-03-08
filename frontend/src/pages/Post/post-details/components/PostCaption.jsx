import React, { useMemo } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';


// This runs only once when the application loads this file.
DOMPurify.addHook('afterSanitizeAttributes', function (node) {
  // Check if the node is an anchor <a> tag
  if (node.tagName && node.tagName.toUpperCase() === 'A') {
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer'); // Crucial for security
  }
});

const PostCaption = ({ html }) => {
  const parsed = useMemo(() => {
    if (!html) return null;

    const clean = DOMPurify.sanitize(html, { 
      ADD_ATTR: ['target'] // Tells DOMPurify not to strip target="_blank"
    });

    return parse(clean);
  }, [html]);

  if (!parsed) return null;

  return (
    <div
      className="
        text-foreground/90 text-[15px] leading-relaxed
        [&_p]:my-1
        [&_a]:text-indigo-400 [&_a]:hover:underline
        [&_strong]:font-semibold [&_strong]:text-foreground
        [&_em]:italic
        [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1
        [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1
        [&_li]:my-0.5
        [&_blockquote]:border-l-2 [&_blockquote]:border-indigo-500
          [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground
          [&_blockquote]:italic [&_blockquote]:my-2
        [&_h1]:text-xl [&_h1]:font-bold [&_h1]:my-2
        [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:my-1.5
        [&_h3]:text-base [&_h3]:font-semibold [&_h3]:my-1
        [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5
          [&_code]:rounded [&_code]:text-[13px] [&_code]:font-mono
      "
    >
      {parsed}
    </div>
  );
};

export default PostCaption;