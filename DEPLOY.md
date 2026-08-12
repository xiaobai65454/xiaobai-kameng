# 号卡平台部署指南

## GitHub 仓库
- 仓库地址：https://github.com/xiaobai65454/xiaobai-kameng
- 最新更新：2026-08-12（三端后台UI重设计 + 前端链接后端化 + 部署配置文件）

---

## 部署方式

提供三种部署方式，根据你的服务器环境选择：

### 方式一：PM2 部署（推荐，最简单）

适合：Linux 服务器（Ubuntu/CentOS/Debian）

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 克隆代码
git clone https://github.com/xiaobai65454/xiaobai-kameng.git /opt/haoka-kameng
cd /opt/haoka-kameng

# 3. 创建环境变量配置
cp .env.example .env
nano .env  # 填入你的 Supabase 配置

# 4. 一键部署
bash deploy.sh
```

### 方式二：Docker 部署

适合：已安装 Docker 的服务器

```bash
# 1. SSH 登录服务器
ssh root@your-server-ip

# 2. 克隆代码
git clone https://github.com/xiaobai65454/xiaobai-kameng.git /opt/haoka-kameng
cd /opt/haoka-kameng

# 3. 创建环境变量配置
cp .env.example .env
nano .env  # 填入你的 Supabase 配置

# 4. Docker 部署
bash deploy-docker.sh
```

### 方式三：宝塔面板部署

适合：使用宝塔面板管理的服务器

1. 宝塔面板 → 网站 → Node 项目 → 添加项目
2. 项目目录：`/opt/haoka-kameng`
3. 项目端口：3000
4. 启动命令：`pnpm start`
5. 先在 SSH 中执行：
```bash
cd /opt/haoka-kameng
git clone https://github.com/xiaobai65454/xiaobai-kameng.git .
cp .env.example .env
nano .env  # 填入配置
pnpm install
pnpm build
```

---

## 环境变量配置（.env 文件）

```ini
# 应用配置
COZE_PROJECT_ENV=PROD
PORT=3000
HOSTNAME=0.0.0.0

# Supabase 数据库（必填）
COZE_SUPABASE_URL=https://your-project.supabase.co
COZE_SUPABASE_ANON_KEY=your-anon-key
COZE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 对象存储（可选，用于文件上传）
COZE_BUCKET_ENDPOINT_URL=
COZE_BUCKET_ACCESS_KEY=
COZE_BUCKET_SECRET_KEY=
COZE_BUCKET_NAME=
```

### 获取 Supabase 配置

1. 访问 https://supabase.com 注册并创建项目
2. 项目设置 → API
3. 复制以下值填入 .env：
   - `Project URL` → `COZE_SUPABASE_URL`
   - `anon public` key → `COZE_SUPABASE_ANON_KEY`
   - `service_role` key → `COZE_SUPABASE_SERVICE_ROLE_KEY`
4. 在 SQL Editor 中执行 `supabase/migrations/` 下的所有迁移脚本

---

## Nginx 反向代理 + HTTPS（可选）

如果需要绑定域名和 HTTPS：

```bash
sudo bash deploy-nginx.sh your-domain.com
```

会自动：
- 配置 Nginx 反向代理（80 → 3000）
- 申请 Let's Encrypt SSL 证书
- 强制 HTTPS 跳转

---

## 常用运维命令

```bash
# PM2 方式
pm2 status              # 查看应用状态
pm2 logs haoka-kameng   # 查看日志
pm2 restart haoka-kameng # 重启应用
pm2 stop haoka-kameng   # 停止应用

# Docker 方式
docker-compose logs -f  # 查看日志
docker-compose restart  # 重启
docker-compose down     # 停止
docker-compose up -d    # 启动

# 更新代码后重新部署
cd /opt/haoka-kameng
git pull origin main
pnpm install
pnpm build
pm2 restart haoka-kameng  # 或 docker-compose up -d --build
```

---

## 部署后验证

1. 访问 `http://服务器IP:3000` — 应看到首页
2. 访问 `http://服务器IP:3000/customer` — 用户端商城
3. 访问 `http://服务器IP:3000/portal/admin` — 管理端登录
4. 访问 `http://服务器IP:3000/portal/agent` — 代理端登录
5. 访问 `http://服务器IP:3000/portal/channel` — 渠道端登录

## 预览页面

仓库内的 `preview/backend-preview.html` 可直接在浏览器打开，
查看三端后台的完整 UI 效果（无需启动服务器）。
