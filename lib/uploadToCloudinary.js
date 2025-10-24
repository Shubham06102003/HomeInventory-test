import imageCompression from 'browser-image-compression'
export async function uploadToCloudinary(file) {
  // Compress image before uploading
  let compressedFile = file
  try {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1280,
      useWebWorker: true
    }
    compressedFile = await imageCompression(file, options)
  } catch (err) {
    // If compression fails, fallback to original file
    // Optionally, you can log or toast the error
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', compressedFile)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  return data.secure_url
}
