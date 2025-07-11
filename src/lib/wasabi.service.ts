import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';

const wasabi = new S3Client({
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY!,
    secretAccessKey: process.env.WASABI_SECRET_KEY!,
  },
});

export async function uploadToWasabi(key: string, body: Buffer | Uint8Array | Blob | string, contentType: string) {
  await wasabi.send(new PutObjectCommand({
    Bucket: process.env.WASABI_BUCKET,
    Key: key,
    Body: body,
    ContentType: contentType,
  }));
}

export async function getFromWasabi(key: string) {
  return wasabi.send(new GetObjectCommand({
    Bucket: process.env.WASABI_BUCKET,
    Key: key,
  }));
} 