# AGENTS.md — Firefly Blog

> 可执行的速查手册。若事实与 `README`/CLAUDE.md 冲突，以本仓库的 `package.json`、`astro.config.mjs`、CI workflow 为准。

## 项目定位

基于 Astro 7 + Svelte islands 的静态博客主题，fork 自 `saicaca/fuwari`。内容驱动：Markdown/MDX → 静态 HTML，配置集中在 `src/config/*`。

## 环境约束

- **Node.js ≥ 22**，**pnpm ≥ 9**（`packageManager: pnpm@9.14.4`）。
- 包管理器被 `preinstall` 钩子锁定为 pnpm：`npm/yarn install` 会失败。
- 无自动化测试。验证靠 `pnpm check` + 手动 `pnpm preview`。

## 高频命令

```bash
pnpm dev              # localhost:4321 开发
pnpm build            # 完整构建（见下）
pnpm preview          # 预览 dist/
pnpm check            # astro check，提交前必跑
pnpm format           # biome format --write ./src
pnpm lint             # biome check --write ./src
pnpm type-check       # tsc --noEmit --isolatedDeclarations
pnpm new-post <file>  # 在 src/content/posts/ 生成文章
pnpm icons            # 重新生成 src/constants/icons.ts
pnpm lqips            # 重新生成 src/constants/lqips.json
```

PR 前顺序：**`pnpm check` → `pnpm format`**（`CONTRIBUTING.md` 要求）。

## 硬性工作流约定

- **每次修改后必须立即 git 提交**。创建、修改、删除文件后，当前步骤完成就要 `git add` + `git commit`，不要累积多个无关改动再一次性提交。
- **commit 使用 Conventional Commits 规范**：`feat:`、`fix:`、`refactor:`、`docs:` 等前缀。
- 如果涉及 `.claude/plans/` 中的计划，按步骤执行，**每完成一步提交一次**。

## 新增文件规则

- **组件** → 放入对应功能域子目录，不要平铺在 `src/components/` 根目录。
- **样式** → 必须放入 `src/styles/`，禁止在组件外新建独立 CSS 文件。
- **配置** → 放入 `src/config/`，并在 `src/config/index.ts` 中统一导出。
- **工具函数** → 放入 `src/utils/`，按职责命名。

## 构建流水线暗坑

`pnpm build` 不是单纯的 `astro build`：

```
generate-icons.js → generate-lqips.ts → astro build → subset-fonts.ts → pagefind --site dist
```

1. **`scripts/generate-icons.js`**：扫描 `src/**/*.svelte` 等源文件，匹配 `icon="prefix:name"`、`getIconSvg("...")`、`hasIcon("...")` 字面量，生成 `src/constants/icons.ts`。**图标名必须写成字面量**，变量拼接会找不到。
2. **`scripts/generate-lqips.ts`**：遍历 `src/`、`public/` 图片，用 sharp 生成 2×2 渐变占位数据到 `src/constants/lqips.json`；会增量追加并清理已删除项。
3. **`scripts/subset-fonts.ts`**：Astro 构建后做字体子集化。
4. **`pagefind --site dist`**：构建完成后索引 HTML；排除规则见 `pagefind.yml`。

`src/constants/icons.ts` 和 `src/constants/lqips.json` 是**生成产物**，不要手改，且被 `biome.json` 排除格式化。

## 配置即 API

- 所有用户配置在 `src/config/*.ts`，统一从 barrel `src/config/index.ts` 导出。
- 新增配置类型时，在 `src/types/config.ts` 和 `src/config/index.ts` 都登记。
- 页面总开关：`siteConfig.pages.{friends,sponsor,guestbook,bangumi,gallery,anime,books,moviesGames,musicPage,changelog}`。关闭后对应路由返回 404，且 `astro.config.mjs` 的 sitemap 过滤器会剔除它。

## 部署适配器切换

`astro.config.mjs` 里：

```js
const adapter = process.env.CF_WORKERS
  ? cloudflare({ prerenderEnvironment: "node" })
  : undefined;
```

- 默认静态输出 → Vercel / Netlify / Cloudflare Pages / GitHub Pages。
- `CF_WORKERS=1 pnpm build` → Cloudflare Workers 适配器，配合 `wrangler.jsonc`。

## 内容集合

`src/content.config.ts` 定义：

- `posts`：`src/content/posts/**/*.{md,mdx}`。支持 `pinned`、`password`/`passwordHint`、`comment`。
- `spec`：关于/友链/留言板页面。
- `bangumi`：书籍/动画/音乐/游戏/影视收藏。
- `changelog`：版本日志。
- `life` / `routines`：生活记录与日常规划。
- `album`：相册。

`src/content/posts/Sample/` 已被 `.gitignore`，本地草稿可放这里。

## Markdown 管线

`astro.config.mjs` 用自定义 `unified()` 处理器替换了 Astro 默认处理器。关键插件链：

- **remark**：`remarkMath`、`remarkReadingTime`、`remarkImageGrid`、`remarkExcerpt`、`remarkDirective`、`remarkSectionize`、`parseDirectiveNode`、`remarkMermaid`、`remarkPlantuml`
- **rehype**：`rehypeKatex`、`rehypeCallouts`、`rehypeSlug`、`rehypeMermaid`、`rehypePlantuml`、`rehypeFigure`、`rehypeExternalLinks`、`rehypeEmailProtection`、`rehypeComponents`（Github 卡片）、`rehypeAutolinkHeadings`

新增图表类块建议照搬 `remarkXxx` + `rehypeXxx` 成对插件模式。`rehypeCallouts` 主题修改后需**重启 dev server**。

## 布局与关键 DOM ID

- `src/layouts/Layout.astro`：全局 HTML 外壳。
- `src/layouts/MainGridLayout.astro`：带侧边栏的内容页网格。

以下 DOM ID 被 Swup 当作替换容器，在 `astro.config.mjs` 注册：

```
#banner-overlay-container
#banner-dim-container
#category-bar-wrapper
#swup-container
#left-sidebar-dynamic
#right-sidebar-dynamic
#floating-toc-wrapper
```

## 音乐播放器硬约束

整个应用**只能有一个 `<audio>` 元素**，由 `MusicManager.astro` 持有并通过 `CustomEvent` 广播状态。所有 `MusicPlayer` 视图只是监听。不要新增第二个 audio 元素。

## 代码风格

- Biome：Tab 缩进，JS/TS 双引号。
- `biome.json` 对 `.svelte` / `.astro` / `.vue` 关闭 `useConst`、`useImportType`、`noUnusedVariables`、`noUnusedImports`。
- `format` 会同时执行 `assist.organizeImports` 重排 import。

## 类型与路径别名

`tsconfig.json`：

```
@components/*  @assets/*  @constants/*  @utils/*  @i18n/*  @layouts/*  @/*
```

有具体别名时优先用具体的。

## 上游同步

- `pnpm sync` / `pnpm sync:local`
- `pnpm sync:full` / `pnpm sync:full:local`

远端约定：`origin` = 你的 fork，`upstream` = `CuteLeaf/Firefly`。

## 忽略的安全沙盒

`.gitignore` 已忽略：`.claude/`、`.vscode/`、`.reasonix/`、`Firefly-docs/`、`package/`、`cache/`、`src/content/posts/Sample/`、`.obsidian/`。本地临时文件可放这些目录。
