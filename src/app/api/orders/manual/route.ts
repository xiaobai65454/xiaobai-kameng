import { NextRequest, NextResponse } from 'next/server';
import { authenticate, generateOrderNo } from '@/lib/auth-middleware';

// POST /api/orders/manual - 手动报单
export async function POST(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const agentId = user!.id;
    const body = await req.json();

    // Validate required fields
    if (!body.product_id) return NextResponse.json({ error: '请选择套餐' }, { status: 400 });
    if (!body.customer_name || body.customer_name.length < 2 || body.customer_name.length > 20) {
      return NextResponse.json({ error: '客户姓名需为2-20个字符' }, { status: 400 });
    }
    if (!body.customer_phone || !/^1[3-9]\d{9}$/.test(body.customer_phone)) {
      return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 });
    }
    if (!body.handling_method) {
      return NextResponse.json({ error: '请选择办理方式' }, { status: 400 });
    }

    // Look up product to get commission amount
    const { data: product, error: productError } = await client
      .from('products')
      .select('commission_amount')
      .eq('id', body.product_id)
      .single();
    if (productError) {
      return NextResponse.json({ error: '商品不存在' }, { status: 400 });
    }

    // Generate secure order number
    const orderNo = generateOrderNo();

    const { data: order, error: insertError } = await client
      .from('orders')
      .insert({
        order_no: orderNo,
        agent_id: agentId,
        product_id: body.product_id,
        commission_amount: product.commission_amount || 0,
        status: 'pending',
        source: 'manual',
        order_source: 'manual',
        customer_name: body.customer_name,
        customer_phone: body.customer_phone,
        customer_id_card: body.customer_id_card || null,
        customer_address: body.customer_address || null,
        selected_number: body.selected_number || null,
        new_phone_number: body.new_phone_number || null,
        handling_method: body.handling_method,
        handling_other: body.handling_other || null,
        evidence_images: body.evidence_images || null,
        remark: body.remark || null,
      })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    // Batch insert notification messages to all admins
    try {
      const { data: admins } = await client.from('profiles').select('id').eq('role', 'admin');
      if (admins && admins.length > 0) {
        const messages = admins.map((admin: { id: string }) => ({
          user_id: admin.id,
          type: 'order',
          title: '新手动报单',
          content: `代理提交了手动报单：${body.customer_name}，${body.customer_phone}`,
          related_order_id: order.id,
        }));
        await client.from('messages').insert(messages);
      }
    } catch (msgError) {
      console.warn('Failed to send admin notification:', msgError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create manual order error:', error);
    return NextResponse.json({ error: '创建手动报单失败' }, { status: 500 });
  }
}
