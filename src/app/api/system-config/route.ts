import { NextRequest, NextResponse } from 'next/server';
import { authenticate, requireAdmin } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    // Any authenticated user can read system config (non-sensitive)
    const { client, error } = await authenticate(req);
    if (error) return error;

    const { data, error: queryError } = await client
      .from('system_config')
      .select('*')
      .order('config_key');

    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Get system config error:', error);
    return NextResponse.json({ error: '获取系统配置失败' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Only admins can modify system config
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: '请提供配置项和值' }, { status: 400 });
    }

    const { data: existing } = await client
      .from('system_config')
      .select('id')
      .eq('config_key', key)
      .maybeSingle();

    let result;
    if (existing) {
      result = await client
        .from('system_config')
        .update({ config_value: String(value), updated_at: new Date().toISOString() })
        .eq('config_key', key);
    } else {
      result = await client
        .from('system_config')
        .insert({ config_key: key, config_value: String(value) });
    }

    if (result.error) throw new Error(result.error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update system config error:', error);
    return NextResponse.json({ error: '更新系统配置失败' }, { status: 500 });
  }
}
