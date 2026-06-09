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

export interface WakenConfig {
	/** 是否启用 Waken 集成，关闭后导航入口与状态卡片均不展示 */
	enable: boolean;
	/** Waken-wa 站点首页地址，例如 "https://waken.example.com"，不要带末尾斜杠 */
	url: string;
	/** 导航栏菜单中的显示名称 */
	navName: string;
	/** 导航栏图标，使用 Iconify 名称 */
	navIcon: string;
<<<<<<< HEAD
	/** 状态卡片完整 URL（包含所有查询参数），可从 Waken-wa 后台/前端复制 */
	statusCardUrl: string;
	/** 状态卡片组件配置 */
	nowWidget: {
		/** 是否在侧栏展示状态卡片 */
		enable: boolean;
		/** 卡片在侧栏的标题（鼠标悬停在标题上可点击跳转 waken 站点） */
		title: string;
		hideOnError: boolean;
		/** 缓存破坏刷新间隔（毫秒），最小 5000；swup 切换会立即刷新，此项是兜底 */
		refreshIntervalMs: number;
		/** 卡片在侧栏的位置：top=固定顶部，sticky=跟随滚动 */
		position: "top" | "sticky";
		/** 放在哪一侧：left / right / both */
		side: "left" | "right" | "both";
=======
	/** 「现在」小组件配置 */
	nowWidget: {
		/** 是否在博客侧栏 / 页面中展示「现在」小组件 */
		enable: boolean;
		/** 拉取间隔（毫秒），最小 5000 */
		refreshIntervalMs: number;
		/** 当 Waken 不可达 / 接口失败时是否完全隐藏小组件 */
		hideOnError: boolean;

	navName: "Waken",
	navIcon: "material-symbols:bedtime-outline",

<<<<<<< HEAD
	// 状态卡片完整 URL（带所有查询参数）
	// 从 Waken-wa 前端"嵌入"对话框或直接拼装后端 /api/status-card 端点
	statusCardUrl:
		"http://124.221.153.114/api/status-card?variant=aurora&showHeader=1&showAvatar=1&showName=1&showBio=1&showNote=0&preferGame=1&showInClassStatus=1&width=auto&height=auto&radius=20&bg=%23FFFFFF&fg=%23111827&muted=%236B7280&accent=%2322C55E&border=%23E5E7EB",

	nowWidget: {
		enable: true,
		title: "当前状态",
		hideOnError: true,
		// 600s = 10 分钟兜底刷新一次；swup 页面切换也会重拉
		refreshIntervalMs: 60_000,
		position: "sticky",
		side: "right",
=======
	nowWidget: {
		enable: true,
		refreshIntervalMs: 30_000,
		hideOnError: false,
>>>>>>> 0880362f (Add Waken-wa integration and docs)
	},
};
