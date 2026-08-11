import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticate, clampPagination, generateOrderNo } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const isAdmin = user?.role === 'admin';
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));
    const status = searchParams.get('status');
    const source = searchParams.get('source');
    const agentId = searchParams.get('agent_id');
    const keyword = searchParams.get('keyword');

    let query = client
      .from('orders')
      .select('*, products(name, monthly_rent, operator), profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Non-admin users can only see their own orders
    if (!isAdmin && user) {
      query = query.eq('agent_id', user.id);
    } else if (agentId && isAdmin) {
      query = query.eq('agent_id', agentId);
    }
    if (status) query = query.eq('status', status);
    if (source) query = query.eq('source', source);
    if (keyword) {
      query = query.or(`order_no.ilike.%${keyword}%,customer_name.ilike.%${keyword}%,customer_phone.ilike.%${keyword}%`);
    }

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ orders: data, total: count });
  } catch (error) {
    console.error('Get orders error:', error);
    return NextResponse.json({ error: '获取订单列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const body = await req.json();

    // Always use the authenticated user's ID, never trust client-sent agent_id
    const agentId = user!.id;
    const isAdmin = user!.role === 'admin';

    // If admin is creating order for a specific agent, allow it
    const targetAgentId = isAdmin && body.agent_id ? body.agent_id : agentId;

    // Generate secure order number
    const orderNo = generateOrderNo();

    // Look up product to get commission amount
    const { data: product, error: productError } = await client
      .from('products')
      .select('commission_amount, monthly_rent')
      .eq('id', body.product_id)
      .single();
    if (productError) {
      return NextResponse.json({ error: '商品不存在' }, { status: 400 });
    }

    const commissionAmount = product.commission_amount || 0;

    const { data: order, error: insertError } = await client
      .from('orders')
      .insert({
        order_no: orderNo,
        agent_id: targetAgentId,
        product_id: body.product_id,
        commission_amount: commissionAmount,
        status: 'pending',
        source: body.source || 'online',
        order_source: body.source || 'online',
        customer_name: body.customer_name || null,
        customer_phone: body.customer_phone || null,
        customer_id_card: body.customer_id_card || null,
        customer_address: body.customer_address || null,
        selected_number: body.selected_number || null,
        new_phone_number: body.new_phone_number || null,
        remark: body.remark || null,
      })
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    // Update agent stats
    try {
      await client.rpc('update_agent_order_stats', {
        p_agent_id: targetAgentId,
        p_amount: commissionAmount,
      });
    } catch (rpcError) {
      console.warn('update_agent_order_stats RPC not available:', rpcError);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Create order error:', error);
    return NextResponse.json({ error: '创建订单失败' }, { status: 500 });
  }
}
