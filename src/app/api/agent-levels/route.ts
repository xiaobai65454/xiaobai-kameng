import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('agent_levels')
      .select('*')
      .order('level', { ascending: true });
    if (error) throw new Error(error.message);

    return NextResponse.json({ levels: data });
  } catch (error) {
    console.error('Get levels error:', error);
    return NextResponse.json({ error: '获取代理等级失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();

    // Whitelist allowed fields only
    const safeData: Record<string, unknown> = {
      name: body.name,
      level: body.level,
      commission_rate: body.commission_rate || '0',
      min_orders: body.min_orders || 0,
      min_team_size: body.min_team_size || 0,
      min_sales: body.min_sales || '0',
    };

    if (!safeData.name) {
      return NextResponse.json({ error: '请输入等级名称' }, { status: 400 });
    }

    const { data, error: insertError } = await client
      .from('agent_levels')
      .insert(safeData)
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ level: data });
  } catch (error) {
    console.error('Create level error:', error);
    return NextResponse.json({ error: '创建代理等级失败' }, { status: 500 });
  }
}
