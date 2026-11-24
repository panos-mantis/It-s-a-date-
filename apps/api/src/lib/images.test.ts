import { describe, expect, it } from 'vitest';
import { isOwnImage } from './images.js';

const env = {
  CLOUDINARY_CLOUD_NAME: 'demo' as string | undefined,
  CLOUDINARY_FOLDER: 'itsadate/dev',
};
const ok = {
  url: 'https://res.cloudinary.com/demo/image/upload/v1712/itsadate/dev/ab12cd.jpg',
  publicId: 'itsadate/dev/ab12cd',
};

describe('isOwnImage', () => {
  it('accepts an image in our cloud and folder', () => {
    expect(isOwnImage(ok, env)).toBe(true);
  });

  it('rejects another cloud, another host, another folder', () => {
    expect(isOwnImage({ ...ok, url: ok.url.replace('/demo/', '/other/') }, env)).toBe(false);
    expect(
      isOwnImage(
        { ...ok, url: 'https://evil.example/demo/image/upload/itsadate/dev/ab12cd.jpg' },
        env,
      ),
    ).toBe(false);
    expect(
      isOwnImage(
        { url: ok.url.replace('itsadate/dev', 'itsadate/prod'), publicId: 'itsadate/prod/ab12cd' },
        env,
      ),
    ).toBe(false);
  });

  it('rejects traversal, odd characters and a url that disagrees with the publicId', () => {
    expect(isOwnImage({ ...ok, publicId: 'itsadate/dev/../prod/x' }, env)).toBe(false);
    expect(isOwnImage({ ...ok, publicId: 'itsadate/dev/ab 12' }, env)).toBe(false);
    expect(isOwnImage({ ...ok, publicId: 'itsadate/dev/zzz' }, env)).toBe(false);
  });

  it('rejects other extensions, http and a missing cloud name', () => {
    expect(isOwnImage({ ...ok, url: ok.url.replace('.jpg', '.gif') }, env)).toBe(false);
    expect(isOwnImage({ ...ok, url: ok.url.replace('https', 'http') }, env)).toBe(false);
    expect(isOwnImage(ok, { ...env, CLOUDINARY_CLOUD_NAME: undefined })).toBe(false);
  });

  it('rejects cloudinary transformation segments, allows an optional version', () => {
    const base = 'https://res.cloudinary.com/demo/image/upload/';
    const publicId = 'itsadate/dev/x';
    const at = (mid: string) => isOwnImage({ url: `${base}${mid}${publicId}.jpg`, publicId }, env);
    expect(at('l_fetch:aHR0cHM6Ly9ldmlsLmV4YW1wbGUveC5wbmc=/')).toBe(false);
    expect(at('c_scale,w_10000/')).toBe(false);
    expect(at('v1712/')).toBe(true);
    expect(at('')).toBe(true);
  });
});
