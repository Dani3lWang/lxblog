// Waken-wa 集成配置
// 用于在 Firefly 中接入独立部署的 Waken-wa 个人实时面板
//
// 使用方式：
//   1. 将 Waken-wa 部署到任意可访问的地址（Docker / Railway / Vercel 等）
//   2. 在下方 `url` 中填入你的 Waken 站点首页地址
//   3. 在 Waken 后台开启「公开 Feed」与对应的 CORS 白名单（允许本博客域名访问 /api/activity?public=1）
//
// 关闭集成：将 `enable` 改为 false，相关导航项与小组件都会自动隐藏。

export interface WakenConfig {
	/** 是否启用 Waken 集成，关闭后导航入口与「现在」小组件均不展示 */
	enable: boolean;
	/** Waken-wa 站点首页地址，例如 "https://waken.example.com"，不要带末尾斜杠 */
	url: string;
	/** 导航栏菜单中的显示名称 */
	navName: string;
	/** 导航栏图标，使用 Iconify 名称 */
	navIcon: string;
	/** 状态卡片完整 URL（包含所有查询参数），可从 Waken-wa 后台/前端复制 */
	statusCardUrl: string;
	/** 状态卡片组件配置 */
	nowWidget: {
		/** 是否在侧栏展示状态卡片 */
		enable: boolean;
		/** 卡片在侧栏的标题（鼠标悬停在标题上可点击跳转 waken 站点） */
		title: string;
		/** 加载失败时是否完全隐藏卡片（避免显示破图） */
		hideOnError: boolean;
		/** 缓存破坏刷新间隔（毫秒），最小 5000；swup 切换会立即刷新，此项是兜底 */
		refreshIntervalMs: number;
		/** 卡片在侧栏的位置：top=固定顶部，sticky=跟随滚动 */
		position: "top" | "sticky";
		/** 放在哪一侧：left / right / both */
		side: "left" | "right" | "both";
	};
}

export const wakenConfig: WakenConfig = {
	// 默认关闭，等用户填入 url 并独立部署 Waken 后再开启
	enable: true,

	// TODO: 替换为你自己的 Waken 部署地址，例如 "https://waken.yourdomain.com"
	url: "http://124.221.153.114/",

	navName: "Waken",
	navIcon: "material-symbols:bedtime-outline",

	nowWidget: {
		enable: true,
		refreshIntervalMs: 30_000,
		hideOnError: false,
	},
};
