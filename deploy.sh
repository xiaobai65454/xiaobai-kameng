#!/bin/bash
# ====================================
# 号卡平台 - Linux 服务器部署脚本
# 使用方法: bash deploy.sh
# ====================================
set -e

echo "🚀 开始部署号卡平台..."

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "📦 安装 Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

# 检查 pnpm
if ! command -v pnpm &> /dev/null; then
    echo "📦 安装 pnpm..."
    sudo npm install -g pnpm
fi

# 检查 PM2
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装 PM2..."
    sudo npm install -g pm2
fi

# 克隆或更新代码
APP_DIR="/opt/haoka-kameng"
if [ -d "$APP_DIR/.git" ]; then
    echo "📥 更新代码..."
    cd "$APP_DIR"
    git pull origin main
else
    echo "📥 克隆代码..."
    sudo mkdir -p "$APP_DIR"
    sudo chown $USER:$USER "$APP_DIR"
    git clone https://github.com/xiaobai65454/xiaobai-kameng.git "$APP_DIR"
    cd "$APP_DIR"
fi

# 检查 .env 文件
if [ ! -f "$APP_DIR/.env" ]; then
    echo "⚠️  请创建 .env 文件！"
    echo "   cp .env.example .env"
    echo "   然后编辑 .env 填入 Supabase 配置"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
pnpm install --frozen-lockfile

# 构建
echo "🔨 构建项目..."
pnpm build

# 重启 PM2
echo "🔄 重启应用..."
pm2 delete haoka-kameng 2>/dev/null || true
pm2 start pnpm --name haoka-kameng -- start
pm2 save

# 设置开机自启
echo "⚙️  设置开机自启..."
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp /home/$USER
pm2 save

echo ""
echo "✅ 部署完成！"
echo "   应用地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "   PM2 管理: pm2 status"
echo "   查看日志: pm2 logs haoka-kameng"
echo ""
echo "💡 如需配置 Nginx 反向代理和 HTTPS，请运行:"
echo "   bash deploy-nginx.sh"
