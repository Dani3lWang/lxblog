import type { GamePlatformId } from "@/types/config";

export interface GameEntryData {
	name: string;
	hours?: number;
	minutes?: number;
	cover?: string;
	last_played?: string;
	store_url?: string;
	earned_achievements?: number;
	total_achievements?: number;
	appid?: number;
}

export type FlattenedGame = GameEntryData & { platform: GamePlatformId };

/** 将 hours + minutes 统一格式化为可读时长，如 "12h 30m" */
export function formatPlaytime(game: GameEntryData): string {
	const minutes = (game.minutes ?? 0) + Math.round((game.hours ?? 0) * 60);
	if (minutes <= 0) return "";
	if (minutes < 60) return `${minutes}m`;
	const h = Math.floor(minutes / 60);
	const m = minutes % 60;
	return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/** 排序：lastPlayed=最近游玩，hours=游玩时长，name=名称 */
export function sortGames(
	items: FlattenedGame[],
	sortBy: "lastPlayed" | "hours" | "name",
): FlattenedGame[] {
	const list = [...items];
	switch (sortBy) {
		case "hours": {
			const minutesOf = (g: FlattenedGame) =>
				(g.minutes ?? 0) + Math.round((g.hours ?? 0) * 60);
			return list.sort((a, b) => minutesOf(b) - minutesOf(a));
		}
		case "name":
			return list.sort((a, b) => a.name.localeCompare(b.name));
		case "lastPlayed":
		default:
			// YYYY-MM-DD 可直接字典序比较，空值排最后
			return list.sort((a, b) =>
				(b.last_played || "").localeCompare(a.last_played || ""),
			);
	}
}
