import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

let ffmpegInstance = null;

async function getFFmpeg() {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

  await ffmpeg.load({
    coreURL:   await toBlobURL(`${baseURL}/ffmpeg-core.js`,   "text/javascript"),
    wasmURL:   await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}
/**
 * Compresses an image File before uploading.
 *
 * @param {File}   file         
 * @param {Object} options
 * @param {number} options.maxWidthOrHeight  
 * @param {number} options.quality           
 * @param {string} options.outputFormat      
 * @returns {Promise<File>} 
 *
 * USAGE:
 *   import { compressImage } from "../utils/mediaCompressor";
 *   const compressed = await compressImage(file);
 *   // then upload `compressed` to Cloudinary instead of `file`
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidthOrHeight = 1280,
    quality = 0.75,
    outputFormat = "image/webp",  // webp is ~30% smaller than jpeg at same quality
    // skipIfUnderKB = 200,          
  } = options;

  // Skip if already small enough
  // if (file.size <= skipIfUnderKB * 1024) {
  //   console.info(`[compressImage] Already small (${(file.size/1024).toFixed(1)} KB), skipping`);
  //   return file;
  // }

  // Skip non-images
  if (!file.type.startsWith("image/")) {
    console.warn("[compressImage] Not an image, returning original:", file.name);
    return file;
  }

  // GIF — canvas strips animation, return as-is
  if (file.type === "image/gif") {
    console.info("[compressImage] GIF skipped (animation preserved):", file.name);
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        // ── Calculate new dimensions keeping aspect ratio ──
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

        // ── Draw on canvas & export ──
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Canvas toBlob failed"));
            const ext = outputFormat === "image/webp" ? "webp" : "jpg";
            const baseName = file.name.replace(/\.[^.]+$/, "");
            const compressedFile = new File([blob], `${baseName}.${ext}`, {
              type: outputFormat,
              lastModified: Date.now(),
            });

            console.info(
              `[compressImage] ${file.name}: ${(file.size / 1024).toFixed(1)} KB → ${(compressedFile.size / 1024).toFixed(1)} KB (${width}×${height})`
            );
            resolve(compressedFile);
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
 * Lightweight video compression using MediaRecorder.
 * Reduces bitrate significantly. Works in Chrome/Edge/Firefox.
 * For aggressive compression, see the ffmpeg.wasm version below.
 *
 * @param {File}   file
 * @param {Object} options
 * @param {number} options.videoBitsPerSecond 
 * @returns {Promise<File>} 
 *
 * USAGE:
 *   import { compressVideo } from "../utils/mediaCompressor";
 *   const compressed = await compressVideo(file, { videoBitsPerSecond: 800_000 });
 */


export async function compressVideo(file, options = {}) {
  const {
    // targetSizeMB     = 8,       
    // videoBitrate     = "800k",  
    audioBitrate     = "96k",   // audio bitrate
    maxWidth         = 1280,    
  } = options;

  if (!file.type.startsWith("video/")) {
    console.warn("[compressVideo] Not a video:", file.name);
    return file;
  }

  

  try {
    console.info(`[compressVideo] Starting FFmpeg compression for: ${file.name}`);
    const ffmpeg = await getFFmpeg();

    const inputName  = "input.mp4";
    const outputName = "output.mp4";

    await ffmpeg.writeFile(inputName, await fetchFile(file));

    await ffmpeg.exec([
      "-i", inputName,
      "-vcodec", "libx264",
      "-crf", "28",               // quality (18=best, 51=worst), 28 is good balance
      "-preset", "fast",
      "-vf", `scale='min(${maxWidth},iw)':-2`,   // scale width down, keep ratio
      "-acodec", "aac",
      "-b:a", audioBitrate,
      "-movflags", "+faststart",  // web-optimized
      "-y",
      outputName,
    ]);

    const data = await ffmpeg.readFile(outputName);
    const blob = new Blob([data.buffer], { type: "video/mp4" });
    const baseName = file.name.replace(/\.[^.]+$/, "");
    const compressedFile = new File([blob], `${baseName}_compressed.mp4`, {
      type: "video/mp4",
      lastModified: Date.now(),
    });

    // Cleanup
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    console.info(
      `[compressVideo] ${file.name}: ${(file.size/1024/1024).toFixed(2)} MB → ${(compressedFile.size/1024/1024).toFixed(2)} MB`
    );

    // Safety: if compressed is bigger, return original
    return compressedFile.size < file.size ? compressedFile : file;

  } catch (err) {
    console.error("[compressVideo] FFmpeg error, returning original:", err);
    return file;
  }
}


/**
 * Automatically compresses a file based on its type.
 * Pass ANY file from an <input> — it handles images and videos.
 *
 * @param {File}   file
 * @param {Object} imageOptions  
 * @param {Object} videoOptions  
 * @returns {Promise<File>}
 *
 * USAGE (simplest — drop-in replacement):
 *   import { autoCompress } from "../utils/mediaCompressor";
 *
 *   const handleUpload = async (e) => {
 *     const file = e.target.files[0];
 *     const compressed = await autoCompress(file);
 *     // upload `compressed` to Cloudinary
 *   };
 */
export async function autoCompress(file, imageOptions = {}, videoOptions = {}) {
  if (!file) return file;

  if (file.type.startsWith("image/")) {
    return compressImage(file, imageOptions);
  }

  if (file.type.startsWith("video/")) {
    return compressVideo(file, videoOptions);
  }

  return file;
}

/**
 * Compresses an array of files (e.g. from multiple file input).
 *
 * @param {File[]} files
 * @param {Object} imageOptions
 * @param {Object} videoOptions
 * @returns {Promise<File[]>}
 *
 * USAGE:
 *   const files = Array.from(e.target.files);
 *   const compressed = await compressBatch(files);
 */
export async function compressBatch(files, imageOptions = {}, videoOptions = {}) {
  return Promise.all(
    files.map((file) => autoCompress(file, imageOptions, videoOptions))
  );
}

/**
 * Compresses a file and uploads it to Cloudinary.
 *
 * @param {File}   file
 * @param {Object} cloudinaryConfig
 * @param {string} cloudinaryConfig.cloudName     - Your Cloudinary cloud name
 * @param {string} cloudinaryConfig.uploadPreset  - Your unsigned upload preset
 * @param {string} cloudinaryConfig.folder        - (optional) Cloudinary folder
 * @param {Object} imageOptions                   - Passed to compressImage()
 * @param {Object} videoOptions                   - Passed to compressVideo()
 * @param {Function} onProgress                   - (percent: number) => void
 * @returns {Promise<Object>}  Cloudinary response { secure_url, public_id, ... }
 *
 * USAGE:
 *   import { compressAndUpload } from "../utils/mediaCompressor";
 *
 *   const result = await compressAndUpload(file, {
 *     cloudName: "your_cloud_name",
 *     uploadPreset: "your_preset",
 *     folder: "hospital-docs",
 *   }, {}, {}, (pct) => setProgress(pct));
 *
 *   console.log(result.secure_url); 
 */
export async function compressAndUpload(
  file,
  cloudinaryConfig = {},
  imageOptions = {},
  videoOptions = {},
  onProgress = null
) {
  const { cloudName, uploadPreset, folder } = cloudinaryConfig;

  if (!cloudName || !uploadPreset) {
    throw new Error("[compressAndUpload] cloudName and uploadPreset are required");
  }

  // Step 1 — Compress
  console.info(`[compressAndUpload] Compressing: ${file.name}`);
  const compressed = await autoCompress(file, imageOptions, videoOptions);

  // Step 2 — Build FormData
  const formData = new FormData();
  formData.append("file", compressed);
  formData.append("upload_preset", uploadPreset);
  if (folder) formData.append("folder", folder);

  // Step 3 — Upload with progress tracking
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const resourceType = file.type.startsWith("video/") ? "video" : "image";

    xhr.open(
      "POST",
      `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`
    );

    if (onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const pct = Math.round((e.loaded / e.total) * 100);
          onProgress(pct);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status === 200) {
        const res = JSON.parse(xhr.responseText);
        console.info(`[compressAndUpload] Done: ${res.secure_url}`);
        resolve(res);
      } else {
        reject(new Error(`Cloudinary upload failed: ${xhr.status} ${xhr.responseText}`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during Cloudinary upload"));
    xhr.send(formData);
  });
}