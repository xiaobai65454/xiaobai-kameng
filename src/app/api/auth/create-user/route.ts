import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseCredentials, getSupabaseServiceRoleKey } from '@/storage/database/supabase-client';
import { requireAdmin } from '@/lib/auth-middleware';

export async function POST(req: NextRequest) {
  try {
    // Only admins can create users directly
    const { client, error: authError } = await requireAdmin(req);
    if (authError) return authError;

    const body = await req.json();
    const { email, password, name, role } = body;

    if (!email || !password || !name) {
      return NextResponse.json({ error: '请填写完整信息' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: '密码至少6位' }, { status: 400 });
    }

    // Validate role - only allow safe roles
    const safeRole = ['agent', 'channel'].includes(role) ? role : 'agent';

    // Use service role key to create user (admin operation)
    const { url } = getSupabaseCredentials();
    const serviceRoleKey = getSupabaseServiceRoleKey();

    if (!serviceRoleKey) {
      return NextResponse.json({ error: 'Service role key not configured' }, { status: 500 });
    }

    const supabaseAdmin = createClient(url, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Create user in Supabase Auth
    const { data: authData, error: authCreateError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (authCreateError) {
      console.error('Auth create user error:', authCreateError);
      return NextResponse.json({ error: authCreateError.message }, { status: 400 });
    }

    // Generate cryptographically secure invite code
    const { randomBytes } = require('crypto');
    const inviteCode = randomBytes(4).toString('hex').toUpperCase();

    // Create profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email,
        name,
        role: safeRole,
        invite_code: inviteCode,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Create profile error:', profileError);
      // Clean up auth user on failure
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      profile,
      message: '用户创建成功',
    });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}
