# Plant LED Site — 开发计划

## 已完成功能

### 聊天系统
- [x] 客户聊天窗口（文字、图片、语音）
- [x] 管理员聊天面板（会话管理、翻译、分配）
- [x] 语音消息录制与播放
- [x] 自动翻译（7 个语言）
- [x] 会话历史

### 产品管理
- [x] 管理员产品 CRUD（创建/编辑/删除）
- [x] 7 语言多语言支持（名称、描述、规格、特性）
- [x] 产品图片上传
- [x] 静态产品数据 JSON

### 系统管理
- [x] 管理员设置页面
- [x] 图片/音频文件上传 API
- [x] Admin 认证守卫

### 前端页面
- [x] 首页（Hero、分类、特色产品、联系）
- [x] 产品列表页
- [x] 产品详情页
- [x] 产品目录页
- [x] 关于页面
- [x] 多语言切换（en/zh/es/ja/ko/de/fi）

---

## 待开发功能

### 优先级 1：基础设施

#### 1.1 Supabase 配置
- 设置 `NEXT_PUBLIC_SUPABASE_URL` 和 `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- 运行 `supabase-schema.sql` 初始化数据库
- 验证聊天消息持久化

#### 1.2 管理员认证
- 当前状态：使用硬编码密码 `admin123`
- 目标：接入 Supabase Auth 或 JWT 认证
- 添加登录/登出流程

### 优先级 2：内容管理

#### 2.1 Sanity CMS 集成（已有详细计划）
- 用 Sanity 头less CMS 替代静态产品数据
- 嵌入 Studio 到 `/admin/studio`
- 可视化编辑产品内容、图片
- 自动回退到静态数据（当 Sanity 未配置时）

#### 2.2 产品图片上传
- 为现有 8 个产品上传真实产品图片
- 配置 `next.config.ts` 的 `images.remotePatterns`

### 优先级 3：功能增强

#### 3.1 语音消息音量增强
- 当前状态：录制正常，播放正常
- 原始问题：声音太小
- 方案：在播放时通过 Web Audio API 的 GainNode 放大音量（3x-5x）
- 注意：`createMediaElementSource` 需在播放前设置

#### 3.2 聊天功能增强
- 已读状态
- 输入中提示
- 文件（PDF/文档）共享
- 消息搜索

### 优先级 4：质量与部署

#### 4.1 构建和测试
- 修复构建警告
- 添加 TypeScript 严格模式
- 端到端测试

#### 4.2 SEO 和性能
- 验证 sitemap
- SEO 元数据完善
- 图片优化（next/image）
- 性能审计

#### 4.3 部署
- Vercel 部署配置
- CI/CD 流程
- 域名和 HTTPS 配置

---

## 技术栈

| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router, Turbopack) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS |
| 数据库 | Supabase (PostgreSQL) |
| CMS | Sanity (计划中) |
| 认证 | Supabase Auth (计划中) |
| 多语言 | next-intl |
| 部署 | Vercel |
