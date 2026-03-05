import multer from 'multer';
import fs from 'fs';
import path from 'path';

const UPLOAD_DIR = './public/uploads';

// Create once at startup, not on every request
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
]);

const FILE_SIZE_LIMITS = {
  image: 8   * 1024 * 1024, //   8MB for images + gifs
  video: 100 * 1024 * 1024, // 100MB for videos
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    return cb(new Error(`Unsupported file type: ${file.mimetype}`), false);
  }

  const isVideo = file.mimetype.startsWith('video/');
  const limit = isVideo ? FILE_SIZE_LIMITS.video : FILE_SIZE_LIMITS.image;

  // Store on req so downstream middleware or controllers can reference it
  req.fileSizeLimit = limit;

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: FILE_SIZE_LIMITS.video, // ✅ set to highest ceiling (video)
    files: 10,                         // Multer enforces per-type via fileFilter above
  },
});

export default upload;