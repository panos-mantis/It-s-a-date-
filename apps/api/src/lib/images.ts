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
  // Only an optional version segment may sit between `upload/` and the public id: any
  // other segment would be a Cloudinary transformation (e.g. l_fetch:, c_scale,w_10000).
  const prefix = `/${cloud}/image/upload/`;
  if (!url.pathname.startsWith(prefix)) return false;
  const rest = url.pathname.slice(prefix.length).replace(/^v\d+\//, '');
  return EXTENSIONS.some((ext) => rest === `${publicId}.${ext}`);
}
