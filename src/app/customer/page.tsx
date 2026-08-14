'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import './customer-page.css';

// ========== Types ==========
interface Product {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  monthly_rent: string;
  general_data: number | string;
  directed_data: number | string;
  call_minutes: number;
  validity_months: number;
  age_limit: string | null;
  area_limit: string | null;
  status: string;
  tags: string | null;
  image_url: string | null;
  promo_url: string | null;
  sort_order: number | null;
}

// ========== Operator Config ==========
const operatorConfig: Record<string, { name: string; icon: string; color: string; bg: string }> = {
  unicom: { name: '联通', icon: 'bi-1-circle-fill', color: 'operator-unicom', bg: 'linear-gradient(135deg, #f5222d 0%, #ff7875 100%)' },
  telecom: { name: '电信', icon: 'bi-2-circle-fill', color: 'operator-telecom', bg: 'linear-gradient(135deg, #1890ff 0%, #69b1ff 100%)' },
  mobile: { name: '移动', icon: 'bi-3-circle-fill', color: 'operator-mobile', bg: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' },
  broadnet: { name: '广电', icon: 'bi-4-circle-fill', color: 'operator-broadnet', bg: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)' },
  // Chinese name fallback
  '联通': { name: '联通', icon: 'bi-1-circle-fill', color: 'operator-unicom', bg: 'linear-gradient(135deg, #f5222d 0%, #ff7875 100%)' },
  '电信': { name: '电信', icon: 'bi-2-circle-fill', color: 'operator-telecom', bg: 'linear-gradient(135deg, #1890ff 0%, #69b1ff 100%)' },
  '移动': { name: '移动', icon: 'bi-3-circle-fill', color: 'operator-mobile', bg: 'linear-gradient(135deg, #52c41a 0%, #95de64 100%)' },
  '广电': { name: '广电', icon: 'bi-4-circle-fill', color: 'operator-broadnet', bg: 'linear-gradient(135deg, #722ed1 0%, #b37feb 100%)' },
};

const tagColors = [
  { bg: '#f0f9ff', text: '#1890ff' },
  { bg: '#f6ffed', text: '#52c41a' },
  { bg: '#fff7e6', text: '#fa8c16' },
  { bg: '#fff2f0', text: '#f5222d' },
  { bg: '#f9f0ff', text: '#722ed1' },
];

// ========== Site Config (from backend) ==========
interface SiteConfig {
  site_name: string;
  site_description: string;
  customer_service_wechat: string;
  customer_service_url: string;
  order_query_url: string;
  logistics_query_url: string;
  shop_rating: string;
  shop_badge: string;
  banner_title: string;
  banner_subtitle: string;
  notice_items: string;
  auth_badge_1: string;
  auth_badge_2: string;
  auth_badge_3: string;
  auth_badge_4: string;
}

const defaultConfig: SiteConfig = {
  site_name: '小白卡盟',
  site_description: '专业号卡分销平台',
  customer_service_wechat: 'xiaobai-kameng',
  customer_service_url: '',
  order_query_url: '',
  logistics_query_url: '',
  shop_rating: '4.98',
  shop_badge: '官方正品保障',
  banner_title: '小白卡盟',
  banner_subtitle: '四运营商全品类 | 官方授权 | 极速开卡',
  notice_items: '官方授权 正品保障 四运营商全覆盖|联通惠派卡限时活动 月租低至9元|支持选号 实名认证 极速开卡|全国发货 免邮到家 售后无忧',
  auth_badge_1: '官方授权',
  auth_badge_2: '实名认证',
  auth_badge_3: '极速开卡',
  auth_badge_4: '售后保障',
};

function CustomerPageInner() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [operatorFilter, setOperatorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);

  // Fetch site config from backend (public, no auth required)
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/system-config/public');
      if (res.ok) {
        const data = await res.json();
        const cfg = data.data || {};
        setConfig({
          ...defaultConfig,
          ...Object.fromEntries(
            Object.entries(cfg).filter(([, v]) => v !== null && v !== undefined)
          ),
        });
      }
    } catch (error) {
      console.error('Fetch config error:', error);
    }
  };

  // Fetch products from API
  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams({ status: 'active' });
      const res = await fetch(`/api/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Fetch products error:', error);
      toast({ title: '加载失败', description: '请稍后重试', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchProducts();
  }, []);

  // Scroll listener for back-to-top button
  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Parse product for display
  const parsedProducts = useMemo(() => {
    return products.map(p => {
      const tags = p.tags ? p.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const isTopping = tags.some(t => t.includes('主推') || t.includes('热销'));
      const operatorKey = p.operator || '';
      const op = operatorConfig[operatorKey] || operatorConfig.unicom;

      // Parse age limit
      let ageMin = 18, ageMax = 60;
      if (p.age_limit) {
        const match = p.age_limit.match(/(\d+)\s*[-~]\s*(\d+)/);
        if (match) {
          ageMin = parseInt(match[1]);
          ageMax = parseInt(match[2]);
        }
      }

      // Detect type from tags or name
      let type: 'card' | 'broadband' | 'device' = 'card';
      if (tags.some(t => t.includes('宽带')) || p.name.includes('宽带')) type = 'broadband';
      else if (tags.some(t => t.includes('设备')) || p.name.includes('设备')) type = 'device';

      // Detect support number & need photo from tags
      const supportNumber = tags.some(t => t.includes('选号') || t.includes('自选'));
      const needPhoto = tags.some(t => t.includes('照片') || t.includes('拍照'));

      return {
        ...p,
        parsedTags: tags,
        isTopping,
        operatorName: op.name,
        operatorIcon: op.icon,
        operatorColor: op.color,
        operatorBg: op.bg,
        ageMin,
        ageMax,
        type,
        supportNumber,
        needPhoto,
        monthlyRent: parseFloat(p.monthly_rent || '0'),
        generalData: Number(p.general_data) || 0,
        directedData: Number(p.directed_data) || 0,
        callMinutes: Number(p.call_minutes) || 0,
      };
    });
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = parsedProducts;

    if (operatorFilter !== 'all') {
      filtered = filtered.filter(p => {
        const op = p.operator || '';
        return op === operatorFilter ||
               operatorConfig[op]?.name === operatorConfig[operatorFilter]?.name;
      });
    }

    if (typeFilter) {
      filtered = filtered.filter(p => p.type === typeFilter);
    }

    if (searchKeyword) {
      const kw = searchKeyword.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(kw) ||
        (p.description || '').toLowerCase().includes(kw) ||
        String(p.monthlyRent).includes(kw)
      );
    }

    // Sort: topping first, then by sort_order
    return filtered.sort((a, b) => {
      if (a.isTopping && !b.isTopping) return -1;
      if (!a.isTopping && b.isTopping) return 1;
      return (a.sort_order || 0) - (b.sort_order || 0);
    });
  }, [parsedProducts, operatorFilter, typeFilter, searchKeyword]);

  // Actions
  const handleOrder = (product: typeof parsedProducts[0]) => {
    const params = new URLSearchParams();
    if (refCode) params.set('ref', refCode);
    router.push(`/customer/product/${product.id}?${params.toString()}`);
  };

  const handleShare = (product: typeof parsedProducts[0]) => {
    const params = new URLSearchParams();
    if (refCode) params.set('ref', refCode);
    const link = `${window.location.origin}/customer/product/${product.id}?${params.toString()}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        toast({ title: '分享链接已复制', description: '快去分享给好友吧' });
      }).catch(() => {
        toast({ title: '分享链接', description: link });
      });
    } else {
      toast({ title: '分享链接', description: link });
    }
  };

  const handlePromoUrl = (product: typeof parsedProducts[0]) => {
    if (product.promo_url) {
      window.open(product.promo_url, '_blank');
    } else {
      handleOrder(product);
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const showToastMsg = (msg: string) => toast({ title: msg });

  // Smart link handlers — use backend config to decide jump or toast
  const handleCustomerService = () => {
    if (config.customer_service_url) {
      window.open(config.customer_service_url, '_blank');
    } else {
      showToastMsg(`客服微信：${config.customer_service_wechat}`);
    }
  };

  const handleOrderQuery = () => {
    if (config.order_query_url) {
      window.open(config.order_query_url, '_blank');
    } else {
      showToastMsg('请输入手机号查询订单');
    }
  };

  const handleLogistics = () => {
    if (config.logistics_query_url) {
      window.open(config.logistics_query_url, '_blank');
    } else {
      showToastMsg('号卡物流查询');
    }
  };

  // Parse notice items from config (pipe-separated)
  const noticeItems = useMemo(() => {
    return config.notice_items
      .split('|')
      .map(s => s.trim())
      .filter(Boolean);
  }, [config.notice_items]);

  // ========== Render ==========
  return (
    <div className="customer-page-wrapper" style={{ minHeight: '100vh', background: '#f0f0f0' }}>
      <div className="customer-page">
        {/* Bootstrap Icons */}
        <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css" rel="stylesheet" />

        {/* Header */}
        <div className="customer-header">
          {/* Search */}
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="搜索套餐名称、月租、流量..."
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <button className="search-btn" onClick={() => {
              if (searchKeyword) showToastMsg('搜索: ' + searchKeyword);
            }}>
              <i className="bi bi-search"></i> 搜索
            </button>
          </div>

          {/* Shop Info */}
          <div className="shop-info-container">
            <div style={{ flex: 1 }}>
              <div className="shop-name">
                {config.site_name} <i className="bi bi-patch-check-fill" style={{ color: '#0d6efd', fontSize: '14px' }}></i>
              </div>
              <div className="shop-rating-container">
                <span className="shop-reputation">店铺口碑 {config.shop_rating}</span>
                <span className="shop-badge">{config.shop_badge}</span>
              </div>
            </div>
            <div className="shop-info-right">
              <button className="shop-action-btn" onClick={handleCustomerService}>
                <i className="bi bi-headset"></i>
                <span>客服</span>
              </button>
              <button className="shop-action-btn" onClick={handleOrderQuery}>
                <i className="bi bi-search"></i>
                <span>查单</span>
              </button>
              <button className="shop-action-btn" onClick={handleLogistics}>
                <i className="bi bi-truck"></i>
                <span>物流</span>
              </button>
              <button className="shop-action-btn" onClick={() => router.push('/customer')}>
                <i className="bi bi-shop"></i>
                <span>店铺</span>
              </button>
            </div>
          </div>

          {/* Banner */}
          <div className="customer-banner">
            <div className="banner-img">
              <div className="banner-text">
                {config.banner_title}
                <div className="sub">{config.banner_subtitle}</div>
              </div>
            </div>
          </div>

          {/* Auth Banner */}
          <div className="auth-banner">
            <span><i className="bi bi-shield-check"></i> {config.auth_badge_1}</span>
            <span><i className="bi bi-lock"></i> {config.auth_badge_2}</span>
            <span><i className="bi bi-lightning-charge"></i> {config.auth_badge_3}</span>
            <span><i className="bi bi-headset"></i> {config.auth_badge_4}</span>
          </div>
        </div>

        {/* Filter */}
        <div className="filter-container">
          <div className="filter-row">
            <div className="filter-group">
              <i className="bi bi-geo-alt" style={{ color: '#ff5000', fontSize: '14px' }}></i>
              <button className="filter-select-btn" onClick={() => showToastMsg('选择收货地')}>
                收货地 <i className="bi bi-chevron-down"></i>
              </button>
            </div>
            <div className="filter-group">
              <i className="bi bi-currency-yen" style={{ color: '#2290fe', fontSize: '14px' }}></i>
              <button className="filter-select-btn" onClick={() => showToastMsg('筛选: 全部 / 20元以下 / 20-30元 / 30-40元 / 40元以上')}>
                优惠月租 <i className="bi bi-chevron-down"></i>
              </button>
            </div>
            <div className="filter-group">
              <i className="bi bi-wifi" style={{ color: '#0090ff', fontSize: '14px' }}></i>
              <button className="filter-select-btn" onClick={() => showToastMsg('筛选: 全部 / 100GB以下 / 100-200GB / 200GB以上')}>
                可用流量 <i className="bi bi-chevron-down"></i>
              </button>
            </div>
            <div className="filter-group">
              <i className="bi bi-telephone" style={{ color: '#1296db', fontSize: '14px' }}></i>
              <button className="filter-select-btn" onClick={() => showToastMsg('筛选: 全部 / 100分钟以内 / 100-200分钟 / 200分钟以上')}>
                通话时长 <i className="bi bi-chevron-down"></i>
              </button>
            </div>
          </div>

          {/* Operator Filter */}
          <div className="filter-buttons">
            <button className={`filter-button ${operatorFilter === 'all' ? 'active' : ''}`} onClick={() => setOperatorFilter('all')}>精选</button>
            <button className={`filter-button ${operatorFilter === 'telecom' ? 'active' : ''}`} onClick={() => setOperatorFilter('telecom')}>电信</button>
            <button className={`filter-button ${operatorFilter === 'unicom' ? 'active' : ''}`} onClick={() => setOperatorFilter('unicom')}>联通</button>
            <button className={`filter-button ${operatorFilter === 'mobile' ? 'active' : ''}`} onClick={() => setOperatorFilter('mobile')}>移动</button>
            <button className={`filter-button ${operatorFilter === 'broadnet' ? 'active' : ''}`} onClick={() => setOperatorFilter('broadnet')}>广电</button>
          </div>

          {/* Card Type Filter */}
          <div className="filter-buttons">
            <button className={`card-type-button ${typeFilter === '' ? 'active' : ''}`} onClick={() => setTypeFilter('')}>全部</button>
            <button className={`card-type-button ${typeFilter === 'card' ? 'active' : ''}`} onClick={() => setTypeFilter('card')}>号卡</button>
            <button className={`card-type-button ${typeFilter === 'broadband' ? 'active' : ''}`} onClick={() => setTypeFilter('broadband')}>宽带</button>
            <button className={`card-type-button ${typeFilter === 'device' ? 'active' : ''}`} onClick={() => setTypeFilter('device')}>设备</button>
          </div>
        </div>

        {/* Notice Bar */}
        <div className="notice-bar">
          <i className="bi bi-megaphone-fill notice-icon"></i>
          <div className="notice-scroll-area">
            <div className="notice-track">
              {noticeItems.concat(noticeItems).map((item, i) => (
                <span key={i} className="notice-item">
                  {i % 3 === 0 ? '📢' : i % 3 === 1 ? '🔥' : '💎'} {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Product List */}
        <div className="product-list">
          {loading ? (
            <div className="loading-skeleton">
              {[1, 2, 3].map(i => (
                <div key={i} className="skeleton-card">
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <div className="skeleton-line" style={{ width: '80px', height: '80px', borderRadius: '4px' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div className="skeleton-line" style={{ height: '16px', width: '60%' }} />
                      <div className="skeleton-line" style={{ height: '12px', width: '80%' }} />
                      <div className="skeleton-line" style={{ height: '12px', width: '40%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <div className="skeleton-line" style={{ flex: 1, height: '40px' }} />
                    <div className="skeleton-line" style={{ flex: 1, height: '40px' }} />
                    <div className="skeleton-line" style={{ flex: 1, height: '40px' }} />
                    <div className="skeleton-line" style={{ flex: 1, height: '40px' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="empty-state">
              <i className="bi bi-inbox"></i>
              <div>暂无符合条件的商品</div>
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id} className="card-item">
                {product.isTopping && <div className="topping-tag">主推</div>}
                <div className={`operator-icon ${product.operatorColor}`}>
                  {product.operatorName[0]}
                </div>

                <div className="card-actionsh">
                  <div className="card-image" style={{ background: product.operatorBg }}>
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} loading="lazy" />
                    ) : (
                      <i className={`bi ${product.operatorIcon}`}></i>
                    )}
                  </div>
                  <div className="card-info">
                    <div className="card-title">{product.name}</div>
                    <div className="card-desc">{product.description || `${product.monthlyRent}月租 ${product.generalData}G流量`}</div>
                    <div className="card-features-inline">
                      <div className={`feature-badge ${product.supportNumber ? 'badge-green' : 'badge-blue'}`}>
                        <i className={`bi ${product.supportNumber ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        {product.supportNumber ? '支持选号' : '无需选号'}
                      </div>
                      <div className={`feature-badge ${product.needPhoto ? 'badge-orange' : 'badge-green'}`}>
                        <i className={`bi ${product.needPhoto ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
                        {product.needPhoto ? '需传照片' : '无需照片'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card-features">
                  <div className="feature-item">
                    <div className="feature-value price">¥{product.monthlyRent}</div>
                    <div className="feature-label">每月月租</div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-value">{product.generalData}G</div>
                    <div className="feature-label">通用流量</div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-value">{product.directedData}G</div>
                    <div className="feature-label">定向流量</div>
                  </div>
                  <div className="feature-item">
                    <div className="feature-value">{product.callMinutes}</div>
                    <div className="feature-label">通话分钟</div>
                  </div>
                </div>

                <div className="card-actions">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div className="card-age">
                      <i className="bi bi-person-check-fill"></i> {product.ageMin}-{product.ageMax}周岁
                    </div>
                  </div>
                  <div className="card-actions-right">
                    <button className="btn-share" onClick={() => handleShare(product)}>
                      <i className="bi bi-share"></i> 分享
                    </button>
                    <button className="btn-buy" onClick={() => handlePromoUrl(product)}>
                      <i className="bi bi-bag-check"></i> 立即办理
                    </button>
                  </div>
                </div>

                {product.parsedTags.length > 0 && (
                  <div className="card-tags">
                    {product.parsedTags.map((tag, i) => {
                      const c = tagColors[i % tagColors.length];
                      return (
                        <span key={i} className="card-tag" style={{ background: c.bg, color: c.text }}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                )}

                {product.area_limit && (
                  <div className="card-remark">
                    <i className="bi bi-info-circle"></i> {product.area_limit}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Floating Buttons */}
      {showBackToTop && (
        <button className="floating-button" onClick={scrollToTop} title="回到顶部">
          <i className="bi bi-arrow-up"></i>
        </button>
      )}
      <button
        className="floating-button"
        onClick={handleCustomerService}
        style={{ background: 'linear-gradient(135deg, #52c41a, #73d13d)' }}
        title="联系客服"
      >
        <i className="bi bi-chat-dots"></i>
      </button>
    </div>
  );
}

export default function CustomerPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#999' }}>加载中...</div>
      </div>
    }>
      <CustomerPageInner />
    </Suspense>
  );
}
