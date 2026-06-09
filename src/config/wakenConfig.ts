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
	/** 「现在」小组件配置 */
	nowWidget: {
		/** 是否在博客侧栏 / 页面中展示「现在」小组件 */
		enable: boolean;
		/** 拉取间隔（毫秒），最小 5000 */
		refreshIntervalMs: number;
		/** 当 Waken 不可达 / 接口失败时是否完全隐藏小组件 */
		hideOnError: boolean;
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
