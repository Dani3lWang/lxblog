// Waken-wa 集成的类型定义
// 与 src/config/wakenConfig.ts 配套：类型在此，值在 src/config/wakenConfig.ts

export interface WakenConfig {
	/** 是否启用 Waken 集成，关闭后导航入口与状态卡片均不展示 */
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
