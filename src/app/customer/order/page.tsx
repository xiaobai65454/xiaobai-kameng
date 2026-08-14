'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  ChevronLeft,
  ShieldCheck,
  Camera,
  Trash2,
  Check,
  ChevronRight,
  Loader2,
} from 'lucide-react';
import { isValidPhone, isValidIdCard } from '@/lib/validation';
import '../order-flow.css';

// ========== Types ==========
interface ProductSummary {
  id: string;
  name: string;
  monthly_rent: string;
  general_data: number | string;
  operator: string;
}

interface UploadState {
  url: string;       // 上传成功后的图片 URL
  preview: string;   // 本地预览（base64）
  uploading: boolean;
  category: string;
  label: string;
}

export default function OrderPage() {
  return (
    <Suspense fallback={<div className="of-loading">加载中...</div>}>
      <OrderForm />
    </Suspense>
  );
}

function OrderForm() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('productId') || '';
  const refCode = searchParams.get('ref') || '';

  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const [form, setForm] = useState({
    customer_name: '',
    id_card: '',
    customer_phone: '',
    address: '',
    remark: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 4 个上传框状态
  const [uploads, setUploads] = useState<Record<string, UploadState>>({
    id_card_front: { url: '', preview: '', uploading: false, category: 'id_card_front', label: '身份证正面' },
    id_card_back: { url: '', preview: '', uploading: false, category: 'id_card_back', label: '身份证反面' },
    portrait: { url: '', preview: '', uploading: false, category: 'portrait', label: '半身人像照' },
    yztc_screenshot: { url: '', preview: '', uploading: false, category: 'yztc_screenshot', label: '一证通查截图' },
  });

  // 上传框 DOM 引用
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (productId) fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await fetch(`/api/products/${productId}/public`);
      const data = await res.json();
      if (res.ok) {
        setProduct(data.product);
      } else {
        toast({ title: data.error || '商品不存在', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Fetch product error:', error);
    } finally {
      setLoading(false);
    }
  };

  // ===== 图片上传 =====
  const handleFileChange = async (key: string, file: File | null) => {
    if (!file) return;

    // 前端预检：类型 + 大小
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ title: '仅支持 JPG、PNG、WebP 格式', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '图片大小不能超过 5MB', variant: 'destructive' });
      return;
    }

    // 本地预览（先显示，再上传）
    const preview = await readFileAsDataURL(file);
    setUploads((prev) => ({
      ...prev,
      [key]: { ...prev[key], preview, uploading: true },
    }));

    // 上传到后端
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', uploads[key].category);

    try {
      const res = await fetch('/api/upload/public', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploads((prev) => ({
          ...prev,
          [key]: { ...prev[key], url: data.url, uploading: false },
        }));
      } else {
        setUploads((prev) => ({
          ...prev,
          [key]: { ...prev[key], preview: '', uploading: false },
        }));
        toast({ title: data.error || '上传失败', variant: 'destructive' });
      }
    } catch (error) {
      setUploads((prev) => ({
        ...prev,
        [key]: { ...prev[key], preview: '', uploading: false },
      }));
      toast({ title: '上传失败，请重试', variant: 'destructive' });
    }
  };

  const readFileAsDataURL = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleRemove = (key: string) => {
    setUploads((prev) => ({
      ...prev,
      [key]: { ...prev[key], url: '', preview: '' },
    }));
    if (fileRefs.current[key]) fileRefs.current[key].value = '';
  };

  // ===== 表单更新 =====
  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // ===== 提交订单 =====
  const handleSubmit = async () => {
    // 校验必填字段
    const newErrors: Record<string, string> = {};
    if (form.customer_name.trim().length < 2 || form.customer_name.trim().length > 20) {
      newErrors.customer_name = '姓名长度应为2-20个字符';
    }
    if (!isValidIdCard(form.id_card.trim())) {
      newErrors.id_card = '请输入正确的18位身份证号码';
    }
    if (!isValidPhone(form.customer_phone.trim())) {
      newErrors.customer_phone = '请输入正确的11位手机号码';
    }
    if (form.address.trim().length < 5) {
      newErrors.address = '请输入详细收货地址（至少5个字）';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast({ title: '请检查填写信息', variant: 'destructive' });
      return;
    }

    // 校验 4 张图片
    const requiredKeys = ['id_card_front', 'id_card_back', 'portrait', 'yztc_screenshot'];
    const missing = requiredKeys.filter((key) => !uploads[key].url);
    if (missing.length > 0) {
      toast({ title: '请上传完整的实名认证材料', description: '身份证正反面、半身照、一证通查截图', variant: 'destructive' });
      return;
    }

    if (!agreed) {
      toast({ title: '请先阅读并同意办理协议', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/orders/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: productId,
          customer_name: form.customer_name.trim(),
          id_card: form.id_card.trim(),
          customer_phone: form.customer_phone.trim(),
          address: form.address.trim(),
          remark: form.remark.trim() || undefined,
          ref_code: refCode || undefined,
          id_card_front_url: uploads.id_card_front.url,
          id_card_back_url: uploads.id_card_back.url,
          portrait_url: uploads.portrait.url,
          yztc_screenshot_url: uploads.yztc_screenshot.url,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowSuccess(true);
      } else {
        toast({ title: '提交失败', description: data.error || '请稍后重试', variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: '提交失败', description: '网络错误，请稍后重试', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleYztc = () => {
    toast({ title: '即将跳转一证通查', description: '请完成查询后截图上传' });
  };

  if (loading) {
    return <div className="of-loading">加载中...</div>;
  }

  if (!product) {
    return <div className="of-loading">商品不存在或已下架</div>;
  }

  return (
    <div className="of-page">
      <div className="of-container">
        {/* ===== 顶部导航 ===== */}
        <div className="of-nav">
          <button className="of-nav-back" onClick={() => router.back()}>
            <ChevronLeft size={20} />
          </button>
          <span className="of-nav-title">填写订单信息</span>
          <span className="of-nav-badge">步骤 2/2</span>
        </div>

        {/* ===== 进度步骤 ===== */}
        <div className="of-steps">
          <div className="of-step done">
            <div className="of-step-dot">1</div>
            <span>确认套餐</span>
          </div>
          <div className="of-step-line done" />
          <div className="of-step active">
            <div className="of-step-dot">2</div>
            <span>填写信息</span>
          </div>
        </div>

        {/* ===== 套餐摘要卡 ===== */}
        <div className="of-summary">
          <div>
            <div className="of-summary-name">
              <span className="of-summary-tag">5G</span>
              {product.name}
            </div>
            <div className="of-summary-spec">
              {Number(product.general_data) || 0}G通用流量 · {product.monthly_rent}元/月
            </div>
          </div>
          <div className="of-summary-price">
            <span className="of-summary-currency">¥</span>
            <span className="of-summary-amount">{product.monthly_rent}</span>
            <div className="of-summary-unit">/月</div>
          </div>
        </div>

        {/* ===== 收货人信息 ===== */}
        <div className="of-form-card">
          <div className="of-form-header">
            <span className="of-form-num">1</span>
            收货人信息
            <span className="of-form-tip">全部必填</span>
          </div>

          <div className="of-field">
            <label>姓名<span className="req">*</span></label>
            <input
              className={`of-input ${errors.customer_name ? 'error' : ''}`}
              placeholder="请填写收货人真实姓名"
              maxLength={20}
              value={form.customer_name}
              onChange={(e) => updateField('customer_name', e.target.value)}
            />
            {errors.customer_name && <div className="of-field-error show">{errors.customer_name}</div>}
          </div>

          <div className="of-field">
            <label>身份证号码<span className="req">*</span></label>
            <input
              className={`of-input ${errors.id_card ? 'error' : ''}`}
              placeholder="请填写18位身份证号码"
              maxLength={18}
              value={form.id_card}
              onChange={(e) => updateField('id_card', e.target.value.replace(/[^\dXx]/g, '').toUpperCase())}
            />
            {errors.id_card && <div className="of-field-error show">{errors.id_card}</div>}
          </div>

          <div className="of-field">
            <label>收货电话<span className="req">*</span></label>
            <input
              className={`of-input ${errors.customer_phone ? 'error' : ''}`}
              placeholder="请填写11位手机号码"
              maxLength={11}
              inputMode="numeric"
              value={form.customer_phone}
              onChange={(e) => updateField('customer_phone', e.target.value.replace(/[^\d]/g, ''))}
            />
            {errors.customer_phone && <div className="of-field-error show">{errors.customer_phone}</div>}
          </div>

          <div className="of-field">
            <label>收货地址<span className="req">*</span></label>
            <textarea
              className={`of-input ${errors.address ? 'error' : ''}`}
              placeholder="请填写省市区及详细收货地址"
              value={form.address}
              onChange={(e) => updateField('address', e.target.value)}
            />
            {errors.address && <div className="of-field-error show">{errors.address}</div>}
          </div>
        </div>

        {/* ===== 身份证照片 ===== */}
        <div className="of-form-card">
          <div className="of-form-header">
            <span className="of-form-num">2</span>
            身份证照片
            <span className="of-form-tip">用于实名认证</span>
          </div>

          <div className="of-upload-grid two-col">
            {(['id_card_front', 'id_card_back'] as const).map((key) => (
              <UploadBox
                key={key}
                ratio="ratio-id"
                corner={uploads[key].label}
                text={`上传${uploads[key].label}`}
                state={uploads[key]}
                onPick={() => fileRefs.current[key]?.click()}
                onRemove={() => handleRemove(key)}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[key] = el; }}
                  onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                />
              </UploadBox>
            ))}
          </div>
        </div>

        {/* ===== 人像与验证截图 ===== */}
        <div className="of-form-card">
          <div className="of-form-header">
            <span className="of-form-num">3</span>
            人像与验证截图
            <span className="of-form-tip">全部必填</span>
          </div>

          <div className="of-yztc-entry" onClick={handleYztc}>
            <ShieldCheck size={18} />
            <span className="of-yztc-text">
              先完成 <strong>一证通查</strong> 查询，再上传截图
            </span>
            <ChevronRight size={14} className="of-yztc-arrow" />
          </div>

          <div className="of-upload-grid two-col">
            {(['portrait', 'yztc_screenshot'] as const).map((key) => (
              <UploadBox
                key={key}
                ratio="ratio-portrait"
                corner={uploads[key].label}
                text={`上传${uploads[key].label}`}
                state={uploads[key]}
                onPick={() => fileRefs.current[key]?.click()}
                onRemove={() => handleRemove(key)}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => { fileRefs.current[key] = el; }}
                  onChange={(e) => handleFileChange(key, e.target.files?.[0] || null)}
                />
              </UploadBox>
            ))}
          </div>
        </div>

        {/* ===== 协议勾选 ===== */}
        <div className="of-agreement" onClick={() => setAgreed(!agreed)}>
          <div className={`of-checkbox ${agreed ? 'checked' : ''}`}>
            {agreed && <Check size={12} />}
          </div>
          <div className="of-agreement-text">
            我已阅读并同意<a href="#" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toast({ title: '办理协议' }); }}>《号卡办理协议》</a>，
            本人承诺所填信息真实有效，且该号卡仅供本人使用，不转卖、不租借，不用于任何违法犯罪活动。
          </div>
        </div>
      </div>

      {/* ===== 底部提交栏 ===== */}
      <div className="of-bottom-bar">
        <div className="of-total">
          <span className="of-total-label">月租</span>
          <span className="of-total-value"><span className="currency">¥</span>{product.monthly_rent}</span>
        </div>
        <button className="of-submit-btn" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <><Loader2 size={16} className="animate-spin" /> 提交中...</> : <>提交订单</>}
        </button>
      </div>

      {/* ===== 成功弹窗 ===== */}
      {showSuccess && (
        <div className="of-modal-overlay">
          <div className="of-modal">
            <div className="of-modal-icon"><Check size={30} /></div>
            <div className="of-modal-title">订单提交成功！</div>
            <div className="of-modal-desc">
              我们将在1-3个工作日内审核您的资料，<br />
              审核通过后为您寄出号卡，请留意短信通知。
            </div>
            <button className="of-modal-btn" onClick={() => router.push('/customer/success')}>
              查看订单
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== 上传框子组件 =====
function UploadBox({
  ratio,
  corner,
  text,
  state,
  onPick,
  onRemove,
  children,
}: {
  ratio: string;
  corner: string;
  text: string;
  state: UploadState;
  onPick: () => void;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  const { preview, uploading, url } = state;
  const hasImage = !!preview;

  return (
    <div
      className={`of-upload-box ${ratio} ${hasImage ? 'has-image' : ''}`}
      onClick={onPick}
    >
      {children}
      {!hasImage && (
        <>
          {uploading ? (
            <>
              <Loader2 size={26} className="animate-spin" style={{ color: '#999', marginBottom: 6 }} />
              <span className="of-upload-text">上传中...</span>
            </>
          ) : (
            <>
              <Camera size={26} className="of-upload-icon" />
              <span className="of-upload-text">{text}</span>
              <span className="of-upload-sub">点击拍摄或选择</span>
            </>
          )}
        </>
      )}
      {hasImage && (
        <>
          <img src={preview} alt={corner} />
          {url && (
            <div className="of-upload-badge"><Check size={13} /></div>
          )}
          <button
            className="of-upload-delete"
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
          >
            <Trash2 size={12} />
          </button>
        </>
      )}
      <span className="of-upload-corner">{corner}</span>
    </div>
  );
}
