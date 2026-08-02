import type { GamesConfig } from "../types/config";

// 游戏页配置：数据同步（方案C）+ 页面显示
export const gamesConfig: GamesConfig = {
	sync: {
		steam: {
			enabled: true,
			// Steam 64 位 ID；留空则读取环境变量 STEAM_ID
			steamId: "",
			// Steam Web API Key；留空则读取环境变量 STEAM_API_KEY
			apiKey: "",
			// 成就抓取上限：只对最近游玩的前 N 款游戏抓取，0=不抓取
			achievementFetchLimit: 3,
			excludeAppIds: [],
			// 是否包含 0 时长游戏
			includeZeroPlaytime: false,
		},
		// 以下平台暂未实现自动同步，预留开关
		epic: { enabled: false },
		exophase: { enabled: false },
		switch: { enabled: false },
	},
	display: {
		// 默认选中的平台："all" 或平台 ID
		defaultPlatform: "all",
		// 排序方式：lastPlayed=最近游玩，hours=游玩时长，name=名称
		sortBy: "lastPlayed",
		// 是否显示成就进度
		showAchievements: true,
		// 每页显示游戏数
		gamesPerPage: 12,
	},
};
