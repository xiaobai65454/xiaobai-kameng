import { NextRequest, NextResponse } from 'next/server';
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
    if (!body.status || !['approved', 'rejected', 'completed'].includes(body.status)) {
      return NextResponse.json({ error: '无效的状态' }, { status: 400 });
    }

    const { data: existing, error: fetchError } = await client
      .from('withdrawals')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (fetchError) throw new Error(fetchError.message);
    if (!existing) return NextResponse.json({ error: '提现记录不存在' }, { status: 404 });

    // Only pending withdrawals can be updated
    if (existing.status !== 'pending') {
      return NextResponse.json({ error: '该提现记录已处理' }, { status: 400 });
    }

    const { data, error: updateError } = await client
      .from('withdrawals')
      .update({
        status: body.status,
        admin_remark: body.admin_remark || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    // If rejected, refund the balance
    if (body.status === 'rejected') {
      const { error: refundError } = await client.rpc('update_agent_balance', {
        p_agent_id: existing.agent_id,
        p_amount: existing.amount,
      });
      if (refundError) {
        console.error('Failed to refund balance for rejected withdrawal:', refundError);
        // Still return success for the update, but log the refund failure
      }
    }

    return NextResponse.json({ withdrawal: data });
  } catch (error) {
    console.error('Update withdrawal error:', error);
    return NextResponse.json({ error: '更新提现状态失败' }, { status: 500 });
  }
}
