# 多级分销代理管理系统 - AGENTS.md

## 项目概览

多级分销代理管理系统是一个前后端一体的 Next.js 应用，实现代理邀请、等级管理、订单处理和佣金分佣等功能。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: shadcn/ui + Tailwind CSS 4
- **Database**: PostgreSQL + Supabase
- **Auth**: Supabase Auth (邮箱+密码登录)
- **Charts**: Recharts

## 目录结构

```
src/
├── app/
│   ├── api/                    # API 路由
│   │   ├── agent-levels/       # 代理等级管理
│   │   ├── agents/             # 代理管理
│   │   ├── commissions/        # 佣金记录
│   │   ├── dashboard/          # 数据看板
│   │   ├── orders/             # 订单管理
│   │   ├── products/           # 商品管理
│   │   ├── profiles/           # 用户档案
│   │   ├── supabase-config/    # Supabase 配置
│   │   ├── team-tree/          # 团队树结构
│   │   └── withdrawals/        # 提现管理
│   ├── admin/                  # 管理员端页面
│   │   ├── agents/             # 代理管理
│   │   ├── commissions/        # 佣金记录
│   │   ├── levels/             # 等级配置
│   │   ├── orders/             # 订单管理
│   │   ├── products/           # 商品管理
│   │   └── withdrawals/        # 提现管理
│   ├── agent/                  # 代理端页面
│   │   ├── commissions/        # 佣金明细
│   │   ├── orders/             # 我的订单
│   │   ├── team/               # 我的团队
│   │   └── withdraw/           # 提现管理
│   ├── login/                  # 登录页
│   ├── register/               # 注册页
│   ├── layout.tsx              # 根布局
│   └── page.tsx                # 首页
├── components/ui/              # shadcn/ui 组件
├── lib/
│   ├── auth-context.tsx        # 认证上下文
│   ├── supabase-browser.ts     # 浏览器端 Supabase 客户端
│   └── utils.ts                # 工具函数
└── storage/database/
    ├── shared/schema.ts        # 数据库 Schema
    └── supabase-client.ts      # 服务端 Supabase 客户端
```

## 数据库模型

| 表名 | 说明 |
|------|------|
| profiles | 用户档案（关联 auth.users） |
| agent_levels | 代理等级配置 |
| products | 商品信息 |
| product_commissions | 商品等级佣金 |
| orders | 订单记录 |
| commissions | 佣金记录 |
| withdrawals | 提现申请 |

## 角色权限

| 角色 | 权限 |
|------|------|
| admin | 全局数据管理、订单审核、等级配置、代理管理 |
| agent | 邀请注册、订单提交、佣金查看、提现申请 |

## 核心功能

### 1. 认证系统
- 邮箱+密码登录（Supabase Auth）
- 邀请码注册
- 自动生成唯一邀请码

### 2. 代理等级
- 5级等级体系：青铜→白银→黄金→钻石→皇冠
- 自动升级（订单数/团队人数/销售额）
- 各等级对应不同佣金比例

### 3. 多级佣金
- 直推佣金（一级）
- 二级佣金
- 三级佣金
- 订单完成时自动计算并分配

### 4. 订单流程
- 待审核 → 已开卡 → 已寄出 → 已完成
- 支持 Excel 导出

### 5. 提现系统
- 代理提交提现申请
- 管理员审核
- 佣金余额实时更新

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发模式
pnpm dev

# 构建
pnpm build

# 启动
pnpm start

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint
```

## API 接口

| 路径 | 方法 | 说明 |
|------|------|------|
| /api/supabase-config | GET | 获取 Supabase 配置 |
| /api/profiles | GET/POST | 用户档案管理 |
| /api/profiles/[id] | GET/PUT | 单个用户档案 |
| /api/profiles/by-invite/[code] | GET | 根据邀请码查询 |
| /api/agent-levels | GET/POST | 等级管理 |
| /api/agent-levels/[id] | GET/PUT/DELETE | 单个等级 |
| /api/products | GET/POST | 商品管理 |
| /api/products/[id] | GET/PUT/DELETE | 单个商品 |
| /api/orders | GET/POST | 订单管理 |
| /api/orders/[id] | GET/PUT | 单个订单 |
| /api/commissions | GET | 佣金记录 |
| /api/withdrawals | GET/POST | 提现管理 |
| /api/withdrawals/[id] | PUT | 提现审核 |
| /api/agents | GET | 代理列表 |
| /api/agents/[id] | GET/PUT | 单个代理 |
| /api/team-tree | GET | 团队树结构 |
| /api/dashboard | GET | 数据看板 |

## 环境变量

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase 项目 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase 匿名密钥
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase 服务密钥
