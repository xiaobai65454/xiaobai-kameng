'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
  Phone,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  price: string;
  operator?: string;
  image_url?: string;
  commission_amount?: string;
}

interface FormErrors {
  product_id?: string;
  new_phone_number?: string;
  customer_name?: string;
  customer_phone?: string;
}

const OPERATOR_COLORS: Record<string, string> = {
  '移动': '#e74153',
  '联通': '#e84153',
  '电信': '#0055a4',
  '广电': '#009944',
};

export default function ManualReportPage() {
  const router = useRouter();
  const { getAuthHeaders } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [orderNo, setOrderNo] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  const [errors, setErrors] = useState<FormErrors>({});

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch('/api/products?status=active');
      const data = await res.json();
      if (data.products) setProducts(data.products);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filteredProducts = products.filter(p => {
    if (!productSearch) return true;
    return p.name.toLowerCase().includes(productSearch.toLowerCase());
  });

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedProduct) newErrors.product_id = '请选择号卡商品';
    if (!newPhoneNumber || !/^1[3-9]\d{9}$/.test(newPhoneNumber)) {
      newErrors.new_phone_number = '请输入正确的新办号码';
    }
    if (!customerName || customerName.length < 2 || customerName.length > 20) {
      newErrors.customer_name = '用户姓名需为2-20个字符';
    }
    if (!customerPhone || !/^1[3-9]\d{9}$/.test(customerPhone)) {
      newErrors.customer_phone = '请输入正确的联系方式';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const headers = getAuthHeaders();
      const res = await fetch('/api/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          product_id: selectedProduct?.id,
          new_phone_number: newPhoneNumber,
          customer_name: customerName,
          customer_phone: customerPhone,
          handling_method: 'offline',
        }),
      });
      const data = await res.json();
      if (data.order) {
        setOrderNo(data.order.order_no);
        setSubmitted(true);
      } else {
        setErrors({ product_id: data.error || '提交失败' });
      }
    } catch (err) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setSelectedProduct(null);
    setNewPhoneNumber('');
    setCustomerName('');
    setCustomerPhone('');
    setErrors({});
    setSubmitted(false);
    setOrderNo('');
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f5] flex flex-col">
        <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
          <div className="flex items-center h-12 px-4">
            <button onClick={() => router.push('/agent')} className="p-1">
              <ArrowLeft className="h-5 w-5 text-[#333]" />
            </button>
            <h1 className="flex-1 text-center text-base font-medium text-[#333]">号卡报单</h1>
            <div className="w-6" />
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-8 py-16">
          <CheckCircle2 className="h-16 w-16 text-[#52c41a] mb-6" />
          <h2 className="text-xl font-bold text-[#333] mb-2">报单提交成功</h2>
          <p className="text-sm text-[#666] mb-1">订单号：{orderNo}</p>
          <p className="text-sm text-[#999] text-center mb-8">
            等待管理员审核，审核通过后佣金将在订单完成时结算
          </p>
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              className="flex-1 rounded-full h-11"
              onClick={resetForm}
            >
              继续报单
            </Button>
            <Button
              className="flex-1 rounded-full h-11 bg-[#0d6efd] hover:bg-[#0b5ed7]"
              onClick={() => router.push('/agent/orders')}
            >
              查看订单
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="flex items-center h-12 px-4">
          <button onClick={() => router.back()} className="p-1">
            <ArrowLeft className="h-5 w-5 text-[#333]" />
          </button>
          <h1 className="flex-1 text-center text-base font-medium text-[#333]">号卡报单</h1>
          <div className="w-6" />
        </div>
      </div>

      <div className="px-4 py-3 space-y-3">
        {/* 选择号卡商品 */}
        <Card className="bg-white p-4 border-0 shadow-[0_0_20px_rgba(0,0,0,0.05)] rounded-lg">
          <Label className="text-sm font-medium text-[#333] mb-2 block">选择号卡商品 <span className="text-red-500">*</span></Label>
          <button
            onClick={() => setShowProductPicker(true)}
            className={`w-full border-2 border-dashed rounded-lg p-4 flex items-center justify-between transition-colors ${
              selectedProduct ? 'border-[#0d6efd] bg-blue-50/30' : 'border-gray-200'
            }`}
          >
            {selectedProduct ? (
              <>
                <div className="flex items-center gap-3">
                  {selectedProduct.image_url && (
                    <img src={selectedProduct.image_url} alt="" className="w-12 h-12 rounded object-cover" />
                  )}
                  <div className="text-left">
                    <p className="text-sm font-medium text-[#333]">{selectedProduct.name}</p>
                    <p className="text-xs text-[#ff3d63] font-bold">¥{selectedProduct.price}/月</p>
                  </div>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </>
            ) : (
              <>
                <span className="text-sm text-[#999]">请选择号卡商品</span>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </>
            )}
          </button>
          {errors.product_id && <p className="text-xs text-red-500 mt-1">{errors.product_id}</p>}
        </Card>

        {/* 新办号码 */}
        <Card className="bg-white p-4 border-0 shadow-[0_0_20px_rgba(0,0,0,0.05)] rounded-lg">
          <Label className="text-sm font-medium text-[#333] mb-2 block">新办号码 <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <Input
              type="tel"
              placeholder="请输入新办的手机号码"
              value={newPhoneNumber}
              onChange={e => setNewPhoneNumber(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0"
              maxLength={11}
            />
          </div>
          {errors.new_phone_number && <p className="text-xs text-red-500 mt-1">{errors.new_phone_number}</p>}
        </Card>

        {/* 用户姓名 */}
        <Card className="bg-white p-4 border-0 shadow-[0_0_20px_rgba(0,0,0,0.05)] rounded-lg">
          <Label className="text-sm font-medium text-[#333] mb-2 block">用户姓名 <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="请输入用户真实姓名"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0"
            />
          </div>
          {errors.customer_name && <p className="text-xs text-red-500 mt-1">{errors.customer_name}</p>}
        </Card>

        {/* 用户联系方式 */}
        <Card className="bg-white p-4 border-0 shadow-[0_0_20px_rgba(0,0,0,0.05)] rounded-lg">
          <Label className="text-sm font-medium text-[#333] mb-2 block">用户联系方式 <span className="text-red-500">*</span></Label>
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-gray-400" />
            <Input
              type="tel"
              placeholder="请输入用户手机号"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              className="border-0 p-0 h-auto focus-visible:ring-0"
              maxLength={11}
            />
          </div>
          {errors.customer_phone && <p className="text-xs text-red-500 mt-1">{errors.customer_phone}</p>}
        </Card>
      </div>

      {/* 底部固定提交按钮 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
        <Button
          className="w-full h-11 rounded-full bg-[#0d6efd] hover:bg-[#0b5ed7] text-white text-base font-medium"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          提交报单
        </Button>
      </div>

      {/* 商品选择Dialog */}
      <Dialog open={showProductPicker} onOpenChange={setShowProductPicker}>
        <DialogContent className="max-w-sm max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>选择号卡商品</DialogTitle>
          </DialogHeader>
          <div className="px-1 pb-2">
            <Input
              placeholder="搜索商品名称"
              value={productSearch}
              onChange={e => setProductSearch(e.target.value)}
              className="rounded-full"
            />
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 px-1">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => { setSelectedProduct(p); setShowProductPicker(false); }}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-100 hover:border-[#0d6efd] hover:bg-blue-50/30 transition-colors text-left"
              >
                {p.image_url && (
                  <img src={p.image_url} alt="" className="w-14 h-14 rounded object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#333] truncate">{p.name}</p>
                  <p className="text-xs text-[#ff3d63] font-bold mt-0.5">¥{p.price}/月</p>
                  {p.operator && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded mt-1 inline-block"
                      style={{ backgroundColor: `${OPERATOR_COLORS[p.operator]}15`, color: OPERATOR_COLORS[p.operator] }}
                    >
                      {p.operator}
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-center text-sm text-[#999] py-8">暂无商品</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
