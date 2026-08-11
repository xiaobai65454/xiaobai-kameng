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

    // Whitelist allowed fields only
    const safeData: Record<string, unknown> = {};
    const allowedFields = ['name', 'level', 'commission_rate', 'min_orders', 'min_team_size', 'min_sales'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        safeData[field] = body[field];
      }
    }
    safeData.updated_at = new Date().toISOString();

    const { data, error: updateError } = await client
      .from('agent_levels')
      .update(safeData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ level: data });
  } catch (error) {
    console.error('Update level error:', error);
    return NextResponse.json({ error: '更新代理等级失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const { error: deleteError } = await client
      .from('agent_levels')
      .delete()
      .eq('id', id);
    if (deleteError) throw new Error(deleteError.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete level error:', error);
    return NextResponse.json({ error: '删除代理等级失败' }, { status: 500 });
  }
}
