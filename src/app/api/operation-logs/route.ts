import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
  try {
    const { client, error } = await requireAdmin(request);
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get('limit') || '50')));

    const { data, error: queryError } = await client
      .from('operation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get operation logs error:', error);
    return NextResponse.json({ error: '获取操作日志失败' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, client, error } = await requireAdmin(request);
    if (error) return error;

    const body = await request.json();

    // Whitelist allowed fields
    const safeData: Record<string, unknown> = {
      user_id: user!.id,
      user_name: user!.name,
      action: body.action,
      module: body.module || null,
      detail: body.detail || null,
      ip: request.headers.get('x-forwarded-for') || null,
    };

    if (!safeData.action) {
      return NextResponse.json({ error: '请提供操作类型' }, { status: 400 });
    }

    const { data, error: insertError } = await client
      .from('operation_logs')
      .insert(safeData)
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Create operation log error:', error);
    return NextResponse.json({ error: '记录操作日志失败' }, { status: 500 });
  }
}
