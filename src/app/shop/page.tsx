'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Copy, ExternalLink, Smartphone, Wifi, Phone, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  monthly_rent: string;
  general_data: number;
  directed_data: number;
  call_minutes: number;
  validity_months: number;
  commission_amount: string;
  age_limit: string | null;
  area_limit: string | null;
  status: string;
  tags: string | null;
  image_url: string | null;
  promo_url: string | null;
}

const operatorMap: Record<string, { name: string; color: string; bgColor: string }> = {
  mobile: { name: '中国移动', color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  unicom: { name: '中国联通', color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  telecom: { name: '中国电信', color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  broadnet: { name: '中国广电', color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
};

export default function ShopPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorFilter, setOperatorFilter] = useState('');

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({ status: 'active' });
      if (operatorFilter) params.append('operator', operatorFilter);
      
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [operatorFilter]);

  const copyPromoLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: '复制成功',
      description: '推广链接已复制到剪贴板',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">号卡商城</h1>
              <p className="text-gray-600 mt-1">精选高性价比流量卡，运营商直发</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={operatorFilter === '' ? 'default' : 'outline'}
                onClick={() => setOperatorFilter('')}
              >
                全部
              </Button>
              <Button
                variant={operatorFilter === 'mobile' ? 'default' : 'outline'}
                onClick={() => setOperatorFilter('mobile')}
                className="text-green-600"
              >
                移动
              </Button>
              <Button
                variant={operatorFilter === 'unicom' ? 'default' : 'outline'}
                onClick={() => setOperatorFilter('unicom')}
                className="text-red-600"
              >
                联通
              </Button>
              <Button
                variant={operatorFilter === 'telecom' ? 'default' : 'outline'}
                onClick={() => setOperatorFilter('telecom')}
                className="text-blue-600"
              >
                电信
              </Button>
              <Button
                variant={operatorFilter === 'broadnet' ? 'default' : 'outline'}
                onClick={() => setOperatorFilter('broadnet')}
                className="text-purple-600"
              >
                广电
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <Smartphone className="w-16 h-16 text-gray-300 mx-auto" />
            <p className="mt-4 text-gray-500 text-lg">暂无号卡产品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const operator = operatorMap[product.operator] || operatorMap.mobile;
              return (
                <Card
                  key={product.id}
                  className={`overflow-hidden border-2 hover:shadow-lg transition-shadow ${operator.bgColor}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Badge className={operator.color + ' bg-white'}>
                            {operator.name}
                          </Badge>
                          {product.tags && product.tags.split(',').map((tag, i) => (
                            <Badge key={i} variant="outline" className="text-orange-500 border-orange-300">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                        <CardTitle className="mt-2 text-xl">{product.name}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Price */}
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-red-500">¥{product.monthly_rent}</span>
                      <span className="text-gray-500">/月</span>
                    </div>

                    {/* Features */}
                    <div className="grid grid-cols-3 gap-3 py-3 border-t border-b">
                      <div className="text-center">
                        <Wifi className="w-5 h-5 mx-auto text-blue-500" />
                        <p className="text-sm font-medium mt-1">{product.general_data}G</p>
                        <p className="text-xs text-gray-500">通用流量</p>
                      </div>
                      {product.directed_data > 0 && (
                        <div className="text-center">
                          <Wifi className="w-5 h-5 mx-auto text-purple-500" />
                          <p className="text-sm font-medium mt-1">{product.directed_data}G</p>
                          <p className="text-xs text-gray-500">定向流量</p>
                        </div>
                      )}
                      <div className="text-center">
                        <Phone className="w-5 h-5 mx-auto text-green-500" />
                        <p className="text-sm font-medium mt-1">{product.call_minutes}</p>
                        <p className="text-xs text-gray-500">通话分钟</p>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>有效期 {product.validity_months} 个月</span>
                      </div>
                      {product.age_limit && (
                        <p className="text-gray-500">年龄限制：{product.age_limit}</p>
                      )}
                      {product.area_limit && (
                        <p className="text-gray-500">地区限制：{product.area_limit}</p>
                      )}
                    </div>

                    {/* Actions */}
                    {product.promo_url && (
                      <div className="flex gap-2 pt-2">
                        <Button
                          className="flex-1"
                          onClick={() => window.open(product.promo_url!, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          立即申请
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => copyPromoLink(product.promo_url!)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-500 text-sm">
          <p>所有号卡均为运营商直发，支持官方APP查询</p>
          <p className="mt-2">© 2024 号卡商城 - 精选高性价比流量卡</p>
        </div>
      </footer>
    </div>
  );
}
