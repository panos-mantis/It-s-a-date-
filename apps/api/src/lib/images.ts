import type { Env } from '../config/env.js';

const PUBLIC_ID = /^[A-Za-z0-9_/-]+$/;
const EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

/**
 * True only for an image that lives in our Cloudinary cloud and folder, so a client
 * cannot attach arbitrary URLs or another environment's assets to an idea.
 */
export function isOwnImage(
  image: { url: string; publicId: string },
  env: Pick<Env, 'CLOUDINARY_CLOUD_NAME' | 'CLOUDINARY_FOLDER'>,
): boolean {
  const cloud = env.CLOUDINARY_CLOUD_NAME;
  if (!cloud) return false;
  const { publicId } = image;
  if (!PUBLIC_ID.test(publicId) || publicId.split('/').includes('..')) return false;
  if (!publicId.startsWith(`${env.CLOUDINARY_FOLDER}/`)) return false;

  let url: URL;
  try {
    url = new URL(image.url);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.host !== 'res.cloudinary.com') return false;
  if (url.username || url.password) return false;
  if (!url.pathname.startsWith(`/${cloud}/image/upload/`)) return false;
  // The file name is the last part of the public id plus an image extension, and the
  // whole public id (folder included) must precede it.
  return EXTENSIONS.some((ext) => url.pathname.endsWith(`/${publicId}.${ext}`));
}
