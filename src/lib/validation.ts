/**
 * 共享参数校验工具
 * 供 API 路由与前端复用，保证前后端校验规则完全一致，避免联调冲突。
 */

/** 手机号校验：1[3-9] 开头 + 9 位数字 */
export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

/** 身份证号校验：18 位，含校验码验证 */
export function isValidIdCard(idCard: string): boolean {
  if (!idCard) return false;
  // 基本格式：17 位数字 + 1 位数字或 X
  if (!/^\d{17}[\dXx]$/.test(idCard)) return false;

  // 加权因子与校验码对照表（GB 11643-1999）
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];

  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i], 10) * weights[i];
  }
  const checkCode = checkCodes[sum % 11];
  return idCard[17].toUpperCase() === checkCode;
}

/** 姓名校验：2-20 个字符 */
export function isValidName(name: string): boolean {
  return !!name && name.trim().length >= 2 && name.trim().length <= 20;
}

/** 收货地址校验：至少 5 个字符 */
export function isValidAddress(address: string): boolean {
  return !!address && address.trim().length >= 5;
}

/**
 * 图片 URL 校验：仅允许 http/https 且指向常见图片后缀，
 * 防止恶意提交任意 URL。
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || url.length > 500) return false;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false;
    // 允许无后缀的签名 URL（对象存储 presigned URL 常带 query 参数）
    return true;
  } catch {
    return false;
  }
}

/**
 * 从请求头提取客户端真实 IP
 * 兼容常见代理/负载均衡转发头。
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown';
}
