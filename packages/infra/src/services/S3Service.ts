import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { AWSConfig, S3UploadResult } from "../types/index.js";

export class S3Service {
	private client: S3Client;
	private bucketName: string;

	constructor(config: AWSConfig = {}) {
		const region = config.region ?? process.env.APP_AWS_REGION ?? "us-east-1";
		this.bucketName =
			config.bucketName ?? process.env.STORAGE_BUCKET_NAME ?? "";

		if (!this.bucketName) {
			throw new Error(
				"S3 bucket name is required. Set STORAGE_BUCKET_NAME environment variable.",
			);
		}

		this.client = new S3Client({ region });
	}

	/**
	 * Converts base64 image data to Uint8Array
	 */
	private base64ToBuffer(base64Data: string): Uint8Array {
		// Remove data URL prefix if present
		let cleanBase64 = base64Data;
		if (base64Data.startsWith("data:")) {
			const matches = base64Data.match(/^data:image\/[a-z]+;base64,(.+)$/);
			if (matches) {
				cleanBase64 = matches[1];
			}
		}

		// Convert base64 to binary string, then to Uint8Array
		const binaryString = atob(cleanBase64);
		const bytes = new Uint8Array(binaryString.length);
		for (let i = 0; i < binaryString.length; i++) {
			bytes[i] = binaryString.charCodeAt(i);
		}
		return bytes;
	}

	/**
	 * Uploads image to S3 bucket with specified path format
	 */
	async uploadImage(
		imageBase64: string,
		imageFormat: string,
		type: "input" | "output",
	): Promise<S3UploadResult> {
		try {
			const imageBuffer = this.base64ToBuffer(imageBase64);

			const now = new Date();
			const date = now.toISOString().split("T")[0]; // YYYY-MM-DD format
			const timestamp = now.toISOString().replace(/[:.]/g, "-"); // ISO timestamp with safe characters

			// Create path in format: /{date}/input_{timestamp} or /{date}/output_{timestamp}
			const key = `${date}/${type}_${timestamp}.${imageFormat}`;

			const command = new PutObjectCommand({
				Bucket: this.bucketName,
				Key: key,
				Body: imageBuffer,
				ContentType: `image/${imageFormat}`,
			});

			await this.client.send(command);

			return { success: true, key };
		} catch (error) {
			console.error(`Failed to upload ${type} image to S3:`, error);
			return {
				success: false,
				error: `Failed to upload ${type} image to storage`,
			};
		}
	}

	/**
	 * Get the configured bucket name
	 */
	getBucketName(): string {
		return this.bucketName;
	}
}
