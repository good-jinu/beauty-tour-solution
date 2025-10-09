# @bts/infra

Infrastructure package for Beauty Tour Solution that provides AWS service abstractions.

## Overview

This package contains AWS service wrappers and utilities used by the core business logic. It abstracts away AWS SDK complexity and provides a clean interface for:

- S3 storage operations
- Bedrock AI image generation
- Environment-based configuration

## Services

### S3Service

Handles image storage operations with automatic path generation.

**Features:**
- Automatic date-based folder structure (`/{date}/input_{timestamp}` and `/{date}/output_{timestamp}`)
- Base64 to binary conversion
- Environment variable configuration
- Error handling and logging

### BedrockService

Manages AI image generation using AWS Bedrock.

**Features:**
- Theme-based prompt generation
- Image validation and preprocessing
- Error handling for AWS-specific exceptions
- Configurable model parameters

## Environment Variables

- `AWS_REGION`: AWS region (default: "us-east-1")
- `STORAGE_BUCKET_NAME`: S3 bucket name for image storage

## Usage

```typescript
import { S3Service, BedrockService } from "@bts/infra";

// Initialize services
const s3Service = new S3Service({
  region: "us-east-1",
  bucketName: "my-bucket"
});

const bedrockService = new BedrockService({
  region: "us-east-1",
  modelId: "amazon.titan-image-generator-v2:0"
});

// Upload image
const result = await s3Service.uploadImage(
  base64Image,
  "jpeg",
  "input"
);

// Generate image
const generated = await bedrockService.generateImage({
  image: base64Image,
  theme: "makeup",
  imageFormat: "jpeg"
});
```

## Architecture

This package is designed to be used by `@bts/core` and provides the infrastructure layer for the Beauty Tour Solution application.

```
@bts/web → @bts/core → @bts/infra → AWS Services
```