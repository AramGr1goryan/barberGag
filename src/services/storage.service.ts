import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

export interface StorageProvider {
  uploadFile(file: Buffer, originalFilename: string, mimeType: string): Promise<string>;
  deleteFile(fileUrl: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.join(process.cwd(), "public", "uploads");
  }

  async uploadFile(file: Buffer, originalFilename: string, mimeType: string): Promise<string> {
    // 1. Validate MIME type
    const allowedMimes: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
      "image/avif": ".avif",
    };

    const extension = allowedMimes[mimeType];
    if (!extension) {
      throw new Error("UNSUPPORTED_FILE_TYPE");
    }

    // 2. Validate Magic Bytes
    const isJpeg = file[0] === 0xff && file[1] === 0xd8 && file[2] === 0xff;
    const isPng = file[0] === 0x89 && file[1] === 0x50 && file[2] === 0x4e && file[3] === 0x47;
    const isWebp = file.subarray(8, 12).toString("ascii") === "WEBP";

    if (!isJpeg && !isPng && !isWebp) {
      throw new Error("INVALID_IMAGE_DATA");
    }

    // 3. Ensure upload directory exists
    await fs.mkdir(this.uploadDir, { recursive: true });

    // 4. Generate cryptographically safe unique filename
    const safeFilename = `${crypto.randomUUID()}${extension}`;
    const targetPath = path.join(this.uploadDir, safeFilename);

    await fs.writeFile(targetPath, file);

    return `/uploads/${safeFilename}`;
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      const filename = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, filename);
      await fs.unlink(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}

export const storageService = getStorageProvider();
