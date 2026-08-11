import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  name: string;
  profile: Record<string, unknown>;
}

export interface AuthResult {
  user: AuthUser | null;
  client: SupabaseClient;
  error: NextResponse | null;
}

/**
 * Unified authentication middleware for all API routes.
 * Extracts token from `x-session` header, verifies with Supabase, fetches profile.
 *
 * @param req - NextRequest object
 * @param options.requireAuth - If true, returns 401 when not authenticated (default: true)
 * @param options.requireRole - If set, returns 403 when role doesn't match (e.g. 'admin')
 * @returns AuthResult with user info, supabase client, and error response if any
 */
export async function authenticate(
  req: NextRequest,
  options: {
    requireAuth?: boolean;
    requireRole?: 'admin' | 'agent' | 'channel';
  } = {}
): Promise<AuthResult> {
  const { requireAuth = true, requireRole } = options;
  const token = req.headers.get('x-session');
  const client = getSupabaseClient();

  // No token provided
  if (!token) {
    if (requireAuth) {
      return {
        user: null,
        client,
        error: NextResponse.json({ error: '请先登录' }, { status: 401 }),
      };
    }
    return { user: null, client, error: null };
  }

  // Verify token with Supabase
  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) {
    if (requireAuth) {
      return {
        user: null,
        client,
        error: NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 }),
      };
    }
    return { user: null, client, error: null };
  }

  // Fetch profile
  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    if (requireAuth) {
      return {
        user: null,
        client,
        error: NextResponse.json({ error: '用户档案不存在' }, { status: 403 }),
      };
    }
    return { user: null, client, error: null };
  }

  // Check if user is active
  if (profile.is_active === false) {
    return {
      user: null,
      client,
      error: NextResponse.json({ error: '账号已被停用' }, { status: 403 }),
    };
  }

  // Check role requirement
  if (requireRole && profile.role !== requireRole) {
    return {
      user: null,
      client,
      error: NextResponse.json({ error: '权限不足' }, { status: 403 }),
    };
  }

  return {
    user: {
      id: authData.user.id,
      email: profile.email,
      role: profile.role,
      name: profile.name,
      profile,
    },
    client,
    error: null,
  };
}

/**
 * Check if a user is an admin.
 * Convenience wrapper around authenticate with requireRole: 'admin'.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthResult> {
  return authenticate(req, { requireAuth: true, requireRole: 'admin' });
}

/**
 * Generate a cryptographically secure order number.
 * Format: ORD + timestamp + 6 random hex chars
 */
export function generateOrderNo(): string {
  const { randomBytes } = require('crypto');
  const ts = Date.now().toString(36).toUpperCase();
  const rand = randomBytes(3).toString('hex').toUpperCase();
  return `ORD${ts}${rand}`;
}

/**
 * Clamp pagination parameters to safe bounds.
 */
export function clampPagination(page: unknown, pageSize: unknown) {
  const p = Math.max(1, parseInt(String(page || '1')) || 1);
  const ps = Math.min(100, Math.max(1, parseInt(String(pageSize || '20')) || 20));
  return { page: p, pageSize: ps };
}
