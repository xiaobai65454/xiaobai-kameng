-- ============================================================
-- 002_order_submit_flow.sql
-- 订单提交两步流程（商品详情页 + 填写信息页）所需字段扩展
-- ============================================================

-- ============================================================
-- 1. products 表扩展：套餐详情页展示字段
-- ============================================================

-- 原套餐月租（用于"原套餐月租 ¥39"划线展示）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS original_rent numeric(10,2) NOT NULL DEFAULT '0';

-- 短信数量（条/月）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS sms_count integer NOT NULL DEFAULT 0;

-- 合约期（月，0 表示无合约）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS contract_months integer NOT NULL DEFAULT 0;

-- 首充金额（激活当月需充值金额，如 100 元）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS first_charge_amount numeric(10,2) NOT NULL DEFAULT '0';

-- 套餐外流量计费（元/GB）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS extra_data_price numeric(10,2) NOT NULL DEFAULT '0';

-- 套餐外通话计费（元/分钟）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS extra_call_price numeric(10,2) NOT NULL DEFAULT '0';

-- 资费介绍（长文本，紫色卡片"资费介绍"区块）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS package_detail text;

-- 下单须知（长文本，紫色卡片"下单须知"区块）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS notice text;

-- 激活方式（如"收货后本人持身份证到营业厅激活"）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS activation_type varchar(255);

-- 是否参与首月免租活动
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS first_month_free boolean NOT NULL DEFAULT false;

-- 发货范围（如"发全国"，覆盖原 area_limit 语义但更明确）
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS delivery_scope varchar(100);

-- ============================================================
-- 2. orders 表扩展：实名认证材料（4 张图片）
-- ============================================================

-- 身份证正面照 URL
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS id_card_front_url varchar(500);

-- 身份证反面照 URL
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS id_card_back_url varchar(500);

-- 半身人像照 URL
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS portrait_url varchar(500);

-- 一证通查截图 URL
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS yztc_screenshot_url varchar(500);

-- 订单提交 IP（用于安全审计与风控）
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS submit_ip varchar(50);

-- ============================================================
-- 3. 索引优化
-- ============================================================

-- 身份证号查询索引（用于"同一身份证30天只能办一张"的查重）
CREATE INDEX IF NOT EXISTS orders_customer_id_card_idx ON orders (customer_id_card);

-- 下单时间 + 状态联合索引（加快订单列表查询）
CREATE INDEX IF NOT EXISTS orders_status_created_idx ON orders (status, created_at);

-- ============================================================
-- 4. 注释说明（可选，PostgreSQL COMMENT）
-- ============================================================
COMMENT ON COLUMN products.original_rent IS '原套餐月租（划线价）';
COMMENT ON COLUMN products.sms_count IS '短信数量（条/月）';
COMMENT ON COLUMN products.contract_months IS '合约期（月，0=无合约）';
COMMENT ON COLUMN products.first_charge_amount IS '激活首充金额（元）';
COMMENT ON COLUMN products.package_detail IS '资费介绍长文本';
COMMENT ON COLUMN products.notice IS '下单须知长文本';
COMMENT ON COLUMN orders.id_card_front_url IS '身份证正面照URL';
COMMENT ON COLUMN orders.id_card_back_url IS '身份证反面照URL';
COMMENT ON COLUMN orders.portrait_url IS '半身人像照URL';
COMMENT ON COLUMN orders.yztc_screenshot_url IS '一证通查截图URL';
COMMENT ON COLUMN orders.submit_ip IS '提交订单IP（风控审计）';
