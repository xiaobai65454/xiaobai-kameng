'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  FilePlus,
  UserCircle,
  Phone,
} from 'lucide-react';

interface Order {
  id: string;
  order_no: string;
  quantity: number;
  unit_price: string;
  total_amount: string;
  status: string;
  remark: string | null;
  source: string | null;
  new_phone_number: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  handling_method: string | null;
  created_at: string;
  products: { name: string; price: string };
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: '待审核', color: 'text-amber-600', bg: 'bg-amber-50' },
  approved: { label: '已审核', color: 'text-blue-600', bg: 'bg-blue-50' },
  activated: { label: '已开卡', color: 'text-indigo-600', bg: 'bg-indigo-50' },
  shipped: { label: '已寄出', color: 'text-purple-600', bg: 'bg-purple-50' },
  completed: { label: '已完成', color: 'text-green-600', bg: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-red-600', bg: 'bg-red-50' },
};

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  pending: Clock,
  approved: CheckCircle2,
  activated: CheckCircle2,
  shipped: Truck,
  completed: CheckCircle2,
  cancelled: XCircle,
};

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'activated', label: '已开卡' },
  { key: 'shipped', label: '已寄出' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
];

const SOURCE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  online: { label: '线上', color: 'text-blue-600', bg: 'bg-blue-50' },
  manual: { label: '报单', color: 'text-orange-600', bg: 'bg-orange-50' },
};

const HANDLING_LABELS: Record<string, string> = {
  offline: '线下当面办理',
  wechat: '微信沟通办理',
  referral: '老客户转介绍',
  other: '其他',
};

export default function AgentOrdersPage() {
  const router = useRouter();
  const { session, getAuthHeaders } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const fetchOrders = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/orders', {
        headers: getAuthHeaders(),
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
  }, [session, getAuthHeaders]);

  const filteredOrders = orders.filter(o => {
    if (activeTab !== 'all' && o.status !== activeTab) return false;
    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      return (
        o.order_no.toLowerCase().includes(kw) ||
        o.customer_name?.toLowerCase().includes(kw) ||
        o.customer_phone?.includes(kw) ||
        o.products?.name?.toLowerCase().includes(kw)
      );
    }
    return true;
  });

  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    completed: orders.filter(o => o.status === 'completed').length,
    totalCommission: orders
      .filter(o => o.status === 'completed')
      .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0),
  };

  const formatMoney = (amount: string) => {
    return `¥${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  const maskPhone = (phone: string | null) => {
    if (!phone) return '-';
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* 顶部状态 Tab 切换 */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        <div className="flex items-center">
          <div className="flex overflow-x-auto px-2 py-2 gap-1 flex-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                  activeTab === tab.key
                    ? 'bg-[#0d6efd] text-white'
                    : 'bg-gray-100 text-gray-600'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 mr-2"
          >
            <Search className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {showSearch && (
          <div className="px-3 pb-2">
            <input
              type="text"
              placeholder="搜索订单号/客户姓名/手机号"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              className="w-full h-9 px-3 rounded-full border border-gray-200 text-sm focus:border-[#0d6efd] outline-none"
            />
          </div>
        )}
      </div>

      {/* 手动报单按钮 */}
      <div className="px-4 py-3">
        <button
          onClick={() => router.push('/agent/report')}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-[#0d6efd] text-white text-sm font-medium"
        >
          <FilePlus className="h-4 w-4" />
          手动报单
        </button>
      </div>

      {/* 订单统计 */}
      <div className="px-4 pb-3">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-lg p-3 text-center" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            <p className="text-lg font-bold font-mono text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 mt-0.5">全部订单</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            <p className="text-lg font-bold font-mono text-amber-600">{stats.pending}</p>
            <p className="text-xs text-gray-500 mt-0.5">待审核</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            <p className="text-lg font-bold font-mono text-green-600">{stats.completed}</p>
            <p className="text-xs text-gray-500 mt-0.5">已完成</p>
          </div>
          <div className="bg-white rounded-lg p-3 text-center" style={{ boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}>
            <p className="text-lg font-bold font-mono text-[#ff3d63]">¥{stats.totalCommission.toFixed(0)}</p>
            <p className="text-xs text-gray-500 mt-0.5">已结算佣金</p>
          </div>
        </div>
      </div>

      {/* 订单卡片列表 */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d6efd]"></div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无订单</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const StatusIcon = STATUS_ICONS[order.status] || Clock;
            const source = SOURCE_MAP[order.source || 'online'];
            return (
              <div
                key={order.id}
                className="bg-white rounded-xl p-4"
                style={{ boxShadow: '0 0 20px rgba(0,0,0,0.05)' }}
              >
                {/* 顶部：套餐名 + 来源标签 + 状态 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-[#0d6efd] text-sm">
                      {order.products?.name || '号卡套餐'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5 font-mono">{order.order_no}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {source && (
                      <span className={cn('px-2 py-0.5 rounded text-xs', source.bg, source.color)}>
                        {source.label}
                      </span>
                    )}
                    <span className={cn('px-2 py-1 rounded-full text-xs font-medium', status.bg, status.color)}>
                      {status.label}
                    </span>
                  </div>
                </div>

                {/* 客户信息 */}
                {(order.customer_name || order.customer_phone) && (
                  <div className="bg-gray-50 rounded-lg p-3 mb-3 space-y-1.5">
                    {order.customer_name && (
                      <div className="flex items-center gap-2 text-sm">
                        <UserCircle className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">客户姓名</span>
                        <span className="text-gray-900 font-medium">{order.customer_name}</span>
                      </div>
                    )}
                    {order.customer_phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-gray-500">联系电话</span>
                        <span className="text-gray-900 font-medium">{maskPhone(order.customer_phone)}</span>
                      </div>
                    )}
                    {order.customer_address && (
                      <div className="flex items-start gap-2 text-xs text-gray-500">
                        <span className="shrink-0 mt-0.5">收货地址</span>
                        <span className="truncate">{order.customer_address}</span>
                      </div>
                    )}
                    {order.handling_method && (
                      <div className="text-xs text-orange-600">
                        办理方式：{HANDLING_LABELS[order.handling_method] || order.handling_method}
                      </div>
                    )}
                  </div>
                )}

                {/* 底部：时间 + 佣金 */}
                <div className="flex items-center justify-between py-2 border-t border-dashed border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <StatusIcon className="w-3.5 h-3.5" />
                    <span>{new Date(order.created_at).toLocaleString('zh-CN')}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">佣金</p>
                    <p className="text-sm font-bold text-[#ff3d63] font-mono">{formatMoney(order.total_amount)}</p>
                  </div>
                </div>

                {order.remark && (
                  <p className="text-xs text-orange-600 mt-2 pt-2 border-t border-gray-100">
                    备注：{order.remark}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
