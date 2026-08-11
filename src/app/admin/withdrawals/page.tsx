'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CheckCircle, XCircle, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Withdrawal {
  id: string;
  amount: string;
  status: string;
  remark: string | null;
  admin_remark: string | null;
  created_at: string;
  profiles: { name: string; email: string };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已通过', color: 'bg-blue-100 text-blue-700' },
  rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  completed: { label: '已打款', color: 'bg-green-100 text-green-700' },
};

export default function WithdrawalsPage() {
  const { session } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Withdrawal | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminRemark, setAdminRemark] = useState('');

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

  const handleUpdate = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`/api/withdrawals/${selected.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, admin_remark: adminRemark }),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchWithdrawals();
      }
    } catch (err) {
      console.error('Failed to update withdrawal:', err);
    }
  };

  const openDialog = (withdrawal: Withdrawal) => {
    setSelected(withdrawal);
    setNewStatus(withdrawal.status);
    setAdminRemark(withdrawal.admin_remark || '');
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">提现管理</h1>
        <p className="text-slate-500 mt-1">审核代理的提现申请</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">代理</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">提现金额</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">申请时间</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((w) => (
                    <tr key={w.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{w.profiles?.name || '-'}</p>
                          <p className="text-xs text-slate-500">{w.profiles?.email || ''}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium">¥{parseFloat(w.amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[w.status]?.color || ''}`}>
                          {STATUS_MAP[w.status]?.label || w.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(w.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => openDialog(w)}>
                          <Eye className="h-4 w-4 mr-1" />
                          处理
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">暂无提现申请</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>提现审核</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">代理：</span>
                  <span>{selected.profiles?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">金额：</span>
                  <span className="font-mono font-medium">¥{parseFloat(selected.amount).toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500">申请时间：</span>
                  <span>{new Date(selected.created_at).toLocaleString('zh-CN')}</span>
                </div>
                <div>
                  <span className="text-slate-500">备注：</span>
                  <span>{selected.remark || '无'}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>审核状态</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已拒绝</option>
                  <option value="completed">已打款</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>管理员备注</Label>
                <Input value={adminRemark} onChange={(e) => setAdminRemark(e.target.value)} placeholder="可选备注" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleUpdate} className="flex-1">确认</Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
