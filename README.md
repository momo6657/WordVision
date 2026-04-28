# WordVision：AI 视觉词汇学习助手

WordVision 是一个基于 React + Vite + Tailwind CSS 的本地英语词汇学习 App。它面向希望通过视觉联想、发音、错题复盘和学习统计提升词汇记忆效率的用户，核心数据优先保存在浏览器本地，适合课程演示、个人学习和 MVP 快速验证。

## 项目简介

WordVision 以“词库选择 -> 学习设置 -> 四选一学习 -> 总结复盘 -> 错题与统计”的学习闭环为主线，帮助用户完成一轮可追踪、可复习的词汇训练。

当前交付目标是一个本地运行的前端应用：

- 使用 React 构建页面和组件。
- 使用 Vite 提供开发服务器和构建流程。
- 使用 Tailwind CSS 实现响应式界面和深色模式。
- 使用 localStorage 保存学习进度、收藏、错题、设置和统计数据。
- 使用浏览器 Web Speech API 或本地音频资源提供单词发音能力。

## 功能介绍

- 首页：展示应用入口、学习进度概览、快捷开始和主要功能导航。
- 词库选择：支持选择不同词库或学习范围，例如基础词汇、考试词汇、自定义词表等。
- 词汇总览：展示当前词库中的单词、释义、掌握状态、收藏状态和学习记录。
- 学习设置：支持设置学习数量、题目顺序、是否包含错题、是否自动发音、深色模式等偏好。
- 四选一学习：以单词或释义为题干，提供四个选项，记录正确率和答题过程。
- 学习总结：在一轮学习结束后展示正确率、用时、错题、已掌握词汇和后续建议。
- 错题本：集中展示答错过的词汇，支持复习、移除和再次练习。
- 统计：展示累计学习数量、正确率、连续学习情况、词库完成度和错题变化。
- localStorage：在本地浏览器保存用户学习数据，不依赖后端服务即可运行。
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

### 构建生产版本

```bash
npm run build
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

本地 MVP 可以先使用静态词库数据与规则逻辑模拟 AI 辅助效果；后续如接入外部 AI API，需要明确 API Key 管理、调用成本、网络失败降级和用户隐私策略。

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
- `utils/quiz.js` 封装抽题、生成四选一选项、计算正确率等学习逻辑。
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
