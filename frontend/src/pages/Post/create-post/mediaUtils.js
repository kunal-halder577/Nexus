// ── Strict allowlist — only these MIME types are accepted ────────────────────
export const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
]);

export const DRAFT_KEY = 'nexus_draft_v1';
export const MAX_CHARS = 500;

export const isAllowed = (f) => ALLOWED_TYPES.has(f.type);
export const isImage   = (type) => type.startsWith('image/') && type !== 'image/gif';
export const isGif     = (type) => type === 'image/gif';
export const isVideo   = (type) => type.startsWith('video/');

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function revokeAll(attachments) {
  attachments.forEach((a) => { if (a.url) URL.revokeObjectURL(a.url); });
}