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
export const uploadImageOnCloud = async (filepath, imageName = 'profile', folder = 'images') => {
  try {
    const uploadUrl = await cloudinary.uploader.upload(filepath, {
      public_id: imageName,
      folder: folder,
      resource_type: 'image',
      allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
      timeout: 60000,
      overwrite: true,
      transformation: [
        { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    //deleting from local server
    fs.unlinkSync(filepath);

    return {
      url: uploadUrl.secure_url,
      publicId: uploadUrl.public_id,
    };
  } catch (error) {
    fs.unlinkSync(filepath);
    throw new Error(error?.message || 'Cloud upload failed.');
  }
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
