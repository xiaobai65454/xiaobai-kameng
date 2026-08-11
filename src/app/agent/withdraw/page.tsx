'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { Wallet, Plus } from 'lucide-react';

interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  remark: string | null;
  admin_remark: string | null;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  completed: { label: '已打款', color: 'bg-green-100 text-green-700' },
};

export default function WithdrawPage() {
  const { profile, session, refreshProfile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [remark, setRemark] = useState('');
  const [error, setError] = useState('');

  const fetchWithdrawals = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/withdrawals', {
        headers: { 'x-session': session.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      }
    } catch (err) {
      console.error('Failed to fetch withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [session]);

  const handleSubmit = async () => {
    setError('');
    if (!session) return;
    if (!amount || parseFloat(amount) <= 0) {
      setError('请输入有效的提现金额');
      return;
    }
    if (parseFloat(amount) > parseFloat(profile?.balance || '0')) {
      setError('提现金额不能超过可用余额');
      return;
    }

    try {
      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-session': session.access_token,
        },
        body: JSON.stringify({ amount, remark }),
      });
      if (res.ok) {
        setDialogOpen(false);
        setAmount('');
        setRemark('');
        fetchWithdrawals();
        refreshProfile();
      } else {
        const data = await res.json();
        setError(data.error || '提现失败');
      }
    } catch (err) {
      setError('提现失败');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">提现管理</h1>
          <p className="text-slate-500 mt-1">管理佣金提现申请</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          申请提现
        </Button>
      </div>

      {/* Balance card */}
      <Card className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-green-200" />
            <div>
              <p className="text-green-200 text-sm">可用余额</p>
              <p className="text-3xl font-bold">¥{parseFloat(profile?.balance || '0').toFixed(2)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>提现记录</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-right py-3 px-4 font-medium text-slate-500">金额</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">备注</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 text-right font-mono font-medium">¥{parseFloat(w.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[w.status]?.color || ''}`}>
                          {STATUS_MAP[w.status]?.label || w.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">{w.admin_remark || w.remark || '-'}</td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(w.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400">暂无提现记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {dialogOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDialogOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">申请提现</h3>
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-500">可用余额</p>
                <p className="text-xl font-bold text-green-600">¥{parseFloat(profile?.balance || '0').toFixed(2)}</p>
              </div>
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>
              )}
              <div className="space-y-2">
                <Label>提现金额</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="请输入提现金额"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Input
                  placeholder="可选备注"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSubmit} className="flex-1">提交申请</Button>
                <Button variant="outline" onClick={() => { setDialogOpen(false); setError(''); }}>取消</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
