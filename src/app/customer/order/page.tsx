'use client';

import { useState, useEffect, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronLeft,
  Shield,
  Zap,
  Phone,
  Clock,
  X as XIcon,
  User,
  IdCard,
  MapPin as MapPinIcon,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';

// 身份证校验函数
const validateIdCard = (idCard: string): { valid: boolean; message: string } => {
  if (!idCard) return { valid: false, message: '请输入身份证号' };
  
  // 基本格式校验：18位数字或17位数字+X
  const reg = /^\d{17}[\dXx]$/;
  if (!reg.test(idCard)) {
    return { valid: false, message: '身份证号格式错误，应为18位' };
  }

  // 校验码验证
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  const lastChar = idCard[17].toUpperCase();
  
  if (lastChar !== checkCode) {
    return { valid: false, message: '身份证号校验码错误' };
  }

  // 出生日期校验
  const year = parseInt(idCard.substring(6, 10));
  const month = parseInt(idCard.substring(10, 12));
  const day = parseInt(idCard.substring(12, 14));
  const birthDate = new Date(year, month - 1, day);
  
  if (birthDate.getFullYear() !== year || birthDate.getMonth() !== month - 1 || birthDate.getDate() !== day) {
    return { valid: false, message: '身份证号出生日期无效' };
  }

  return { valid: true, message: '' };
};

// 手机号校验
const validatePhone = (phone: string): boolean => {
  return /^1[3-9]\d{9}$/.test(phone);
};

interface Product {
  id: string;
  name: string;
  operator: string;
  monthly_rent: string;
  general_data: string;
  directed_data: string;
  call_minutes: number;
  validity_months: number;
  age_limit: string;
  area_limit: string;
}

function OrderForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId');
  const refCode = searchParams.get('ref');

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [idCardError, setIdCardError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [selectedAddr, setSelectedAddr] = useState('');
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_phone: '',
    id_card: '',
    address: '',
    remark: '',
  });

  // 身份证号码校验
  const validateIdCard = (idCard: string): boolean => {
    if (!idCard) return false;
    // 18位身份证校验
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
    if (!reg.test(idCard)) return false;

    // 校验码验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
    let sum = 0;
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i];
    }
    const checkCode = checkCodes[sum % 11];
    return idCard[17].toUpperCase() === checkCode;
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}`);
      const data = await res.json();
      setProduct(data.product);
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  // 打开地址选择器 - 使用浏览器定位
  const handleOpenAddressPicker = async () => {
    setShowMapPicker(true);
    setSelectedAddr('');

    // 尝试获取用户当前位置
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // 使用经纬度生成地址提示
          setSelectedAddr(`当前位置：${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        },
        (error) => {
          console.log('定位失败:', error);
          setSelectedAddr('');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  };

  // 确认选择的地址
  const handleConfirmAddress = () => {
    if (selectedAddr) {
      setFormData(prev => ({ ...prev, address: selectedAddr }));
      setShowMapPicker(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.customer_name || !formData.customer_phone || !formData.id_card || !formData.address) {
      toast({ title: '请填写完整信息', variant: 'destructive' });
      return;
    }

    // 姓名长度校验
    if (formData.customer_name.length < 2 || formData.customer_name.length > 20) {
      toast({ title: '姓名长度应为2-20个字符', variant: 'destructive' });
      return;
    }

    // 手机号校验
    if (!validatePhone(formData.customer_phone)) {
      setPhoneError('手机号格式错误');
      toast({ title: '手机号格式错误', variant: 'destructive' });
      return;
    }
    setPhoneError('');

    // 校验身份证号码
    if (!validateIdCard(formData.id_card)) {
      setIdCardError('身份证号码格式错误');
      toast({ title: '身份证号码格式错误', variant: 'destructive' });
      return;
    }
    setIdCardError('');

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          ...formData,
          ref_code: refCode || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: '提交成功', description: '您的订单已提交，请等待审核' });
        router.push('/customer/success');
      } else {
        toast({ title: '提交失败', description: data.error || '请稍后重试', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast({ title: '提交失败', description: '网络错误，请稍后重试', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-gray-400">商品不存在</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-24">
      {/* 顶部导航 */}
      <div className="bg-white px-4 py-3 border-b sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold">确认订单</h1>
        </div>
      </div>

      {/* 商品信息 */}
      <div className="bg-white mx-4 mt-4 rounded-xl p-4 shadow-sm">
        <div className="flex gap-3">
          <div className="w-20 h-24 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex flex-col items-center justify-center flex-shrink-0">
            <div className="text-white text-2xl font-bold">{product.general_data}G</div>
            <div className="text-white/80 text-xs">通用流量</div>
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-gray-900">{product.name}</h3>
              <Badge className="bg-blue-50 text-blue-600 border-0">{product.operator}</Badge>
            </div>
            <div className="space-y-1.5 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-[#0d6efd]" />
                <span>通用流量 {product.general_data}G</span>
                {product.directed_data && (
                  <span className="text-gray-400">+ 定向{product.directed_data}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-[#0d6efd]" />
                <span>通话 {product.call_minutes}分钟</span>
                <span className="text-gray-400">|</span>
                <span>月租 ¥{product.monthly_rent}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-[#0d6efd]" />
                <span>有效期 {product.validity_months}个月</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 表单 */}
      <form onSubmit={handleSubmit} className="px-4 mt-4 space-y-4">
        {/* 收货人信息 */}
        <div className="bg-white rounded-xl p-4 shadow-sm space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <User className="h-5 w-5 text-[#0d6efd]" />
            <h3 className="font-bold text-gray-900">收货人信息</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600 mb-1 block">收货人姓名 *</label>
              <Input
                placeholder="请输入收货人姓名"
                value={formData.customer_name}
                onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                className="h-12 bg-gray-50 border-0 rounded-lg"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">手机号码 *</label>
              <Input
                placeholder="请输入手机号码"
                value={formData.customer_phone}
                onChange={(e) => {
                  setFormData({ ...formData, customer_phone: e.target.value });
                  if (phoneError) setPhoneError('');
                }}
                className={`h-12 bg-gray-50 border-0 rounded-lg ${phoneError ? 'ring-2 ring-red-500' : ''}`}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">身份证号 *</label>
              <div className="relative">
                <IdCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="请输入身份证号"
                  value={formData.id_card}
                  onChange={(e) => {
                    setFormData({ ...formData, id_card: e.target.value });
                    if (idCardError) setIdCardError('');
                  }}
                  className={`h-12 bg-gray-50 border-0 rounded-lg pl-10 ${idCardError ? 'ring-2 ring-red-500' : ''}`}
                />
              </div>
              {idCardError ? (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {idCardError}
                </p>
              ) : (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  身份证信息仅用于实名认证，不会泄露
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">收货地址 *</label>
              <div className="relative">
                <MapPinIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  placeholder="请输入详细收货地址"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="bg-gray-50 border-0 rounded-lg pl-10 min-h-[80px] pr-20"
                />
                <button
                  type="button"
                  onClick={handleOpenAddressPicker}
                  className="absolute right-2 top-2 bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs flex items-center gap-1 hover:bg-blue-600 transition-colors"
                >
                  <MapPinIcon className="h-3 w-3" />
                  地图选点
                </button>
              </div>
              {formData.address && (
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <MapPinIcon className="h-3 w-3" />
                  {formData.address}
                </p>
              )}
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">备注</label>
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Textarea
                  placeholder="如有特殊需求请备注"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  className="bg-gray-50 border-0 rounded-lg pl-10 min-h-[60px]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 提示信息 */}
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-start gap-2">
            <Shield className="h-5 w-5 text-[#0d6efd] mt-0.5" />
            <div className="text-sm text-gray-600">
              <p className="font-medium text-[#0d6efd] mb-1">温馨提示</p>
              <p>1. 请确保填写的信息真实有效，否则无法通过审核</p>
              <p>2. 同一身份证30天内只能办理一张号卡</p>
              <p>3. 号卡将免费邮寄到您填写的地址</p>
            </div>
          </div>
        </div>
      </form>

      {/* 地址选择器 */}
      {showMapPicker && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
          <div className="bg-white rounded-t-2xl w-full max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-bold text-lg">选择收货地址</h3>
              <button onClick={() => setShowMapPicker(false)} className="text-gray-400 hover:text-gray-600">
                <XIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {/* 当前位置提示 */}
              {selectedAddr && (
                <div className="bg-blue-50 rounded-lg p-3 mb-4">
                  <p className="text-sm text-[#0d6efd]">
                    <MapPinIcon className="h-4 w-4 inline mr-1" />
                    {selectedAddr}
                  </p>
                </div>
              )}

              {/* 手动输入地址 */}
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">省/市/区</label>
                  <input
                    type="text"
                    placeholder="请输入省市区，如：北京市朝阳区"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                    onChange={(e) => {
                      const region = e.target.value;
                      setSelectedAddr(prev => {
                        const coords = prev?.match(/[\d.]+, [\d.]+/);
                        return coords ? `${region} ${coords[0]}` : region;
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">详细地址</label>
                  <textarea
                    placeholder="请输入详细地址，如：xx 街道 xx 号 xx 室"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0d6efd]"
                    onChange={(e) => {
                      const detail = e.target.value;
                      setSelectedAddr(prev => {
                        const region = prev?.split(/[\d.]+, [\d.]+/)[0] || '';
                        const coords = prev?.match(/[\d.]+, [\d.]+/);
                        return coords ? `${region}${detail} ${coords[0]}` : `${region}${detail}`;
                      });
                    }}
                  />
                </div>
              </div>

              {/* 常用地址快捷选择 */}
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">快捷选择</p>
                <div className="space-y-2">
                  {['北京市', '上海市', '广州市', '深圳市', '杭州市'].map(city => (
                    <button
                      key={city}
                      onClick={() => setSelectedAddr(city)}
                      className="w-full text-left px-3 py-2 bg-gray-50 rounded-lg text-sm hover:bg-gray-100"
                    >
                      {city}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t p-4 flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowMapPicker(false)}
                className="flex-1"
              >
                取消
              </Button>
              <Button
                onClick={handleConfirmAddress}
                disabled={!selectedAddr}
                className="flex-1 bg-[#0d6efd]"
              >
                确认选择
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 底部提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-600">月租费用</span>
          <span className="text-2xl font-bold text-[#F5222D]">¥{product.monthly_rent}</span>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full h-12 bg-[#0d6efd] hover:bg-[#0d6efd]/90 text-white text-lg font-bold rounded-lg"
        >
          {submitting ? '提交中...' : '提交订单'}
        </Button>
      </div>
    </div>
  );
}

export default function OrderPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
        <div className="text-gray-400">加载中...</div>
      </div>
    }>
      <OrderForm />
    </Suspense>
  );
}
