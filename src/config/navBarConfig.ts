import {
	type NavBarConfig,
	type NavBarLink,
	type NavBarSearchConfig,
	NavBarSearchMethod,
} from "../types/config";
import { wakenConfig } from "./wakenConfig";

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
		],
	});

	// 友链 —— 2026-06-12:siteConfig.pages.friends = false,导航栏入口移除
	// 恢复方法:取消下面一行的注释即可
	// links.push(LinkPresets.Friends);

	// 留言板
	links.push(LinkPresets.Guestbook);

	// ─────────────────────────────────────────────────────────────
	// 2026-06-12 临时改动:把"我的(下拉)"换成"相册(直链)"
	// 原因:目前还没有更多拓展内容,下拉只含相册/番组,不如直接给一个相册入口
	// 恢复方法:
	//   1) 注释掉下面这一行
	//   2) 取消下方"// === 我的(原始模板) ==="块注释
	//   3) 若"番组计划"也启用了,确保 LinkPresets.Bangumi 还能用
	// ─────────────────────────────────────────────────────────────
	links.push({
		name: "相册",
		url: "/gallery/",
		icon: "material-symbols:photo-library-outline-rounded",
	});
	// === 我的(原始模板) - 2026-06-12 暂时禁用,需要时取消整段注释即可恢复 ===
	// links.push({
	// 	name: "我的",
	// 	url: "#",
	// 	icon: "material-symbols:person",
	// 	children: [
	// 		// 相册
	// 		LinkPresets.Gallery,
	// 		// 番组计划
	// 		LinkPresets.Bangumi,
	// 	],
	// });

	// ─────────────────────────────────────────────────────────────
	// 2026-06-12 临时改动:把"关于(下拉)"换成直链到 /about/
	// 原因:下拉原本只有"赞助"和"关于我",且赞助页面已关闭,不如直进
	// 恢复方法:
	//   1) 注释掉下面这一行
	//   2) 取消下方"// === 关于(原始模板) ==="块注释
	// ─────────────────────────────────────────────────────────────
	links.push({
		name: "关于",
		url: "/about/",
		icon: "material-symbols:info",
	});
	// === 关于(原始模板) - 2026-06-12 暂时禁用,需要时取消整段注释即可恢复 ===
	// links.push({
	// 	name: "关于",
	// 	url: "#",
	// 	icon: "material-symbols:info",
	// 	children: [
	// 		// 赞助
	// 		LinkPresets.Sponsor,
	// 		// 关于页面
	// 		LinkPresets.About,
	// 	],
	// });

	// 自定义导航栏链接,并且支持多级菜单
	links.push({
		name: "链接",
		url: "#",
		icon: "material-symbols:link",
		// 子菜单
		children: [
			// Waken-wa:总开关 wakenConfig.enable 关闭时此项不出现
			{
				name: "GitHub",
				url: "https://github.com/Dani3lWang",
				external: true,
				icon: "fa7-brands:github",
			},
			/*...(wakenConfig.enable
				? [
						{
							name: wakenConfig.navName,
							url: wakenConfig.url,
							external: true,
							icon: wakenConfig.navIcon,
						},
					]
				: []),
			
			#预留示例(注释保留供使用者参考)
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
			*/
		],
	});

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
		name: "留言",
		url: "/guestbook/",
		icon: "material-symbols:chat",
	},
	About: {
		name: "关于我",
		url: "/about/",
		icon: "material-symbols:person",
	},
	Bangumi: {
		name: "番组计划",
		url: "/bangumi/",
		icon: "material-symbols:movie",
	},
	Gallery: {
		name: "相册",
		url: "/gallery/",
		// 2026-06-12:修正为 outline-rounded 变体,material-symbols 合集里没有
		// 纯 "photo-library" 也没有纯 "photo-library-outline"
		icon: "material-symbols:photo-library-outline-rounded",
	},
	Anime: {
		name: "追番",
		url: "/anime/",
		icon: "material-symbols:live-tv",
		pageKey: "anime",
	},
};

export const navBarConfig: NavBarConfig = getDynamicNavBarConfig();
