'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import {
  Home,
  Share2,
  Search,
  ListOrdered,
  ShieldCheck,
  Receipt,
  ShoppingBag,
  FireExtinguisher,
  BadgeCheck,
} from 'lucide-react';
import '../order-flow.css';

// ========== Types ==========
interface ProductDetail {
  id: string;
  name: string;
  operator: string;
  monthly_rent: string;
  original_rent: string;
  general_data: number | string;
  directed_data: number | string;
  call_minutes: number | string;
  sms_count: number | string;
  contract_months: number | string;
  first_charge_amount: string;
  extra_data_price: string;
  extra_call_price: string;
  delivery_scope: string | null;
  package_detail: string | null;
  notice: string | null;
  activation_type: string | null;
  first_month_free: boolean;
  tags: string | null;
  image_url: string | null;
}

// 运营商中文名映射
const operatorNames: Record<string, string> = {
  unicom: '中国联通',
  telecom: '中国电信',
  mobile: '中国移动',
  broadnet: '中国广电',
  '联通': '中国联通',
  '电信': '中国电信',
  '移动': '中国移动',
  '广电': '中国广电',
};

export default function ProductDetailPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';
  const productId = params.id;

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWarning, setShowWarning] = useState(true);

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

  const handleOrder = () => {
    const q = new URLSearchParams({ productId });
    if (refCode) q.set('ref', refCode);
    router.push(`/customer/order?${q.toString()}`);
  };

  const handleShare = () => {
    const q = new URLSearchParams({ productId });
    if (refCode) q.set('ref', refCode);
    const link = `${window.location.origin}/customer/product/${productId}?${q.toString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        toast({ title: '分享链接已复制' });
      }).catch(() => toast({ title: '分享链接', description: link }));
    } else {
      toast({ title: '分享链接', description: link });
    }
  };

  const handleYztc = () => {
    // 工信部一证通查（外部跳转）
    toast({ title: '即将跳转一证通查', description: '请完成查询后截图保存' });
  };

  if (loading) {
    return <div className="of-loading">加载中...</div>;
  }

  if (!product) {
    return <div className="of-loading">商品不存在或已下架</div>;
  }

  const operatorName = operatorNames[product.operator] || product.operator;
  const tags = (product.tags || '').split(',').filter(Boolean);
  const generalData = Number(product.general_data) || 0;
  const smsCount = Number(product.sms_count) || 0;

  return (
    <div className="of-page">
      <div className="of-container">
        {/* ===== 紫色渐变 Hero Banner ===== */}
        <div className="of-hero">
          <div className="of-hero-top">
            <div className="of-brand">
              <div className="of-brand-logo">5G</div>
              <div>
                <div className="of-brand-name">{operatorName}</div>
                <div className="of-brand-sub">官方授权</div>
              </div>
              <div className="of-brand-divider" />
              <span className="of-product-tag">{product.name.split(/[【\[]/)[0] || '号卡'}</span>
            </div>
            <button className="of-home-btn" onClick={() => router.push('/customer')}>
              首页
            </button>
          </div>

          <div className="of-hero-center">
            <div className="of-big-number">{generalData}G</div>
            <div className="of-big-unit">
              <span>通用</span>
              <span>流量</span>
            </div>
          </div>

          <div className="of-hero-features">
            <span className="of-hero-chip">赠送入网体验金</span>
          </div>
          <div className="of-hero-features">
            <span className="of-hero-chip">官方套餐</span>
            <span className="of-hero-chip">正规可查</span>
          </div>

          <div className="of-hero-cta">
            <FireExtinguisher size={14} />
            激活当月专属渠道充值{Number(product.first_charge_amount) || 100}元
          </div>
        </div>

        {/* ===== 价格卡片 ===== */}
        <div className="of-price-card">
          <div className="of-price-inner">
            <div className="of-price-left">
              <div className="of-price-label">优惠月租</div>
              <div className="of-price-value">
                <span className="currency">¥</span>
                <span className="amount">{product.monthly_rent}</span>
              </div>
              <div className="of-price-condition">激活当月专属渠道充值{Number(product.first_charge_amount) || 100}元</div>
            </div>
            <div className="of-price-right">
              <div className="of-price-orig-label">原套餐月租</div>
              <div className="of-price-orig">¥{product.original_rent || product.monthly_rent}</div>
            </div>
          </div>
        </div>

        {/* ===== 认证徽章 ===== */}
        <div className="of-auth-badge">
          <div className="of-auth-icon"><ShieldCheck size={14} /></div>
          <div className="of-auth-text">官方授权保障，售后无忧</div>
        </div>

        {/* ===== 商品标题 ===== */}
        <div className="of-title-card">
          <div className="of-title">{product.name}</div>
          <div className="of-tags">
            {product.delivery_scope && <span className="of-tag">{product.delivery_scope}</span>}
            {tags.map((tag) => (
              <span key={tag} className="of-tag">{tag}</span>
            ))}
          </div>
        </div>

        {/* ===== 数据三宫格 ===== */}
        <div className="of-stats">
          <div className="of-stat-item">
            <div className="of-stat-value">{generalData}G</div>
            <div className="of-stat-label">通用流量</div>
          </div>
          <div className="of-stat-item">
            <div className="of-stat-value">{Number(product.directed_data) || 0}G</div>
            <div className="of-stat-label">定向流量</div>
          </div>
          <div className="of-stat-item">
            <div className="of-stat-value">{Number(product.call_minutes) || 0}分钟</div>
            <div className="of-stat-label">通话时长</div>
          </div>
        </div>

        {/* ===== 操作按钮行 ===== */}
        <div className="of-actions">
          <button className="of-action-btn" onClick={handleShare}>
            <Share2 size={18} color="#ff5800" />
            <span>分享</span>
          </button>
          <button className="of-action-btn" onClick={handleYztc}>
            <Search size={18} color="#ff5800" />
            <span>查名下卡</span>
          </button>
          <button className="of-action-btn" onClick={() => toast({ title: '商品详情' })}>
            <ListOrdered size={18} color="#ff5800" />
            <span>商品详情</span>
          </button>
        </div>

        {/* ===== 紫色套餐详情卡 ===== */}
        <div className="of-package-card">
          <div className="of-package-header">
            <div className="of-package-tabs">
              <div className="of-package-tab active">月租</div>
              <div className="of-package-tab">全国流量</div>
              <div className="of-package-tab">通话</div>
            </div>
            <div className="of-package-5g">5G</div>
          </div>

          <div className="of-package-data-row">
            <div className="of-package-data-item">
              <div className="of-package-data-value">{product.monthly_rent}<span className="small">元/月</span></div>
              <div className="of-package-data-label">月租</div>
            </div>
            <div className="of-package-data-item">
              <div className="of-package-data-value">{generalData}G</div>
              <div className="of-package-data-label">通用流量</div>
            </div>
            <div className="of-package-data-item">
              <div className="of-package-data-value">{product.extra_call_price || '0.15'}<span className="small">元/分</span></div>
              <div className="of-package-data-label">通话</div>
            </div>
            <div className="of-package-data-item">
              <div className="of-package-data-value">{smsCount}条</div>
              <div className="of-package-data-label">短信</div>
            </div>
          </div>

          {product.package_detail && (
            <div className="of-package-section">
              <div className="of-package-section-title">资费介绍</div>
              <div className="of-package-content">{product.package_detail}</div>
            </div>
          )}

          {product.first_month_free && (
            <div className="of-package-warning">
              参与活动后首月免租，之后月租{product.monthly_rent}元/月含{generalData}G通用流量
            </div>
          )}

          {product.notice && (
            <div className="of-package-section">
              <div className="of-package-section-title">下单须知</div>
              <div className="of-package-content">{product.notice}</div>
            </div>
          )}

          <div className="of-package-list">
            温馨提示：{product.activation_type || '收货后本人持身份证到营业厅激活'}；号卡将免费邮寄到您填写的地址。
          </div>
        </div>

        {/* ===== 温馨提示卡 ===== */}
        <div className="of-tips-card">
          <div className="of-tips-header">
            <BadgeCheck size={15} />
            温馨提示
          </div>
          <div className="of-tips-body">
            {`① 公安部提示：请勿将已登记您本人身份证信息的号卡用于诈骗等不合法行为\n② 请勿将号卡进行转卖、租借他人使用\n③ 请及时挂失、注销已丢失号卡，保护个人信息安全\n④ 涉嫌诈骗等违法犯罪行为等号码，实名登记机主需承担法律责任`}
          </div>
        </div>

        {/* ===== 合规警示条 ===== */}
        <div className="of-compliance">
          <div className="of-compliance-title">
            <ShieldCheck size={14} />
            合规警示
          </div>
          <div className="of-compliance-list">
            · 禁止买卖电话卡 · 严禁利用电话卡从事违法犯罪活动 · 工信部监管·实名认证
          </div>
        </div>
      </div>

      {/* ===== 底部 Tab 栏 ===== */}
      <div className="of-tabbar">
        <button className="of-tab-item" onClick={() => router.push('/customer')}>
          <Home size={18} />
          <span>首页</span>
        </button>
        <button className="of-tab-item" onClick={() => toast({ title: '查看我的订单' })}>
          <Receipt size={18} />
          <span>订单</span>
        </button>
        <button className="of-tab-cta" onClick={handleOrder}>
          <ShoppingBag size={16} />
          &nbsp;免费领取
        </button>
      </div>

      {/* ===== 公安警示弹窗 ===== */}
      {showWarning && (
        <div className="of-modal-overlay" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div
            style={{
              background: '#4caf50',
              borderRadius: 12,
              padding: '24px 20px',
              maxWidth: 340,
              width: '100%',
              color: '#fff',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>温馨提示 👮</div>
            <div style={{ fontSize: 14, lineHeight: 1.7, textAlign: 'left', marginBottom: 20, color: 'rgba(255,255,255,0.95)' }}>
              公安部提示：请勿将已登记您本人身份证信息的号卡用于诈骗等不合法行为，请勿将号卡进行转卖、租借他人使用，请及时挂失、注销已丢失号卡，保护个人信息安全。涉嫌诈骗等违法犯罪行为等号码，实名登记机主需承担法律责任。
            </div>
            <button
              onClick={() => setShowWarning(false)}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.95)',
                color: '#2e7d32',
                border: 'none',
                padding: 14,
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              我已知晓，并承诺本人使用
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
