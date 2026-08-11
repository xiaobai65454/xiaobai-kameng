'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  ChevronDown,
  Star,
  Shield,
  CheckCircle,
  ArrowUp,
  Plus,
  MessageCircle,
  Heart,
  Flame,
  Users,
  Share2,
  Link2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

interface Product {
  id: string;
  name: string;
  operator: string;
  monthly_rent: string;
  general_data: string;
  directed_data: string;
  call_minutes: number;
  validity_months: number;
  commission_amount: string;
  age_limit: string;
  area_limit: string;
  main_image: string;
  image_url: string;
  promo_url: string;
  status: string;
  tags: string;
}

const OPERATORS = [
  { id: 'all', name: '全部' },
  { id: '移动', name: '移动' },
  { id: '联通', name: '联通' },
  { id: '电信', name: '电信' },
  { id: '广电', name: '广电' },
];

const SORT_OPTIONS = [
  { id: 'default', name: '月租' },
  { id: 'price_asc', name: '流量' },
  { id: 'data_desc', name: '通话' },
  { id: 'area', name: '地区' },
];

function CustomerPageInner() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, [operatorFilter, sortBy]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (operatorFilter && operatorFilter !== 'all') {
        // Convert Chinese operator name to English for API
        const operatorMap: Record<string, string> = {
          '移动': 'mobile',
          '联通': 'unicom',
          '电信': 'telecom',
          '广电': 'broadcast',
        };
        params.append('operator', operatorMap[operatorFilter] || operatorFilter);
      }
      if (searchTerm) params.append('search', searchTerm);
      params.append('status', 'active');

      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      let sortedProducts = data.products || [];

      if (sortBy === 'price_asc') {
        sortedProducts = sortedProducts.sort((a: Product, b: Product) =>
          parseFloat(a.monthly_rent) - parseFloat(b.monthly_rent)
        );
      } else if (sortBy === 'data_desc') {
        sortedProducts = sortedProducts.sort((a: Product, b: Product) =>
          parseFloat(b.general_data || '0') - parseFloat(a.general_data || '0')
        );
      }

      setProducts(sortedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOperatorIcon = (operator: string) => {
    switch (operator) {
      case '移动':
        return 'text-blue-600';
      case '联通':
        return 'text-red-600';
      case '电信':
        return 'text-green-600';
      case '广电':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const getOperatorColor = (operator: string) => {
    switch (operator) {
      case '移动':
        return 'text-blue-600';
      case '联通':
        return 'text-red-600';
      case '电信':
        return 'text-green-600';
      case '广电':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleOrder = (product: Product) => {
    const refParam = refCode ? `&ref=${refCode}` : '';
    router.push(`/customer/order?productId=${product.id}${refParam}`);
  };

  const handleShare = (product: Product) => {
    const refParam = refCode ? `&ref=${refCode}` : '';
    navigator.clipboard.writeText(`${window.location.origin}/customer/order?productId=${product.id}${refParam}`);
    toast({ title: '链接已复制', description: '快去分享给好友吧' });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      {/* 顶部Header */}
      <div className="bg-white sticky top-0 z-50">
        {/* 搜索栏 */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="请输入商品名称"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchProducts()}
                className="pl-10 h-10 rounded-full border-[#0d6efd] focus:border-[#0d6efd] focus:ring-[#0d6efd]"
              />
            </div>
            <Button
              onClick={fetchProducts}
              className="h-10 px-6 rounded-full bg-[#0d6efd] hover:bg-[#0d6efd]/90 text-white"
            >
              搜索
            </Button>
          </div>
        </div>

        {/* 店铺信息行 */}
        <div className="px-4 py-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="font-bold text-gray-900">小白卡盟</span>
              <div className="flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded-full">
                <Star className="h-3.5 w-3.5 fill-red-500 text-red-500" />
                <span className="text-xs text-red-500 font-medium">4.98</span>
              </div>
              <Badge className="bg-[#0d6efd] text-white border-0 text-xs">官方认证</Badge>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-gray-600 text-sm">
                <MessageCircle className="h-4 w-4" />
                <span>客服</span>
              </button>
              <button className="flex items-center gap-1 text-gray-600 text-sm">
                <Heart className="h-4 w-4" />
                <span>收藏</span>
              </button>
            </div>
          </div>
        </div>

        {/* 认证横幅 */}
        <div className="px-4 py-2">
          <div className="bg-[#e6f7ff] rounded-lg px-3 py-2 flex items-center gap-3 overflow-x-auto">
            <div className="flex items-center gap-1 text-[#0d6efd] text-xs whitespace-nowrap">
              <Shield className="h-3.5 w-3.5" />
              <span>官方正品保障</span>
            </div>
            <div className="flex items-center gap-1 text-[#0d6efd] text-xs whitespace-nowrap">
              <CheckCircle className="h-3.5 w-3.5" />
              <span>运营商战略合作伙伴</span>
            </div>
            <div className="flex items-center gap-1 text-[#0d6efd] text-xs whitespace-nowrap">
              <Users className="h-3.5 w-3.5" />
              <span>10万+用户信赖</span>
            </div>
          </div>
        </div>
      </div>

      {/* 筛选栏 */}
      <div className="bg-white sticky top-[120px] z-40 border-b">
        {/* 运营商Tab */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {OPERATORS.map((op) => (
              <button
                key={op.id}
                onClick={() => setOperatorFilter(op.id)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  operatorFilter === op.id
                    ? 'bg-[#0d6efd] text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {op.name}
              </button>
            ))}
          </div>
        </div>

        {/* 下拉筛选按钮组 */}
        <div className="px-4 py-2 border-t border-gray-100">
          <div className="flex items-center gap-4">
            {SORT_OPTIONS.map((option) => (
              <button
                key={option.id}
                onClick={() => setSortBy(option.id)}
                className={`flex items-center gap-1 text-sm ${
                  sortBy === option.id ? 'text-[#0d6efd]' : 'text-gray-600'
                }`}
              >
                <span>{option.name}</span>
                <ChevronDown className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 商品列表 */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-24 h-28 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-gray-400">暂无数据</div>
          </div>
        ) : (
          products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.05)] relative overflow-hidden"
            >
              {/* 主推角标 */}
              {product.tags?.includes('主推') && (
                <div className="absolute top-0 left-0 bg-[#ff3d63] text-white text-xs px-2 py-1 rounded-br-lg flex items-center gap-1 z-10">
                  <Flame className="h-3 w-3" />
                  <span>主推</span>
                </div>
              )}

              <div className="p-3">
                <div className="flex gap-3">
                  {/* 左侧套餐主图 - 正方形 500x500 */}
                  <div className="w-[30%] flex-shrink-0">
                    {product.image_url ? (
                      <div className="rounded-lg overflow-hidden" style={{ aspectRatio: '1/1' }}>
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                    ) : (
                      <div className="bg-gradient-to-br from-[#0d6efd] to-[#0a58ca] rounded-lg p-3 text-center" style={{ aspectRatio: '1/1' }}>
                        <div className="flex flex-col items-center justify-center h-full">
                          <div className="text-white text-3xl font-bold">{product.general_data}</div>
                          <div className="text-white/80 text-xs mt-1">G 通用流量</div>
                        </div>
                      </div>
                    )}
                    {/* 运营商图标 */}
                    <div className="mt-2 text-center">
                      <span className={`text-xs font-medium ${getOperatorColor(product.operator)}`}>
                        {product.operator === 'mobile' ? '移动' :
                         product.operator === 'unicom' ? '联通' :
                         product.operator === 'telecom' ? '电信' :
                         product.operator === 'broadcast' ? '广电' :
                         product.operator}
                      </span>
                    </div>
                  </div>

                  {/* 右侧信息 */}
                  <div className="flex-1 min-w-0">
                    {/* 套餐名称 */}
                    <h3 className="font-bold text-gray-900 text-base truncate">{product.name}</h3>

                    {/* 属性标签 */}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-[#f0f9ff] text-[#1890ff] border-0 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        支持选号
                      </Badge>
                      <Badge className="bg-[#fff7e6] text-[#fa8c16] border-0 text-xs">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        无需照片
                      </Badge>
                    </div>

                    {/* 数据栏 */}
                    <div className="grid grid-cols-4 gap-2 mt-3 py-2 border-t border-b border-gray-100">
                      <div className="text-center">
                        <div className="text-[#ff3d63] font-bold text-lg">¥{product.monthly_rent}</div>
                        <div className="text-gray-400 text-xs">每月月租</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#0d6efd] font-bold text-lg">{product.general_data}G</div>
                        <div className="text-gray-400 text-xs">通用流量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#0d6efd] font-bold text-lg">{product.directed_data || '0'}G</div>
                        <div className="text-gray-400 text-xs">定向流量</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[#0d6efd] font-bold text-lg">{product.call_minutes}</div>
                        <div className="text-gray-400 text-xs">通话分钟</div>
                      </div>
                    </div>

                    {/* 年龄限制 */}
                    <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                      <Users className="h-3.5 w-3.5" />
                      <span>年龄：{product.age_limit || '18-60周岁'}</span>
                    </div>

                    {/* 底部操作行 */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2">
                        {product.tags?.split(',').map((tag, index) => {
                          const colors = [
                            'bg-[#f6ffed] text-[#52c41a]',
                            'bg-[#fff7e6] text-[#fa8c16]',
                            'bg-[#f0f9ff] text-[#1890ff]',
                            'bg-[#fff2f0] text-[#f5222d]',
                            'bg-[#f9f0ff] text-[#722ed1]',
                          ];
                          return (
                            <span
                              key={index}
                              className={`text-xs px-2 py-0.5 rounded ${colors[index % 5]}`}
                            >
                              {tag}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        onClick={() => handleShare(product)}
                        className="flex-1 h-9 rounded-full bg-[#f0f0f0] border-0 text-gray-600 hover:bg-[#e0e0e0]"
                      >
                        <Share2 className="h-4 w-4 mr-1" />
                        分享
                      </Button>
                      <Button
                        onClick={() => handleOrder(product)}
                        className="flex-1 h-9 rounded-full bg-[#0d6efd] hover:bg-[#0d6efd]/90 text-white"
                      >
                        <Link2 className="h-4 w-4 mr-1" />
                        立即办理
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 悬浮按钮 */}
      <div className="fixed bottom-6 right-4 flex flex-col gap-3">
        {/* 回顶按钮 */}
        {showBackToTop && (
          <button
            onClick={scrollToTop}
            className="w-12 h-12 bg-[#0d6efd] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6efd]/90 transition-colors"
          >
            <ArrowUp className="h-5 w-5" />
          </button>
        )}
        {/* 加入按钮 */}
        <button
          onClick={() => router.push('/register')}
          className="w-12 h-12 bg-[#0d6efd] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#0d6efd]/90 transition-colors"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center"><div className="text-gray-400">加载中...</div></div>}>
      <CustomerPageInner />
    </Suspense>
  );
}
