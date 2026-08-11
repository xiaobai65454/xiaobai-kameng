import { NextRequest, NextResponse } from 'next/server';
import { authenticate, clampPagination } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const isAdmin = user?.role === 'admin';
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));
    const status = searchParams.get('status');

    let query = client
      .from('withdrawals')
      .select('*, profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Non-admin users can only see their own withdrawals
    if (!isAdmin && user) {
      query = query.eq('agent_id', user.id);
    }
    if (status) query = query.eq('status', status);

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ withdrawals: data, total: count });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    return NextResponse.json({ error: '获取提现记录失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const body = await req.json();
    const userId = user!.id;

    // Validate amount
    const amount = parseFloat(body.amount);
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: '提现金额无效' }, { status: 400 });
    }
    if (amount > 1000000) {
      return NextResponse.json({ error: '单笔提现金额不能超过100万' }, { status: 400 });
    }

    // Use RPC to atomically check balance and deduct, preventing race conditions
    // The RPC should: 1) lock the row, 2) check balance >= amount, 3) deduct if sufficient, 4) return status
    const { data: rpcResult, error: rpcError } = await client.rpc('create_withdrawal_safe', {
      p_agent_id: userId,
      p_amount: amount.toString(),
      p_remark: body.remark || null,
    });

    if (rpcError) {
      // If RPC doesn't exist, fall back to non-atomic approach with better checks
      console.warn('create_withdrawal_safe RPC not available, using fallback:', rpcError.message);

      // Check balance
      const { data: profile } = await client
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .maybeSingle();

      if (!profile || parseFloat(profile.balance) < amount) {
        return NextResponse.json({ error: '余额不足' }, { status: 400 });
      }

      // Create withdrawal record
      const { data: withdrawal, error: insertError } = await client
        .from('withdrawals')
        .insert({
          agent_id: userId,
          amount: amount.toString(),
          status: 'pending',
          remark: body.remark || null,
        })
        .select()
        .single();
      if (insertError) throw new Error(insertError.message);

      // Deduct balance immediately (frozen)
      const { error: deductError } = await client.rpc('update_agent_balance', {
        p_agent_id: userId,
        p_amount: `-${amount}`,
      });
      if (deductError) {
        // If deduction fails, delete the withdrawal record
        await client.from('withdrawals').delete().eq('id', withdrawal.id);
        return NextResponse.json({ error: '余额扣减失败，请重试' }, { status: 500 });
      }

      return NextResponse.json({ withdrawal });
    }

    // RPC succeeded
    if (rpcResult && rpcResult.success === false) {
      return NextResponse.json({ error: rpcResult.message || '余额不足' }, { status: 400 });
    }

    return NextResponse.json({ withdrawal: rpcResult });
  } catch (error) {
    console.error('Create withdrawal error:', error);
    return NextResponse.json({ error: '提现申请失败' }, { status: 500 });
  }
}
