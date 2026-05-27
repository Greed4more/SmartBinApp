// Cloudinary credentials
const CLOUDINARY_CLOUD_NAME = 'dc8suuh6h';
const CLOUDINARY_UPLOAD_PRESET = 'Smartbin';

export const uploadToCloudinary = async (imageUri) => {
  try {
    const formData = new FormData();
    const filename = imageUri.split('/').pop();
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('file', { uri: imageUri, name: filename, type });
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'smartbin_waste');

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData, headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return { url: data.secure_url, publicId: data.public_id, width: data.width, height: data.height };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};
