'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Clock } from 'lucide-react';

interface Order {
  id: string;
  order_no: string;
  customer_name: string | null;
  customer_phone: string | null;
  new_phone_number: string | null;
  status: string;
  source: string | null;
  total_amount: string;
  created_at: string;
  products: { name: string; price: string };
  profiles: { name: string; email: string };
}

export default function AdminReportAuditPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [auditDialog, setAuditDialog] = useState<{ open: boolean; order: Order | null; action: 'approve' | 'reject' }>({ open: false, order: null, action: 'approve' });
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch('/api/orders?source=manual&status=pending', {
        headers: { 'x-admin-request': 'true' },
      });
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleAudit = async () => {
    if (!auditDialog.order) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${auditDialog.order.id}/audit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-request': 'true' },
        body: JSON.stringify({
          action: auditDialog.action,
          reason: auditDialog.action === 'reject' ? rejectReason : undefined,
        }),
      });
      if (res.ok) {
        setAuditDialog({ open: false, order: null, action: 'approve' });
        setRejectReason('');
        fetchOrders();
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (err) {
      console.error('Audit error:', err);
      alert('操作失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) return;
    setSubmitting(true);
    try {
      for (const id of selectedIds) {
        await fetch(`/api/orders/${id}/audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-request': 'true' },
          body: JSON.stringify({ action: 'approve' }),
        });
      }
      setSelectedIds(new Set());
      fetchOrders();
    } catch (err) {
      console.error('Batch approve error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map(o => o.id)));
    }
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">手动报单审核</h1>
          <p className="text-sm text-gray-500 mt-1">审核代理提交的线下号卡报单</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleBatchApprove}
              disabled={submitting}
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              批量通过 ({selectedIds.size})
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={orders.length > 0 && selectedIds.size === orders.length}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>订单号</TableHead>
                <TableHead>套餐</TableHead>
                <TableHead>代理</TableHead>
                <TableHead>新办号码</TableHead>
                <TableHead>客户姓名</TableHead>
                <TableHead>客户电话</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">加载中...</TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    暂无待审核报单
                  </TableCell>
                </TableRow>
              ) : (
                orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(order.id)}
                        onCheckedChange={() => toggleSelect(order.id)}
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs">{order.order_no}</TableCell>
                    <TableCell className="font-medium">{order.products?.name}</TableCell>
                    <TableCell>{order.profiles?.name || order.profiles?.email}</TableCell>
                    <TableCell className="font-mono">{order.new_phone_number || '-'}</TableCell>
                    <TableCell>{order.customer_name}</TableCell>
                    <TableCell className="font-mono">{maskPhone(order.customer_phone)}</TableCell>
                    <TableCell className="font-mono">¥{parseFloat(order.total_amount).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {new Date(order.created_at).toLocaleString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white h-7 text-xs"
                          onClick={() => setAuditDialog({ open: true, order, action: 'approve' })}
                        >
                          通过
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="h-7 text-xs"
                          onClick={() => setAuditDialog({ open: true, order, action: 'reject' })}
                        >
                          驳回
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Audit Dialog */}
      <Dialog open={auditDialog.open} onOpenChange={open => setAuditDialog({ ...auditDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {auditDialog.action === 'approve' ? '审核通过' : '驳回报单'}
            </DialogTitle>
            <DialogDescription>
              {auditDialog.action === 'approve'
                ? `确认通过订单 ${auditDialog.order?.order_no} 的报单审核？`
                : `请输入驳回原因`}
            </DialogDescription>
          </DialogHeader>
          {auditDialog.action === 'reject' && (
            <div className="space-y-2">
              <Label>驳回原因</Label>
              <Textarea
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因"
                rows={3}
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setAuditDialog({ open: false, order: null, action: 'approve' })}
            >
              取消
            </Button>
            <Button
              className={auditDialog.action === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
              variant={auditDialog.action === 'reject' ? 'destructive' : 'default'}
              onClick={handleAudit}
              disabled={submitting || (auditDialog.action === 'reject' && !rejectReason.trim())}
            >
              {submitting ? '提交中...' : '确认'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
