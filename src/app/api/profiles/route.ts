import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const { data: profile, error: queryError } = await client
      .from('profiles')
      .select('*')
      .eq('id', user!.id)
      .maybeSingle();
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // POST /api/profiles is called right after signUp with the session token.
    // We authenticate to ensure only the newly registered user can create their own profile.
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const body = await req.json();

    // Security: the profile ID must match the authenticated user ID
    if (body.id !== user!.id) {
      return NextResponse.json({ error: '无权为其他用户创建档案' }, { status: 403 });
    }

    // Whitelist allowed fields only
    const safeData: Record<string, unknown> = {
      id: body.id,
      email: body.email,
      name: body.name,
      role: 'agent', // Force role to 'agent', never trust client-sent role
      invite_code: body.invite_code,
      parent_id: body.parent_id || null,
      level_id: body.level_id || null,
    };

    const { data, error: insertError } = await client
      .from('profiles')
      .insert(safeData)
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    // If has parent, update parent's team_count
    if (safeData.parent_id) {
      try {
        await client.rpc('increment_team_count', { p_parent_id: safeData.parent_id as string });
      } catch (rpcError) {
        console.warn('increment_team_count RPC not available:', rpcError);
      }
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error('Create profile error:', error);
    return NextResponse.json({ error: '创建用户档案失败' }, { status: 500 });
  }
}
