'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Eye } from 'lucide-react';

interface Order {
  id: string;
  order_no: string;
  customer_name: string;
  customer_phone: string;
  new_phone_number: string | null;
  status: string;
  channel_status: string | null;
  channel_remark: string | null;
  created_at: string;
  products: { name: string } | null;
  profiles: { name: string } | null;
}

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending: { label: '待审核', variant: 'secondary' },
  approved: { label: '已审核', variant: 'default' },
  activated: { label: '已开卡', variant: 'default' },
  shipped: { label: '已寄出', variant: 'default' },
  completed: { label: '已完成', variant: 'default' },
  cancelled: { label: '已取消', variant: 'destructive' },
};

const channelStatusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  null: { label: '未审核', variant: 'outline' },
  pending_audit: { label: '待渠道审核', variant: 'secondary' },
  approved: { label: '办理成功', variant: 'default' },
  rejected: { label: '办理失败', variant: 'destructive' },
};

export default function ChannelOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('channel_view', 'true');
      if (statusFilter !== 'all') {
        params.set('channel_status', statusFilter);
      }
      const res = await fetch(`/api/orders?${params.toString()}`);
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
        <h1 className="text-2xl font-bold">订单管理</h1>
        <p className="text-gray-500">查看所有订单信息</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>订单列表</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="搜索订单号/姓名/手机号"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="渠道状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending_audit">待审核</SelectItem>
                  <SelectItem value="approved">办理成功</SelectItem>
                  <SelectItem value="rejected">办理失败</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">暂无订单数据</div>
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
                    <th className="text-left py-3 px-2 font-medium">订单状态</th>
                    <th className="text-left py-3 px-2 font-medium">渠道状态</th>
                    <th className="text-left py-3 px-2 font-medium">下单时间</th>
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
                      <td className="py-3 px-2">
                        <Badge variant={statusMap[order.status]?.variant || 'outline'}>
                          {statusMap[order.status]?.label || order.status}
                        </Badge>
                      </td>
                      <td className="py-3 px-2">
                        <Badge variant={channelStatusMap[order.channel_status || 'null']?.variant || 'outline'}>
                          {channelStatusMap[order.channel_status || 'null']?.label || '未审核'}
                        </Badge>
                      </td>
                      <td className="py-3 px-2 text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
