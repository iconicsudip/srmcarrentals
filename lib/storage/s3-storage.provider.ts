import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import path from "node:path";
import { nanoid } from "nanoid";
import type { StorageProvider } from "./storage-provider";

const bucket = process.env.AWS_S3_BUCKET || "srm-rentals-uploads";
const region = process.env.AWS_REGION || "ap-south-1";

let s3Client: S3Client | null = null;

function getS3Client(): S3Client {
  if (!s3Client) {
    s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return s3Client;
}

function getContentType(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    case ".avif":
      return "image/avif";
    case ".svg":
      return "image/svg+xml";
    default:
      return "application/octet-stream";
  }
}

export const s3StorageProvider: StorageProvider = {
  async save({ buffer, originalName, folder }) {
    const ext = path.extname(originalName) || "";
    const filename = `${nanoid()}${ext}`;
    const key = folder ? `${folder}/${filename}` : filename;
    const client = getS3Client();

    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: getContentType(ext),
      })
    );

    const url = `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
    return { url, filename };
  },

  async delete({ folder, filename }) {
    try {
      const key = folder ? `${folder}/${filename}` : filename;
      const client = getS3Client();
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucket,
          Key: key,
        })
      );
    } catch {
      // Ignored if IAM policy restricts DeleteObject
    }
  },
};
