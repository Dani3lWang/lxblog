# "记录"功能移植指南 — 移植到 lxblog

> 目标：将 dumplingandcakeblog 的"记录"功能模块完整移植到 lxblog 项目。
> lxblog 版本：Firefly v6.13.5（当前仅有 posts + spec 两个 Content Collection）

---

## 目录

1. [移植概览](#1-移植概览)
2. [需要新增/修改的文件清单](#2-需要新增修改的文件清单)
3. [步骤一：更新 Content Collections](#3-步骤一更新-content-collections)
4. [步骤二：更新类型定义](#4-步骤二更新类型定义)
5. [步骤三：更新配置](#5-步骤三更新配置)
6. [步骤四：添加国际化翻译](#6-步骤四添加国际化翻译)
7. [步骤五：创建组件文件](#7-步骤五创建组件文件)
8. [步骤六：创建页面文件](#8-步骤六创建页面文件)
9. [步骤七：创建内容数据文件](#9-步骤七创建内容数据文件)
10. [步骤八：更新导航栏](#10-步骤八更新导航栏)
11. [步骤九：验证](#11-步骤九验证)

---

## 1. 移植概览

### 1.1 需要移植的模块

| # | 模块 | 路由 | 源项目文件 | 说明 |
|---|------|------|-----------|------|
| 1 | 书架 | `/books/` | `src/pages/books/` | 从 bangumi 集合筛选 book |
| 2 | 影视与游戏 | `/movies-games/` | `src/pages/movies-games/` | 从 bangumi 集合筛选 anime/game/real |
| 3 | 音乐 | `/music/` | `src/pages/music/index.astro` | 从 bangumi 集合筛选 music |
| 4 | 更新日志 | `/changelog/` | `src/pages/changelog.astro` | 独立 changelog 集合 |
| 5 | 规划 | `/life/routines/` | `src/pages/life/routines.astro` | 独立 routines 集合 |
| 6 | 足迹 | `/life/places/` | `src/pages/life/places.astro` | 从 life 集合筛选 places |

### 1.2 两个项目架构差异

| 对比项 | dumplingandcakeblog | lxblog |
|--------|-------------------|--------|
| Firefly 版本 | v6.6.13 | v6.13.5 |
| Content Collections | 13 个 | 2 个（posts, spec） |
| siteConfig.pages | 含 books, moviesGames, musicPage, changelog | 不含这些字段 |
| Bangumi 页面 | 静态内容集合（本地 md 文件） | 动态 Bangumi API（客户端获取） |
| 导航栏 pageKey | 不支持 | 支持 |

### 1.3 移植策略

lxblog 已有自己的 Bangumi 动态页面，建议采用**混合策略**：

- **新增模块**：更新日志、规划、足迹 — 这些是 lxblog 完全没有的
- **拆分模块**：在导航栏中为书架、影视、音乐创建独立入口，链接到 Bangumi 页面对应的分类筛选
- **保留原有**：lxblog 的 Bangumi 动态页面保持不变

---

## 2. 需要新增/修改的文件清单

### 2.1 需修改的文件

```
src/content.config.ts          — 添加 bangumi, changelog, life, routines 集合
src/i18n/i18nKey.ts            — 添加新翻译键
src/i18n/languages/zh_CN.ts    — 添加中文翻译
src/i18n/languages/en.ts       — 添加英文翻译
src/i18n/languages/ja.ts       — 添加日文翻译
src/i18n/languages/ru.ts       — 添加俄文翻译
src/i18n/languages/zh_TW.ts    — 添加繁体中文翻译
src/config/siteConfig.ts       — 扩展 pages 开关
src/config/navBarConfig.ts     — 添加"记录"导航菜单
src/types/siteConfig.ts        — 扩展 PageConfig 类型
```

### 2.2 需新增的文件

```
# Content Collections 数据目录
src/content/bangumi/                 — bangumi 内容数据（直接复制）
src/content/changelog/               — 更新日志数据
src/content/life/routines/           — 规划数据
src/content/life/places/             — 足迹数据

# 组件文件
src/components/pages/books/Bookshelf.astro
src/components/pages/books/BookCard.astro
src/components/pages/movies-games/MovieGameCard.astro
src/components/pages/music/MusicCard.astro
src/components/features/music-visualizer/MusicVisualizer.svelte
src/components/common/ClientPagination.astro

# 页面文件
src/pages/books/index.astro
src/pages/books/[...slug].astro
src/pages/movies-games/index.astro
src/pages/music/index.astro
src/pages/changelog.astro
src/pages/life/routines.astro
src/pages/life/places.astro
src/pages/life/notebooks/index.astro       （可选）
src/pages/life/notebooks/[...slug].astro   （可选）

# 内容数据文件
src/content/bangumi/book/   （示例数据 markdown）
src/content/bangumi/anime/  （示例数据 markdown）
src/content/bangumi/music/  （示例数据 markdown）
src/content/bangumi/game/   （示例数据 markdown）
src/content/changelog/*.md
src/content/life/routines/*.md
src/content/life/places/*.md
```

---

## 3. 步骤一：更新 Content Collections

打开 lxblog 的 `src/content.config.ts`，添加以下集合定义。

### 3.1 添加 bangumi 集合

bangumi 集合用于存储书架、影视与游戏、音乐的数据。

```typescript
// 在 postsCollection 和 specCollection 之后添加：

const bangumiCollection = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx,yaml,yml}",
    base: "./src/content/bangumi",
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      name_cn: z.string().optional(),
      category: z
        .enum(["book", "anime", "music", "game", "real"])
        .default("anime"),
      subcategory: z.enum(["movie", "tv", "anime", "documentary"]).optional(),
      status: z.number().min(1).max(5).default(2),
      image: image().or(z.string()),
      link: z.string().optional(),
      score: z.number().min(0).max(10).optional(),
      comment: z.string().optional(),
      tags: z.array(z.string()).optional().default([]),
      published: z.date().optional(),
      artist: z.string().optional(),     // music 专用
      audioUrl: z.string().optional(),   // music 专用
      lrcUrl: z.string().optional(),     // music 专用
      metingServer: z.string().optional(), // music 专用
      metingId: z.string().optional(),   // music 专用
    }),
});
```

### 3.2 添加 changelog 集合

```typescript
const changelogCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/changelog" }),
  schema: z.object({
    version: z.string(),
    date: z.date(),
    time: z.string().optional(),
    type: z.enum(["feature", "improvement", "fix", "removal"]),
    description: z.string(),
  }),
});
```

### 3.3 添加 life 集合（含 places 数据）

```typescript
const lifeCollection = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/life" }),
  schema: z.object({
    label: z.string().optional().default(""),
    value: z.string().optional().default(""),
    title: z.string().optional().default(""),
    description: z.string().optional().default(""),
    date: z.coerce.date().optional(),
    createdAt: z.coerce.date().optional(),
    completedAt: z.coerce.date().optional(),
    status: z.enum(["done", "todo"]).optional(),

    // Notebook
    name: z.string().optional().default(""),
    cover: z.string().optional().default(""),
    summary: z.string().optional().default(""),
    entries: z.number().optional().default(0),
    updatedAt: z.union([z.string(), z.date()]).optional(),
    tags: z.array(z.string()).optional().default([]),

    // Place
    province: z.string().optional().default(""),
    city: z.string().optional().default(""),
    experience: z.string().optional().default(""),
    visitCount: z.number().optional().default(1),
    lat: z.number().optional(),
    lng: z.number().optional(),

    // Legacy
    waterCups: z.number().optional(),
    meals: z.array(z.object({ name: z.string(), value: z.string() })).optional().default([]),
    streak: z.number().optional().default(0),
    progress: z.number().min(0).max(100).optional().default(0),
  }),
});
```

### 3.4 添加 routines 集合

```typescript
const routinesCollection = defineCollection({
  loader: glob({
    pattern: "**/*.{md,mdx}",
    base: "./src/content/life/routines",
  }),
  schema: z.object({
    name: z.string(),
    time: z.string().optional().default(""),
    description: z.string().optional().default(""),
    icon: z.string().optional().default("📌"),
    color: z.string().optional().default(""),
    updatedAt: z.union([z.string(), z.date()]).optional(),
  }),
});
```

### 3.5 注册到 collections 导出

```typescript
// 在 src/content.config.ts 底部：
export const collections = {
  posts: postsCollection,
  spec: specCollection,
  bangumi: bangumiCollection,     // 新增
  changelog: changelogCollection, // 新增
  life: lifeCollection,           // 新增
  routines: routinesCollection,   // 新增
};
```

---

## 4. 步骤二：更新类型定义

### 4.1 修改 `src/types/siteConfig.ts`

在 `pages` 类型中添加新页面开关：

```typescript
// 找到 pages 类型定义，添加：
pages: {
  friends: boolean;
  sponsor: boolean;
  guestbook: boolean;
  bangumi: boolean;
  gallery: boolean;
  anime: boolean;

  // 新增：
  books: boolean;         // 书架页面开关
  moviesGames: boolean;   // 影视与游戏页面开关
  musicPage: boolean;     // 音乐页面开关
  changelog: boolean;     // 更新日志页面开关
};
```

---

## 5. 步骤三：更新配置

### 5.1 修改 `src/config/siteConfig.ts`

在 `pages` 对象中添加新开关：

```typescript
pages: {
  friends: false,
  sponsor: false,
  guestbook: true,
  bangumi: false,
  gallery: true,
  anime: false,

  // === 新增 ===
  // 书架页面开关
  books: false,
  // 影视与游戏页面开关
  moviesGames: false,
  // 音乐页面开关
  musicPage: false,
  // 更新日志页面开关
  changelog: false,
},
```

> **提示**：先将这些开关设为 `false`，等页面文件创建完成并验证无误后再改为 `true`。

---

## 6. 步骤四：添加国际化翻译

### 6.1 修改 `src/i18n/i18nKey.ts`

在枚举中添加新键：

```typescript
enum I18nKey {
  // ... 现有键 ...

  // === 新增 ===
  booksTitle = "booksTitle",
  booksSubtitle = "booksSubtitle",
  booksNoData = "booksNoData",
  bookshelfRead = "bookshelfRead",
  bookshelfReading = "bookshelfReading",
  bookshelfWantRead = "bookshelfWantRead",

  moviesGamesTitle = "moviesGamesTitle",
  moviesGamesSubtitle = "moviesGamesSubtitle",
  moviesGamesNoData = "moviesGamesNoData",
  moviesGamesAll = "moviesGamesAll",
  moviesGamesMovie = "moviesGamesMovie",
  moviesGamesTv = "moviesGamesTv",
  moviesGamesAnime = "moviesGamesAnime",
  moviesGamesGame = "moviesGamesGame",
  moviesGamesReal = "moviesGamesReal",
  moviesGamesDocumentary = "moviesGamesDocumentary",

  musicPageTitle = "musicPageTitle",
  musicPageSubtitle = "musicPageSubtitle",

  changelogTitle = "changelogTitle",
  changelogSubtitle = "changelogSubtitle",
  changelogFeature = "changelogFeature",
  changelogImprovement = "changelogImprovement",
  changelogFix = "changelogFix",
  changelogRemoval = "changelogRemoval",
  changelogAll = "changelogAll",
}
```

### 6.2 修改 `src/i18n/languages/zh_CN.ts`

```typescript
// === 新增 ===
[Key.booksTitle]: "书架",
[Key.booksSubtitle]: "我的阅读记录",
[Key.booksNoData]: "暂无书籍数据",
[Key.bookshelfRead]: "读过",
[Key.bookshelfReading]: "在读",
[Key.bookshelfWantRead]: "想读",

[Key.moviesGamesTitle]: "影视与游戏",
[Key.moviesGamesSubtitle]: "记录看过的影视和玩过的游戏",
[Key.moviesGamesNoData]: "暂无数据",
[Key.moviesGamesAll]: "全部",
[Key.moviesGamesMovie]: "电影",
[Key.moviesGamesTv]: "剧集",
[Key.moviesGamesAnime]: "动画",
[Key.moviesGamesGame]: "游戏",
[Key.moviesGamesReal]: "三次元",
[Key.moviesGamesDocumentary]: "纪录片",

[Key.musicPageTitle]: "音乐",
[Key.musicPageSubtitle]: "音乐收藏与可视化",

[Key.changelogTitle]: "更新日志",
[Key.changelogSubtitle]: "记录博客的成长历程",
[Key.changelogFeature]: "新功能",
[Key.changelogImprovement]: "优化",
[Key.changelogFix]: "修复",
[Key.changelogRemoval]: "移除",
[Key.changelogAll]: "全部",
```

对 `en.ts`、`ja.ts`、`ru.ts`、`zh_TW.ts` 也添加对应的翻译（可先复制中文，后续再完善）。

## 7. 步骤五：创建组件文件

### 7.1 书架组件

从源项目直接复制：

```bash
# 复制书架组件
cp -r D:/Github/dumplingandcakeblog/src/components/pages/books D:/lxblog/src/components/pages/books/
```

注意修改 `Bookshelf.astro` 中的路径别名，确保与 lxblog 的 `@` 别名一致。

### 7.2 影视与游戏组件

```bash
# 创建目录并复制
mkdir -p D:/lxblog/src/components/pages/movies-games/
cp D:/Github/dumplingandcakeblog/src/components/pages/movies-games/MovieGameCard.astro D:/lxblog/src/components/pages/movies-games/
```

### 7.3 音乐组件

```bash
# 复制音乐卡片和可视化组件
mkdir -p D:/lxblog/src/components/pages/music/
cp D:/Github/dumplingandcakeblog/src/components/pages/music/MusicCard.astro D:/lxblog/src/components/pages/music/
cp -r D:/Github/dumplingandcakeblog/src/components/features/music-visualizer D:/lxblog/src/components/features/music-visualizer/
```

### 7.4 分页组件

```bash
cp D:/Github/dumplingandcakeblog/src/components/common/ClientPagination.astro D:/lxblog/src/components/common/
```

### 7.5 关键：调整组件中的 import 路径

lxblog 和 dumplingandcakeblog 使用不同的路径别名：

| 别名 | dumplingandcakeblog | lxblog |
|------|-------------------|--------|
| 布局 | `@/layouts/` | `@/layouts/`（相同）|
| 配置 | `@config/` | `@/config/`（注意区别）|
| 组件 | `@components/` | `@/components/` |
| 国际化 | `@i18n/` | `@/i18n/` |

需要将组件中的 `@config/xxx` 改为 `@/config/xxx`，`@components/xxx` 改为 `@/components/xxx` 等。

---

## 8. 步骤六：创建页面文件

### 8.1 书架页面

从源项目直接复制：

```bash
mkdir -p D:/lxblog/src/pages/books/
cp D:/Github/dumplingandcakeblog/src/pages/books/index.astro D:/lxblog/src/pages/books/
cp D:/Github/dumplingandcakeblog/src/pages/books/[...slug].astro D:/lxblog/src/pages/books/
```

然后修改 import 路径（同上）。

### 8.2 影视与游戏页面

```bash
mkdir -p D:/lxblog/src/pages/movies-games/
cp D:/Github/dumplingandcakeblog/src/pages/movies-games/index.astro D:/lxblog/src/pages/movies-games/
```

### 8.3 音乐页面

```bash
mkdir -p D:/lxblog/src/pages/music/
cp D:/Github/dumplingandcakeblog/src/pages/music/index.astro D:/lxblog/src/pages/music/
```

### 8.4 更新日志页面

```bash
cp D:/Github/dumplingandcakeblog/src/pages/changelog.astro D:/lxblog/src/pages/
```

### 8.5 规划页面

```bash
mkdir -p D:/lxblog/src/pages/life/
cp D:/Github/dumplingandcakeblog/src/pages/life/routines.astro D:/lxblog/src/pages/life/
```

### 8.6 足迹页面

```bash
cp D:/Github/dumplingandcakeblog/src/pages/life/places.astro D:/lxblog/src/pages/life/
```

> **重要**：每次复制后，都需要：
> 1. 将 `@config/` → `@/config/`
> 2. 将 `@components/` → `@/components/`
> 3. 将 `@i18n/` → `@/i18n/`
> 4. 将 `@utils/` → `@/utils/`
> 5. 如果 lxblog 没有 `removeFileExtension` 等工具函数，需要自行添加
> 6. 检查所有 import 是否在 lxblog 中存在

---

## 9. 步骤七：创建内容数据文件

### 9.1 Bangumi 数据示例

在 `src/content/bangumi/` 下创建目录结构：

```bash
mkdir -p D:/lxblog/src/content/bangumi/{book,anime,music,game}
```

**书籍示例** `src/content/bangumi/book/人性的弱点.md`：

```markdown
---
title: 人性的弱点
category: book
status: 2
score: 8
image: https://example.com/cover.jpg
published: 2026-01-01
tags: [心理学, 自我提升]
---

一部经典的心理学著作，教你如何与人相处。
```

**影视示例** `src/content/bangumi/anime/肖申克的救赎.md`：

```markdown
---
title: 肖申克的救赎
category: anime
subcategory: movie
status: 2
score: 10
image: https://example.com/shawshank.jpg
published: 2026-01-15
tags: [经典, 励志]
---

希望是美好的，也许是人间至善。
```

**音乐示例** `src/content/bangumi/music/海阔天空.md`：

```markdown
---
title: 海阔天空
category: music
artist: Beyond
status: 2
score: 10
image: https://example.com/haikuotiankong.jpg
published: 2026-02-01
tags: [经典, 粤语]
---
```

### 9.2 更新日志示例

**`src/content/changelog/2026-07-01-init.md`**：

```markdown
---
version: v1.0
date: 2026-07-01
type: feature
description: 初始化博客，完成基本功能搭建
---
```

### 9.3 规划示例

**`src/content/life/routines/每日时间规划.md`**：

```markdown
---
name: 每日时间规划
time: 全天
icon: 📋
description: 日常工作学习安排
updatedAt: 2026-07-01
---

| 时间段 | 安排 |
|--------|------|
| 8:00 | 起床 |
| 9:00-12:00 | 工作学习 |
```

### 9.4 足迹示例

**`src/content/life/places/2026-07-01-beijing.md`**：

```markdown
---
date: 2026-07-01
province: 北京
city: 北京
experience: 第一次去北京，感受首都的魅力
visitCount: 1
---
```

## 10. 步骤八：更新导航栏

### 10.1 修改 `src/config/navBarConfig.ts`

在 `LinkPresets` 中添加新入口：

```typescript
export const LinkPresets: Record<string, NavBarLink> = {
  // ... 现有预设 ...

  // === 新增 ===
  Books: {
    name: "书架",
    url: "/books/",
    icon: "material-symbols:book-5",
  },
  MoviesGames: {
    name: "影视与游戏",
    url: "/movies-games/",
    icon: "material-symbols:movie",
  },
  MusicPage: {
    name: "音乐",
    url: "/music/",
    icon: "material-symbols:music-note",
  },
  Changelog: {
    name: "更新日志",
    url: "/changelog/",
    icon: "material-symbols:history",
  },
  Routines: {
    name: "规划",
    url: "/life/routines/",
    icon: "material-symbols:list-alt",
  },
  Places: {
    name: "足迹",
    url: "/life/places/",
    icon: "material-symbols:location-on",
  },
};
```

### 10.2 在导航菜单中添加"记录"下拉

修改 `getDynamicNavBarConfig()` 函数，在适当位置添加"记录"菜单：

```typescript
const getDynamicNavBarConfig = (): NavBarConfig => {
  const links: NavBarLink[] = [
    LinkPresets.Home,

    // 文章
    {
      name: "文章",
      url: "#",
      icon: "material-symbols:article",
      children: [
        LinkPresets.Archive,
        LinkPresets.Categories,
        LinkPresets.Tags,
      ],
    },

    // === 新增：记录 ===
    {
      name: "记录",
      url: "/books/",
      icon: "material-symbols:camera-outdoor",
      children: [
        LinkPresets.Books,
        LinkPresets.MoviesGames,
        LinkPresets.MusicPage,
        LinkPresets.Changelog,
        LinkPresets.Routines,
        LinkPresets.Places,
      ],
    },

    // 相册
    LinkPresets.Gallery,

    // 留言板
    LinkPresets.Guestbook,

    // 关于
    {
      name: "关于",
      url: "/about/",
      icon: "material-symbols:info",
    },
  ];

  // 注意：这里重建了 links 数组，需要根据 lxblog 现有的
  // 自定义配置（如 pageKey、条件判断等）做调整
  return { links } as NavBarConfig;
};
```

> **注意**：lxblog 原本的 `getDynamicNavBarConfig()` 较简洁（没有使用 `siteConfig.pages` 动态判断），以上代码是重建版本。你可以根据 lxblog 现有的样式进行调整。

---

## 11. 步骤九：验证

### 11.1 构建验证

```bash
cd D:/lxblog
pnpm build
```

检查是否出现编译错误，特别是：
- Content Collection schema 是否匹配数据文件
- import 路径是否正确
- 类型是否正确

### 11.2 运行时验证

```bash
pnpm dev
```

依次访问以下路由：
- [x] `/books/` — 书架列表，应显示书籍卡片
- [x] `/books/example-book/` — 书籍详情（需有对应数据）
- [x] `/movies-games/` — 影视与游戏列表
- [x] `/music/` — 音乐页面（含 3D 可视化）
- [x] `/changelog/` — 更新日志时间线
- [x] `/life/routines/` — 规划页面
- [x] `/life/places/` — 足迹页面（含 ECharts 地图）

### 11.3 导航栏验证

- [x] 导航栏出现"记录"下拉菜单
- [x] 6 个子菜单均可正常跳转
- [x] 页面开关设为 `false` 时返回 404

---

## 12. 常见问题排查

### Q1: ECharts 地图不显示

足迹页面需要加载 ECharts 和 China 地图数据。lxblog 的足迹页面 `places.astro` 中已有 CDN 回退逻辑，确保网络可访问 `cdn.jsdelivr.net`。

### Q2: MusicVisualizer 不工作

音乐可视化组件是 Svelte 组件，需要确保：
- lxblog 已安装 Svelte 集成（`@astrojs/svelte`）
- 组件使用 `client:visible` 或 `client:load` 指令挂载

### Q3: Import 路径错误

两个项目的路径别名不同，复制文件后必须检查：
```
@config/        → @/config/
@components/    → @/components/
@i18n/          → @/i18n/
@utils/         → @/utils/
@layouts/       → @/layouts/（相同）
@types/         → @/types/（相同）
```

### Q4: siteConfig.pages 类型错误

如果 `siteConfig.pages` 类型报错，说明 `src/types/siteConfig.ts` 中的 `pages` 类型没有添加新字段。按第 4 步更新即可。

---

## 13. 总结

移植完成后，lxblog 将获得：

| 模块 | 数据源 | 渲染方式 | 交互复杂度 |
|------|--------|---------|-----------|
| 书架 | bangumi content collection | SSR | 低 |
| 影视与游戏 | bangumi content collection | SSR + 分页 | 中 |
| 音乐 | bangumi content collection | SSR + Svelte 交互 | 高（3D） |
| 更新日志 | changelog content collection | SSR + 客户端筛选 | 低 |
| 规划 | routines content collection | SSR | 无 |
| 足迹 | life content collection | SSR + ECharts 地图 | 中 |

总共涉及约 **15 个新文件、5 个修改文件**，建议分步操作：先做 Content Collections 和类型定义，再创建页面和组件，最后更新导航栏。
