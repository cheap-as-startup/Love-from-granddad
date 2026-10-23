// Server-only: checks, cleans and stores photos.
import { randomUUID } from 'node:crypto';

import { put } from '@vercel/blob';
import jpeg from 'jpeg-js';

// The app shrinks photos before sending, so anything bigger than this is suspicious.
export const MaxPhotoBytes = 4 * 1024 * 1024;
const MaxPhotoSide = 2000;

// Decodes the photo and saves it again as a fresh JPEG. This proves it really is an
// image, and strips hidden details like the GPS location where it was taken.
export async function cleanPhoto(file: File): Promise<Buffer> {
  if (file.size > MaxPhotoBytes) {
    throw new PhotoError('That photo is too big — please choose a smaller one.');
  }

  let image;
  try {
    image = jpeg.decode(Buffer.from(await file.arrayBuffer()), {
      maxResolutionInMP: 5,
      maxMemoryUsageInMB: 64,
    });
  } catch {
    throw new PhotoError("Sorry, we couldn't read that photo. Please try a different one.");
  }
  if (image.width > MaxPhotoSide || image.height > MaxPhotoSide) {
    throw new PhotoError('That photo is too big — please choose a smaller one.');
  }

  // Pass on only the pixels — the decoder also keeps the hidden details, which we leave behind.
  const { width, height, data } = image;
  return jpeg.encode({ width, height, data }, 80).data;
}

// Saves the photo to Vercel Blob storage and returns its web address.
export async function storePhoto(photo: Buffer): Promise<string> {
  const blob = await put(`walks/${randomUUID()}.jpg`, photo, {
    access: 'public',
    contentType: 'image/jpeg',
  });
  return blob.url;
}

export class PhotoError extends Error {}
