#!/bin/bash
# ====================================
# Docker 部署脚本（适用于已安装 Docker 的服务器）
# 使用方法: bash deploy-docker.sh
# ====================================
set -e

echo "🐳 Docker 部署号卡平台..."

# 检查 Docker
if ! command -v docker &> /dev/null; then
    echo "📦 安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl start docker
    systemctl enable docker
fi

# 检查 Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo "📦 安装 Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# 检查 .env
if [ ! -f ".env" ]; then
    echo "⚠️  请先创建 .env 文件！"
    echo "   cp .env.example .env"
    echo "   然后编辑 .env 填入 Supabase 配置"
    exit 1
fi

# 构建并启动
echo "🔨 构建 Docker 镜像..."
docker-compose build

echo "🚀 启动容器..."
docker-compose up -d

echo ""
echo "✅ Docker 部署完成！"
echo "   应用地址: http://$(hostname -I | awk '{print $1}'):3000"
echo "   查看日志: docker-compose logs -f"
echo "   停止服务: docker-compose down"
