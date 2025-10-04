import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function deleteFromCloudinary(imageUrl) {
  // Extract public_id from imageUrl
  // Example: https://res.cloudinary.com/<cloudName>/image/upload/v<version>/<public_id>.<ext>
  const matches = imageUrl.match(/\/upload\/(?:v\d+\/)?([^\.]+)(?:\.[a-zA-Z]+)?$/);
  const publicId = matches ? matches[1] : null;
  if (!publicId) throw new Error('Could not extract public_id from imageUrl');

  return cloudinary.uploader.destroy(publicId);
}
