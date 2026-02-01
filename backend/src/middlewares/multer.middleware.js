import multer from 'multer';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = './public';
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // 2. Create a unique filename
    // Result: "avatar-170992384.png" instead of just "avatar"
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    
    // Grab the original extension (e.g., .jpg, .png)
    // Note: file.originalname might be "blob" if coming from cropper without name, 
    // so we handle that in the frontend or default to .jpg here if needed.
    let extension = file.originalname.split('.').pop();
    if(extension === file.originalname) extension = "jpg"; // Fallback if no dot found

    cb(null, file.fieldname + '-' + uniqueSuffix + '.' + extension);
  },
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 6 * 1024 * 1024 } // Optional: Limit to 5MB
});

export default upload;