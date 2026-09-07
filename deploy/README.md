# Caddy 静态部署示例

先在项目根目录运行：

```bash
npm ci
npm run build:root
```

把 `dist/` 中的内容同步到服务器的 `/var/www/tongqin`，然后使用本目录的 `Caddyfile`。

```bash
SITE_DOMAIN=bus.example.com caddy run --config /etc/caddy/Caddyfile
```

Caddy 会自动申请和续期 HTTPS 证书。若站点目录不同，请修改 `root`。这里只需要静态文件服务，不需要反向代理 Node.js 进程。
