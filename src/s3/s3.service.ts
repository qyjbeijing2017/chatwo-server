import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class S3Service {
  private readonly s3: AWS.S3;
  private readonly logger = new Logger(S3Service.name);

  constructor(private configService: ConfigService<NodeJS.ProcessEnv>) {
    this.s3 = new AWS.S3({
      endpoint: this.configService.get<string>('STORAGE_HOST'),
      accessKeyId: this.configService.get<string>('STORAGE_USERNAME'),
      secretAccessKey: this.configService.get<string>('STORAGE_PASSWORD'),
      s3ForcePathStyle:
        this.configService.get<string>('STORAGE_FORCE_PATH_STYLE') === 'true',
      signatureVersion: this.configService.get<string>(
        'STORAGE_SIGNATURE_VERSION',
      ),
    });
  }

  async upload(bucket: string, key: string, body: AWS.S3.Body) {
    await this.s3
      .putObject({
        Bucket: bucket,
        Key: key,
        Body: body,
        ACL: 'public-read',
      })
      .promise();
    return `${key}`;
  }

  get(bucket: string, key: string, range?: string) {
    return this.s3.getObject({
      Bucket: bucket,
      Key: key,
      Range: range,
    });
  }

  async head(bucket: string, key: string) {
    return this.s3
      .headObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
  }

  async delete(bucket: string, key: string) {
    await this.s3
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
  }

  async createMultipartUpload(
    bucket: string,
    key: string,
  ): Promise<AWS.S3.CreateMultipartUploadOutput> {
    return this.s3
      .createMultipartUpload({
        Bucket: bucket,
        Key: key,
        ACL: 'public-read',
      })
      .promise();
  }

  async uploadPart(
    bucket: string,
    key: string,
    partNumber: number,
    uploadId: string,
    body: AWS.S3.Body,
  ): Promise<AWS.S3.UploadPartOutput> {
    return this.s3
      .uploadPart({
        Bucket: bucket,
        Key: key,
        PartNumber: partNumber,
        UploadId: uploadId,
        Body: body,
      })
      .promise();
  }

  async completeMultipartUpload(
    bucket: string,
    key: string,
    uploadId: string,
    parts: AWS.S3.CompletedPart[],
  ): Promise<AWS.S3.CompleteMultipartUploadOutput> {
    return this.s3
      .completeMultipartUpload({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        MultipartUpload: { Parts: parts },
      })
      .promise();
  }

  async ensureBucketExists(bucket: string): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: bucket }).promise();
    } catch (e) {
      this.logger.warn(`Bucket ${bucket} does not exist, creating...`, e);
      await this.s3.createBucket({ Bucket: bucket }).promise();
    }
  }

  async getSize(bucket: string, prefix?: string): Promise<number> {
    let totalSize = 0;
    let continuationToken: string | undefined;

    do {
      const response = await this.s3
        .listObjectsV2({
          Bucket: bucket,
          Prefix: prefix,
          ContinuationToken: continuationToken,
        })
        .promise();

      if (response.Contents) {
        totalSize += response.Contents.reduce(
          (sum, object) => sum + (object.Size || 0),
          0,
        );
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return totalSize;
  }

  async copy(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
  ): Promise<void> {
    await this.s3
      .copyObject({
        Bucket: destinationBucket,
        CopySource: `${sourceBucket}/${sourceKey}`,
        Key: destinationKey,
        ACL: 'public-read',
      })
      .promise();
  }

  async list(
    bucket: string,
    prefix?: string,
  ): Promise<AWS.S3.ListObjectsV2Output> {
    return this.s3
      .listObjectsV2({
        Bucket: bucket,
        Prefix: prefix,
      })
      .promise();
  }

  async rename(bucket: string, oldKey: string, newKey: string): Promise<void> {
    await this.copy(bucket, oldKey, bucket, newKey);
    await this.delete(bucket, oldKey);
  }

  async move(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
  ): Promise<void> {
    await this.ensureBucketExists(destinationBucket);
    await this.copy(sourceBucket, sourceKey, destinationBucket, destinationKey);
    await this.delete(sourceBucket, sourceKey);
  }

  async tryMove(
    sourceBucket: string,
    sourceKey: string,
    destinationBucket: string,
    destinationKey: string,
  ): Promise<void> {
    try {
      await this.move(
        sourceBucket,
        sourceKey,
        destinationBucket,
        destinationKey,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to move file from ${sourceBucket}/${sourceKey} to ${destinationBucket}/${destinationKey}`,
        error,
      );
    }
  }

  async getBuffer(bucket: string, key: string): Promise<Buffer> {
    const data = await this.get(bucket, key).promise();
    if (!data.Body) {
      throw new NotFoundException(`File not found: ${key} in bucket ${bucket}`);
    }
    return data.Body as Buffer;
  }
}
