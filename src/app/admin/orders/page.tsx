'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Eye, CheckCircle, XCircle, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Order {
  id: string;
  order_no: string;
  total_amount: string;
  quantity: number;
  unit_price: string;
  status: string;
  source: string | null;
  order_source: string | null;
  new_phone_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  remark: string | null;
  admin_remark: string | null;
  created_at: string;
  products: { name: string; price: string };
  profiles: { name: string; email: string };
}

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已审核' },
  { value: 'activated', label: '已开卡' },
  { value: 'shipped', label: '已寄出' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-amber-100 text-amber-700' },
  approved: { label: '已审核', color: 'bg-blue-100 text-blue-700' },
  activated: { label: '已开卡', color: 'bg-indigo-100 text-indigo-700' },
  shipped: { label: '已寄出', color: 'bg-purple-100 text-purple-700' },
  completed: { label: '已完成', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
};

const SOURCE_OPTIONS = [
  { value: '', label: '全部渠道' },
  { value: 'online', label: '用户下单' },
  { value: 'manual', label: '号卡报单' },
];

const SOURCE_MAP: Record<string, { label: string; color: string }> = {
  online: { label: '用户下单', color: 'bg-sky-100 text-sky-700' },
  manual: { label: '号卡报单', color: 'bg-indigo-100 text-indigo-700' },
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [orderSource, setOrderSource] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminRemark, setAdminRemark] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const handleExportExcel = () => {
    const exportData = orders.map(order => ({
      '订单号': order.order_no,
      '渠道': SOURCE_MAP[order.source || 'online']?.label || '用户下单',
      '代理': order.profiles?.name || '-',
      '商品': order.products?.name || '-',
      '新办号码': order.new_phone_number || '-',
      '用户姓名': order.customer_name || '-',
      '联系方式': order.customer_phone || '-',
      '数量': order.quantity,
      '单价': order.unit_price,
      '总金额': order.total_amount,
      '状态': STATUS_MAP[order.status]?.label || order.status,
      '下单时间': order.created_at ? new Date(order.created_at).toLocaleString('zh-CN') : '',
      '备注': order.admin_remark || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, '订单列表');
    XLSX.writeFile(workbook, `订单列表_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (orderSource) params.set('source', orderSource);
      const res = await fetch(`/api/orders?${params}`, {
        headers: { 'x-admin-request': 'true' },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [status, orderSource]);

  const handleStatusUpdate = async () => {
    if (!selectedOrder) return;
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-admin-request': 'true' },
        body: JSON.stringify({ status: newStatus, admin_remark: adminRemark }),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchOrders();
      }
    } catch (err) {
      console.error('Failed to update order:', err);
    }
  };

  const openStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setAdminRemark(order.admin_remark || '');
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">订单管理</h1>
        <p className="text-slate-500 mt-1">审核和管理所有订单</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <select
              className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <select
              className="h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
              value={orderSource}
              onChange={(e) => setOrderSource(e.target.value)}
            >
              {SOURCE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <Button variant="outline" size="sm" onClick={handleExportExcel} className="ml-auto">
              <Upload className="h-4 w-4 mr-2 rotate-180" />
              导出 Excel
            </Button>
          </div>
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
                    <th className="text-left py-3 px-4 font-medium text-slate-500">订单号</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">渠道</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">代理</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">商品</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">报单信息</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">金额</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">状态</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">下单时间</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-mono text-xs">{order.order_no}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${SOURCE_MAP[order.source || 'online']?.color || 'bg-slate-100 text-slate-600'}`}>
                          {SOURCE_MAP[order.source || 'online']?.label || '用户下单'}
                        </span>
                      </td>
                      <td className="py-3 px-4">{order.profiles?.name || '-'}</td>
                      <td className="py-3 px-4">{order.products?.name || '-'}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-xs">
                          {order.customer_name && <div className="text-slate-700">{order.customer_name}</div>}
                          {order.customer_phone && <div className="text-slate-500 font-mono">{order.customer_phone}</div>}
                          {order.new_phone_number && <div className="text-blue-600 font-mono">新号: {order.new_phone_number}</div>}
                          {!order.customer_name && !order.customer_phone && !order.new_phone_number && <span className="text-slate-400">-</span>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-mono">¥{parseFloat(order.total_amount).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${STATUS_MAP[order.status]?.color || ''}`}>
                          {STATUS_MAP[order.status]?.label || order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center text-xs text-slate-500">
                        {order.created_at ? new Date(order.created_at).toLocaleString('zh-CN', {
                          year: 'numeric',
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        }) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button variant="ghost" size="sm" onClick={() => openStatusDialog(order)}>
                          <Eye className="h-4 w-4 mr-1" />
                          处理
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">暂无订单</td>
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
            <DialogTitle>订单处理</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">订单号：</span>
                  <span className="font-mono">{selectedOrder.order_no}</span>
                </div>
                <div>
                  <span className="text-slate-500">代理：</span>
                  <span>{selectedOrder.profiles?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">商品：</span>
                  <span>{selectedOrder.products?.name}</span>
                </div>
                <div>
                  <span className="text-slate-500">金额：</span>
                  <span className="font-mono">¥{parseFloat(selectedOrder.total_amount).toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label>订单状态</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  {STATUS_OPTIONS.filter(o => o.value).map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>管理员备注</Label>
                <Input value={adminRemark} onChange={(e) => setAdminRemark(e.target.value)} placeholder="可选备注" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleStatusUpdate} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  确认更新
                </Button>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>取消</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
