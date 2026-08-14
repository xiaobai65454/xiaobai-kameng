import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { generateOrderNo } from '@/lib/auth-middleware';
import {
  isValidPhone,
  isValidIdCard,
  isValidName,
  isValidAddress,
  isValidImageUrl,
  getClientIp,
} from '@/lib/validation';

/**
 * 用户下单接口（无需登录，通过 ref_code 关联代理）
 *
 * 对应前端 UI「填写信息页」（第二步）的提交操作。
 *
 * 请求体（Content-Type: application/json）：
 * {
 *   product_id: string,            // 必填：商品 ID
 *   customer_name: string,         // 必填：收货人姓名（2-20字）
 *   id_card: string,               // 必填：身份证号（18位，含校验码）
 *   customer_phone: string,        // 必填：收货电话（11位手机号）
 *   address: string,               // 必填：收货地址（≥5字）
 *   id_card_front_url: string,     // 必填：身份证正面照 URL
 *   id_card_back_url: string,      // 必填：身份证反面照 URL
 *   portrait_url: string,          // 必填：半身人像照 URL
 *   yztc_screenshot_url: string,   // 必填：一证通查截图 URL
 *   remark?: string,               // 可选：备注
 *   ref_code?: string,             // 可选：代理邀请码
 * }
 *
 * 响应：
 * 成功 { success: true, order_no: string, order_id: string, message: string }
 * 失败 { error: string }  + 对应 HTTP 状态码
 */
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();

    const {
      product_id,
      customer_name,
      id_card,
      customer_phone,
      address,
      id_card_front_url,
      id_card_back_url,
      portrait_url,
      yztc_screenshot_url,
      remark,
      ref_code,
    } = body;

    // ===== 必填字段校验 =====
    if (
      !product_id ||
      !customer_name ||
      !id_card ||
      !customer_phone ||
      !address
    ) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      );
    }

    // 姓名 2-20 字
    if (!isValidName(customer_name)) {
      return NextResponse.json(
        { error: '姓名长度应为2-20个字符' },
        { status: 400 }
      );
    }

    // 手机号校验
    if (!isValidPhone(customer_phone)) {
      return NextResponse.json(
        { error: '手机号格式错误' },
        { status: 400 }
      );
    }

    // 身份证号 18 位 + 校验码验证
    if (!isValidIdCard(id_card)) {
      return NextResponse.json(
        { error: '身份证号格式错误' },
        { status: 400 }
      );
    }

    // 收货地址 ≥5 字
    if (!isValidAddress(address)) {
      return NextResponse.json(
        { error: '请填写详细收货地址' },
        { status: 400 }
      );
    }

    // ===== 实名认证材料校验（4 张图片必传）=====
    if (
      !id_card_front_url ||
      !id_card_back_url ||
      !portrait_url ||
      !yztc_screenshot_url
    ) {
      return NextResponse.json(
        { error: '请上传完整的实名认证材料（身份证正反面、半身照、一证通查截图）' },
        { status: 400 }
      );
    }

    // 图片 URL 合法性校验
    const imageFields: [string, string][] = [
      ['id_card_front_url', id_card_front_url],
      ['id_card_back_url', id_card_back_url],
      ['portrait_url', portrait_url],
      ['yztc_screenshot_url', yztc_screenshot_url],
    ];
    for (const [field, url] of imageFields) {
      if (!isValidImageUrl(url)) {
        return NextResponse.json(
          { error: `${field} 图片地址无效` },
          { status: 400 }
        );
      }
    }

    // ===== 获取商品信息 =====
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('commission_amount, monthly_rent, status')
      .eq('id', product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: '商品不存在' },
        { status: 404 }
      );
    }

    if (product.status !== 'active') {
      return NextResponse.json(
        { error: '该商品已下架' },
        { status: 400 }
      );
    }

    // ===== 同一身份证 30 天内只能办一张号卡（风控查重）=====
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data: existingOrders, error: dupError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer_id_card', id_card)
      .not('status', 'in', '(cancelled)')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .limit(1);

    if (dupError) throw new Error(dupError.message);
    if (existingOrders && existingOrders.length > 0) {
      return NextResponse.json(
        { error: '该身份证 30 天内已办理过号卡，暂不能重复办理' },
        { status: 400 }
      );
    }

    // ===== 通过 ref_code 查找代理 =====
    let agentId: string | null = null;
    if (ref_code) {
      const { data: agent } = await supabase
        .from('profiles')
        .select('id, is_active')
        .eq('invite_code', ref_code)
        .maybeSingle();
      if (agent && agent.is_active !== false) {
        agentId = agent.id;
      }
    }

    // ===== 生成安全订单号并创建订单 =====
    const orderNo = generateOrderNo();
    const clientIp = getClientIp(request.headers);

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_no: orderNo,
        product_id: product_id,
        agent_id: agentId,
        commission_amount: product.commission_amount || 0,
        status: 'pending',
        source: 'online',
        order_source: 'online',
        customer_name,
        customer_phone,
        customer_id_card: id_card,
        customer_address: address,
        id_card_front_url,
        id_card_back_url,
        portrait_url,
        yztc_screenshot_url,
        submit_ip: clientIp,
        remark,
      })
      .select()
      .single();

    if (orderError) {
      console.error('Order creation error:', orderError);
      return NextResponse.json(
        { error: '订单创建失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      order_no: orderNo,
      order_id: order.id,
      message: '订单提交成功，请等待审核',
    });
  } catch (error) {
    console.error('Customer order error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
