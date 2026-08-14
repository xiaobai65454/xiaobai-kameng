import { NextRequest, NextResponse } from 'next/server';
import { S3Storage } from 'coze-coding-dev-sdk';

/**
 * 公开图片上传接口（无需登录）
 * 供 C 端用户在「填写信息页」下单前上传实名认证材料：
 *  - 身份证正面 / 反面
 *  - 半身人像照
 *  - 一证通查截图
 *
 * 与 `/api/upload`（后台商品图上传，需鉴权）的区别：
 * 本接口面向未登录的 C 端用户，因此不要求登录态，但通过以下措施控制风险：
 *  - 严格限制文件类型（仅 JPG/PNG/WebP）
 *  - 限制文件大小（单张 ≤ 5MB）
 *  - 使用随机文件名，杜绝路径穿越
 *  - 独立的存储目录 order-materials/，与后台资源隔离
 */

// Use environment variables for S3 credentials
const storage = new S3Storage({
  endpointUrl: process.env.COZE_BUCKET_ENDPOINT_URL,
  accessKey: process.env.COZE_BUCKET_ACCESS_KEY || '',
  secretKey: process.env.COZE_BUCKET_SECRET_KEY || '',
  bucketName: process.env.COZE_BUCKET_NAME,
  region: 'cn-beijing',
});

// 允许的图片类型
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
// 允许的扩展名
const ALLOWED_EXTS = ['jpg', 'jpeg', 'png', 'webp'];
// 单张最大 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// 允许的分类目录（对应前端上传框）
const ALLOWED_CATEGORIES = [
  'id_card_front',
  'id_card_back',
  'portrait',
  'yztc_screenshot',
];

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string) || 'general';

    if (!file) {
      return NextResponse.json({ error: '请选择要上传的图片' }, { status: 400 });
    }

    // 校验分类目录（防路径穿越）
    const safeCategory = ALLOWED_CATEGORIES.includes(category) ? category : 'general';

    // 校验文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: '仅支持 JPG、PNG、WebP 格式的图片' },
        { status: 400 }
      );
    }

    // 校验文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: '图片大小不能超过 5MB' },
        { status: 400 }
      );
    }

    // 校验扩展名
    const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : 'jpg';

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 生成安全随机文件名
    const { randomBytes } = require('crypto');
    const fileName = `order-materials/${safeCategory}/${Date.now()}-${randomBytes(6).toString('hex')}.${ext}`;

    // 上传文件
    const key = await storage.uploadFile({
      fileContent: buffer,
      fileName,
      contentType: file.type,
    });

    // 生成签名 URL（有效期 30 天，覆盖订单审核周期）
    const url = await storage.generatePresignedUrl({
      key,
      expireTime: 30 * 24 * 60 * 60,
    });

    return NextResponse.json({
      key,
      url,
      category: safeCategory,
    });
  } catch (error) {
    console.error('Public upload error:', error);
    return NextResponse.json({ error: '上传失败，请重试' }, { status: 500 });
  }
}
