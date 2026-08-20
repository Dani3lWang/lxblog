export type GamePlatformId =
	| "steam"
	| "switch"
	| "xbox"
	| "epic"
	| "playstation";

// 游戏页配置类型。完整设置说明见 src/config/gamesConfig.ts
// （含 game-platforms.json 数据格式与 Steam 同步启用步骤）
export type GamesConfig = {
	// 构建时自动同步配置（方案C）
	sync: {
		steam: {
			enabled: boolean;
			// Steam 64 位 ID；留空则读取环境变量 STEAM_ID
			steamId: string;
			// Steam Web API Key；留空则读取环境变量 STEAM_API_KEY
			apiKey: string;
			// 成就抓取上限（只对最近游玩的前 N 款游戏抓取，0=不抓取）
			achievementFetchLimit: number;
			// 需要排除的游戏 appid
			excludeAppIds: number[];
			// 是否包含 0 时长游戏（默认只同步有游玩记录的游戏）
			includeZeroPlaytime: boolean;
		};
		// 以下平台暂未实现自动同步，预留开关
		epic: { enabled: boolean };
		exophase: { enabled: boolean };
		switch: { enabled: boolean };
	};
	// 页面显示配置
	display: {
		// 默认选中的平台："all" 或平台 ID
		defaultPlatform: "all" | GamePlatformId;
		// 排序方式：lastPlayed=最近游玩，hours=游玩时长，name=名称
		sortBy: "lastPlayed" | "hours" | "name";
		// 是否显示成就进度
		showAchievements: boolean;
		// 每页显示游戏数
		gamesPerPage: number;
	};
};
