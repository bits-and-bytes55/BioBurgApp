/**
 * Compresses an image File using the Canvas API before uploading.
 *
 * @param {File}   file
 * @param {Object} options
 * @param {number} options.maxWidthOrHeight  – default 1280
 * @param {number} options.quality           – 0-1, default 0.75
 * @param {string} options.outputFormat      – default "image/webp"
 * @returns {Promise<File>}
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidthOrHeight = 1280,
    quality = 0.75,
    outputFormat = "image/webp",
  } = options;

  if (!file.type.startsWith("image/")) {
    console.warn("[compressImage] Not an image, returning original:", file.name);
    return file;
  }

  // GIF – canvas strips animation, return as-is
  if (file.type === "image/gif") {
    console.info("[compressImage] GIF skipped (animation preserved):", file.name);
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        let { width, height } = img;
        if (width > maxWidthOrHeight || height > maxWidthOrHeight) {
          if (width >= height) {
            height = Math.round((height * maxWidthOrHeight) / width);
            width = maxWidthOrHeight;
          } else {
            width = Math.round((width * maxWidthOrHeight) / height);
            height = maxWidthOrHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            const ext = outputFormat === "image/webp" ? "webp" : "jpg";
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const compressed = new File([blob], `${baseName}.${ext}`, {
              type: outputFormat,
              lastModified: Date.now(),
            });
            console.info(
              `[compressImage] ${file.name}: ${(file.size / 1024).toFixed(1)} KB → ` +
              `${(compressed.size / 1024).toFixed(1)} KB (${width}×${height})`
            );
            resolve(compressed);
          },
          outputFormat,
          quality
        );
      };

      img.onerror = () => reject(new Error("Failed to load image for compression"));
      img.src = e.target.result;
    };

    reader.onerror = () => reject(new Error("FileReader error"));
    reader.readAsDataURL(file);
  });
}

/**
 * Videos are passed through as-is.
 * Cloudinary transcodes them server-side – far faster than FFmpeg.wasm.
 *
 * @param {File}   file
 * @returns {Promise<File>}
 */
export async function compressVideo(file) {
  if (!file.type.startsWith("video/")) {
    console.warn("[compressVideo] Not a video:", file.name);
  }
  console.info(
    `[compressVideo] Skipping client-side compression – ` +
    `uploading raw (${(file.size / 1024 / 1024).toFixed(2)} MB). ` +
    `Cloudinary will transcode server-side.`
  );
  return file; // pass-through
}

/**
 * Automatically compresses a file based on its type.
 * Images are compressed; videos are passed through.
 *
 * @param {File}   file
 * @param {Object} imageOptions
 * @returns {Promise<File>}
 */
// eslint-disable-next-line no-unused-vars
export async function autoCompress(file, imageOptions = {}, videoOptions = {}) {
  if (!file) return file;
  if (file.type.startsWith("image/")) return compressImage(file, imageOptions);
  if (file.type.startsWith("video/")) return compressVideo(file);
  return file;
}

/**
 * Compresses an array of files.
 *
 * @param {File[]} files
 * @param {Object} imageOptions
 * @param {Object} videoOptions
 * @returns {Promise<File[]>}
 */
export async function compressBatch(files, imageOptions = {}, videoOptions = {}) {
  return Promise.all(files.map((f) => autoCompress(f, imageOptions, videoOptions)));
}

/**
 * Compresses a file (images only) and uploads to Cloudinary with progress.
 *
 * @param {File}     file
 * @param {Object}   cloudinaryConfig
 * @param {string}   cloudinaryConfig.cloudName
 * @param {string}   cloudinaryConfig.uploadPreset
 * @param {string}   [cloudinaryConfig.folder]
 * @param {Object}   imageOptions        – passed to compressImage()
 * @param {Object}   videoOptions        – kept for API compatibility, unused
 * @param {Function} onProgress          – (percent: number) => void
 * @returns {Promise<Object>}            – Cloudinary response { secure_url, public_id, … }
 */
// eslint-disable-next-line no-unused-vars
export async function compressAndUpload(
  file,
  cloudinaryConfig = {},
  imageOptions = {},
  onProgress = null
) {
  const { cloudName, uploadPreset, folder } = cloudinaryConfig;

  if (!cloudName || !uploadPreset) {
    throw new Error("[compressAndUpload] cloudName and uploadPreset are required");
  }

  // Compress images; videos skip compression
  console.info(`[compressAndUpload] Preparing: ${file.name}`);
  const ready = await autoCompress(file, imageOptions);

  const fd = new FormData();
  fd.append("file", ready);
  fd.append("upload_preset", uploadPreset);
  if (folder) fd.append("folder", folder);

  const resourceType = file.type.startsWith("video/") ? "video" : "image";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
    );

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        console.info(`[compressAndUpload] Done: ${res.secure_url}`);
        resolve(res);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} – ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(fd);
  });
}