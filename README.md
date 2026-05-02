# WordVision：AI 视觉词汇学习助手

WordVision 是一个基于 React + Vite + Tailwind CSS 的英语词汇学习 App。它面向希望通过视觉联想、发音、错题复盘和学习统计提升词汇记忆效率的用户，支持完整考试词库、本地学习进度、可替换 AI 图片生成接口和 Vercel Serverless 部署。

## 项目简介

WordVision 以“词库选择 -> 学习设置 -> 四选一学习 -> 总结复盘 -> 错题与统计”的学习闭环为主线，帮助用户完成一轮可追踪、可复习的词汇训练。

## 在线访问说明

线上演示地址：

```text
https://wordvision.vercel.app
```

当前演示站部署在 Vercel。由于 Vercel 在中国大陆网络下访问可能不稳定，国内网络访问该地址时可能需要开启 VPN 或代理；这属于部署平台和网络环境限制，不是项目功能故障。本地运行不受影响，可按下方安装运行方法启动。

当前交付目标是一个本地运行的前端应用：

- 使用 React 构建页面和组件。
- 使用 Vite 提供开发服务器和构建流程。
- 使用 Tailwind CSS 实现响应式界面和深色模式。
- 使用 IndexedDB 保存单词级学习进度、图片缓存状态、收藏、错题和复习计划。
- 使用 localStorage 保存主题、最近学习记录等轻量元数据。
- 使用浏览器 Web Speech API 或本地音频资源提供单词发音能力。
- 使用 Vercel Serverless API 生成 AI 单词图片，默认 OpenAI，可通过 provider adapter 替换为更经济的模型。

## 功能介绍

- 首页：展示应用入口、学习进度概览、快捷开始和主要功能导航。
- 词库选择：支持选择不同词库或学习范围，例如基础词汇、考试词汇、自定义词表等。
- 词汇总览：展示当前词库中的单词、释义、掌握状态、收藏状态和学习记录。
- 学习设置：支持设置学习数量、题目顺序、是否包含错题、是否自动发音、深色模式等偏好。
- 四选一学习：以单词或释义为题干，提供四个选项，记录正确率和答题过程。
- 学习总结：在一轮学习结束后展示正确率、用时、错题、已掌握词汇和后续建议。
- 错题本：集中展示答错过的词汇，支持复习、移除和再次练习。
- 统计：展示累计学习数量、正确率、连续学习情况、词库完成度和错题变化。
- localStorage：在本地浏览器保存主题、学习记录等轻量元数据。
- IndexedDB：保存完整词库下的单词学习进度，避免把大词库整体写入 localStorage。
- AI 图片：学习页按单词请求 `/api/images/generate`，服务端生成图片并缓存，前端不会暴露 API Key。
- 间隔复习：答对后推迟下次复习，答错后进入近期复习队列。
- 收藏：用户可收藏重点词汇，并在总览或复习中快速筛选。
- 深色模式：支持明暗主题切换，并持久化用户选择。
- 发音：支持单词发音，辅助听读记忆。
- 详情弹窗：点击单词后展示释义、例句、音标、联想说明、掌握状态和操作按钮。

## 安装运行方法

### 环境要求

- Node.js 18 或更高版本。
- npm、pnpm 或 yarn 任一包管理器。

### 本地启动

```bash
npm install
npm run dev
```

启动后，按终端提示打开本地开发地址，通常是：

```text
http://localhost:5173
```

本地 Vite 开发服务器已配置 `/api` 代理，会把图片生成请求转发到线上 Vercel API，避免本地页面出现“服务端图片 API 未部署”的提示。

### 构建生产版本

```bash
npm run build
```

### 重新导入完整词库

```bash
npm run import:ecdict
```

脚本会下载 ECDICT CSV 到 `.cache/`，并生成 `src/data/words.js` 与 `docs/VOCAB_SOURCE.md`。

### 运行测试

```bash
npm test
```

### 本地预览构建结果

```bash
npm run preview
```

如果仓库尚未初始化 Vite 项目，可使用以下方式创建基础工程后再迁移现有 `src` 目录：

```bash
npm create vite@latest . -- --template react
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## AI 在项目中的作用

WordVision 的 AI 定位是“视觉词汇学习助手”，主要用于增强记忆材料和学习反馈，而不是替代用户学习过程。

- 视觉联想：为单词生成或整理便于记忆的画面描述、场景提示和图像联想。
- 释义辅助：帮助生成更适合学习者理解的英文释义、中文解释和常用语境。
- 例句生成：为单词生成贴近日常或考试语境的例句，辅助理解用法。
- 干扰项设计：在四选一练习中生成难度适中的错误选项，提升练习质量。
- 复习建议：根据错题、收藏和正确率，为用户提供下一轮复习重点。
- 内容整理：辅助维护词库数据结构，补充音标、词性、例句、标签和难度信息。

### AI 图片 API 与模型切换

前端只调用统一接口：

```http
POST /api/images/generate
Content-Type: application/json

{
  "bookId": "cet4",
  "wordId": "cet4-abandon",
  "force": false
}
```

服务端按环境变量选择 provider。当前版本不再提供任何代码绘制的 mock 图片，也不会生成 SVG 占位图；学习页只接受真实图片 API 返回的 PNG/JPG/WebP 位图。默认 provider 为 OpenAI；如果后期更换更经济的模型，只需要增加或调整 `api/_lib/images/providers/` 下的 adapter，并修改环境变量，不需要改学习页。

关键环境变量：

```text
AI_IMAGE_PROVIDER=openai | custom
AI_IMAGE_MODEL=gpt-image-1
AI_IMAGE_BASE_URL=https://api.openai.com/v1/images/generations
AI_IMAGE_API_KEY=你的服务端密钥
AI_IMAGE_QUALITY=low
AI_IMAGE_SIZE=1024x1024
AI_IMAGE_RESPONSE_FORMAT=url
AI_IMAGE_OUTPUT_FORMAT=png
AI_IMAGE_STYLE=realistic | anime
AI_IMAGE_DAILY_LIMIT=120
BLOB_READ_WRITE_TOKEN=Vercel Blob 写入令牌
```

说明：

- `openai` 需要在 Vercel 环境变量中配置 `AI_IMAGE_API_KEY` 或 `OPENAI_API_KEY`。没有真实 API Key 时接口会返回“需要配置真实图片 API”，不会再用程序画猪、车或其他假图。
- `custom` provider 适合接入 OpenAI 兼容或其他 HTTP 图片生成服务。
- 使用 OpenAI 兼容第三方服务时，`AI_IMAGE_BASE_URL` 可以填写根地址，例如 `https://example.com/v1`；服务端会自动请求 `/images/generations`。
- `AI_IMAGE_RESPONSE_FORMAT=url` 会优先让 provider 返回图片 URL，前端可更快显示；如果 provider 只返回 base64，服务端仍会兼容。
- 默认风格为 `realistic`，prompt 会要求输出与单词含义匹配的写实无文字场景图，并明确禁止通用 fallback 主体、文字、标签、矢量图、扁平图标和代码绘制风格。
- 生成图片会按 `bookId/wordId/provider/model/quality/size/promptHash` 写入 Vercel Blob，命中缓存时不会再次调用模型。未配置 `BLOB_READ_WRITE_TOKEN` 且 provider 返回 URL 时，服务端会直接把 URL 返回给前端，减少二次下载和 base64 传输延迟。
- 学习页会在当前图片准备好后预生成后两个单词的图片，并把生成结果写入 IndexedDB；同一浏览器跨会话会直接复用已生成图片，生产环境则优先命中 Vercel Blob 跨设备缓存。

## 词库来源

当前完整词库由 `scripts/import-ecdict.mjs` 从 ECDICT 导入生成：

- 高考词汇：3671 词
- 四级词汇：3846 词
- 六级词汇：5406 词
- 合计：12923 词

ECDICT 是 MIT License 的公开英汉词典数据库。本项目使用其考试标签 `gk/cet4/cet6` 作为公开词库基线，不宣称这些词表是官方考纲原始文件。详细导入报告见 `docs/VOCAB_SOURCE.md`。

## 项目文件结构

当前项目建议按以下结构组织：

```text
WordVision/
├─ README.md
├─ DEVELOPMENT_PLAN.md
├─ package-lock.json
├─ package.json
├─ vite.config.js
├─ tailwind.config.js
├─ postcss.config.js
├─ index.html
├─ api/
│  └─ images/
│     └─ generate.js
├─ docs/
│  ├─ CHINA_DEPLOYMENT_PLAN.md
│  └─ VOCAB_SOURCE.md
├─ scripts/
│  └─ import-ecdict.mjs
└─ src/
   ├─ main.jsx
   ├─ App.jsx
   ├─ components/
   │  ├─ BookCard.jsx
   │  ├─ Navbar.jsx
   │  ├─ OptionButton.jsx
   │  ├─ ProgressBar.jsx
   │  ├─ StatCard.jsx
   │  ├─ StatusBadge.jsx
   │  ├─ WordDetailModal.jsx
   │  └─ WordList.jsx
   ├─ pages/
   │  ├─ Home.jsx
   │  ├─ BookSelect.jsx
   │  ├─ WordOverview.jsx
   │  ├─ StudySettings.jsx
   │  ├─ Study.jsx
   │  ├─ Summary.jsx
   │  ├─ Mistakes.jsx
   │  └─ Statistics.jsx
   ├─ data/
   │  ├─ bookMeta.js
   │  ├─ books/
   │  │  ├─ cet4.js
   │  │  ├─ cet6.js
   │  │  └─ gaokao.js
   │  └─ words.js
   ├─ utils/
   │  ├─ storage.js
   │  └─ quiz.js
   └─ styles/
      └─ index.css
```

说明：

- `components/` 存放可复用 UI 组件。
- `pages/` 存放页面级组件和主要业务流程。
- `data/` 存放本地词库与示例数据。
- `utils/storage.js` 封装 localStorage 读写，避免页面中散落存储逻辑。
- `utils/db.js` 封装 IndexedDB 单词进度读写。
- `utils/quiz.js` 封装抽题、生成四选一选项、计算正确率等学习逻辑。
- `api/images/generate.js` 是 Vercel Serverless 图片生成接口。
- `api/_lib/images/providers/` 存放可替换的图片模型 provider adapter。
- 发音能力目前在 `App.jsx` 中通过浏览器 SpeechSynthesis API 封装，后续可按需要拆分到 `utils/speech.js`。
- `styles/` 存放 Tailwind 入口样式和少量全局样式。

## 后续可改进方向

- 自定义词库导入：支持 CSV、JSON 或手动录入词汇。
- 数据导出与备份：允许导出 localStorage 学习数据，便于迁移设备。
- 间隔重复算法：根据记忆曲线安排复习时间，而不是只按错题筛选。
- 更丰富的统计图表：加入每日学习趋势、词库完成率、薄弱词性和难度分布。
- AI 图片生成或检索：为单词提供更直观的视觉素材。
- 多题型练习：增加拼写题、听音选词、例句填空、英英释义匹配等模式。
- PWA 离线能力：支持安装到桌面或移动端，并在离线状态下继续学习。
- 云端同步：在需要多设备使用时增加账号体系和远程数据同步。
- 无障碍优化：提升键盘操作、屏幕阅读器支持和颜色对比度。
- 测试覆盖：补充组件测试、工具函数测试和关键学习流程端到端测试。
