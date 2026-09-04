// 统一的 meting 音源解析模块(纯函数,无 DOM 依赖)
//
// 全站所有 meting 解析共用这一套逻辑,避免三处实现行为分叉:
// - page-tabs.ts(详情页曲目 / 影视音乐页卡片)直接 import 使用
// - MusicManager.astro 等 is:inline 脚本运行时无法 import 模块,
//   由 Layout.astro 的模块脚本把本模块挂到 window.__musicSource 后调用

export interface MusicSourceTrack {
	name: string;
	artist: string;
	url: string;
	pic: string;
	lrc: string;
	metingServer: string;
	metingId: string;
}

export interface MusicSourceData {
	playlist: MusicSourceTrack[];
	metingApiUrl: string;
	fallbackApis?: string[];
}

export interface MetingSongData {
	url?: string;
	pic?: string;
	lrc?: string;
	title?: string;
	author?: string;
	artist?: string;
}

export const MUSIC_FETCH_TIMEOUT_MS = 8000;

// 构建 meting API 请求 URL。type 默认为 song(单曲),可传 playlist/url 等
export function resolveMetingUrl(
	metingApi: string,
	server: string,
	id: string,
	type = "song",
): string {
	if (!metingApi) return "";
	const s = encodeURIComponent(server || "");
	const i = encodeURIComponent(id || "");
	const t = encodeURIComponent(type);
	return metingApi
		.replace(":server", s)
		.replace(":type", t)
		.replace(":id", i)
		.replace(":r", Date.now().toString());
}

export async function fetchWithTimeout(
	url: string,
	init?: RequestInit,
	timeoutMs: number = MUSIC_FETCH_TIMEOUT_MS,
): Promise<Response> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		return await fetch(url, { ...init, signal: controller.signal });
	} finally {
		clearTimeout(timer);
	}
}

// 请求单曲信息(type=song),取数组第一项;失败返回 null
export async function requestMetingSong(
	apiUrl: string,
): Promise<MetingSongData | null> {
	try {
		const res = await fetchWithTimeout(apiUrl);
		if (!res.ok) throw new Error(`HTTP ${res.status}`);
		const raw = (await res.json()) as MetingSongData[] | MetingSongData;
		return Array.isArray(raw) ? (raw[0] ?? null) : raw;
	} catch (err) {
		console.warn("[MusicSource] Meting request failed:", apiUrl, err);
		return null;
	}
}

// 部分 meting 实例返回中间跳转（type=url），需再请求一次拿到直链：
// - injahow 等返回 302 重定向（跟随后是音频流，audio 可直接播放最终地址）
// - i-meto 等返回 JSON { url: "..." }
// 浏览器跨域下 302 的 Location 头不可见（opaqueredirect），因此不读头，
// 而是跟随重定向后按 Content-Type 区分：JSON 解析 url 字段，音频直接用
// 最终地址；fetch 因跨域失败时把跳转地址交给 audio 自行跟随（audio
// 播放不受 CORS 限制）
export async function resolveFinalUrl(url: string): Promise<string> {
	if (!url || !/[?&]type=url(&|$)/.test(url)) return url;
	try {
		const res = await fetchWithTimeout(url);
		if (res.ok) {
			const contentType = (res.headers.get("content-type") || "").toLowerCase();
			if (contentType.includes("json")) {
				const raw = (await res.json()) as { url?: string };
				if (raw.url) return raw.url;
			} else {
				return res.url || url;
			}
		}
	} catch (err) {
		console.warn("[MusicSource] Meting url resolve failed:", url, err);
		return url;
	}
	return "";
}

// 解析单首曲目的直链：已有 url 或缺 meting 信息直接返回；
// 否则依次尝试主 API 与 fallbackApis，拿到可用直链即停。
// 原地补全并返回传入的 track（不改动则原样返回）
export async function resolveMusicTrack(
	track: MusicSourceTrack,
	data: MusicSourceData,
): Promise<MusicSourceTrack> {
	if (!track.metingServer || !track.metingId || track.url) return track;
	const apis = [data.metingApiUrl, ...(data.fallbackApis ?? [])].filter(
		(api): api is string => Boolean(api),
	);
	for (const api of apis) {
		const song = await requestMetingSong(
			resolveMetingUrl(api, track.metingServer, track.metingId),
		);
		if (!song) continue;
		const url = await resolveFinalUrl(song.url || "");
		if (!url) continue;
		track.url = url;
		if (song.pic && !track.pic) track.pic = song.pic;
		if (song.lrc && !track.lrc) track.lrc = song.lrc;
		track.artist = track.artist || song.author || song.artist || "";
		track.name =
			track.name && track.name !== track.metingId
				? track.name
				: song.title || track.name;
		break;
	}
	return track;
}

// 并行解析整份播放列表（深拷贝，不修改入参）；
// 解析失败的曲目保留在列表中（url 为空），维持索引对齐
export async function resolveMusicPlaylist(
	data: MusicSourceData,
): Promise<MusicSourceTrack[]> {
	if (!data.playlist || data.playlist.length === 0) return [];
	const resolved = JSON.parse(
		JSON.stringify(data.playlist),
	) as MusicSourceTrack[];
	await Promise.all(resolved.map((track) => resolveMusicTrack(track, data)));
	return resolved;
}

// 挂到 window.__musicSource 的 API 形态（供 is:inline 脚本调用）
export interface MusicSourceApi {
	fetchWithTimeout: typeof fetchWithTimeout;
	resolveMusicTrack: typeof resolveMusicTrack;
	resolveMusicPlaylist: typeof resolveMusicPlaylist;
}
