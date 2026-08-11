import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { generateOrderNo } from '@/lib/auth-middleware';

// 用户下单接口（无需登录，通过 ref_code 关联代理）
export async function POST(request: Request) {
  try {
    const supabase = getSupabaseClient();
    const body = await request.json();
    const {
      product_id,
      customer_name,
      customer_phone,
      id_card,
      address,
      remark,
      ref_code,
    } = body;

    // 验证必填字段
    if (!product_id || !customer_name || !customer_phone || !id_card || !address) {
      return NextResponse.json(
        { error: '请填写完整信息' },
        { status: 400 }
      );
    }

    // 客户姓名 2-20 字
    if (customer_name.length < 2 || customer_name.length > 20) {
      return NextResponse.json(
        { error: '姓名长度应为2-20个字符' },
        { status: 400 }
      );
    }

    // 手机号校验
    if (!/^1[3-9]\d{9}$/.test(customer_phone)) {
      return NextResponse.json(
        { error: '手机号格式错误' },
        { status: 400 }
      );
    }

    // 身份证号 18 位校验
    if (!/^\d{17}[\dXx]$/.test(id_card)) {
      return NextResponse.json(
        { error: '身份证号格式错误' },
        { status: 400 }
      );
    }

    // 获取商品信息
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

    // 通过 ref_code 查找代理
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

    // 生成安全订单号
    const orderNo = generateOrderNo();

    // 创建订单 - 只插入 schema 中存在的字段
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
