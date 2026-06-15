import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type R2ConfigSubset = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketPublic: string;
  publicUrl: string;
};

export function createR2Client(cfg: R2ConfigSubset): S3Client {
  return new S3Client({
    region: "auto",
    endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: cfg.accessKeyId,
      secretAccessKey: cfg.secretAccessKey,
    },
  });
}

function normalizeBaseUrl(publicUrl: string): string {
  return publicUrl.replace(/\/$/, "");
}

export function publicObjectUrl(cfg: R2ConfigSubset, key: string): string {
  const pathPart = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${normalizeBaseUrl(cfg.publicUrl)}/${pathPart}`;
}

export async function putPublicObject(
  client: S3Client,
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string,
): Promise<void> {
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );
}

export async function deletePublicObject(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<void> {
  await client.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

export async function getPublicObjectBuffer(
  client: S3Client,
  bucket: string,
  key: string,
): Promise<Buffer> {
  const res = await client.send(
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
  const body = res.Body;
  if (!body) throw new Error("empty_object_body");
  const chunks: Uint8Array[] = [];
  for await (const chunk of body as AsyncIterable<Uint8Array>) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
