# 通琴号班次查询

一个用于查询澳门城市大学与横琴口岸之间通琴号班次的移动端静态网站。全部查询在浏览器中完成，不需要数据库、API 或常驻 Node.js 服务。

**在线访问：** [https://billylicn.github.io/hqcityubus/](https://billylicn.github.io/hqcityubus/)

## 特点

- 纯静态构建，可部署到 Caddy、Nginx、GitHub Pages、Cloudflare Pages、Netlify 等静态托管服务
- 显示下一班、倒计时和全天时刻表
- 支持展开查看完整停靠站
- PWA 离线缓存和深色模式
- 班次数据与界面代码分离，文本格式适合直接维护和审查
- 构建时验证数据，格式错误不会被静默忽略

## 本地开发

要求 Node.js 22.13 或更高版本。

```bash
npm install
npm run dev
```

常用命令：

```bash
npm run data:check  # 解析并验证班次数据
npm test            # 运行班次逻辑测试
npm run check       # 数据、类型、代码、测试和生产构建的完整检查
npm run build       # 生成 docs/（GitHub Pages 发布目录）
npm run preview     # 本地预览生产构建
```

## 维护班次

班次的唯一数据源在 [`data/`](data/) 目录。更新格式、运营日覆盖方式和示例请查看 [`data/README.md`](data/README.md)。

不要直接编辑 `src/data/routes.generated.json`；运行 `npm run data:generate` 生成它。

## 部署

`npm run build` 会生成 `docs/`，仓库已按 GitHub Pages 的 `/hqcityubus/` 子路径配置。将 GitHub Pages 的发布来源设为主分支的 `/docs`，提交并推送 `docs/` 即可。

若部署到自有域名根路径，请运行 `npm run build:root`，然后将 `dist/` 目录作为网站根目录发布。服务器应直接提供：

- `/index.html`
- `/schedule/index.html`
- `/assets/*`
- `public/` 中复制出的图标、manifest 和 Service Worker

仓库中的 `deploy/Caddyfile` 是当前域名的静态托管示例。

如仓库名或部署子路径改变，可在构建时覆盖配置：

```bash
VITE_BASE_PATH=/your-repository/ VITE_OUT_DIR=docs npm run build
```

PWA manifest 和 Service Worker 会根据部署路径工作，无需再手工修改。

## 项目结构

```text
data/                   人工维护的班次数据
scripts/parse-routes.mjs 数据验证与生成器
src/                    React 前端源码
schedule/index.html     全天时刻表静态入口
public/                 PWA 与图片资源
tests/                  数据和时刻计算测试
deploy/                 可选的 Caddy 部署示例
```

## 参与贡献

欢迎通过 Issue 或 Pull Request 修正班次和改进功能。提交前请运行 `npm run check`。更详细的约定见 [CONTRIBUTING.md](CONTRIBUTING.md)。

## 数据说明

本项目展示的是维护者整理的班次信息，并非运营方官方服务。出行前请以运营方最新通知和现场安排为准。

## 许可证

代码以 MIT License 开源，详见 [LICENSE](LICENSE)。班次事实数据不主张专有权；提交者应确保其提供的数据可以公开分发。
