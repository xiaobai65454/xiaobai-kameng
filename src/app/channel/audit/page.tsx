'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Check, X, Eye } from 'lucide-react';

interface Order {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  new_phone_number: string | null;
  status: string;
  channel_status: string | null;
  channel_remark: string | null;
  channel_audit_time: string | null;
  created_at: string;
  products: { name: string } | null;
  profiles: { name: string } | null;
}

export default function ChannelAudit() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [auditOrder, setAuditOrder] = useState<Order | null>(null);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject' | null>(null);
  const [auditRemark, setAuditRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/orders?channel_audit=true&channel_status=pending_audit');
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAudit = async () => {
    if (!auditOrder || !auditAction) return;
    if (auditAction === 'reject' && !auditRemark.trim()) {
      alert('请填写驳回原因');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${auditOrder.id}/channel-audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: auditAction,
          remark: auditRemark,
        }),
      });

      if (res.ok) {
        alert(auditAction === 'approve' ? '审核通过' : '已驳回');
        setAuditOrder(null);
        setAuditAction(null);
        setAuditRemark('');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || '审核失败');
      }
    } catch (error) {
      console.error('Failed to audit:', error);
      alert('审核失败');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.order_no.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_phone?.includes(search) ||
      order.new_phone_number?.includes(search)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">订单审核</h1>
        <p className="text-gray-500">审核号卡是否成功办理</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>待审核订单</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="搜索订单号/姓名/手机号"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无待审核订单</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-2 font-medium">订单号</th>
                    <th className="text-left py-3 px-2 font-medium">套餐</th>
                    <th className="text-left py-3 px-2 font-medium">客户姓名</th>
                    <th className="text-left py-3 px-2 font-medium">联系电话</th>
                    <th className="text-left py-3 px-2 font-medium">新办号码</th>
                    <th className="text-left py-3 px-2 font-medium">代理</th>
                    <th className="text-left py-3 px-2 font-medium">下单时间</th>
                    <th className="text-left py-3 px-2 font-medium">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-2 font-mono text-xs">{order.order_no}</td>
                      <td className="py-3 px-2">{order.products?.name || '-'}</td>
                      <td className="py-3 px-2">{order.customer_name || '-'}</td>
                      <td className="py-3 px-2">{order.customer_phone || '-'}</td>
                      <td className="py-3 px-2">{order.new_phone_number || '-'}</td>
                      <td className="py-3 px-2">{order.profiles?.name || '-'}</td>
                      <td className="py-3 px-2 text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-2">
                        <Button size="sm" onClick={() => setAuditOrder(order)}>
                          <Eye className="mr-1 h-4 w-4" />
                          审核
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Audit Dialog */}
      {auditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">
              {auditAction === 'approve' ? '确认通过' : auditAction === 'reject' ? '确认驳回' : '订单审核'}
            </h3>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">订单号：</span>
                <span className="font-mono">{auditOrder.order_no}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">套餐：</span>
                <span>{auditOrder.products?.name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">客户姓名：</span>
                <span>{auditOrder.customer_name || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">联系电话：</span>
                <span>{auditOrder.customer_phone || '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">新办号码：</span>
                <span>{auditOrder.new_phone_number || '-'}</span>
              </div>
            </div>

            {auditAction && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  {auditAction === 'reject' ? '驳回原因 *' : '备注'}
                </label>
                <Textarea
                  value={auditRemark}
                  onChange={(e) => setAuditRemark(e.target.value)}
                  placeholder={auditAction === 'reject' ? '请填写驳回原因' : '可选备注'}
                  rows={3}
                />
              </div>
            )}

            <div className="flex gap-2">
              {!auditAction && (
                <>
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => setAuditAction('approve')}
                  >
                    <Check className="mr-1 h-4 w-4" />
                    办理成功
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setAuditAction('reject')}
                  >
                    <X className="mr-1 h-4 w-4" />
                    办理失败
                  </Button>
                </>
              )}
              {auditAction && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAuditAction(null);
                      setAuditRemark('');
                    }}
                    disabled={submitting}
                  >
                    返回
                  </Button>
                  <Button
                    className={auditAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
                    variant={auditAction === 'reject' ? 'destructive' : 'default'}
                    onClick={handleAudit}
                    disabled={submitting}
                  >
                    {submitting ? '提交中...' : '确认提交'}
                  </Button>
                </>
              )}
              <Button variant="ghost" onClick={() => {
                setAuditOrder(null);
                setAuditAction(null);
                setAuditRemark('');
              }}>
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
