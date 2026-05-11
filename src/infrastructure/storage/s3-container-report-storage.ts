import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

type UploadInput = {
  bucket: string;
  key: string;
  body: Buffer;
  content_type: string;
};

export type ContainerReportStorageGateway = {
  upload: (input: UploadInput) => Promise<void>;
  getSignedDownloadUrl: (input: {
    bucket: string;
    key: string;
    original_filename: string;
    expires_in_seconds?: number;
  }) => Promise<string>;
  delete: (input: { bucket: string; key: string }) => Promise<void>;
};

let client: S3Client | null = null;

const getClient = () => {
  if (!client) {
    client = new S3Client({
      region: process.env.AWS_REGION,
    });
  }

  return client;
};

export const getContainerReportsBucket = () => {
  const bucket = process.env.AWS_S3_CONTAINER_REPORTS_BUCKET;

  if (!bucket) {
    throw new Error("AWS_S3_CONTAINER_REPORTS_BUCKET is not configured.");
  }

  return bucket;
};

export const S3ContainerReportStorage: ContainerReportStorageGateway = {
  upload: async ({ bucket, key, body, content_type }) => {
    await getClient().send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: content_type,
      }),
    );
  },
  getSignedDownloadUrl: async ({
    bucket,
    key,
    original_filename,
    expires_in_seconds = 300,
  }) =>
    await getSignedUrl(
      getClient(),
      new GetObjectCommand({
        Bucket: bucket,
        Key: key,
        ResponseContentDisposition: `attachment; filename="${original_filename.replace(/"/g, "")}"`,
      }),
      { expiresIn: expires_in_seconds },
    ),
  delete: async ({ bucket, key }) => {
    await getClient().send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
  },
};
