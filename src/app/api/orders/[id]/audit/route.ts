import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

// POST /api/orders/[id]/audit - 手动报单审核 (admin only)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { user, client, error } = await requireAdmin(req);
    if (error) return error;

    const adminUserId = user!.id;
    const body = await req.json();
    const { action, reason } = body; // action: 'approve' | 'reject'

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: '无效的操作' }, { status: 400 });
    }

    // Get order
    const { data: order, error: orderError } = await client
      .from('orders')
      .select('*, profiles(name)')
      .eq('id', id)
      .single();
    if (orderError || !order) return NextResponse.json({ error: '订单不存在' }, { status: 404 });

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '订单当前状态不允许审核' }, { status: 400 });
    }

    const newStatus = action === 'approve' ? 'approved' : 'cancelled';

    const { data: updatedOrder, error: updateError } = await client
      .from('orders')
      .update({
        status: newStatus,
        audit_reason: reason || null,
        audit_time: new Date().toISOString(),
        audit_by: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    // Send notification to agent
    try {
      const { data: agent } = await client.from('profiles').select('id, name').eq('id', order.agent_id).single();
      if (agent) {
        await client.from('messages').insert({
          user_id: agent.id,
          type: 'order',
          title: action === 'approve' ? '报单审核通过' : '报单被驳回',
          content: action === 'approve'
            ? `您的手动报单 ${order.order_no} 已审核通过`
            : `您的手动报单 ${order.order_no} 被驳回，原因：${reason || '无'}`,
          related_order_id: order.id,
        });
      }
    } catch (msgError) {
      console.warn('Failed to send agent notification:', msgError);
    }

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('Audit order error:', error);
    return NextResponse.json({ error: '审核失败' }, { status: 500 });
  }
}
