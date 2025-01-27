import {
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'crypto';
import { deflateSync, inflateSync } from 'zlib';
import { Settings } from './settings';

const pad = (data: Buffer, blockSize: number): Buffer => {
  const padding = blockSize - (data.length % blockSize);
  return Buffer.concat([data, Buffer.alloc(padding, padding)]);
};

const unpad = (data: Buffer): Buffer => {
  const padding = data[data.length - 1];
  return data.subarray(0, data.length - padding);
};

export const compressAndEncrypt = (data: string): string => {
  // First compress the data with Deflate compression
  const compressedData = deflateSync(Buffer.from(data, 'utf-8'), { level: 9 });
  const secretKey = Settings.SECRET_KEY;
  if (!secretKey) {
    console.error('|ERR| crypto > compressAndEncrypt > No secret key provided');
    throw new Error('No secret key provided');
  }

  // Then encrypt the compressed data
  const iv = randomBytes(16);
  const cipher = createCipheriv('aes-256-cbc', secretKey, iv);

  // Ensure proper padding
  const paddedData = pad(compressedData, 16);
  const encryptedData = Buffer.concat([
    cipher.update(paddedData),
    cipher.final(),
  ]);
  return `E-${iv.toString('hex')}-${encryptedData.toString('hex')}`;
};

export const decryptAndDecompress = (
  encryptedData: Buffer,
  iv: Buffer
): string => {
  const secretKey = Settings.SECRET_KEY;
  if (!secretKey) {
    console.error(
      '|ERR| crypto > decryptAndDecompress > No secret key provided'
    );
    throw new Error('No secret key provided');
  }
  const decipher = createDecipheriv('aes-256-cbc', secretKey, iv);

  // Decrypt the data
  const decryptedPaddedData = Buffer.concat([
    decipher.update(encryptedData),
    decipher.final(),
  ]);

  // Remove padding
  const decryptedData = unpad(decryptedPaddedData);

  // Decompress the data with Deflate decompression
  const decompressedData = inflateSync(decryptedData);

  return decompressedData.toString('utf-8');
};

export function parseAndDecryptString(data: string): string | null {
  try {
    if (data.startsWith('E-')) {
      const [ivHex, encryptedHex] = data.replace('E-', '').split('-');
      const iv = Buffer.from(ivHex, 'hex');
      const encrypted = Buffer.from(encryptedHex, 'hex');
      return decryptAndDecompress(encrypted, iv);
    }
    return data;
  } catch (error: any) {
    console.error(
      `|ERR| crypto > parseAndDecryptString > Failed to decrypt data: ${error.message}`
    );
    return null;
  }
}

export function getTextHash(text: string): string {
  const hash = createHash('sha256');
  hash.update(text);
  return hash.digest('hex');
}
