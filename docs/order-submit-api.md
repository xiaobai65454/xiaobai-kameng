# 订单提交流程后端接口文档

本文档说明订单提交两步流程（商品详情页 → 填写信息页）的后端实现，包括接口定义、请求/响应格式、数据库模型，以及与前端 UI 的对应关系。

## 一、UI 页面与接口对应关系总览

### 第一步：商品详情页（`preview/order-submit-preview.html`）

| UI 区块 | 数据来源 / 操作 | 对应接口 |
|---------|----------------|---------|
| 紫色 Hero Banner（套餐名、60G 大字） | 展示套餐信息 | `GET /api/products/[id]/public` |
| 价格卡片（优惠月租 ¥39 / 原套餐月租 ¥39 划线） | 展示价格 | 同上（`monthly_rent` / `original_rent`） |
| 认证徽章（官方授权保障） | 静态文案 / 系统配置 | 可复用 `GET /api/system-config/public` |
| 商品标题 + 标签（发全国） | 展示商品名 + `tags` | `GET /api/products/[id]/public` |
| 数据三宫格（60G / 0G / 0分钟） | 展示套餐参数 | 同上（`general_data` / `directed_data` / `call_minutes`） |
| 操作按钮：分享 | 复制带 `ref_code` 的分享链接 | 前端拼接，无需专门接口 |
| 操作按钮：查名下卡（一证通查） | 跳转工信部外部页面 | 前端跳转，无需后端 |
| 紫色套餐详情卡（资费介绍 / 下单须知 / 温馨提示） | 展示长文本 | `GET /api/products/[id]/public`（`package_detail` / `notice`） |
| 底部「免费领取」按钮 | 跳转第二步 | 前端路由跳转 |

### 第二步：填写信息页（`preview/order-form-step2.html`）

| UI 区块 | 数据来源 / 操作 | 对应接口 |
|---------|----------------|---------|
| 套餐摘要卡（套餐名 / 月租 / 流量） | 读取套餐信息 | `GET /api/products/[id]/public` |
| 收货人信息（姓名/身份证号/电话/地址） | 表单输入 | 提交时交给 `POST /api/orders/customer` |
| 身份证正面照上传 | 图片上传 | `POST /api/upload/public`（`category=id_card_front`） |
| 身份证反面照上传 | 图片上传 | `POST /api/upload/public`（`category=id_card_back`） |
| 半身人像照上传 | 图片上传 | `POST /api/upload/public`（`category=portrait`） |
| 一证通查截图上传 | 图片上传 | `POST /api/upload/public`（`category=yztc_screenshot`） |
| 提交订单按钮 | 创建订单 | `POST /api/orders/customer` |

---

## 二、接口详细定义

### 1. 获取公开商品详情

```
GET /api/products/{id}/public
```

**用途**：商品详情页 + 填写信息页套餐摘要卡。无需登录。

**响应示例**：
```json
{
  "product": {
    "id": "uuid",
    "name": "广电奔马卡39元60G【发全国】",
    "operator": "broadnet",
    "monthly_rent": "39.00",
    "original_rent": "39.00",
    "general_data": 60,
    "directed_data": 0,
    "call_minutes": 0,
    "sms_count": 100,
    "validity_months": 12,
    "contract_months": 12,
    "first_charge_amount": "100.00",
    "extra_data_price": "5.00",
    "extra_call_price": "0.15",
    "age_limit": "16-60周岁",
    "delivery_scope": "发全国",
    "package_detail": "资费介绍长文本...",
    "notice": "下单须知长文本...",
    "activation_type": "收货后本人持身份证到营业厅激活",
    "first_month_free": true,
    "tags": "主推,新品",
    "image_url": "...",
    "status": "active"
  }
}
```

> ⚠️ 注意：该接口**不会**返回 `commission_amount`（佣金）等敏感字段。

---

### 2. 公开图片上传（实名认证材料）

```
POST /api/upload/public
Content-Type: multipart/form-data
```

**用途**：填写信息页 4 个上传框（身份证正反面、半身照、一证通查截图）。无需登录。

**请求参数（FormData）**：
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `file` | File | 是 | 图片文件（JPG/PNG/WebP，≤5MB） |
| `category` | string | 否 | `id_card_front` / `id_card_back` / `portrait` / `yztc_screenshot` |

**响应示例**：
```json
{
  "key": "order-materials/id_card_front/1699999999999-ab12cd34ef56.jpg",
  "url": "https://...presigned-url...",
  "category": "id_card_front"
}
```

**错误响应**：
```json
{ "error": "仅支持 JPG、PNG、WebP 格式的图片" }   // 400
{ "error": "图片大小不能超过 5MB" }              // 400
```

---

### 3. 用户下单（无需登录）

```
POST /api/orders/customer
Content-Type: application/json
```

**用途**：填写信息页「提交订单」按钮。

**请求体**：
```json
{
  "product_id": "uuid",
  "customer_name": "张三",
  "id_card": "110101199001011234",
  "customer_phone": "13800138000",
  "address": "北京市朝阳区XX街道XX号",
  "id_card_front_url": "https://...正面照...",
  "id_card_back_url": "https://...反面照...",
  "portrait_url": "https://...半身照...",
  "yztc_screenshot_url": "https://...一证通查截图...",
  "remark": "可选备注",
  "ref_code": "可选代理邀请码"
}
```

**字段校验规则**：
| 字段 | 规则 |
|------|------|
| `customer_name` | 2-20 字 |
| `id_card` | 18 位，含校验码验证（GB 11643-1999） |
| `customer_phone` | `1[3-9]` 开头 11 位 |
| `address` | ≥5 字 |
| 4 张图片 URL | 必填，http/https 合法 URL |

**业务逻辑**：
1. 校验商品存在且 `status=active`
2. **风控查重**：同一身份证 30 天内只能办一张（非 cancelled 状态）
3. 通过 `ref_code` 关联代理（可选）
4. 生成安全订单号，订单状态初始 `pending`
5. 记录提交 IP（风控审计）

**成功响应（200）**：
```json
{
  "success": true,
  "order_no": "ORD...",
  "order_id": "uuid",
  "message": "订单提交成功，请等待审核"
}
```

**失败响应示例**：
```json
{ "error": "该身份证 30 天内已办理过号卡，暂不能重复办理" }  // 400
{ "error": "身份证号格式错误" }                              // 400
{ "error": "商品不存在" }                                    // 404
```

---

## 三、数据库模型变更

迁移文件：`supabase/migrations/002_order_submit_flow.sql`

### products 表新增字段

| 字段 | 类型 | 说明 | UI 对应 |
|------|------|------|---------|
| `original_rent` | numeric(10,2) | 原套餐月租（划线价） | 价格卡片"原套餐月租" |
| `sms_count` | integer | 短信数量（条/月） | 数据宫格 |
| `contract_months` | integer | 合约期（月） | 套餐详情 |
| `first_charge_amount` | numeric(10,2) | 首充金额 | Hero CTA"首充100元" |
| `extra_data_price` | numeric(10,2) | 套餐外流量费（元/GB） | 资费介绍 |
| `extra_call_price` | numeric(10,2) | 套餐外通话费（元/分） | 资费介绍 |
| `package_detail` | text | 资费介绍长文本 | 紫色卡片"资费介绍" |
| `notice` | text | 下单须知长文本 | 紫色卡片"下单须知" |
| `activation_type` | varchar | 激活方式 | 下单须知 |
| `first_month_free` | boolean | 首月免租 | 黄色警告条 |
| `delivery_scope` | varchar | 发货范围 | 商品标签"发全国" |

### orders 表新增字段

| 字段 | 类型 | 说明 | UI 对应 |
|------|------|------|---------|
| `id_card_front_url` | varchar(500) | 身份证正面照 | 第二步身份证正面上传 |
| `id_card_back_url` | varchar(500) | 身份证反面照 | 第二步身份证反面上传 |
| `portrait_url` | varchar(500) | 半身人像照 | 第二步半身照上传 |
| `yztc_screenshot_url` | varchar(500) | 一证通查截图 | 第二步截图上传 |
| `submit_ip` | varchar(50) | 提交 IP | 风控审计 |

新增索引：
- `orders_customer_id_card_idx`（身份证查重）
- `orders_status_created_idx`（订单列表查询）

---

## 四、共享校验模块

`src/lib/validation.ts` 提供前后端统一的校验函数：

- `isValidPhone` — 手机号
- `isValidIdCard` — 身份证（含校验码）
- `isValidName` — 姓名
- `isValidAddress` — 地址
- `isValidImageUrl` — 图片 URL
- `getClientIp` — 客户端 IP 提取

> 前端 React 页面应复用这些函数，保证前后端校验规则一致，避免"前端通过、后端拦截"的联调冲突。

---

## 五、本地运行

```bash
# 1. 安装依赖
pnpm install

# 2. 配置环境变量
cp .env.example .env
# 填入 COZE_SUPABASE_URL / COZE_SUPABASE_ANON_KEY / COZE_SUPABASE_SERVICE_ROLE_KEY
# 以及 COZE_BUCKET_*（对象存储，上传功能必需）

# 3. 执行数据库迁移（在 Supabase SQL Editor 中运行）
# supabase/migrations/001_security_enhancement.sql
# supabase/migrations/002_order_submit_flow.sql

# 4. 启动开发服务（默认 5000 端口）
pnpm dev
```

生产构建与启动：`pnpm build` → `pnpm start`。
