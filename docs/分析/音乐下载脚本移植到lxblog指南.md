# 音乐自动下载脚本移植指南 — 移植到 lxblog

> 目标：将 dumplingandcakeblog 的音乐自动下载脚本体系完整移植到 lxblog 项目。
> lxblog 版本：Firefly v6.13.5（已有 MusicManager/MusicPlayer，但无下载脚本、无 bangumi 内容集合）

---

## 目录

1. [移植概览](#1-移植概览)
2. [需要新增/修改的文件清单](#2-需要新增修改的文件清单)
3. [步骤一：复制下载脚本](#3-步骤一复制下载脚本)
4. [步骤二：配置 Meting API 端点](#4-步骤二配置-meting-api-端点)
5. [步骤三：更新音乐配置](#5-步骤三更新音乐配置)
6. [步骤四：配置音频输出目录](#6-步骤四配置音频输出目录)
7. [步骤五：使用下载脚本](#7-步骤五使用下载脚本)
8. [步骤六（推荐）：整合 bangumi 集合作为数据源](#8-步骤六推荐整合-bangumi-集合作为数据源)
9. [步骤七（可选）：集成音乐页面与 3D 可视化器](#9-步骤七可选集成音乐页面与-3d-可视化器)
10. [验证清单](#10-验证清单)
11. [常见问题](#11-常见问题)

---

## 1. 移植概览

### 1.1 两个项目的差异对比

| 对比项 | dumplingandcakeblog | lxblog |
|--------|-------------------|--------|
| Firefly 版本 | v6.6.13 | v6.13.5 |
| 下载脚本 | ✅ `scripts/fetch-music/` 完整 | ❌ 无 |
| Meting API | `https://mu.tsh520.cn/api` | `https://api.i-meto.com/meting/api` |
| 音频存储 | 外部 CDN (`https://ph.0824.uk/file/music/`) | 本地 `public/assets/music/` |
| 音乐数据源 | `src/content/bangumi/music/` (396 个 .md 文件) | `src/config/musicConfig.ts` 的 `local.playlist[]` |
| 音乐播放器 | ✅ MusicManager + MusicPlayer + 3D Visualizer | ✅ MusicManager + MusicPlayer（无 3D） |
| 音乐页面 | ✅ `/music/` 全屏 3D 页面 | ❌ 无 |
| bangumi 集合 | ✅ 13 个 Content Collections | ❌ 仅 `posts` + `spec` |

### 1.2 移植策略

**核心移植（必做）：** 移植下载脚本，让 lxblog 具备从多平台批量下载歌曲的能力。
下载后的歌曲通过 `musicConfig.ts` 的 `local.playlist[]` 接入现有播放器。

**推荐增强（建议做）：** 添加 bangumi 内容集合来管理音乐数据，实现与 dumplingandcakeblog 一致的数据流。

---

## 2. 需要新增/修改的文件清单

### 2.1 核心移植（必需）

```
# 新增：下载脚本目录（完整复制）
scripts/fetch-music/
  batch-download.py       # 批量下载入口
  fetch-lrc.py            # 核心下载引擎 (796行)
  extract-lrc.py          # 歌词提取工具
  playlist.txt            # 歌曲清单（示例数据）
  downloads/              # 本地音频缓存目录
  api1.txt                # API 文档（参考）
  api2.txt                # APlayer 文档（参考）

# 新增：音频资源目录
public/assets/music/
  songs/                  # 下载的音频文件
  covers/                 # 封面图片
  lyrics/                 # 歌词文件

# 修改：音乐配置
src/config/musicConfig.ts   # 更新 API 端点、CDN 地址
```

### 2.2 推荐增强（建议做）

```
# 新增：bangumi 内容集合数据目录
src/content/bangumi/music/   # 音乐数据（.md 文件，每首歌一个）

# 修改：Content Collections
src/content.config.ts        # 添加 bangumi 集合定义

# 修改：类型定义
src/types/config.ts          # 添加 MusicVisualizerConfig 类型（可选）

# 新增：音乐页面（可选）
src/pages/music/index.astro  # 音乐页面
src/components/pages/music/MusicCard.astro  # 音乐卡片

# 新增：3D 可视化器组件（可选）
src/components/features/music-visualizer/
  MusicVisualizer.svelte
  ThreeScene.svelte
  AudioAnalyzer.ts
  VisualizerControls.svelte
  LyricsOverlay.svelte

# 新增：可视化器样式
src/styles/pages/music-visualizer.css
```

---

## 3. 步骤一：复制下载脚本

### 3.1 复制整个 fetch-music 目录

```bash
# 在 lxblog 项目根目录执行
cp -r D:/Github/dumplingandcakeblog/scripts/fetch-music D:/lxblog/scripts/
```

### 3.2 创建音频资源目录

```bash
mkdir -p D:/lxblog/public/assets/music/{songs,covers,lyrics}
```

### 3.3 安装 Python 依赖

下载脚本依赖 mutagen 库处理音频元数据：

```bash
pip install mutagen
```

---

## 4. 步骤二：配置 Meting API 端点

### 4.1 查看脚本中的 API 配置

`fetch-lrc.py` 中的 API 端点定义（第 59-62 行）：

```python
API_ENDPOINTS = [
    "https://mu.tsh520.cn/api",                  # 你的自部署实例
    "https://meting.mikus.ink/api",               # 公共实例
]
```

### 4.2 推荐配置方案

**方案 A：继续使用 mu.tsh520.cn（推荐）**

如果 `mu.tsh520.cn` 的 Meting API 仍然可用，保持默认配置即可。该 API 支持多平台搜索（netease、tencent、kugou）和多平台 fallback。

**方案 B：使用 lxblog 现有的 API**

lxblog 的 `musicConfig.ts` 中已有多个 API 地址：

```python
# 在 fetch-lrc.py 中修改 API_ENDPOINTS 列表
API_ENDPOINTS = [
    "https://api.i-meto.com/meting/api",           # 官方 Meting API
    "https://api.injahow.cn/meting/",               # 备用
    "https://api.moeyao.cn/meting/",                # 备用
]
```

**方案 C：自部署 Meting API**

如果希望完全自控，可以部署自己的 Meting API 实例。

### 4.3 配置 NETEASE_SEARCH_ONLY

如果使用只支持 netease 搜索的 API，需要更新（第 65 行）：

```python
NETEASE_SEARCH_ONLY = {"https://api.i-meto.com/meting/api"}
```

---

## 5. 步骤三：更新音乐配置

### 5.1 修改 `src/config/musicConfig.ts`

lxblog 现有的 `musicConfig.ts` 需要更新以配合下载脚本的配置：

```typescript
// src/config/musicConfig.ts - 修改后
export const musicPlayerConfig: MusicPlayerConfig = {
  showInNavbar: true,
  mode: "local",                        // 使用本地模式
  volume: 0.7,
  playMode: "list",
  showLyrics: true,

  // Meting API 配置（用于下载脚本和前端 fallback）
  meting: {
    api: "https://mu.tsh520.cn/api?server=:server&type=:type&id=:id",
    server: "netease",
    type: "playlist",
    id: "10046455237",                   // 换成你的歌单 ID
    auth: "",
    fallbackApis: [
      "https://api.i-meto.com/meting/api?server=:server&type=:type&id=:id",
      "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id",
    ],
  },

  // 本地播放列表（下载脚本下载后的歌曲添加到这里）
  local: {
    playlist: [
      // 下载脚本生成的歌曲会添加到此处
      // 格式示例：
      // {
      //   name: "晴天",
      //   artist: "周杰伦",
      //   url: "/assets/music/songs/晴天周杰伦.m4a",
      //   cover: "/assets/music/covers/晴天周杰伦.jpg",
      //   lrc: "/assets/music/lyrics/晴天周杰伦.lrc",
      // },
    ],
  },
};
```

---

## 6. 步骤四：配置音频输出目录

### 6.1 修改 fetch-lrc.py 中的默认路径（第 48-51 行）

```python
# 脚本中默认的博客内容目录
BLOG_CONTENT_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "src", "content", "bangumi", "music"
))

# 默认音频 CDN 基础 URL
AUDIO_BASE = "https://ph.0824.uk/file/music/"

# 默认下载输出目录
DEFAULT_OUT = os.path.abspath(os.path.join(os.path.dirname(__file__), "downloads"))
```

### 6.2 lxblog 适配修改

由于 lxblog 不使用 bangumi 集合，需要调整路径指向：

```python
# 修改后的路径配置
BLOG_CONTENT_DIR = None                     # 不生成 .md 文件
# 或指向自定义目录
# BLOG_CONTENT_DIR = os.path.abspath(os.path.join(
#     os.path.dirname(__file__), "..", "..", "src", "content", "bangumi", "music"
# ))

# 音频 CDN 改为本地路径
AUDIO_BASE = "/assets/music/songs/"          # 本地路径，或留空

# 下载输出目录改为 public/assets/music/
DEFAULT_OUT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "public", "assets", "music", "songs"
))
```

### 6.3 修改 batch-download.py 中的默认目录（第 48-50 行）

```python
# 博客内容目录（lxblog 不需要可设为 None）
BLOG_CONTENT_DIR = None

# 默认输出目录
DEFAULT_OUT = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "public", "assets", "music", "songs"
))
```

---

## 7. 步骤五：使用下载脚本

### 7.1 单曲搜索下载

```bash
# 进入 lxblog 的脚本目录
cd D:/lxblog/scripts/fetch-music

# 搜索并下载单曲（自动下载音频+封面+歌词）
python fetch-lrc.py "晴天" "周杰伦" --md --server=netease

# 指定输出目录
python fetch-lrc.py "海阔天空" "Beyond" --md --server=netease --out=../public/assets/music/songs
```

### 7.2 批量下载（从 playlist.txt）

```bash
# 准备歌曲清单文件 playlist.txt，格式如下：
# 歌曲名：晴天，歌手名：周杰伦，专辑名：叶惠美
# 歌曲名：十年，歌手名：陈奕迅，专辑名：黑白灰

# 批量下载（跳过已存在的）
python batch-download.py playlist.txt --server=netease --skip-existing

# 预览模式（仅列出，不下载）
python batch-download.py playlist.txt --dry-run

# 不生成 .md 文件
python batch-download.py playlist.txt --no-md
```

### 7.3 本地文件处理（已有音频文件）

```bash
# 提取本地 M4A 文件的封面和歌词
python fetch-lrc.py ./downloads/晴天周杰伦.m4a

# 提取目录下所有文件并生成 .md
python fetch-lrc.py ./ --md
```

### 7.4 多平台诊断

```bash
# 测试一首歌在所有平台的可用性
python fetch-lrc.py "知我" "国风堂" --test

# 指定平台下载
python fetch-lrc.py "晴天" "周杰伦" --server=kugou --md
```

### 7.5 下载后添加到播放列表

下载完成后，将歌曲信息添加到 `src/config/musicConfig.ts` 的 `local.playlist[]` 中：

```typescript
local: {
  playlist: [
    {
      name: "晴天",
      artist: "周杰伦",
      url: "/assets/music/songs/晴天周杰伦.m4a",
      cover: "/assets/music/covers/晴天周杰伦.jpg",
      lrc: "/assets/music/lyrics/晴天周杰伦.lrc",
    },
  ],
},
```

> 提示：可以写一个小脚本，自动解析下载目录中的文件并生成 `musicConfig.ts` 的 playlist 配置片段。

---

## 8. 步骤六（推荐）：整合 bangumi 集合作为数据源

这是将音乐数据管理方式提升到与 dumplingandcakeblog 一致的关键步骤。
通过 Astro Content Collections 管理音乐数据，可避免手动维护 `local.playlist[]`。

### 8.1 修改 `src/content.config.ts`，添加 bangumi 集合

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
      artist: z.string().optional(),       // music 专用
      audioUrl: z.string().optional(),     // music 专用
      lrcUrl: z.string().optional(),       // music 专用
      metingServer: z.string().optional(), // music 专用
      metingId: z.string().optional(),     // music 专用
    }),
});

// 在 collections 导出中添加
export const collections = {
  posts: postsCollection,
  spec: specCollection,
  bangumi: bangumiCollection,   // 新增
};
```

### 8.2 创建音乐数据目录

```bash
mkdir -p D:/lxblog/src/content/bangumi/music
```

### 8.3 修改 fetch-lrc.py 输出路径

将 `fetch-lrc.py` 中的 `BLOG_CONTENT_DIR` 指向正确路径：

```python
BLOG_CONTENT_DIR = os.path.abspath(os.path.join(
    os.path.dirname(__file__), "..", "..", "src", "content", "bangumi", "music"
))
```

### 8.4 下载时自动生成 .md 文件

```bash
# 下载并生成 .md 文件到 src/content/bangumi/music/
python fetch-lrc.py "晴天" "周杰伦" --md --server=netease
```

生成的 `.md` 文件格式：

```markdown
---
title: 晴天
category: music
status: 2
image: /assets/music/covers/晴天周杰伦.jpg
artist: 周杰伦
audioUrl: /assets/music/songs/晴天周杰伦.m4a
lrcUrl: /assets/music/lyrics/晴天周杰伦.lrc
score: 0
published: 2026-07-06
---
```

### 8.5 修改 MusicManager.astro 支持从 bangumi 集合加载

lxblog 的 `MusicManager.astro` 目前只从 `musicConfig.ts` 的 `local.playlist[]` 加载数据。
需要修改以支持从 Astro 构建时传递的播放列表：

```astro
---
// 在 MusicManager.astro 的前端代码块中，添加 props 支持
// 这需要在调用的页面/组件中传递数据

interface Props {
  externalPlaylist?: Array<{
    name: string;
    artist: string;
    url: string;
    pic?: string;
    lrc?: string;
  }>;
}

const { externalPlaylist } = Astro.props;

// 合并外部播放列表到配置中
const mergedPlaylist = [
  ...(externalPlaylist || []),
  ...(config.mode === "local" && config.local?.playlist
    ? config.local.playlist.map(song => ({
        name: song.name,
        artist: song.artist,
        url: song.url,
        pic: song.cover,
        lrc: song.lrc,
      }))
    : []),
];
```

然后在页面中调用：

```astro
<MusicManager externalPlaylist={collectionPlaylist} />
```

---

## 9. 步骤七（可选）：集成音乐页面与 3D 可视化器

### 9.1 需要复制的文件

```bash
# 音乐页面
cp -r D:/Github/dumplingandcakeblog/src/pages/music D:/lxblog/src/pages/music

# 音乐卡片
mkdir -p D:/lxblog/src/components/pages/music
cp D:/Github/dumplingandcakeblog/src/components/pages/music/MusicCard.astro \
   D:/lxblog/src/components/pages/music/MusicCard.astro

# 3D 可视化器组件
cp -r D:/Github/dumplingandcakeblog/src/components/features/music-visualizer \
   D:/lxblog/src/components/features/music-visualizer

# 可视化器样式
mkdir -p D:/lxblog/src/styles/pages
cp D:/Github/dumplingandcakeblog/src/styles/pages/music-visualizer.css \
   D:/lxblog/src/styles/pages/music-visualizer.css
```

### 9.2 需要修改的类型定义

在 `src/types/musicConfig.ts`（或 `src/types/config.ts`）中添加可视化器类型：

```typescript
// 3D 可视化器主题配置
export type MusicVisualizerThemeConfig = {
  base1: string;
  base2: string;
  coolCore: string;
  coolEdge: string;
  warmCore: string;
  warmEdge: string;
  rippleColor: string;
  fogColor: string;
  glowIntensity: number;
};

// 3D 可视化器地形高度配置
export type MusicVisualizerHeightConfig = {
  idle: number;
  subBass: number;
  bass: number;
  lowMid: number;
  mid: number;
  highMid: number;
  energy: number;
  ripple: number;
  rippleAccent: number;
};

// 3D 可视化器配置
export type MusicVisualizerConfig = {
  background: { dark: string; light: string };
  camera: { position: { x: number; y: number; z: number } };
  autoRotate: boolean;
  autoRotateSpeed: number;
  height: MusicVisualizerHeightConfig;
  theme: MusicVisualizerThemeConfig;
};
```

### 9.3 添加 Three.js 依赖

```bash
cd D:/lxblog
pnpm add three
pnpm add -D @types/three
```

---

## 10. 验证清单

### 10.1 脚本运行验证

```bash
cd D:/lxblog/scripts/fetch-music

# [ ] 探测 API 可用性
python fetch-lrc.py --help

# [ ] 单曲下载测试
python fetch-lrc.py "晴天" "周杰伦" --md --server=netease

# [ ] 检查下载文件
ls -la ../public/assets/music/songs/   # 应有 .m4a 文件
ls -la ../public/assets/music/covers/  # 应有 .jpg 文件
ls -la ../public/assets/music/lyrics/  # 应有 .lrc 文件

# [ ] 批量下载预览
python batch-download.py playlist.txt --dry-run

# [ ] 诊断模式
python fetch-lrc.py "知我" "国风堂" --test
```

### 10.2 前端播放器验证

- [ ] 打开 lxblog 开发服务器 `pnpm dev`
- [ ] 检查侧边栏音乐播放器是否正常显示
- [ ] 点击播放按钮，测试是否能播放下载的歌曲
- [ ] 检查歌词是否同步显示
- [ ] 检查封面是否正常加载

### 10.3 bangumi 集合验证（如已添加）

- [ ] `pnpm build` 无错误
- [ ] bangumi 集合的 schema 与数据文件匹配

### 10.4 音乐页面验证（如已移植）

- [ ] 访问 `/music/` 正常显示
- [ ] 3D 可视化器正常渲染
- [ ] 音乐播放功能正常

---

## 11. 常见问题

### Q1: API 请求失败/超时

Meting API 可能会因为网络原因或平台限制失败。解决方法：

1. 测试各 API 可用性：
   ```bash
   python fetch-lrc.py --test
   ```

2. 在 `fetch-lrc.py` 中添加更多 API 端点：
   ```python
   API_ENDPOINTS = [
       "https://mu.tsh520.cn/api",
       "https://api.i-meto.com/meting/api",
       "https://api.injahow.cn/meting/",
       "https://api.moeyao.cn/meting/",
   ]
   ```

3. 使用 `--api=` 参数指定自定义 API：
   ```bash
   python fetch-lrc.py "晴天" --api=https://your-api.com
   ```

### Q2: 下载的音频是 30 秒试听

脚本会自动检测并切换平台。如果所有平台都返回试听：

1. 使用 `--test` 诊断各平台情况
2. 尝试换歌名搜索（如带 "DJ版" 或 "Live" 版本）
3. 手动提供完整音频文件，使用本地文件模式处理

### Q3: 歌词获取失败

- 部分歌曲可能没有同步歌词
- 可以尝试换平台搜索获取歌词
- 或手动从其他来源获取 .lrc 文件

### Q4: 播放器不显示新添加的歌曲

- 确保 `musicConfig.ts` 的 `local.playlist[]` 中已添加歌曲条目
- 确保音频文件路径正确（相对于 `public/` 目录）
- 重启开发服务器

### Q5: bangumi 集合类型错误

如果 `pnpm build` 报类型错误，检查：
- `src/content.config.ts` 中的 bangumi schema 是否与数据文件匹配
- 数据文件中的 `published` 字段是否为有效日期格式
- `image` 字段类型（`image()` 或 `z.string()`）

### Q6: 多平台 fallback 不生效

确保 `fetch-lrc.py` 中的 `FALLBACK_SERVERS` 列表完整：
```python
FALLBACK_SERVERS = ["tencent", "kugou", "netease", "xiami", "baidu"]
```

### Q7: Windows 路径编码问题

如果脚本在 Windows 上运行出现乱码，脚本已内置了编码处理：
```python
if sys.platform == "win32":
    os.system("chcp 65001 >nul 2>&1")
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")
```

---

## 12. 总结

移植完成后，lxblog 将获得：

| 模块 | 文件 | 说明 |
|------|------|------|
| **下载脚本** | `scripts/fetch-music/` 7 个文件 | 从多音乐平台批量下载歌曲、封面、歌词 |
| **音频资源** | `public/assets/music/` | 本地音频文件存储 |
| **音乐配置** | `src/config/musicConfig.ts`（修改） | 更新 API 端点和播放列表 |
| **bangumi 集合** | `src/content/bangumi/music/`（可选） | 结构化音乐数据管理 |
| **音乐页面** | `/music/`（可选） | 全屏 3D 可视化页面 |
| **3D 可视化器** | `music-visualizer/` 5 个文件（可选） | Three.js 3D 音乐可视化 |

**移植建议顺序：**
1. 先做核心移植（脚本 + 配置）— 半天内可完成
2. 再做 bangumi 集合整合 — 1 天
3. 最后做音乐页面和 3D 可视化器 — 2-3 天

**依赖关系：**
- 核心移植：依赖 Python 3 + mutagen
- bangumi 集合：无额外依赖
- 3D 可视化器：依赖 Three.js（`pnpm add three`）
```