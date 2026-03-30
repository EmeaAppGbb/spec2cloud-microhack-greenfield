import * as fs from 'node:fs/promises';
import * as fsSync from 'node:fs';
import * as path from 'node:path';
import { logger } from '../logger.js';

function getStorageDir(): string {
  return process.env.IMAGE_STORAGE_DIR || path.join(process.cwd(), 'data', 'images');
}

function extensionForMime(mimeType: string): string {
  return mimeType === 'image/jpeg' ? 'jpg' : 'png';
}

export async function saveImage(
  campaignId: string,
  version: number,
  imageData: Buffer,
  mimeType: string,
): Promise<{ path: string; url: string }> {
  const storageDir = getStorageDir();
  const campaignDir = path.join(storageDir, campaignId);
  const ext = extensionForMime(mimeType);
  const filename = `${version}.${ext}`;
  const filePath = path.join(campaignDir, filename);

  await fs.mkdir(campaignDir, { recursive: true });
  await fs.writeFile(filePath, imageData);

  const url = `/api/campaign/${campaignId}/image/${version}`;

  logger.info({ campaignId, version, filePath }, 'Image saved');

  return { path: filePath, url };
}

export async function getImage(
  campaignId: string,
  version: number,
): Promise<{ data: Buffer; mimeType: string } | null> {
  const storageDir = getStorageDir();
  const campaignDir = path.join(storageDir, campaignId);

  // Try png first, then jpg
  for (const ext of ['png', 'jpg']) {
    const filePath = path.join(campaignDir, `${version}.${ext}`);
    if (fsSync.existsSync(filePath)) {
      const data = await fs.readFile(filePath);
      const mimeType = ext === 'jpg' ? 'image/jpeg' : 'image/png';
      return { data, mimeType };
    }
  }

  return null;
}
