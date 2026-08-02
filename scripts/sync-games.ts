/**
 * 游戏数据同步脚本（方案C）
 *
 * 在 astro build 前运行，从 Steam Web API 拉取游玩数据，写入
 * src/content/games/game-platforms.json，构建时由 games 内容集合读取。
 *
 * - Steam ID / API Key 优先读取环境变量 STEAM_ID / STEAM_API_KEY，
 *   其次读取 src/config/gamesConfig.ts 中的配置
 * - 未配置或请求失败时降级：保留现有数据，不中断构建
 * - 成就抓取受 gamesConfig.sync.steam.achievementFetchLimit 限制
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { gamesConfig } from "../src/config/gamesConfig";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = resolve(__dirname, "../src/content/games/game-platforms.json");

const STEAM_API_BASE = "https://api.steampowered.com";
const STEAM_STORE_CDN =
	"https://shared.cloudflare.steamstatic.com/store_item_assets/steam/apps";
const STEAM_ICON_CDN = "https://media.steampowered.com/steamcommunity/public/images/apps";

const PLATFORMS = ["steam", "switch", "xbox", "epic", "playstation"] as const;
type Platform = (typeof PLATFORMS)[number];

interface Achievement {
	name: string;
	image?: string;
	url?: string;
	achieved?: boolean;
	unlock_time?: number;
}

interface GameEntry {
	name: string;
	hours?: number;
	minutes?: number;
	cover?: string;
	last_played?: string;
	store_url?: string;
	earned_achievements?: number;
	total_achievements?: number;
	achievements?: Achievement[];
	appid?: number;
}

type PlatformData = Record<Platform, GameEntry[]>;

interface SteamOwnedGame {
	appid: number;
	name: string;
	playtime_forever: number;
	img_icon_url?: string;
	img_logo_url?: string;
	has_community_visible_stats?: boolean;
}

interface SteamRecentGame {
	appid: number;
	name: string;
	playtime_2weeks?: number;
	playtime_forever: number;
	img_icon_url?: string;
	img_logo_url?: string;
}

const EMPTY_DATA: PlatformData = {
	steam: [],
	switch: [],
	xbox: [],
	epic: [],
	playstation: [],
};

function readPlatformData(): PlatformData {
	try {
		const raw = JSON.parse(readFileSync(DATA_FILE, "utf-8")) as Partial<
			Record<Platform, GameEntry[]>
		>;
		const data = { ...EMPTY_DATA };
		for (const p of PLATFORMS) {
			if (Array.isArray(raw[p])) data[p] = raw[p] as GameEntry[];
		}
		return data;
	} catch {
		return { ...EMPTY_DATA };
	}
}

function writePlatformData(data: PlatformData) {
	// 与 biome format（tab 缩进）保持一致
	writeFileSync(DATA_FILE, `${JSON.stringify(data, null, "\t")}\n`, "utf-8");
}

async function fetchSteamApi(
	path: string,
	params: Record<string, string | number>,
	timeoutMs = 15000,
): Promise<unknown> {
	const url = new URL(`${STEAM_API_BASE}/${path}`);
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, String(value));
	}
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		const res = await fetch(url, {
			signal: controller.signal,
			headers: { "User-Agent": "Firefly-Blog-GameSync" },
		});
		if (!res.ok) {
			throw new Error(`HTTP ${res.status} for ${path}`);
		}
		return await res.json();
	} finally {
		clearTimeout(timer);
	}
}

function formatDate(unixSeconds?: number): string {
	if (!unixSeconds || unixSeconds <= 0) return "";
	const d = new Date(unixSeconds * 1000);
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function headerCoverUrl(appid: number): string {
	return `${STEAM_STORE_CDN}/${appid}/header.jpg`;
}

function iconCoverUrl(appid: number, hash?: string): string {
	return hash ? `${STEAM_ICON_CDN}/${appid}/${hash}.jpg` : "";
}

interface SteamAchievement {
	apiname: string;
	name?: string;
	description?: string;
	icon?: string;
	icongray?: string;
	achieved: boolean;
	unlocktime?: number;
}

async function fetchAchievements(
	steamId: string,
	apiKey: string,
	appid: number,
): Promise<Achievement[]> {
	try {
		const stats = (await fetchSteamApi(
			"IPlayerService/GetPlayerAchievements/v1/",
			{ key: apiKey, steamid: steamId, appid },
		)) as {
			playerstats?: { success?: boolean; achievements?: SteamAchievement[] };
		};
		const list = stats.playerstats?.achievements;
		if (!Array.isArray(list)) return [];

		const schema = (await fetchSteamApi(
			"ISteamUserStats/GetSchemaForGame/v2/",
			{ key: apiKey, appid },
		)) as {
			game?: {
				availableGameStats?: {
					achievements?: Array<{
						name: string;
						displayName?: string;
						icon?: string;
						icongray?: string;
					}>;
				};
			};
		};
		const schemaMap = new Map(
			(schema.game?.availableGameStats?.achievements ?? []).map((a) => [
				a.name,
				a,
			]),
		);

		return list.map((a) => {
			const info = schemaMap.get(a.apiname);
			const icon = a.achieved ? info?.icon : info?.icongray;
			return {
				name: info?.displayName || a.name || a.apiname,
				image: icon ? `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${icon}.jpg` : "",
				achieved: Boolean(a.achieved),
				unlock_time: a.unlocktime,
			};
		});
	} catch (err) {
		console.warn(`[GameSync] 成就抓取失败 (appid=${appid}):`, err);
		return [];
	}
}

async function syncSteam(data: PlatformData): Promise<PlatformData> {
	const cfg = gamesConfig.sync.steam;
	const steamId = process.env.STEAM_ID || cfg.steamId;
	const apiKey = process.env.STEAM_API_KEY || cfg.apiKey;

	if (!cfg.enabled) {
		console.log("[GameSync] Steam 同步已禁用，跳过");
		return data;
	}
	if (!steamId || !apiKey) {
		console.log(
			"[GameSync] 未配置 Steam ID / API Key（环境变量 STEAM_ID、STEAM_API_KEY 或 gamesConfig），跳过同步",
		);
		return data;
	}

	console.log("[GameSync] 开始同步 Steam 游戏库...");

	const owned = (await fetchSteamApi("IPlayerService/GetOwnedGames/v1/", {
		key: apiKey,
		steamid: steamId,
		include_appinfo: true,
	})) as { response?: { games?: SteamOwnedGame[] } };
	const recent = (await fetchSteamApi("IPlayerService/GetRecentlyPlayedGames/v1/", {
		key: apiKey,
		steamid: steamId,
	})) as { response?: { games?: SteamRecentGame[] } };

	const ownedGames = owned.response?.games ?? [];
	const recentGames = recent.response?.games ?? [];
	console.log(
		`[GameSync] 获取到 ${ownedGames.length} 款拥有游戏，${recentGames.length} 款最近游玩`,
	);

	const recentByAppid = new Map(
		recentGames.map((g) => [g.appid, g]),
	);

	const syncedEntries: GameEntry[] = [];
	for (const g of ownedGames) {
		if (cfg.excludeAppIds.includes(g.appid)) continue;
		if (g.playtime_forever <= 0 && !cfg.includeZeroPlaytime) continue;

		const recentInfo = recentByAppid.get(g.appid);
		const cover = g.img_logo_url
			? iconCoverUrl(g.appid, g.img_logo_url)
			: headerCoverUrl(g.appid);
		const entry: GameEntry = {
			name: g.name,
			minutes: g.playtime_forever,
			cover,
			store_url: `https://store.steampowered.com/app/${g.appid}/`,
			appid: g.appid,
		};
		// Steam API 无精确游玩时间戳，最近玩过的游戏标记为今天
		if (recentInfo) {
			entry.last_played = formatDate(Date.now() / 1000);
		}
		syncedEntries.push(entry);
	}

	// 最近游玩优先放前面，方便抓取成就时选取
	const recentOrdered = recentGames
		.filter((g) => cfg.excludeAppIds.includes(g.appid) === false)
		.slice(0, cfg.achievementFetchLimit);

	for (const g of recentOrdered) {
		const entry = syncedEntries.find((e) => e.appid === g.appid);
		if (!entry) continue;
		const achievements = await fetchAchievements(steamId, apiKey, g.appid);
		if (achievements.length > 0) {
			entry.earned_achievements = achievements.filter(
				(a) => a.achieved,
			).length;
			entry.total_achievements = achievements.length;
			entry.achievements = achievements;
		}
	}

	// 与现有数据合并：同步字段覆盖，保留用户手写的额外字段
	const existing = data.steam;
	const merged = new Map<string, GameEntry>();
	for (const e of existing) {
		merged.set(e.appid ? `appid:${e.appid}` : `name:${e.name}`, e);
	}
	for (const e of syncedEntries) {
		const key = e.appid ? `appid:${e.appid}` : `name:${e.name}`;
		const prev = merged.get(key);
		merged.set(
			key,
			prev
				? {
						...prev,
						...e,
						achievements: e.achievements?.length
							? e.achievements
							: prev.achievements ?? [],
						// 保留用户手写的封面，同步结果仅作兜底
						cover: prev.cover || e.cover,
					}
				: e,
		);
	}

	data.steam = [...merged.values()].sort((a, b) =>
		(b.last_played || "").localeCompare(a.last_played || ""),
	);
	console.log(`[GameSync] Steam 同步完成，共 ${data.steam.length} 款游戏`);
	return data;
}

async function main() {
	try {
		let data = readPlatformData();
		data = await syncSteam(data);
		writePlatformData(data);
	} catch (err) {
		// 同步失败不中断构建，保留现有数据
		console.warn("[GameSync] 同步失败，保留现有数据:", err);
		process.exitCode = 0;
	}
}

void main();
