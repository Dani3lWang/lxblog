import type { GamesConfig } from "../types/config";

// ============================================================================
// 游戏页配置（src/config/gamesConfig.ts）—— 游戏模块的"后台"
// ============================================================================
//
// lxblog 是静态博客，没有可视化后台；游戏模块的所有设置都在本文件，
// 游戏数据存放在 src/content/games/game-platforms.json。
//
// 【页面入口】
//   - 路由：/games/（顶部导航"记录"菜单 → 游戏）
//   - 页面开关：siteConfig.pages.games（关闭后路由 404 + sitemap 剔除）
//
// 【数据来源（方案 A：静态数据 + 方案 C：构建时自动同步）】
//   1. 静态数据：直接编辑 src/content/games/game-platforms.json
//   2. 自动同步：配置好 Steam 后运行 pnpm build / pnpm sync-games，
//      脚本会从 Steam API 拉取游玩数据并写入 game-platforms.json
//
// 【game-platforms.json 数据格式】（与 HEXO 博客的 game-platforms.json 兼容）
//   顶层按平台分组，平台 ID 必须是：steam / switch / xbox / epic / playstation
//   {
//     "steam": [
//       {
//         "name": "Counter-Strike 2",              // 必填：游戏名称
//         "hours": 12.5,                           // 可选：游玩小时数（与 minutes 叠加）
//         "minutes": 750,                          // 可选：游玩分钟数（同步脚本写入）
//         "cover": "https://.../header.jpg",       // 可选：封面图 URL
//         "last_played": "2026-07-30",             // 可选：最近游玩日期（YYYY-MM-DD）
//         "store_url": "https://store.steampowered.com/app/730/", // 可选：商店链接
//         "earned_achievements": 10,               // 可选：已解锁成就数
//         "total_achievements": 30,                // 可选：总成就数
//         "achievements": [                        // 可选：成就明细列表
//           {
//             "name": "成就名称",
//             "image": "https://.../icon.jpg",     // 可选：成就图标
//             "achieved": true,                    // 可选：是否已解锁
//             "unlock_time": 1767292800            // 可选：解锁时间戳（秒）
//           }
//         ],
//         "appid": 730                             // 可选：Steam App ID（同步脚本写入）
//       }
//     ],
//     "switch": [], "xbox": [], "epic": [], "playstation": []
//   }
//   注意：同步脚本会保留你手写的 cover / 额外字段，只更新时长、成就等实时数据；
//   空数组的平台在页面上不显示 tab。
//
// 【Steam 自动同步启用步骤】（可选，不配置则页面只显示静态数据）
//   1. 到 https://steamcommunity.com/dev/apikey 申请 Steam Web API Key
//   2. 在下方 sync.steam 填 steamId / apiKey，或使用环境变量：
//      - PowerShell:  $env:STEAM_ID="76561198xxxxxxxxxx"; $env:STEAM_API_KEY="xxxx"
//      - 建议用环境变量，避免把 Key 提交进仓库
//   3. 运行 pnpm sync-games 手动同步，或直接 pnpm build（构建前自动同步）
//
// 【常用命令】
//   pnpm dev          # 本地开发，预览 /games/ 页面
//   pnpm sync-games   # 手动触发 Steam 同步，更新 game-platforms.json
//   pnpm build        # 构建（自动包含 Steam 同步）
// ============================================================================

export const gamesConfig: GamesConfig = {
	sync: {
		steam: {
			// 是否启用 Steam 自动同步（构建前从 Steam API 拉取数据）
			enabled: true,
			// Steam 64 位 ID；留空则读取环境变量 STEAM_ID
			steamId: "",
			// Steam Web API Key；留空则读取环境变量 STEAM_API_KEY
			apiKey: "",
			// 成就抓取上限：只对"最近游玩"的前 N 款游戏抓取成就明细（含图标），
			// 0 = 完全不抓取成就；每款游戏需要 2 次 API 请求，值越大构建越慢
			achievementFetchLimit: 3,
			// 需要排除的游戏 appid（例如免费 DLC 或不想展示的游戏）
			excludeAppIds: [],
			// 是否包含 0 时长游戏（默认只同步有游玩记录的游戏）
			includeZeroPlaytime: false,
		},
		// 以下平台暂未实现自动同步，预留开关：
		// epic = Epic（Legendary）、exophase = Xbox/成就导入、switch = Nintendo
		// 这些平台的游戏需要手动维护在 game-platforms.json 中
		epic: { enabled: false },
		exophase: { enabled: false },
		switch: { enabled: false },
	},
	display: {
		// 页面默认选中的平台："all" 显示全部平台，或填平台 ID
		// （steam / switch / xbox / epic / playstation）
		defaultPlatform: "all",
		// 排序方式：lastPlayed=按最近游玩倒序（默认），hours=按游玩时长倒序，name=按名称
		sortBy: "lastPlayed",
		// 是否在卡片上显示成就进度条（需要数据里有 earned/total_achievements）
		showAchievements: true,
		// 每个平台每页显示的游戏数量
		gamesPerPage: 12,
	},
};
