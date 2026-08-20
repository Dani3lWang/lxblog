# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

Firefly is a feature-rich static blog theme built on **Astro 7** with **Svelte 5** for interactive components. It's a fork of [Fuwari](https://github.com/saicaca/fuwari) extended with extensive features. Primary language is Chinese (Simplified) with i18n for en, zh_TW, ja, ko, ru.

## 常用命令

| 命令 | 用途 |
|---|---|
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build (LQIPs → VNDB covers → Astro build → pio asset pruning → font subsetting → Pagefind indexing) |
| `pnpm preview` | Preview production build |
| `pnpm check` | `astro check` for type/error checking |
| `pnpm type-check` | `tsc --noEmit --isolatedDeclarations` (covers `src/` and `scripts/`) |
| `pnpm lint` | Biome lint + auto-fix |
| `pnpm format` | Biome format |
| `pnpm new-post <filename>` | Scaffold a new blog post |
| `pnpm new-dynamic` (`new-d`) | Scaffold a new dynamic (microblog) entry |
| `pnpm lqips` | Regenerate LQIP data into `src/constants/lqips.json` |

**包管理器被强制锁定**：`preinstall` 钩子里跑 `npx only-allow pnpm`，只接受 pnpm。Node ≥ 22、pnpm ≥ 9。本项目**没有自动化测试**，验证只能靠 `pnpm check` + 手动 `pnpm preview`。

根据 `CONTRIBUTING.md`：提交 PR 前请跑 `pnpm check` 和 `pnpm format`，commit 信息使用 Conventional Commits 规范。

## 构建流水线的两个"暗坑"

`pnpm build` 在 Astro 之前会跑**两个代码生成器**，产物会写回仓库；只要被扫描的输入变化就需要重新跑：

1. **`scripts/generate-icons.js`** —— 扫描 `src/**/*.svelte`（及其他源文件），匹配 `icon="prefix:name"`、`getIconSvg("…")`、`hasIcon("…")` 这几种字面量模式，然后从 `@iconify-json/*` 数据里把对应 SVG 烤进 `src/constants/icons.ts`。**新加的图标名称必须以字面量形式出现在源码里**，靠变量拼接的图标名在构建时找不到，会变成空。
2. **`scripts/generate-lqips.ts`** —— 遍历 `src/` 与 `public/` 下的图片，用 `sharp` 缩到 2×2，生成一个十六进制渐变色数据写到 `src/constants/lqips.json`，供 LQIP 组件使用。会增量追加新文件，缺失的文件会自动清理。

两个产物都已在 `biome.json` 的 `files.includes` 里**排除 Biome 格式化**，且都不应手改。

`pagefind --site dist` 在 Astro 构建**之后**运行，索引已经生成的 HTML。`pagefind.yml` 里写好了要排除的选择器（katex、搜索面板、任何带 `data-pagefind-ignore` 的节点）。

## 部署适配器的切换

`astro.config.mjs` 里根据环境变量动态选 adapter：

```js
const adapter = process.env.CF_WORKERS
  ? cloudflare({ prerenderEnvironment: "node" })
  : undefined;
```

- 不设环境变量 → 默认静态产物，适配 Vercel / Netlify / Cloudflare Pages。
- `CF_WORKERS=1 pnpm build` → 走 Cloudflare Workers 适配器，配合 `wrangler.jsonc`（asset 目录是 `./dist`，项目名 `blog`）。

### Scroll Performance Constraints

Scroll-linked work in `src/utils/` is rAF-throttled and must stay cheap on mobile — do not regress these:

- `fullscreen-wallpaper-utils.ts` — fullscreen-mode title fade + blur ramp. The blur value `--fullscreen-blur` is **quantized to 2px steps** (skips writes when unchanged) and the max blur (`--overlay-blur`) is **cached** (read once; refreshed by a MutationObserver on `#wallpaper-wrapper` style). Avoid per-frame `getComputedStyle` or continuous full-screen `filter: blur()` writes — each change re-rasterizes the whole viewport on mobile.
- `grid-layout-utils.ts` — `updateSidebarStickySpacing()` is the per-scroll path and **must not read layout** (`offsetHeight` etc.). The sidebar top-container visibility (`hasVisibleTop`) is cached by `refreshSidebarStickyState()`, which runs on init/navigation only.
- Fullscreen blur ramp can be disabled per device via `backgroundWallpaper.fullscreen.blurRamp.enable.{desktop,mobile}` — when off, fullscreen mode has no blur on that device (home + other pages) and the settings-panel blur slider is hidden. Documented in `Firefly-Docs/` (zh/en).

### Content Collections

Defined in `src/content.config.ts`:
- `posts` — blog posts (`.md`/`.mdx`) with frontmatter: title, published, tags, category, draft, pinned, password, comment, etc.
- `spec` — special pages (about, guestbook)
- `dynamic` — microblog entries (`.md`) with frontmatter: published, pinned, location

`vercel.json` 设置了安全响应头以及对 `/_astro/*` 的 immutable 缓存。

- `src/components/` — organized by domain: `analytics/`, `comment/`, `common/`, `controls/`, `features/`, `layout/`, `misc/`, `pages/`, `widget/`
- `src/plugins/` — 15 custom remark/rehype plugins (Mermaid, PlantUML, KaTeX, GitHub cards, reading time, wiki links, etc.)
- `src/i18n/` — translation keys in `i18nKey.ts`, language files in `languages/*.ts`, lookup via `translation.ts`
- `src/utils/` — content sorting, crypto (encrypted posts), date formatting, image processing/LQIP, TOC generation
- `src/pages/` — Astro file-based routing
- `scripts/` — build-time utilities (`generate-lqips.ts`, `generate-vndb-covers.ts`, `subset-fonts.ts`, `new-post.js`, `new-dynamic.js`)

### 配置是面向用户的"公共 API"

所有用户可配项都分散在 `src/config/*.ts`，最终通过 `src/config/index.ts` 这个 barrel 统一导出。**永远从 barrel 引入**：

```ts
import { siteConfig, sidebarLayoutConfig } from "@/config";
```

- **Biome** enforces: tab indentation, double quotes, recommended lint rules
- Relaxed rules for `.svelte`/`.astro`/`.vue` files (`useConst`, `useImportType`, `noUnusedVariables`, `noUnusedImports` off)
- `pnpm lint`/`pnpm format` only target `./src` — `scripts/` is type-checked (tsconfig `include`) but not linted, and currently has pre-existing Biome findings
- `scripts/subset-font.d.ts` is a hand-written ambient declaration for the untyped `subset-font` package
- Commit convention: **Conventional Commits** (`feat:`, `fix:`, `chore:`, etc.)

`siteConfig.pages.{friends,sponsor,guestbook,bangumi,gallery}` 是一个**横切式开关**：

1. 关闭时对应路由直接返回 404；
2. 同时被 `astro.config.mjs` 里的 `sitemap` 过滤器用来剔除条目。

Multi-step: `scripts/generate-lqips.ts` → `scripts/generate-vndb-covers.ts` → `astro build` → `scripts/prune-pio-assets.ts` → `scripts/subset-fonts.ts` → `scripts/minify-inline-scripts.ts` → `pagefind --site dist`

LQIP data is generated into `src/constants/lqips.json` and committed — regenerate with `pnpm lqips`. Icon data lives in `src/constants/icons-data.json` (committed, Biome-ignored, consumed by `src/components/common/Icon.svelte`) but has no generator script in the current build.

`generate-vndb-covers.ts` downloads VNDB cover art into `public/vndb-covers/` (gitignored, skips files that already exist). It no-ops unless `siteConfig.vndb` has a `userId`, `downloadCovers: true`, and `mode: "static"`.

`prune-pio-assets.ts` deletes unused 看板娘 assets from `dist/` after the Astro build (Astro copies all of `public/` regardless of config). It drops `dist/pio/models/live2d` plus the orphaned `Live2DWidget` client chunk when `live2dWidgetConfig.enable` is false, `dist/pio/models/spine` and `dist/pio/static` when `spineModelConfig.enable` is false, and all of `dist/pio` when both are off (~15 MiB). It no-ops when both are enabled.

新增可选页面时，这三处要一起改（见上文页面开关说明）。

所有配置类型按 feature 拆分在 `src/types/` 下的 `xxxConfig.ts`,通过 `src/types/config.ts` 这个 barrel 集中 re-export;`src/config/index.ts` 顶部再把它们透传出来,所以组件可以直接 `import type { SiteConfig } from "@/config"`。新增类型时记得在两个 barrel 都登记一遍,保持对称。

### 布局文件是"巨石"

- `src/layouts/Layout.astro`（约 64 KB）是全局 `<html>` 外壳：head 注入、主题引导、字体/Katex/Fancybox/Music/Sakura 各 Manager 的挂载、Swup 容器、暗色模式防闪烁脚本。
- `src/layouts/MainGridLayout.astro`（约 43 KB）把内容页包进带侧边栏的网格。

**不要轻易重构这两个文件**：很多组件依赖一组固定的 DOM ID（`#swup-container`、`#left-sidebar-dynamic`、`#right-sidebar-dynamic`、`#banner-overlay-container`、`#banner-dim-container`、`#floating-toc-wrapper`），这些 ID 正是 `astro.config.mjs` 里 Swup 用来识别可替换容器的标识。

### 组件分类（详见 `src/components/README.md`）

- **`layout/`** —— 页面骨架（Navbar、Footer、SideBar、PostCard……）
- **`widget/`** —— 侧边栏小卡片（Calendar、Categories、Tags、SiteStats、Profile、SidebarTOC、Music……）
- **`controls/`** —— 交互控件；带状态的 UI 写成 `.svelte` 岛（Search、ArchivePanel、DisplaySettings、LightDarkSwitch、WallpaperSwitch、LayoutSwitchButton）
- **`features/`** —— 全局挂载的 **Manager** 与视觉效果。命名约定 `*Manager.astro` 表示**单例协调器**。最关键的是 `MusicManager`：它持有唯一的 `<audio>` 元素并通过 `CustomEvent` 广播状态，所有 `MusicPlayer` 视图只是纯 UI 在监听事件。**不要新增第二个 audio 元素。**
- **`common/`** —— 跨场景复用的基础组件（Icon、ImageWrapper、CoverImage、Markdown、Pagination）
- **`comment/`** —— 可插拔评论后端（Artalk、Disqus、Giscus、Twikoo、Waline），通过 `commentConfig` 选择
- **`pages/`** —— 页面专用组件（番组卡片、AdvancedSearch）
- **`analytics/`、`misc/`** —— 第三方接入、License、SharePoster

### 内容集合

`src/content.config.ts` 用 Zod 定义两个 collection：

- **`posts`** —— `src/content/posts/**/*.{md,mdx}`。Schema 包含 Firefly 扩展字段：`pinned`、`password`/`passwordHint`（配合 `features/EncryptedPost.astro` 实现加密文章）、`comment`、许可信息字段，以及**内部**的 `prevSlug/prevTitle/nextSlug/nextTitle`（由 `src/utils/content-utils.ts` 里的 `getSortedPosts()` 注入，**不要在 frontmatter 里手写**）。
- **`spec`** —— `src/content/spec/` 下的特殊页面。

`src/content/posts/Sample/` 已被 `.gitignore` 忽略——本地自由用，不会污染仓库。

`getSortedPosts()` 只在生产环境过滤草稿（`import.meta.env.PROD`），置顶优先、再按日期排序，并把 prev/next 链接就地缝进去。

`getRelatedPosts()` 评分公式（写在 `content-utils.ts` 里）：`tagJaccard*100 + titleJaccard*100 + freshness(半衰期 180 天，封顶 30) + categoryBonus(10)`。设置了 `data.password` 的加密文章会从推荐池里排除。

### Markdown 处理管线

`astro.config.mjs` 用自定义的 `unified()` 处理器**替代了 Astro 默认的 Markdown 处理器**。要加一个 Markdown 特性，就往这两个列表里塞：

- **Remark**（文本 → MDAST）：`remarkMath`、`remarkReadingTime`、`remarkImageGrid`、`remarkExcerpt`、`remarkDirective`、`remarkSectionize`、`parseDirectiveNode`、`remarkMermaid`、`remarkPlantuml`
- **Rehype**（MDAST → HAST）：`rehypeKatex`、`rehypeCallouts`（主题从 `siteConfig.rehypeCallouts.theme` 读）、`rehypeSlug`、`rehypeMermaid`、`rehypePlantuml`、`rehypeFigure`、`rehypeExternalLinks`、`rehypeEmailProtection`、`rehypeComponents`（挂载 `GithubCardComponent`）、`rehypeAutolinkHeadings`

`src/plugins/` 下本地的 `.mjs` / `.js` 插件是**成对出现**的：一个 **remark** 插件识别 Markdown 指令并注入占位节点；对应的 **rehype** 插件（mermaid/plantuml）把占位节点换成实际渲染容器，并把客户端渲染脚本（`mermaid-render-script.js`、`plantuml-render-script.js`，通过 Vite 的 `?raw` 引入）内联进 HTML。**新增图表类块**就照着这个模式写。

`rehypeCallouts` 改主题后需要**重启 dev server**——它在启动时通过 Vite alias 解析。

### 页面生成

- `src/pages/[...page].astro` —— 分页首页（`postsPerPage` 来自 `siteConfig.pagination`）
- `src/pages/posts/[...slug].astro` —— 文章详情（处理加密文章和 last-modified 阈值）
- `src/pages/categories/`、`src/pages/tags/` —— 由内容动态生成的路由
- `src/pages/api/allPostMeta.json.ts` —— 给客户端搜索/归档用的 JSON 端点
- `src/pages/og/` —— 用 Satori 生成 OG 图，受 `siteConfig.generateOgImages` 控制（默认关闭，因为很慢）
- `src/pages/rss.astro`、`rss.xml.ts`、`robots.txt.ts` —— 订阅与 robots

### i18n

`src/i18n/i18nKey.ts` 是**所有字符串 key 的枚举**；`src/i18n/translation.ts` 根据 `siteConfig.lang` 选到 `src/i18n/languages/{zh_CN,zh_TW,en,ja,ru}.ts` 里去取译文。**非中文语言是 AI 翻译的**，`README.md` 明确欢迎提 PR 修正。新增 UI 文案时，要在 `i18nKey.ts` 加 key，并在**每一个**语言文件里补上翻译。

### 样式

Tailwind v4 通过 `@tailwindcss/vite` 接入（**没有 `tailwind.config.js`**，类是 JIT 生成的）。全局样式集中在 `src/styles/`，混合了 CSS、`.styl`（Stylus）以及 PostCSS。`biome.json` 把 `src/**/*.css` 排除在格式化之外；Stylus 与 Tailwind 指令也都在这个目录里。

### TypeScript 路径别名

`tsconfig.json` 定义了：`@components/*`、`@assets/*`、`@constants/*`、`@utils/*`、`@i18n/*`、`@layouts/*`，以及宽泛的 `@/*`。有具体别名时优先用具体的。

## Biome 里的硬性约定

- **Tab** 缩进，JS/TS 用**双引号**
- 下列规则都升为 `error`（与上游 `recommended` 重叠的不算）：`noParameterAssign`、`useAsConstAssertion`、`useDefaultParameterLast`、`useEnumInitializers`、`useSelfClosingElements`、`useSingleVarDeclarator`、`noUnusedTemplateLiteral`、`useNumberNamespace`、`noInferrableTypes`、`noUselessElse`
- 对 `.svelte` / `.astro` / `.vue` 文件，**关闭** `useConst`、`useImportType`、`noUnusedVariables`、`noUnusedImports`（与模板层冲突）
- `assist.organizeImports` 开启 —— Biome 在 format 时会自动重排 import

## 已 gitignore 的本地便利目录

`Firefly-docs/`（文档站开发预览）、`package/`、`cache/`、`src/content/posts/Sample/`、`.obsidian/`（Obsidian vault 标记），以及上游常用的 `.vscode/`、`.idea/`、`.claude/` 配置目录，都已被忽略——是放本地临时文件的安全位置。`astro.config.mjs` 还额外告诉 Vite 不要监听 `**/package/**` 和 `**/Firefly-docs/**`。

仓库根的 `_frontmatter.json` 是 [Front Matter CMS](https://frontmatter.codes/) 的 IDE 侧配置（VS Code 等），不影响构建。
