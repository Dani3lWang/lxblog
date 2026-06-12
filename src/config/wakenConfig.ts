// Waken-wa 集成配置
// 用于在 Firefly 中接入独立部署的 Waken-wa 个人实时面板
//
// 使用方式：
//   1. 将 Waken-wa 部署到任意可访问的地址（Docker / Railway / Vercel 等）
//   2. 在下方 `url` 中填入你的 Waken 站点首页地址
//   3. 在 Waken 后台开启「公开 Feed」与对应的 CORS 白名单
//   4. 浏览器访问 /api/status-card?variant=... 取得状态卡片完整 URL，
//      粘贴到下方 `statusCardUrl`
//
// 关闭集成：将 `enable` 改为 false，相关导航项与小组件都会自动隐藏。
//
// ⚠️ 重要提示（混合内容 Mixed Content）：
//   - 状态卡片是后端实时渲染的 SVG（Content-Type: image/svg+xml）
//   - 如果博客部署在 HTTPS 域名下，而 `statusCardUrl` 仍为 http://，浏览器会
//     阻止加载（Mixed Content）。三种解决方案：
//       A) 给 Waken-wa 接入 HTTPS（推荐）
//       B) 临时把博客也部署到 HTTP（不推荐）
//       C) 在 Waken-wa 前面加一层 HTTPS 反向代理
//   - 本组件默认 `loading="lazy"` + 缓存破坏查询串，swup 页面切换时自动重拉

import type { WakenConfig } from "../types/wakenConfig";

export const wakenConfig: WakenConfig = {
	// 默认关闭，等用户填入 url 并独立部署 Waken 后再开启
	enable: true,

	// TODO: 替换为你自己的 Waken 部署地址，例如 "https://waken.yourdomain.com"
	url: "http://124.221.153.114/",

	navName: "Waken",
	navIcon: "material-symbols:bedtime-outline",

	// 状态卡片完整 URL（带所有查询参数）
	// 从 Waken-wa 前端"嵌入"对话框或直接拼装后端 /api/status-card 端点
	statusCardUrl:
		"http://124.221.153.114/api/status-card?variant=aurora&showHeader=1&showAvatar=1&showName=1&showBio=1&showNote=0&preferGame=1&showInClassStatus=1&width=auto&height=auto&radius=20&bg=%23FFFFFF&fg=%23111827&muted=%236B7280&accent=%2322C55E&border=%23E5E7EB",

	nowWidget: {
		enable: false,
		title: "当前状态",
		hideOnError: true,
		// 600s = 10 分钟兜底刷新一次；swup 页面切换也会重拉
		refreshIntervalMs: 60_000,
		position: "sticky",
		side: "right",
	},
};
