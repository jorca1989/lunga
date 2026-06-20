import { action } from "./_generated/server";
import { v } from "convex/values";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const R2_BUCKET = "complains";
const R2_PUBLIC_URL = "https://pub-2e19cd5eed3b430fbd424824137b6bde.r2.dev";

export const uploadMedia = action({
  args: {
    base64Str: v.string(),
  },
  handler: async (ctx, args) => {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "Missing Cloudflare R2 credentials (CLOUDFLARE_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY) in Convex environment configuration."
      );
    }

    let mimeType = "image/jpeg";
    let base64Data = args.base64Str;

    // Detect mime type and base64 header
    const match = args.base64Str.match(/^data:(.*?);base64,(.*)$/);
    if (match) {
      mimeType = match[1];
      base64Data = match[2];
    }

    const buffer = Buffer.from(base64Data, "base64");

    const s3 = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const extension = mimeType.split("/")[1] || "jpg";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}.${extension}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: filename,
        Body: buffer,
        ContentType: mimeType,
      })
    );

    return `${R2_PUBLIC_URL}/${filename}`;
  },
});
