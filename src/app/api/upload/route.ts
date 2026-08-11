import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';
import { authenticate } from '@/lib/auth-middleware';

// Use environment variables for S3 credentials instead of hardcoded empty strings
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: process.env.COZE_BUCKET_ACCESS_KEY || '',
  secretKey: process.env.COZE_BUCKET_SECRET_KEY || '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

export async function POST(request: NextRequest) {
  try {
    // Require authentication for file uploads
    const { error } = await authenticate(request);
    if (error) return error;

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的文件' }, { status: 400 });
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: '只支持 JPG、PNG、GIF、WebP 格式的图片' }, { status: 400 });
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ error: '图片大小不能超过 5MB' }, { status: 400 });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成安全文件名（使用 crypto 避免冲突）
    const { randomBytes } = require('crypto');
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `products/${Date.now()}-${randomBytes(4).toString('hex')}.${ext}`;

    // 上传文件
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期 30 天）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({ key, url });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 });
  }
}
