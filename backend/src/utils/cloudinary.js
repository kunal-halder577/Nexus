import { v2 as cloudinary } from 'cloudinary';
import { configDotenv } from 'dotenv';
import fs from 'fs';
configDotenv();

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image
export const uploadImageOnCloud = async (filepath, folder = 'images') => {
  try {
    const uploadUrl = await cloudinary.uploader.upload(filepath, {
      folder: folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      timeout: 60000,
      use_filename: true, 
      unique_filename: false, // Multer already made it unique

      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    await fs.unlink(filepath);
    const aspectRatio = +(uploadUrl.width / uploadUrl.height).toFixed(2);

    return {
      url: uploadUrl.secure_url,
      publicId: uploadUrl.public_id,
      width: uploadUrl.width,
      height: uploadUrl.height,
      aspectRatio: aspectRatio, // e.g., "1.00"
      // Generate a quick thumbnail URL using Cloudinary's URL helper
      thumbnailUrl: cloudinary.url(uploadUrl.public_id, {
        width: 150,
        height: 150,
        crop: 'thumb',
        gravity: 'face',
        quality: 'auto'
      })
    };
  } catch (error) {
    try {
      await fs.unlink(filepath);
    } catch (unlinkError) {
      console.error("Failed to delete local file:", unlinkError);
    }
    throw new Error(error?.message || 'Cloud upload failed.');
  }
};

// Upload multiple images
export const uploadMultipleImages = async (filePaths, folder = 'images') => {
  const uploadPromises = filePaths.map(path =>
    uploadImageOnCloud(path, folder)
  );

  const results = await Promise.allSettled(uploadPromises);

  const successfulUploads = results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);

  const failedUploads = results
    .filter(r => r.status === 'rejected');

  if (failedUploads.length > 0) {
    throw new Error('Some uploads failed');
  }

  return successfulUploads;
};

// Delete the image
export const deleteImageFromCloud = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: 'image',
    });
    return result; // { result: "ok" }
  } catch (error) {
    throw new Error(error?.message || 'Failed delete image from cloud.');
  }
};

// Delete multiple images
export const deleteMultipleImages = async (publicIds) => {
  try {
    // cloudinary.api.delete_resources takes an array of public IDs
    const result = await cloudinary.api.delete_resources(publicIds, {
      invalidate: true,
      resource_type: 'image',
    });
    
    // { deleted: { publicId1: "deleted", publicId2: "not_found" }, ... }
    return result; 
  } catch (error) {
    throw new Error(error?.message || 'Failed to bulk delete images from cloud.');
  }
};