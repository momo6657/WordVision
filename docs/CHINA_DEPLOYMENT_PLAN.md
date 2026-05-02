# WordVision 国内直连部署计划

## 目标

让 WordVision 在中国大陆网络下无需 VPN 也能稳定访问，同时保留可替换 AI 生图 API、图片缓存和学习进度能力。

## 当前限制

- `wordvision.vercel.app` 依赖 Vercel 海外网络和 `.vercel.app` 域名，在中国大陆可能被限速、丢包或不可达。
- Vercel 不提供中国大陆境内节点和 ICP 备案支持。
- 现有服务端图片 API 使用 Vercel Functions、Vercel Blob、`waitUntil`，迁移到国内云需要替换存储和函数运行时。

## 推荐路线

### 阶段一：无备案快速可用

适合先验证国内访问体验。

- 前端：部署到腾讯云 EdgeOne Pages 海外区、Cloudflare Pages、阿里云 OSS 香港/新加坡，或香港轻量服务器。
- API：部署到香港/新加坡 Serverless 或 Node 服务。
- 图片缓存：迁到 COS/OSS/R2，绑定 `img.xxx.com`，开启海外/亚太 CDN。
- 优点：不需要 ICP，迁移快。
- 风险：仍是境外节点，对大陆网络比 Vercel 稳定但不能保证所有运营商直连质量。

### 阶段二：备案后大陆直连

适合最终稳定版本。

- 前端：腾讯云 EdgeOne Pages 中国大陆/全球可用区，或阿里云 OSS + CDN。
- API：腾讯云 SCF/EdgeOne Functions 或阿里云函数计算 FC。
- 图片缓存：腾讯云 COS 或阿里云 OSS，前置大陆 CDN。
- 域名：建议拆成：
  - `www.xxx.com`：前端站点
  - `api.xxx.com`：图片生成 API
  - `img.xxx.com`：图片缓存 CDN
- 要求：域名完成 ICP 备案；公开网站上线后按要求补公安联网备案和备案号展示。

## 代码迁移准备

本项目已完成这些准备：

- 前端图片 API 地址支持 `VITE_IMAGE_API_BASE_URL`，后续可直接切到 `https://api.xxx.com`。
- 完整词库已按书拆分动态加载，首页不再下载完整 16MB 词库。
- 服务端图片 API 已按词库动态加载单本词库，降低冷启动体积。
- 图片生成支持先返回 provider URL，再后台写入缓存，减少前端等待。
- 缓存 key 仍保持稳定：`wordvision/{bookId}/{wordId}/{provider}/{model}/{quality}/{size}/{word}-{promptHash}`。

## 迁移工作清单

1. 准备域名和 DNS 管理权限。
2. 决定第一阶段平台：推荐腾讯 EdgeOne 海外区或阿里云香港 OSS。
3. 迁移图片缓存：
   - Vercel Blob `list/put/del` 替换为 COS/OSS/R2 SDK。
   - 保留原缓存 key，方便后续批量迁移。
4. 迁移 API：
   - 将 `api/images/generate.js` 改为目标 Serverless 入口。
   - 替换 `@vercel/functions waitUntil`，可改为后台队列、异步任务或同步写缓存。
5. 配置环境变量：
   - `AI_IMAGE_PROVIDER=custom`
   - `AI_IMAGE_BASE_URL=https://www.uocode.com/v1`
   - `AI_IMAGE_MODEL=codex-gpt-image-2`
   - `AI_IMAGE_API_KEY`
   - `AI_IMAGE_CACHE_STRATEGY=fast-url`
   - `VITE_IMAGE_API_BASE_URL=https://api.xxx.com`
6. 大陆三网测试：
   - 首屏加载时间
   - 词库切换加载时间
   - 首次生图时间
   - 缓存命中时间
   - 图片 CDN 命中率

## 需要用户准备

- 已实名腾讯云或阿里云账号。
- 域名及 DNS 权限。
- 是否已有 ICP 备案；如果没有，需要主体资料、域名实名信息、负责人核验材料。
- 预计日活、每日生图上限、图片缓存保存期限。
- 是否接受先用香港/新加坡节点上线，再等备案后切大陆 CDN。
