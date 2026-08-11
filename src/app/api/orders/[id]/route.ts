import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-middleware';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();

    // Validate status
    const validStatuses = ['pending', 'approved', 'activated', 'shipped', 'completed', 'cancelled'];
    if (body.status && !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: '无效的订单状态' }, { status: 400 });
    }

    const { data: existingOrder, error: fetchError } = await client
      .from('orders')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!existingOrder) return NextResponse.json({ error: '订单不存在' }, { status: 404 });

    const newStatus = body.status;
    const oldStatus = existingOrder.status;

    // Update order status
    const { data: order, error: updateError } = await client
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        admin_remark: body.admin_remark || null,
        operator_order_no: body.operator_order_no || existingOrder.operator_order_no,
        phone_number: body.phone_number || existingOrder.phone_number,
        iccid: body.iccid || existingOrder.iccid,
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    // When order is completed, calculate commissions
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      await calculateCommissions(client, existingOrder);
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error('Update order error:', error);
    return NextResponse.json({ error: '更新订单失败' }, { status: 500 });
  }
}

/**
 * Calculate and distribute commissions for a completed order.
 * Walks up the agent tree up to 3 levels, applying commission rates.
 */
async function calculateCommissions(
  client: ReturnType<typeof getSupabaseClient>,
  order: { id: string; agent_id: string; commission_amount: string }
) {
  // Use commission_amount from the order, not total_amount (which doesn't exist in schema)
  const commissionBase = parseFloat(order.commission_amount || '0');
  if (commissionBase <= 0) return;

  let currentAgentId = order.agent_id;
  let level = 1;

  // Walk up the tree up to 3 levels
  while (currentAgentId && level <= 3) {
    // Get current agent's parent
    const { data: agent } = await client
      .from('profiles')
      .select('parent_id, level_id')
      .eq('id', currentAgentId)
      .maybeSingle();

    if (!agent?.parent_id) break;

    const parentId = agent.parent_id;

    // Get parent's level commission rate
    const { data: parentProfile } = await client
      .from('profiles')
      .select('level_id, agent_levels(commission_rate)')
      .eq('id', parentId)
      .maybeSingle();

    const commissionRate = parentProfile?.agent_levels
      ? parseFloat((parentProfile.agent_levels as unknown as { commission_rate: string })?.commission_rate || '0')
      : 0;

    if (commissionRate > 0) {
      // Commission is based on the order's commission_amount and the agent level's rate
      const commissionAmount = (commissionBase * commissionRate / 100).toFixed(2);

      await client.from('commissions').insert({
        order_id: order.id,
        agent_id: parentId,
        from_agent_id: order.agent_id,
        level,
        amount: commissionAmount,
        status: 'settled',
      });

      // Update parent's balance
      try {
        await client.rpc('update_agent_balance', {
          p_agent_id: parentId,
          p_amount: commissionAmount,
        });
      } catch (rpcError) {
        console.warn('update_agent_balance RPC not available:', rpcError);
      }
    }

    currentAgentId = parentId;
    level++;
  }
}
