# 配置文件说明

本目录包含 Firefly 主题的所有配置文件，采用模块化设计，每个文件负责特定的功能模块。

## 📁 配置文件结构

```
src/config/
├── index.ts                  # 配置索引文件 - 统一导出
├── siteConfig.ts             # 站点基础配置
├── analyticsConfig.ts        # 统计分析配置（Google Analytics、Umami、51la 等）
├── announcementConfig.ts     # 公告配置
├── backgroundWallpaper.ts    # 背景壁纸配置
├── commentConfig.ts          # 评论系统配置
├── coverImageConfig.ts       # 封面图配置
├── effectsConfig.ts          # 动画特效配置（樱花等）
├── expressiveCodeConfig.ts   # 代码高亮配置
├── fontConfig.ts             # 字体配置
├── footerConfig.ts           # 页脚配置
├── friendsConfig.ts          # 友链配置
├── galleryConfig.ts          # 相册配置
├── licenseConfig.ts          # 许可证配置
├── musicConfig.ts            # 音乐播放器配置
├── navBarConfig.ts           # 导航栏配置（含 LinkPresets 链接预设）
├── pioConfig.ts              # 看板娘配置（Spine、Live2D）
├── plantumlConfig.ts         # PlantUML 图表配置
├── profileConfig.ts          # 用户资料配置
├── sidebarConfig.ts          # 侧边栏布局配置
├── sponsorConfig.ts          # 赞助配置
└── README.md                 # 本文件
```

## 🚀 使用方式

### 推荐：使用配置索引（统一导入）
```typescript
import { siteConfig, profileConfig } from "@/config";
```

### 直接导入单个配置
```typescript
import { siteConfig } from "@/config/siteConfig";
import { profileConfig } from "@/config/profileConfig";
```

## 📋 配置文件列表

| 文件 | 说明 |
|------|------|
| `siteConfig.ts` | 站点基础配置（标题、描述、主题色、页面宽度、文章内容页配置等） |
| `analyticsConfig.ts` | 统计分析配置（Google Analytics、Microsoft Clarity、Umami、51la） |
| `announcementConfig.ts` | 公告配置（标题、内容、类型、链接等） |
| `backgroundWallpaper.ts` | 背景壁纸配置（壁纸模式、图片、横幅文字、水波纹等） |
| `commentConfig.ts` | 评论系统配置（Twikoo、Waline、Artalk、Giscus、Disqus） |
| `coverImageConfig.ts` | 封面图配置（文章封面图、随机封面图 API） |
| `effectsConfig.ts` | 动画特效配置（樱花数量、速度、尺寸等） |
| `expressiveCodeConfig.ts` | 代码高亮配置（亮色/暗色主题、折叠、语言徽章） |
| `fontConfig.ts` | 字体配置（字体列表、回退、预加载） |
| `footerConfig.ts` | 页脚配置（自定义 HTML 注入，如备案号） |
| `friendsConfig.ts` | 友链配置（友链列表、页面设置） |
| `galleryConfig.ts` | 相册配置（相册列表、瀑布流列宽） |
| `licenseConfig.ts` | 许可证配置（CC 协议等） |
| `musicConfig.ts` | 音乐播放器配置（Meting API / 本地音乐） |
| `navBarConfig.ts` | 导航栏配置（动态链接、LinkPresets 链接预设、搜索配置） |
| `pioConfig.ts` | 看板娘配置（Spine 模型、Live2D 模型） |
| `plantumlConfig.ts` | PlantUML 图表渲染配置 |
| `profileConfig.ts` | 用户资料配置（头像、姓名、社交链接） |
| `sidebarConfig.ts` | 侧边栏布局配置（左侧/右侧/移动端组件列表） |
| `sponsorConfig.ts` | 赞助配置（赞助方式、赞助者列表） |

## 🇨🇳 国内备案号（footerConfig.beian）

大陆站点部署到国内服务器或使用国内 CDN（腾讯云 EdgeOne、阿里云、华为云等）时，域名必须完成 **ICP 备案**，且拿到 ICP 备案号后 30 天内必须补做 **公安网安备案**。两个备案号均需展示在首页底部并可点击跳转。

在 `src/config/footerConfig.ts` 中配置：

```ts
export const footerConfig: FooterConfig = {
  enable: false,                 // 是否启用 FooterConfig.html 自由 HTML 注入
  beian: {
    enable: true,                // 是否在页脚渲染备案号
    // 工信部 ICP 备案
    icp: {
      number: "京ICP备2026000001号-1", // 完整备案号，前缀为省份简称
      // link 留空时默认跳转到 https://beian.miit.gov.cn/
      // link: "https://beian.miit.gov.cn/",
    },
    // 公安网安备案（拿到 ICP 后 30 天内必须补做）
    police: {
      number: "京公网安备 11010102000000号",
      // link 留空时默认跳转到 https://beian.mps.gov.cn/
      // link: "https://beian.mps.gov.cn/",
    },
  },
};
```

**渲染效果**：在版权行下方新增一行，左侧是带盾牌图标的公安网安备案号，右侧是工信部 ICP 备案号，两侧均 `target="_blank"` 跳转官方查询页。

**注意事项**：
- `number` 字段必须与备案审批下来的字符串**完全一致**（含省份简称"京/沪/粤/浙/..."以及末尾的"号"和可能的"-1"子号）
- 部署到海外/香港，或仅使用 EdgeOne Pages 默认 `*.edgeone.app` 测试域名时，可保持 `beian.enable: false`
- 仅做 ICP 备案、公安备案未办理时，把 `police` 整个字段注释掉即可（公安备案可选，ICP 必填）
- 备案号以外的任意 HTML 内容仍可走 `src/config/FooterConfig.html` 自由注入（与 `beian` 不冲突，会显示在备案号上方）


大陆站点部署到国内服务器或使用国内 CDN（腾讯云 EdgeOne、阿里云、华为云等）时，域名必须完成 **ICP 备案**，且拿到 ICP 备案号后 30 天内必须补做 **公安网安备案**。两个备案号均需展示在首页底部并可点击跳转。

在 `src/config/footerConfig.ts` 中配置：

```ts
export const footerConfig: FooterConfig = {
  enable: false,                 // 是否启用 FooterConfig.html 自由 HTML 注入
  beian: {
    enable: true,                // 是否在页脚渲染备案号
    // 工信部 ICP 备案
    icp: {
      number: "京ICP备2026000001号-1", // 完整备案号，前缀为省份简称
      // link 留空时默认跳转到 https://beian.miit.gov.cn/
      // link: "https://beian.miit.gov.cn/",
    },
    // 公安网安备案（拿到 ICP 后 30 天内必须补做）
    police: {
      number: "京公网安备 11010102000000号",
      // link 留空时默认跳转到 https://beian.mps.gov.cn/
      // link: "https://beian.mps.gov.cn/",
    },
  },
};
```

**渲染效果**：在版权行下方新增一行，左侧是带盾牌图标的公安网安备案号，右侧是工信部 ICP 备案号，两侧均 `target="_blank"` 跳转官方查询页。

**注意事项**：
- `number` 字段必须与备案审批下来的字符串**完全一致**（含省份简称"京/沪/粤/浙/..."以及末尾的"号"和可能的"-1"子号）
- 部署到海外/香港，或仅使用 EdgeOne Pages 默认 `*.edgeone.app` 测试域名时，可保持 `beian.enable: false`
- 仅做 ICP 备案、公安备案未办理时，把 `police` 整个字段注释掉即可（公安备案可选，ICP 必填）
- 备案号以外的任意 HTML 内容仍可走 `src/config/FooterConfig.html` 自由注入（与 `beian` 不冲突，会显示在备案号上方）


- 所有配置文件均可通过 `index.ts` 统一导入
- 每个配置文件对应 `types/` 目录下的独立类型定义文件
- `siteConfig.ts` 只保留站点核心信息，不聚合其他模块配置
- `navBarConfig.ts` 底部的 `LinkPresets` 可自由自定义导航栏链接的名称、图标和 URL

## 🌙 Waken 集成的三个开关

`wakenConfig.ts` 的字段对运行时影响:

| 字段 | 影响范围 |
|---|---|
| `enable` | **总开关**。关闭后,导航栏「链接」下的 Waken-wa 入口与侧栏状态卡片**同时**消失 |
| `nowWidget.enable` | 仅控制侧栏卡片。总开关仍开时,关掉它只是把卡片藏起来,导航入口保留 |
| `nowWidget.side` | `"left"` / `"right"` / `"both"`,决定卡片注入到哪一侧;由 `src/config/sidebarConfig.ts` 顶部 `buildWakenWidget()` 工厂在构建期落点 |
| `nowWidget.position` | `"top"` 或 `"sticky"`,决定卡片落在侧栏哪个区段 |

移动端底部组件(<768px)**不会**自动注入 Waken 卡片(移动端无左右概念,如需在底部展示请在 `mobileBottomComponents` 里显式添加 `type: "wakenStatus"`)。
