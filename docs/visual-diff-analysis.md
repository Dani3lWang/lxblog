# 视觉风格差异分析：lxblog → dumplingandcakeblog

> 分析日期：2026-07-03
>
> 目标：将 lxblog 的界面风格向 dumplingandcakeblog（极简/粗野主义）靠拢

---

## 概览

两个项目都是 **Firefly** 主题，但 `dumplingandcakeblog` 进行了深度的**极简/粗野主义 (Brutalist)** 定制。`lxblog` 保留了 Firefly 的默认风格（圆角、阴影、毛玻璃、彩色主题）。

**核心设计哲学差异：**

| 维度 | lxblog | dumplingandcakeblog |
|---|---|---|
| 设计风格 | 圆润、立体、彩色 | 锐利、扁平、黑白灰 |
| 色相 | 165 (青绿色) | 230 (蓝紫色) |
| 饱和度 | 有 chroma (0.01~0.14) | chroma 全部为 0 |
| 圆角 | 1rem 大圆角 | 全部直角 |
| 阴影 | Material 风格多层阴影 | 全部无阴影 |
| 模糊 | 毛玻璃效果 | 全部无模糊 |

---

## 一、色彩系统（最核心差异）

### 关键发现

dumplingandcakeblog 虽然 `siteConfig.ts` 中 `hue: 230`，但实际上在 `src/styles/tokens/colors.css` 中**把所有 OKLCH 颜色的 chroma 值设为了 0**，使得色相完全不生效，整个博客变成纯粹的黑白灰设计。

### 亮色主题对比

| 变量 | lxblog | dumplingandcakeblog |
|---|---|---|
| `--primary` | `oklch(0.70 0.14 var(--hue))` | `oklch(0.30 0 0)` |
| `--page-bg` | `oklch(0.95 0.01 var(--hue))` | `oklch(1 0 0)` |
| `--card-bg` | `white` | `transparent` |
| `--card-bg-transparent` | `rgb(255 255 255 / 0.6)` | `transparent` |
| `--btn-content` | `oklch(0.55 0.12 var(--hue))` | `oklch(0.25 0 0)` |
| `--btn-regular-bg` | `oklch(0.95 0.025 var(--hue))` | `transparent` |
| `--btn-regular-bg-hover` | `oklch(0.9 0.05 var(--hue))` | `oklch(0.94 0 0)` |
| `--btn-regular-bg-active` | `oklch(0.85 0.08 var(--hue))` | `oklch(0.90 0 0)` |
| `--btn-plain-bg-hover` | `oklch(0.95 0.025 var(--hue))` | `oklch(0.94 0 0)` |
| `--btn-plain-bg-active` | `oklch(0.98 0.01 var(--hue))` | `oklch(0.90 0 0)` |
| `--btn-card-bg-hover` | `oklch(0.98 0.005 var(--hue))` | `oklch(0.96 0 0)` |
| `--btn-card-bg-active` | `oklch(0.9 0.03 var(--hue))` | `oklch(0.92 0 0)` |
| `--deep-text` | `oklch(0.25 0.02 var(--hue))` | `oklch(0.10 0 0)` |
| `--title-active` | `oklch(0.6 0.1 var(--hue))` | `oklch(0.30 0 0)` |
| `--line-divider` | `rgba(0,0,0,0.08)` | `oklch(0.85 0 0)` |
| `--inline-code-bg` | `var(--btn-regular-bg)` | `oklch(0.95 0 0)` |
| `--codeblock-bg` | `oklch(0.17 0.015 var(--hue))` | `oklch(0.97 0 0)` |
| `--float-panel-bg` | `white` | `oklch(1 0 0)` |
| `--link-underline` | `oklch(0.93 0.04 var(--hue))` | `oklch(0.85 0 0)` |
| `--toc-badge-bg` | `oklch(0.9 0.045 var(--hue))` | `transparent` |

### 暗色主题对比

| 变量 | lxblog | dumplingandcakeblog |
|---|---|---|
| `--primary` | `oklch(0.75 0.14 var(--hue))` | `oklch(0.98 0 0)` |
| `--page-bg` | `oklch(0.16 0.014 var(--hue))` | `oklch(0.08 0 0)` |
| `--card-bg` | `oklch(0.23 0.015 var(--hue))` | `transparent` |
| `--deep-text` | (继承亮色) | `oklch(0.90 0 0)` |
| `--btn-regular-bg` | `oklch(0.33 0.035 var(--hue))` | `transparent` |
| `--btn-regular-bg-hover` | `oklch(0.38 0.04 var(--hue))` | `oklch(0.18 0 0)` |
| `--codeblock-bg` | `oklch(0.17 0.015 var(--hue))` | `oklch(0.12 0 0)` |
| `--float-panel-bg` | `oklch(0.19 0.015 var(--hue))` | `oklch(0.10 0 0)` |

---

## 二、设计 Token 对比

### 2.1 圆角 (Border Radius)

| Token | lxblog | dumplingandcakeblog |
|---|---|---|
| `--radius-large` | `1rem` | `0` |
| `--radius-sm` | `0.25rem` | `0` |
| `--radius-md` | `0.375rem` | `0` |
| `--radius-lg` | `0.5rem` | `0` |
| `--radius-xl` | `0.75rem` | `0` |
| `--radius-2xl` | `1rem` | `0` |
| `--radius-3xl` | `1.5rem` | `0` |
| `--radius-full` | `9999px` | `9999px` (保留) |

### 2.2 阴影 (Box Shadow)

| Token | lxblog | dumplingandcakeblog |
|---|---|---|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | `none` |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | `none` |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | `none` |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | `none` |
| `--shadow-2xl` | `0 25px 50px rgba(0,0,0,0.25)` | `none` |
| `--shadow-navbar` | `0 4px 16px rgba(0,0,0,0.1)` | `none` |
| `--shadow-navbar-dark` | `0 4px 16px rgba(0,0,0,0.2)` | `none` |
| `--shadow-button` | `0 4px 12px rgba(0,0,0,0.15)` | `none` |

### 2.3 模糊 (Blur)

| Token | lxblog | dumplingandcakeblog |
|---|---|---|
| `--blur-sm` | `4px` | `0px` |
| `--blur-md` | `8px` | `0px` |
| `--blur-lg` | `12px` | `0px` |
| `--blur-xl` | `16px` | `0px` |
| `--blur-2xl` | `20px` | `0px` |
| `--blur-3xl` | `24px` | `0px` |

---

## 三、导航栏 (Navbar) 差异

| 特性 | lxblog | dumplingandcakeblog |
|---|---|---|
| 定位 | sticky，始终可见 | sticky，向下滚动**隐藏**，向上滚动**显示** |
| 背景 | 半透明 + 毛玻璃 (`blur 20px`) | 纯色 `var(--page-bg)` |
| 圆角 | 底部圆角 `0 0 0.75rem 0.75rem` | 无圆角 |
| 边框 | 无 | 滚动后 `2px solid #000`（暗色 `#fff`） |
| 滚动后形态 | 保持原位，出现阴影 | 收缩为居中 pill，`max-width: min(72%, 860px)` |
| 透明度模式 | semi / full / semifull 三种 | 无（统一纯色） |
| 下拉面板 | 圆角 + 阴影 + 半透明边框 | `2px solid #000` 硬边框 + `page-bg` 背景 |
| 导航按钮 hover | 有背景色变化 | 无背景（`background: transparent !important`） |

### 关键 CSS 差异

**lxblog (`src/styles/navbar.css`):**
- 复杂的透明模式系统（semi/full/semifull）
- 依赖 `#wallpaper-wrapper` 判断 banner 模式
- 毛玻璃 + 半透明背景
- 桌面端和移动端分别处理
- 暗色主题有独立规则

**dumplingandcakeblog (`src/styles/layout/navbar.css`):**
- 极简：只有基础的 sticky + 显示/隐藏
- 滚动后收缩为 pill 带 2px 边框
- 不依赖 wallpaper 模式
- 代码量约为 lxblog 的 1/3

---

## 四、字体 (Font) 差异

| 维度 | lxblog | dumplingandcakeblog |
|---|---|---|
| 正文字体 | `system`（系统默认字体） | `AaZongYiYuan`（自定义中文圆体） |
| 字体来源 | 系统内置 | 本地 `/fonts/AaZongYiYuan/AaZongYiYuan-2.woff2` |
| 预加载 | 否 | 是 |
| 字体回退 | system-ui → Roboto → sans-serif | system-ui → Roboto → sans-serif |
| 备选字体 | Zen Maru Gothic, Inter, JetBrains Mono, GreatVibes | Zen Maru Gothic, Inter, MiSans, Chiron GoRound, STDongGuanTi |
| 代码字体 | JetBrains Mono (fontsource) | 继承系统（未单独配置） |

### dumplingandcakeblog 字体配置详情

```ts
// src/config/fontConfig.ts
selected: ["aazongyiyuan"],
fonts: {
    aazongyiyuan: {
        id: "aazongyiyuan",
        name: "Aa综艺圆",
        src: "/fonts/AaZongYiYuan/AaZongYiYuan-2.woff2",
        family: "AaZongYiYuan",
        format: "woff2",
        display: "swap",
    },
    // ... 还有 zen-maru-gothic, inter, misans, chiron-goround, stdongguanti
}
```

### lxblog 字体配置详情

```ts
// src/config/fontConfig.ts
selected: ["system"],  // 全局使用系统字体
bannerTitleFont: "--font-zen-maru-gothic",
bannerSubtitleFont: "--font-inter",
codeFont: "--font-jetbrains-mono",
```

---

## 五、布局与组件差异

### 5.1 顶部渐变高光

| 特性 | lxblog | dumplingandcakeblog |
|---|---|---|
| 存在 | 无 | 有 |
| 实现 | - | 固定定位 180px 渐变层 |
| 亮色 | - | `rgba(255,255,255,0.5)` → transparent |
| 暗色 | - | `rgba(0,0,0,0.5)` → transparent |

### 5.2 卡片 (Card) 配置

| 配置 | lxblog | dumplingandcakeblog |
|---|---|---|
| `card.border` | `true` | `true` |
| `card.followTheme` | `false` | 无此字段（新版已移除） |
| 卡片背景 | `var(--card-bg-transparent)` | `transparent` |
| 卡片圆角 | `var(--radius-large)` = 1rem | `var(--radius-large)` = 0 |
| 边框阴影 | `border + shadow-xs` | `border`（但因 shadow 为 none，无阴影） |

### 5.3 下拉面板 (Dropdown/Float Panel)

| 特性 | lxblog | dumplingandcakeblog |
|---|---|---|
| 背景 | `var(--card-bg)` 或半透明 | `var(--page-bg) !important` |
| 边框 | `1px solid rgba(0,0,0,0.05)` | `2px solid #000 !important` |
| 暗色边框 | `1px solid rgba(255,255,255,0.1)` | `2px solid #fff !important` |
| 圆角 | `var(--radius-large)` | `var(--radius-large)` = 0 |

### 5.4 侧边栏组件

| 位置 | lxblog | dumplingandcakeblog |
|---|---|---|
| 左栏 | Profile, 公告, 音乐, 分类, 标签 | Profile, PostDirectory, Calendar, Stats |
| 右栏 | Stats, SiteInfo, Calendar, TOC | Relationship, SiteVisit, Quote, RecentItems, TOC |
| 移动端 | Profile, 公告, 音乐, 分类, 标签, Stats, SiteInfo | Relationship, RecentItems, Stats |

### 5.5 文章列表布局

| 配置 | lxblog | dumplingandcakeblog |
|---|---|---|
| `defaultMode` | `"list"` | `"grid"` |
| `grid.columns` | 无（默认 2） | `3` |
| `grid.masonry` | `false` | `false` |

---

## 六、页面开关配置差异

| 页面 | lxblog | dumplingandcakeblog |
|---|---|---|
| 友链 | `false` | (通过关于下拉) |
| 赞助 | `false` | `true` |
| 留言板 | `true` | `true` |
| 番组计划 | `false` | `false` |
| 相册 | `true` | (通过动态下拉) |
| 追番 | `false` | 无 |
| 书架 | 无 | `true` |
| 影视游戏 | 无 | `true` |
| 音乐页 | 无 | `true` |
| 更新日志 | 无 | `true` |

---

## 七、调整方案

### 第一层：配置修改（`src/config/siteConfig.ts`）

低风险，修改后立即生效：

```ts
themeColor: {
    hue: 230,        // 165 → 230 (虽然 chroma 归零后色相不影响，但保持一致)
    fixed: false,
    defaultMode: "system",
},

card: {
    border: false,   // true → false (关闭卡片边框，让极简生效)
    followTheme: false,
},
```

### 第二层：CSS 变量覆盖（`src/styles/variables.styl`）⭐ 核心

这是最重要的改动。将 `variables.styl` 中所有颜色的 **chroma 值归零**，同时将圆角、阴影、模糊全部置零。

参考 dumplingandcakeblog 的 `src/styles/tokens/colors.css` 和 `src/styles/tokens/breakpoints.css`。

关键原则：
- 所有 `oklch(L C var(--hue))` 改为 `oklch(L 0 0)`（chroma 归零，不再依赖 hue）
- 所有 `--shadow-*` 改为 `none`
- 所有 `--blur-*` 改为 `0px`
- 所有 `--radius-*` 改为 `0`（保留 `--radius-full: 9999px`）

### 第三层：导航栏改造（`src/styles/navbar.css`）

参考 dumplingandcakeblog 的 `src/styles/layout/navbar.css`：

- 去掉毛玻璃效果（`backdrop-filter: none`）
- 去掉圆角（`border-radius: 0`）
- 添加滚动隐藏/显示逻辑
- 滚动后收缩为 2px 实线边框 pill
- 下拉面板改为 2px 实线边框

### 第四层：字体（可选）

如需使用 AaZongYiYuan 字体：
1. 获取字体文件放到 `public/fonts/AaZongYiYuan/`
2. 修改 `src/config/fontConfig.ts` 添加字体定义
3. 修改 `selected: ["aazongyiyuan"]`

### 第五层：顶部渐变高光（可选）

在 `src/styles/main.css` 中添加 `.top-gradient-highlight` 样式。

---

## 八、架构差异说明

两个项目的 **代码架构版本不同**，不能简单复制文件：

| 维度 | lxblog | dumplingandcakeblog |
|---|---|---|
| 变量管理 | Stylus (`variables.styl`) | 模块化 CSS (`tokens/colors.css`, `tokens/breakpoints.css`) |
| 样式入口 | `main.css` + 独立 CSS 文件 | `main.css` 分层 `@import` 体系 |
| 组件样式 | 分散在多个 CSS 文件 | 集中在 `components/`, `features/`, `layout/` 子目录 |
| 字体系统 | Astro Font API | 自定义 `fontConfig` + 本地文件 |
| 配置类型 | 独立 `src/types/` barrel | 统一的 `src/types/config.ts` barrel |

**安全策略：** 修改现有文件的值，而不是替换文件。保持 `lxblog` 的架构不变，只改 CSS 变量值。

---

## 九、相关文件索引

### lxblog 需要修改的文件

| 文件 | 修改内容 |
|---|---|
| `src/config/siteConfig.ts` | hue, card.border |
| `src/styles/variables.styl` | 颜色 chroma 归零, 圆角/阴影/模糊置零 |
| `src/styles/navbar.css` | 极简化导航栏 |
| `src/styles/main.css` | 添加顶部渐变高光 |
| `src/config/fontConfig.ts` | (可选) 添加自定义字体 |

### dumplingandcakeblog 参考文件

| 文件 | 参考内容 |
|---|---|
| `src/styles/tokens/colors.css` | 极简色彩系统 |
| `src/styles/tokens/breakpoints.css` | 圆角/阴影/模糊置零 |
| `src/styles/layout/navbar.css` | 极简导航栏 |
| `src/config/fontConfig.ts` | 字体配置 |
| `src/config/siteConfig.ts` | 站点配置 |
| `src/config/sidebarConfig.ts` | 侧边栏布局 |
| `src/styles/main.css` | 样式入口 + 顶部渐变 |