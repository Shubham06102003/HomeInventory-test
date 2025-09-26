export async function uploadToCloudinary(file) {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', uploadPreset)

  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  })
  const data = await res.json()
  return data.secure_url
}
