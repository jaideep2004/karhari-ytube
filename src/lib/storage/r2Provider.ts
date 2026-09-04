import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  HeadBucketCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl as s3GetSignedUrl } from '@aws-sdk/s3-request-presigner';
import fs from 'fs/promises';

const R2_ENDPOINT = () => process.env.R2_ENDPOINT || '';
const R2_ACCESS_KEY_ID = () => process.env.R2_ACCESS_KEY_ID || '';
const R2_SECRET_ACCESS_KEY = () => process.env.R2_SECRET_ACCESS_KEY || '';
const R2_BUCKET_NAME = () => process.env.R2_BUCKET_NAME || '';
const R2_PUBLIC_DOMAIN = () => (process.env.R2_PUBLIC_DOMAIN || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');

export class R2Provider {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: R2_ENDPOINT(),
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID(),
        secretAccessKey: R2_SECRET_ACCESS_KEY(),
      },
      requestHandler: {
        connectionTimeout: 30_000,
        requestTimeout: 600_000,
      },
    });
  }

  get isConfigured(): boolean {
    return !!(R2_ENDPOINT() && R2_ACCESS_KEY_ID() && R2_SECRET_ACCESS_KEY() && R2_BUCKET_NAME());
  }

  get publicDomain(): string {
    return R2_PUBLIC_DOMAIN();
  }

  get bucketName(): string {
    return R2_BUCKET_NAME();
  }

  get publicUrl(): string {
    const domain = this.publicDomain;
    if (domain) return `https://${domain}`;
    return '';
  }

  getR2Key(filename: string, directory: string): string {
    return `${directory}/${filename}`;
  }

  getPublicUrl(filename: string, directory: string): string {
    const base = this.publicUrl;
    if (!base) return '';
    return `${base}/${directory}/${filename}`;
  }

  async uploadFile(filePath: string, key: string, contentType?: string): Promise<{ url: string; key: string }> {
    const body = await fs.readFile(filePath);

    await this.client.send(new PutObjectCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
    }));

    const domain = this.publicDomain;
    const url = domain ? `https://${domain}/${key}` : '';
    return { url, key };
  }

  async uploadAndCleanup(filePath: string, key: string, contentType?: string): Promise<{ url: string; key: string }> {
    const result = await this.uploadFile(filePath, key, contentType);
    await fs.unlink(filePath).catch(() => {});
    return result;
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
    }));
  }

  async generateSignedUploadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
    });
    return s3GetSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: R2_BUCKET_NAME(),
        Key: key,
      }));
      return true;
    } catch {
      return false;
    }
  }

  async generateSignedDownloadUrl(key: string, expiresInSeconds = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
    });
    return s3GetSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  /** Reliable SDK streaming download — avoids undici/fetch IPv6 socket-close (UND_ERR_SOCKET) on large files */
  async downloadToFile(key: string, destPath: string): Promise<void> {
    const res = await this.client.send(
      new GetObjectCommand({ Bucket: R2_BUCKET_NAME(), Key: key })
    );
    const body = res.Body as unknown as { transformToByteArray?: () => Promise<Uint8Array>; pipe?: unknown } & NodeJS.ReadableStream;
    // SDK v3 Body is a mix — prefer streaming to file to avoid buffering 200 MB in RAM
    if (body && typeof (body as unknown as { transformToByteArray?: unknown }).transformToByteArray === "function") {
      const bytes = await (body as unknown as { transformToByteArray: () => Promise<Uint8Array> }).transformToByteArray();
      await fs.writeFile(destPath, Buffer.from(bytes));
      return;
    }
    // Fallback: Node readable stream
    const { createWriteStream } = await import("fs");
    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(destPath);
      (body as NodeJS.ReadableStream).pipe(ws);
      ws.on("finish", resolve);
      ws.on("error", reject);
      (body as NodeJS.ReadableStream).on("error", reject);
    });
  }

  async createMultipartUpload(key: string, contentType?: string): Promise<string> {
    const command = new CreateMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
      ContentType: contentType || 'application/octet-stream',
    });
    const result = await this.client.send(command);
    return result.UploadId || '';
  }

  async getPartUploadUrl(key: string, uploadId: string, partNumber: number, expiresInSeconds = 3600): Promise<string> {
    const command = new UploadPartCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return s3GetSignedUrl(this.client, command, { expiresIn: expiresInSeconds });
  }

  async completeMultipartUpload(
    key: string,
    uploadId: string,
    parts: { PartNumber: number; ETag: string }[]
  ): Promise<void> {
    const command = new CompleteMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
      UploadId: uploadId,
      MultipartUpload: { Parts: parts },
    });
    await this.client.send(command);
  }

  async abortMultipartUpload(key: string, uploadId: string): Promise<void> {
    const command = new AbortMultipartUploadCommand({
      Bucket: R2_BUCKET_NAME(),
      Key: key,
      UploadId: uploadId,
    });
    await this.client.send(command);
  }

  async checkConnection(): Promise<{ ok: boolean; error?: string; detail?: string }> {
    if (!this.isConfigured) return { ok: false, error: "Not configured — missing R2_ENDPOINT / R2_ACCESS_KEY_ID / R2_SECRET / R2_BUCKET_NAME" };
    try {
      // HeadBucket is cheapest live check; 403 means bad token, 404 means bucket missing but creds ok
      await this.client.send(new HeadBucketCommand({ Bucket: R2_BUCKET_NAME() }));
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      // Try to extract more detail
      const detail = (e as unknown as { Code?: string; $metadata?: { httpStatusCode?: number } })?.Code || (e as unknown as { $metadata?: { httpStatusCode?: number } })?.$metadata?.httpStatusCode?.toString() || "";
      // 403 = AccessDenied token scope wrong, 404 = NoSuchBucket, 400 = bad endpoint
      return { ok: false, error: msg.slice(0, 400), detail };
    }
  }
}

export const r2 = new R2Provider();
