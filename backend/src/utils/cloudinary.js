import { v2 as cloudinary } from 'cloudinary';
import { configDotenv } from 'dotenv';
import fs from 'fs/promises';
configDotenv();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadMediaToCloud = async (filepath, folder = 'media') => {
  try {
    const uploadUrl = await cloudinary.uploader.upload(filepath, {
      folder,
      resource_type: 'auto', // ✅ handles image, video, gif automatically
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'],
      timeout: 120000, // ✅ increase for video — 60s is too tight
      use_filename: true,
      unique_filename: false,
    });

    await fs.unlink(filepath);

    const aspectRatio = +(uploadUrl.width / uploadUrl.height).toFixed(2);
    const isVideo = uploadUrl.resource_type === 'video';

    return {
      url: uploadUrl.secure_url,
      publicId: uploadUrl.public_id,
      resourceType: uploadUrl.resource_type, // 'image' | 'video'
      width: uploadUrl.width,
      height: uploadUrl.height,
      aspectRatio,
      duration: isVideo ? uploadUrl.duration : null, // ✅ only videos have this
      thumbnailUrl: isVideo
        // Cloudinary can generate a video thumbnail automatically
        ? cloudinary.url(uploadUrl.public_id, {
            resource_type: 'video',
            format: 'jpg',        // grab a JPG frame
            transformation: [{ width: 150, height: 150, crop: 'thumb' }],
          })
        : cloudinary.url(uploadUrl.public_id, {
            width: 150,
            height: 150,
            crop: 'thumb',
            gravity: 'face',
            quality: 'auto',
          }),
    };
  } catch (error) {
    console.error("CLOUDINARY UPLOAD ERROR:", error);
    await fs.unlink(filepath).catch(err =>
      console.error('Failed to delete local file:', err)
    );
    throw new Error(error?.message || 'Cloud upload failed.');
  }
};

export const uploadMultipleMedia = async (filePaths, folder = 'media') => {
  const results = await Promise.allSettled(
    filePaths.map(p => uploadMediaToCloud(p, folder))
  );

  const failed = results.filter(r => r.status === 'rejected');
  if (failed.length > 0) {
    failed.forEach(f => console.error('Upload failed:', f.reason));
    throw new Error('Some uploads failed');
  }

  return results.map(r => r.value);
};

export const deleteMediaFromCloud = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: resourceType, // 'image' for images + gifs, 'video' for videos
    });
    return result; // { result: 'ok' } or { result: 'not found' }
  } catch (error) {
    throw new Error(error?.message || 'Failed to delete media from cloud.');
  }
};

export const deleteMultipleMedia = async (mediaItems) => {
  const images = mediaItems
    .filter(m => m.resourceType === 'image') // covers jpg, png, webp, gif
    .map(m => m.publicId);

  const videos = mediaItems
    .filter(m => m.resourceType === 'video') // covers mp4, webm, mov
    .map(m => m.publicId);

  const results = await Promise.allSettled([
    images.length > 0 && cloudinary.api.delete_resources(images, {
      resource_type: 'image',
      invalidate: true,
    }),
    videos.length > 0 && cloudinary.api.delete_resources(videos, {
      resource_type: 'video',
      invalidate: true,
    }),
  ].filter(Boolean));

  return results;
};