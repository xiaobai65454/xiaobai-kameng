#!/bin/bash
# ====================================
# Nginx 反向代理 + HTTPS 配置脚本
# 使用方法: sudo bash deploy-nginx.sh your-domain.com
# ====================================
set -e

DOMAIN=${1:=""}

if [ -z "$DOMAIN" ]; then
    echo "⚠️  请提供域名: sudo bash deploy-nginx.sh your-domain.com"
    exit 1
fi

echo "🔧 配置 Nginx 反向代理 for $DOMAIN ..."

# 安装 Nginx
if ! command -v nginx &> /dev/null; then
    echo "📦 安装 Nginx..."
    apt-get update
    apt-get install -y nginx
fi

# 安装 Certbot
if ! command -v certbot &> /dev/null; then
    echo "📦 安装 Certbot..."
    apt-get install -y certbot python3-certbot-nginx
fi

# 创建 Nginx 配置
cat > /etc/nginx/sites-available/haoka-kameng << EOF
server {
    listen 80;
    server_name $DOMAIN;

    # 文件上传大小限制
    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用站点
ln -sf /etc/nginx/sites-available/haoka-kameng /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 测试 Nginx 配置
nginx -t

# 重载 Nginx
systemctl reload nginx

# 申请 SSL 证书
echo "🔒 申请 SSL 证书..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --register-unsafely-without-email --redirect

echo ""
echo "✅ Nginx + HTTPS 配置完成！"
echo "   访问地址: https://$DOMAIN"
