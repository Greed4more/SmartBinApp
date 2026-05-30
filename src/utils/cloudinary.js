/**
 * Simulates uploading an image to Cloudinary.
 * Returns a promise that resolves with a simulated URL after a short delay.
 * If Cloudinary keys are configured, this can be swapped with real API calls.
 */
export async function uploadToCloudinary(fileDataUrl) {
  return new Promise((resolve) => {
    console.log("Cloudinary Upload Simulator: Uploading file...");
    setTimeout(() => {
      // Return the uploaded base64 dataUrl directly as the image URL so it displays instantly,
      // or a placeholder if it's too large. Since base64 works perfectly in img src tags,
      // this gives a 100% functional representation of the uploaded image!
      resolve(fileDataUrl);
    }, 1000);
  });
}
