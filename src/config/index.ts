// 配置索引文件 - 统一导出所有配置
// 这样组件可以一次性导入多个相关配置，减少重复的导入语句

// 类型导出
export type {
	AdConfig,
	AnalyticsConfig,
	AnnouncementConfig,
	BackgroundWallpaperConfig,
	CalendarConfig,
	CommentConfig,
	CoverImageConfig,
	ExpressiveCodeConfig,
	Favicon,
	FontConfig,
	FontItem,
	FooterConfig,
	FriendLink,
	FriendsPageConfig,
	GalleryAlbum,
	GalleryConfig,
	ImageFormat,
	LIGHT_DARK_MODE,
	LicenseConfig,
	Live2DWidgetConfig,
	MobileBottomComponentConfig,
	MusicPlayerConfig,
	NavBarConfig,
	NavBarLink,
	NavBarSearchConfig,
	PlantUMLConfig,
	PluginCollapsibleConfig,
	PluginLanguageBadgeConfig,
	ProfileConfig,
	ResponsiveImageLayout,
	SakuraConfig,
	SidebarLayoutConfig,
	SiteConfig,
	SiteInfoConfig,
	SpineModelConfig,
	SponsorConfig,
	SponsorItem,
	SponsorMethod,
	WALLPAPER_MODE,
	WidgetComponentConfig,
	WidgetComponentType,
	WidgetSpecificConfig,
} from "../types/config";
// NavBarSearchMethod 是 enum(值 + 类型),走值导出
export { NavBarSearchMethod } from "../types/config";
export type {
	BuiltinFontProvider,
	CustomFontProvider,
	FontDefinition,
	FontSelectionConfig,
} from "../types/fontConfig"; // 字体类型定义
export { analyticsConfig } from "./analyticsConfig"; // 统计分析配置
export { announcementConfig } from "./announcementConfig"; // 公告配置
// 样式配置
export { backgroundWallpaper } from "./backgroundWallpaper"; // 背景壁纸配置
// 功能配置
export { commentConfig } from "./commentConfig"; // 评论系统配置
export { coverImageConfig } from "./coverImageConfig"; // 封面图配置
export { sakuraConfig } from "./effectsConfig"; // 动画特效配置（樱花等）
export { expressiveCodeConfig } from "./expressiveCodeConfig"; // 代码高亮配置
export { fontConfig, fontsList } from "./fontConfig"; // 字体配置
export { footerConfig } from "./footerConfig"; // 页脚配置
export { friendsPageConfig, getEnabledFriends } from "./friendsConfig"; // 友链配置
export { galleryConfig } from "./galleryConfig"; // 相册配置
export { licenseConfig } from "./licenseConfig"; // 许可证配置
// 组件配置
export { musicPlayerConfig } from "./musicConfig"; // 音乐播放器配置
export { navBarConfig, navBarSearchConfig } from "./navBarConfig"; // 导航栏配置与搜索配置
export { live2dWidgetConfig, spineModelConfig } from "./pioConfig"; // 看板娘配置
export { plantumlConfig } from "./plantumlConfig"; // PlantUML 图表配置
export { profileConfig } from "./profileConfig"; // 用户资料配置
// 布局配置
export { sidebarLayoutConfig } from "./sidebarConfig"; // 侧边栏布局配置
// 核心配置
export { siteConfig } from "./siteConfig"; // 站点基础配置
export { sponsorConfig } from "./sponsorConfig"; // 赞助配置
