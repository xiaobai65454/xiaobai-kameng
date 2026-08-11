'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-context';

interface Commission {
  id: string;
  level: number;
  amount: string;
  status: string;
  created_at: string;
  orders: { order_no: string };
}

const LEVEL_LABELS: Record<number, string> = {
  1: '直推佣金',
  2: '二级佣金',
  3: '三级佣金',
};

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待结算', color: 'bg-amber-100 text-amber-700' },
  settled: { label: '已结算', color: 'bg-green-100 text-green-700' },
};

export default function AgentCommissionsPage() {
  const { session } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCommissions = async () => {
      if (!session) return;
      try {
        const res = await fetch('/api/commissions', {
          headers: { 'x-session': session.access_token },
        });
        if (res.ok) {
          const data = await res.json();
          setCommissions(data.commissions || []);
        }
      } catch (err) {
        console.error('Failed to fetch commissions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCommissions();
  }, [session]);

  const totalAmount = commissions.reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const level1Amount = commissions.filter(c => c.level === 1).reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const level2Amount = commissions.filter(c => c.level === 2).reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const level3Amount = commissions.filter(c => c.level === 3).reduce((sum, c) => sum + parseFloat(c.amount), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">佣金明细</h1>
        <p className="text-slate-500 mt-1">查看我的所有佣金收入记录</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">总佣金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">¥{totalAmount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">直推佣金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{level1Amount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">二级佣金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{level2Amount.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-500">三级佣金</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{level3Amount.toFixed(2)}</div>
          </CardContent>
        </Card>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-500">订单号</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">类型</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">金额</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">状态</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">时间</th>
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs">{c.orders?.order_no || '-'}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                          {LEVEL_LABELS[c.level] || `第${c.level}级`}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-medium text-green-600">
                        +¥{parseFloat(c.amount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[c.status]?.color || ''}`}>
                          {STATUS_MAP[c.status]?.label || c.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(c.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                  {commissions.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">暂无佣金记录</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
