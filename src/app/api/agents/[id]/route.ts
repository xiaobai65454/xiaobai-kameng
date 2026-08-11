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

    // Whitelist allowed fields only - prevent role escalation
    const safeData: Record<string, unknown> = {};
    const allowedFields = ['name', 'phone', 'level_id', 'parent_id', 'is_active'];
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        safeData[field] = body[field];
      }
    }
    safeData.updated_at = new Date().toISOString();

    // Only allow role change if explicitly set and is a valid role
    if (body.role !== undefined && ['agent', 'channel'].includes(body.role)) {
      safeData.role = body.role;
    }

    const { data, error: updateError } = await client
      .from('profiles')
      .update(safeData)
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Update agent error:', error);
    return NextResponse.json({ error: '更新代理信息失败' }, { status: 500 });
  }
}
