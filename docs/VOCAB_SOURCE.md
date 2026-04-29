# WordVision 词库来源报告

生成时间：2026-04-29T12:36:42.903Z

## 数据来源

- 基线词典：ECDICT Free English to Chinese Dictionary Database
- 仓库：https://github.com/skywind3000/ECDICT
- 许可证：MIT License

## 导入规则

- 使用 ECDICT 的考试标签筛选：高考=gk，四级=cet4，六级=cet6。
- 保留英文单词、音标、中文释义、英文释义、词性、词频、来源标签。
- 例句、中文例句、记忆提示和图片提示词使用模板生成，后续可通过 AI 批量优化。
- 本项目不宣称这些词表是官方考纲原始文件，而是公开词典标签整理基线。

## 导入结果

- 高考词汇（gaokao）：3671 词
- 四级词汇（cet4）：3846 词
- 六级词汇（cet6）：5406 词
- 合计：12923 词
