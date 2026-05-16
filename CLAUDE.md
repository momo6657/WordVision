# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

WordVision 是一个基于 React + Vite + Tailwind CSS 的英语词汇学习应用，支持 AI 视觉图片生成、情景学习、口语练习和长难句理解。部署在 Vercel，使用 Serverless API 处理 AI 请求。

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器（本地开发）
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm test

# 本地预览构建结果
npm run preview

# 重新导入完整词库（从 ECDICT）
npm run import:ecdict
```

## 架构要点

### 前端状态管理

- **无路由库**: 使用自定义视图切换系统，`App.jsx` 中的 `view` 状态控制当前页面
- **中心化状态**: 所有核心状态（books, records, theme, sessionWords）在 `App.jsx` 中管理，通过 props 传递给子组件
- **数据持久化**:
  - `localStorage`: 主题、元数据 (`wordvision:v2:meta`)
  - `IndexedDB`: 单词进度、自定义词汇、场景、口语/句子记录 (`wordvision-db`)

### 词库系统

- 词库按需加载（lazy load）：`App.jsx` 中的 `bookLoaders` 对象
- 5 个考试词库：高考、四级、六级、考研、雅思（`src/data/books/`）
- 自定义词汇：用户手动添加，存储在 IndexedDB
- 词库元数据：`src/data/bookMeta.js`

### 学习系统

- 四选一测验模式：`src/utils/quiz.js`
- 间隔复习算法：`updateReviewSchedule()` 维护 `dueAt/ease/intervalDays/reviewCount`
- 学习模式：due（今日应复习）、unlearned、wrong、favorite、all、learned

### AI 集成

- **图片生成**: `POST /api/images/generate`，使用 Vercel Blob 缓存
- **文本接口**:
  - `POST /api/ai/scene` - 情景词汇生成
  - `POST /api/ai/dialogue` - 对话生成
  - `POST /api/ai/sentence` - 长难句分析
- **默认模型**: 文本使用 `mimo-v2.5`，图片使用 OpenAI 兼容接口
- **降级策略**: 文本 AI 失败时使用本地模板兜底

### 关键文件

- `src/App.jsx`: 主应用组件，包含所有状态管理和业务逻辑
- `src/utils/storage.js`: localStorage 封装
- `src/utils/db.js`: IndexedDB 封装
- `src/utils/quiz.js`: 测验逻辑和间隔复习算法
- `src/utils/aiApi.js`: 前端 AI API 调用封装
- `api/_lib/ai/text.js`: 服务端文本 AI 配置和调用
- `api/_lib/images/config.js`: 服务端图片 AI 配置

### Vite 配置

开发服务器代理 `/api` 请求到生产环境 Vercel API（`vite.config.js`），避免本地需要部署 API。

## 测试

测试文件位于 `test/` 目录，使用 Node.js 内置测试框架：

```bash
npm test  # 运行所有测试
```

测试覆盖：quiz.js 工具函数、AI API 服务端逻辑、图片 provider 配置。

## 环境变量

### 图片生成（必需）

```
AI_IMAGE_PROVIDER=openai | custom
AI_IMAGE_MODEL=gpt-image-1
AI_IMAGE_BASE_URL=https://api.openai.com/v1/images/generations
AI_IMAGE_API_KEY=你的服务端密钥
BLOB_READ_WRITE_TOKEN=Vercel Blob 写入令牌
```

### 文本 AI（可选，无 key 时使用本地模板）

```
AI_TEXT_PROVIDER=openai | custom | local
AI_TEXT_MODEL=mimo-v2.5
AI_TEXT_BASE_URL=https://token-plan-cn.xiaomimimo.com/v1
AI_TEXT_API_KEY=你的服务端密钥
```

## 开发规范

- 提交规范：Conventional Commits（feat/fix/docs/style/refactor/test/chore）
- 版本号：语义化版本（当前 0.5.0）
- 分支策略：main（稳定）→ develop（集成）→ feature/* / fix/*
