import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

/**
 * 公开商品详情接口（无需登录，供 C 端下单流程使用）
 *
 * 与 `/api/products/[id]`（管理后台专用，需 admin 鉴权）的区别：
 * 本接口无需鉴权，且会过滤掉佣金等敏感字段，仅返回用户端展示所需的数据。
 *
 * 前端调用方：
 * - 第一步「商品详情页」读取套餐信息
 * - 第二步「填写信息页」顶部套餐摘要卡读取套餐名/月租/流量
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: '缺少商品 ID' }, { status: 400 });
    }

    const client = getSupabaseClient();
    const { data: product, error } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('status', 'active')
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!product) {
      return NextResponse.json({ error: '商品不存在或已下架' }, { status: 404 });
    }

    // 过滤敏感字段：不向前端暴露佣金金额
    const safeProduct: Record<string, unknown> = { ...(product as Record<string, unknown>) };
    delete safeProduct.commission_amount;

    return NextResponse.json({ product: safeProduct });
  } catch (error) {
    console.error('Get public product error:', error);
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 });
  }
}
