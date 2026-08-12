'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  ShoppingCart,
  Search,
  Wallet,
  FileText,
  Users,
  UserCircle,
  Copy,
  CheckCircle2,
  Star,
} from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  status: string;
  operator?: string;
  monthly_rent?: string;
  general_data?: string;
  directed_data?: string;
  call_minutes?: number;
  validity_months?: number;
  commission_amount?: string;
  age_limit?: string;
  area_limit?: string;
  tags?: string;
  sort_order?: number;
  is_featured?: boolean;
}

const operatorColors: Record<string, string> = {
  '移动': 'bg-blue-100 text-blue-700',
  '联通': 'bg-red-100 text-red-700',
  '电信': 'bg-purple-100 text-purple-700',
  '广电': 'bg-green-100 text-green-700',
};

const operatorTabs = ['全部', '移动', '联通', '电信', '广电'];

export default function AgentProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOperator, setActiveOperator] = useState('全部');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products?status=active');
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('Failed to fetch products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(p => {
    const matchOperator = activeOperator === '全部' || p.operator === activeOperator;
    const matchSearch = !searchQuery || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchOperator && matchSearch;
  });

  const handleCopyLink = (productId: string) => {
    const link = `${window.location.origin}/shop?agent=${productId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(productId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatMoney = (amount: string | undefined) => {
    return `¥${(parseFloat(amount || '0') || 0).toFixed(2)}`;
  };

  return (
    <div>
      {/* 顶部筛选区 */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-200">
        {/* 运营商 Tab */}
        <div className="flex overflow-x-auto px-2 py-2 gap-1">
          {operatorTabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveOperator(tab)}
              className={cn(
                'px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors',
                activeOperator === tab
                  ? 'bg-[#1677FF] text-white'
                  : 'bg-gray-100 text-gray-600'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 搜索栏 */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索套餐名称..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 rounded-lg bg-gray-100 text-sm border-0 focus:outline-none focus:ring-2 focus:ring-[#1677FF]/20"
            />
          </div>
        </div>
      </div>

      {/* 商品卡片列表 */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">暂无商品</p>
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-xl p-4 relative"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
              {/* 主推角标 */}
              {product.is_featured && (
                <div className="absolute top-0 left-0 bg-red-500 text-white text-xs px-2 py-0.5 rounded-bl-lg rounded-tr-xl">
                  主推
                </div>
              )}

              <div className="flex gap-4">
                {/* 左侧套餐主图 */}
                <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center flex-shrink-0">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#1677FF] font-mono">
                      {product.general_data?.replace('GB', '') || '0'}
                    </p>
                    <p className="text-xs text-gray-500">GB</p>
                  </div>
                </div>

                {/* 右侧套餐详情 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <h3 className="font-medium text-gray-900 text-base truncate">
                      {product.name}
                    </h3>
                    {product.operator && (
                      <span className={cn('px-2 py-0.5 rounded text-xs ml-2 flex-shrink-0', operatorColors[product.operator] || 'bg-gray-100 text-gray-600')}>
                        {product.operator}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 space-y-1">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>通用流量：{product.general_data || '0'}</span>
                      {product.directed_data && <span>| 定向：{product.directed_data}</span>}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>通话：{product.call_minutes || 0}分钟</span>
                      <span>| 月租：{formatMoney(product.monthly_rent)}</span>
                    </div>
                    {product.validity_months && (
                      <div className="text-xs text-gray-500">
                        有效期：{product.validity_months}个月
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-gray-500">佣金：</span>
                      <span className="text-sm font-bold text-red-600 font-mono">
                        {formatMoney(product.commission_amount)}
                      </span>
                    </div>
                    <button
                      onClick={() => handleCopyLink(product.id)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1',
                        copiedId === product.id
                          ? 'bg-green-50 text-green-600'
                          : 'bg-[#1677FF] text-white hover:bg-[#1565E0]'
                      )}
                    >
                      {copiedId === product.id ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          已复制
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          立即办理
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 标签 */}
              {product.tags && (
                <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-gray-100">
                  {product.tags.split(',').map((tag, index) => (
                    <span key={index} className="px-2 py-0.5 bg-blue-50 text-[#1677FF] text-xs rounded">
                      {tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

    </div>
  );
}
