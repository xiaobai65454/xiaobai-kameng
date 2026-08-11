'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import * as XLSX from 'xlsx';
import { Wallet, Receipt, ArrowUpDown, Download, Check, X, Eye } from 'lucide-react';

const withdrawalStatusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待审核', className: 'bg-[#fff7e6] text-[#fa8c16]' },
  approved: { label: '已通过', className: 'bg-[#f6ffed] text-[#52c41a]' },
  rejected: { label: '已拒绝', className: 'bg-[#fff2f0] text-[#f5222d]' },
  completed: { label: '已完成', className: 'bg-[#f0f9ff] text-[#1890ff]' },
};

export default function FinancePage() {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'commissions' | 'withdrawals'>('commissions');
  const [commissions, setCommissions] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailOpen, setDetailOpen] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      if (activeTab === 'commissions') {
        const res = await fetch('/api/commissions', { headers });
        if (res.ok) {
          const data = await res.json();
          setCommissions(data.data || data.commissions || []);
        }
      } else {
        const res = await fetch('/api/withdrawals', { headers });
        if (res.ok) {
          const data = await res.json();
          setWithdrawals(data.data || data.withdrawals || []);
        }
      }
    } catch (err) {
      console.error('加载数据失败', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawAction = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/withdrawals/${id}`, {
        method: 'PUT',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        toast({ title: status === 'approved' ? '已通过' : '已拒绝' });
        loadData();
      } else {
        toast({ title: '操作失败', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: '操作失败', variant: 'destructive' });
    }
  };

  const handleExport = () => {
    const data = activeTab === 'commissions' ? commissions : withdrawals;
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, activeTab === 'commissions' ? '佣金记录' : '提现记录');
    XLSX.writeFile(wb, `${activeTab === 'commissions' ? '佣金记录' : '提现记录'}.xlsx`);
  };

  const totalCommission = commissions.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
  const totalWithdraw = withdrawals
    .filter((w: any) => w.status === 'approved' || w.status === 'completed')
    .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);
  const pendingWithdraw = withdrawals
    .filter((w: any) => w.status === 'pending')
    .reduce((sum: number, w: any) => sum + (Number(w.amount) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Wallet className="h-6 w-6 text-[#1677FF]" />
        <div>
          <h1 className="text-xl font-bold">财务管理</h1>
          <p className="text-sm text-[#999]">佣金记录、提现审核</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-xs text-[#999]">累计佣金</p>
          <p className="text-xl font-bold text-[#ff3d63] mt-1">¥{totalCommission.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#999]">已提现金额</p>
          <p className="text-xl font-bold text-[#52c41a] mt-1">¥{totalWithdraw.toFixed(2)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-[#999]">待审核提现</p>
          <p className="text-xl font-bold text-[#fa8c16] mt-1">¥{pendingWithdraw.toFixed(2)}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2 bg-white rounded-xl p-1">
          {[
            { key: 'commissions', label: '佣金记录', icon: Receipt },
            { key: 'withdrawals', label: '提现管理', icon: Wallet },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-[#1677FF] text-white shadow'
                  : 'text-[#666] hover:text-[#333]'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-3 w-3 mr-1" />
          导出
        </Button>
      </div>

      {/* Content */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          {activeTab === 'commissions' ? (
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafa] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">代理</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">订单号</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">佣金等级</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">金额</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {commissions.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#999]">暂无佣金记录</td>
                  </tr>
                ) : (
                  commissions.map((item: any) => (
                    <tr key={item.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 text-sm">{item.agent_name || item.agent_id || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#666]">{item.order_id || '-'}</td>
                      <td className="px-4 py-3 text-sm">
                        <Badge variant="outline" className="text-xs">
                          {item.level === 1 ? '一级' : item.level === 2 ? '二级' : item.level === 3 ? '三级' : `L${item.level}`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-[#ff3d63]">¥{Number(item.amount || 0).toFixed(2)}</td>
                      <td className="px-4 py-3 text-sm text-[#999]">{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafa] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">代理</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">金额</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">状态</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">申请时间</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#999]">暂无提现记录</td>
                  </tr>
                ) : (
                  withdrawals.map((item: any) => {
                    const statusInfo = withdrawalStatusMap[item.status] || { label: item.status, className: 'bg-gray-100 text-gray-600' };
                    return (
                      <tr key={item.id} className="hover:bg-[#fafafa]">
                        <td className="px-4 py-3 text-sm">{item.agent_name || item.agent_id || '-'}</td>
                        <td className="px-4 py-3 text-sm font-bold text-[#ff3d63]">¥{Number(item.amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-xs ${statusInfo.className}`}>{statusInfo.label}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-[#999]">{new Date(item.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          {item.status === 'pending' ? (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleWithdrawAction(item.id, 'approved')}
                              >
                                <Check className="h-3 w-3 mr-1" />通过
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleWithdrawAction(item.id, 'rejected')}
                              >
                                <X className="h-3 w-3 mr-1" />拒绝
                              </Button>
                            </div>
                          ) : (
                            <span className="text-sm text-[#999]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </div>
  );
}