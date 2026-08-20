import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";
import { siteConfig } from "./siteConfig";

// ============================================================================
// 导航栏配置 - 根据顺序动态生成导航栏链接
// NavBar Configuration - Dynamically generate navigation bar links based on order
// ============================================================================
const getDynamicNavBarConfig = (): NavBarConfig => {
	// 基础导航栏链接
	const links: NavBarLink[] = [
		// 主页
		LinkPresets.Home,
	];

	// 文章及其子菜单
	links.push({
		name: "文章",
		url: "#",
		icon: "material-symbols:article",
		children: [
			// 归档
			LinkPresets.Archive,

			// 分类
			LinkPresets.Categories,

			// 标签
			LinkPresets.Tags,

			// 系列
			LinkPresets.Series,
		],
	});

	// 友链 —— 2026-06-12:siteConfig.pages.friends = false,导航栏入口移除
	// 恢复方法:取消下面一行的注释即可
	// links.push(LinkPresets.Friends);

	// 我的入口 —— 2026-08-15:由本地"动态"菜单替换为上游"我的"结构
	// 子项通过 pageKey 由 Navbar 按 siteConfig.pages 自动过滤（关闭的页面不显示）
	links.push({
		name: "我的",
		url: "#",
		icon: "material-symbols:person",
		children: [
			// 动态
			LinkPresets.Dynamic,

			// 相册
			LinkPresets.Gallery,

			// VNDB
			LinkPresets.VNDB,

			// 书签导航
			LinkPresets.Booknav,

			// 关于我 —— 2026-08-15:由顶层"关于"移入
			LinkPresets.About,
		],
	});

	// 记录入口 - 书架、影视和音乐、游戏、更新日志、规划、足迹
	const recordChildren: NavBarLink[] = [];
	if (siteConfig.pages.books) {
		recordChildren.push(LinkPresets.Books);
	}
	if (siteConfig.pages.moviesGames) {
		recordChildren.push(LinkPresets.MoviesGames);
	}
	if (siteConfig.pages.games) {
		recordChildren.push(LinkPresets.Games);
	}
	if (siteConfig.pages.musicPage) {
		recordChildren.push(LinkPresets.MusicPage);
	}
	if (siteConfig.pages.changelog) {
		recordChildren.push(LinkPresets.Changelog);
	}
	if (siteConfig.pages.routines) {
		recordChildren.push(LinkPresets.Routines);
	}
	if (siteConfig.pages.places) {
		recordChildren.push(LinkPresets.Places);
	}

	if (recordChildren.length > 0) {
		const defaultUrl = siteConfig.pages.books
			? "/books/"
			: siteConfig.pages.moviesGames
				? "/movies-games/"
				: siteConfig.pages.games
					? "/games/"
					: siteConfig.pages.musicPage
						? "/music/"
						: siteConfig.pages.routines
							? "/routines/"
							: "/places/";

		links.push({
			name: "记录",
			url: defaultUrl,
			icon: "material-symbols:camera-outdoor",
			children: recordChildren,
		});
	}

	// 关于我 —— 2026-08-15:已移入"我的"子菜单,不再单独展示

	// 自定义导航栏链接,并且支持多级菜单
	/*links.push({
		name: "链接",
		url: "#",
		icon: "material-symbols:link",
		// 子菜单
		children: [
			{
				name: "GitHub",
				url: "https://github.com/Dani3lWang",
				external: true,
				icon: "fa7-brands:github",
			},
			/*#预留示例(注释保留供使用者参考)
			{
				name: "Gitee",
				url: "https://gitee.com/CuteLeaf/Firefly",
				external: true,
				icon: "fa7-brands:gitee",
			},
			{
				name: "QQ交流群",
				url: "https://qm.qq.com/q/ZGsFa8qX2G",
				external: true,
				icon: "fa7-brands:qq",
			},
			{
				name: "Firefly文档",
				url: "https://docs-firefly.cuteleaf.cn",
				external: true,
				icon: "material-symbols:docs",
			},
			
		],
	});*/
	// 文档链接
	// links.push({
	// 	name: "文档",
	// 	url: "https://docs-firefly.cuteleaf.cn",
	// 	external: true,
	// 	icon: "material-symbols:docs",
	// });

	return { links } as NavBarConfig;
};

// 导航搜索配置
export const navBarSearchConfig: NavBarSearchConfig = {
	method: NavBarSearchMethod.PageFind,
};

// ============================================================================
// 链接预设 - 可自由自定义导航栏链接的名称、图标和URL
// Link Presets - Allows free customization of the name, icon, and URL of navigation bar links
// ============================================================================
export const LinkPresets: Record<string, NavBarLink> = {
	Home: {
		name: "主页",
		url: "/",
		icon: "material-symbols:home",
	},
	Archive: {
		name: "归档",
		url: "/archive/",
		icon: "material-symbols:archive",
	},
	Categories: {
		name: "分类",
		url: "/categories/",
		icon: "material-symbols:folder-open-rounded",
	},
	Tags: {
		name: "标签",
		url: "/tags/",
		icon: "material-symbols:tag-rounded",
	},
	Series: {
		name: "系列",
		url: "/series/",
		icon: "material-symbols:layers",
	},
	Dynamic: {
		name: "动态",
		url: "/dynamic/",
		icon: "material-symbols:dynamic-feed",
		pageKey: "dynamic",
	},
	Friends: {
		name: "友链",
		url: "/friends/",
		icon: "material-symbols:group",
	},
	Sponsor: {
		name: "赞助",
		url: "/sponsor/",
		icon: "material-symbols:favorite",
	},
	Guestbook: {
		name: "留言板",
		url: "/moments/guestbook/",
		icon: "material-symbols:menu-book",
	},
	Notebooks: {
		name: "笔记本",
		url: "/moments/notebooks/",
		icon: "material-symbols:book-outline",
	},
	Routines: {
		name: "规划",
		url: "/routines/",
		icon: "material-symbols:schedule-outline",
	},
	Places: {
		name: "足迹",
		url: "/places/",
		icon: "material-symbols:location-on-outline",
	},
	Bangumi: {
		name: "番组计划",
		url: "/bangumi/",
		icon: "material-symbols:movie",
		pageKey: "bangumi",
	},
	Booknav: {
		name: "书签导航",
		url: "/booknav/",
		icon: "material-symbols:bookmarks",
		pageKey: "booknav",
	},
	Gallery: {
		name: "相册",
		url: "/moments/gallery/",
		// 2026-06-12:修正为 outline-rounded 变体,material-symbols 合集里没有
		// 纯 "photo-library" 也没有纯 "photo-library-outline"
		icon: "material-symbols:photo-library-outline-rounded",
		pageKey: "gallery",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Moments: {
		name: "动态",
		url: "/moments/",
		icon: "material-symbols:local-cafe",
	},
	Books: {
		name: "书架",
		url: "/books/",
		icon: "material-symbols:book",
	},
	MoviesGames: {
		name: "影视和音乐",
		url: "/movies-games/",
		icon: "material-symbols:movie",
	},
	Games: {
		name: "游戏",
		url: "/games/",
		icon: "material-symbols:sports-esports",
	},
	MusicPage: {
		name: "音乐",
		url: "/music/",
		icon: "material-symbols:library-music",
	},
	Changelog: {
		name: "更新日志",
		url: "/changelog/",
		icon: "material-symbols:update",
	},
	VNDB: {
		name: "VNDB",
		url: "/vndb/",
		icon: "material-symbols:movie",
		pageKey: "vndb",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
