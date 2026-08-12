# PM2 生态系统配置文件
module.exports = {
  apps: [{
    name: 'haoka-kameng',
    script: 'node',
    args: 'server.js',
    cwd: '/opt/haoka-kameng',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      HOSTNAME: '0.0.0.0',
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    error_file: '/var/log/haoka-kameng/error.log',
    out_file: '/var/log/haoka-kameng/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
  }],
};
