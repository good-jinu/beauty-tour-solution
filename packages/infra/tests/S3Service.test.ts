import { beforeAll, describe, expect, it } from "vitest";
import { S3Service } from "../src/services/S3Service";

describe("S3Service", () => {
	let s3Service: S3Service;
	const bucketName = "test-bucket";

	beforeAll(() => {
		process.env.STORAGE_BUCKET_NAME = bucketName;
		process.env.APP_AWS_REGION = "us-east-1";

		s3Service = new S3Service({
			region: "us-east-1",
			bucketName,
		});
	});

	it("should return the correct public URL for an S3 object", async () => {
		const key = "test-key";
		const expectedUrl = `https://${bucketName}.s3.us-east-1.amazonaws.com/${key}`;
		const publicUrl = await s3Service.getPublicUrl(key);
		expect(publicUrl).toBe(expectedUrl);
	});
});
