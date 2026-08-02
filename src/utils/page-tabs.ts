// 页面级交互模块的全局初始化
//
// Swup 导航后新页面 HTML 中的 is:inline 脚本不会执行（SwupScriptsPlugin 在
// 本项目环境下未生效），导致 mg-tabs / games-tabs / music-cards 等页面内
// tab 交互在从其他页面导航过来时点击无响应。
//
// 因此所有页面级 tab 初始化统一注册在全局模块脚本（Layout.astro）中，
// 通过 astro:page-load / swup:contentReplaced / DOMContentLoaded 事件
// 在每次页面切换后执行，与新页面的 DOM 根节点（#swup-container）绑定。

interface MusicTrack {
	name: string;
	artist: string;
	url: string;
	pic: string;
	lrc: string;
	metingServer: string;
	metingId: string;
}

interface MusicData {
	playlist: MusicTrack[];
	metingApiUrl: string;
}

type MusicManager = {
	setPlaylist: (playlist: MusicTrack[]) => void;
	loadTrack: (index: number, autoPlay: boolean) => void;
	on: (event: string, callback: (payload: unknown) => void) => void;
};

const TAB_ACTIVE_CLASSES = [
	"bg-[var(--card-bg)]",
	"dark:bg-[var(--btn-regular-bg)]",
	"text-[var(--primary)]",
	"shadow-sm",
];
const TAB_INACTIVE_CLASSES = [
	"text-[var(--content-meta)]",
	"hover:text-[var(--deep-text)]",
	"hover:bg-[var(--btn-card-bg-hover)]",
];
const FILTER_ACTIVE_CLASSES = [
	"bg-[var(--primary)]",
	"text-white",
	"border-[var(--primary)]",
	"shadow-sm",
];
const FILTER_INACTIVE_CLASSES = [
	"bg-[var(--card-bg)]",
	"text-[var(--content-meta)]",
	"border-[var(--line-divider)]",
	"hover:border-[var(--primary)]/30",
	"hover:text-[var(--deep-text)]",
];

// 防重复绑定：mg-tab / games-tab / filter 通过 clone 去重，无全局状态；
// music manager 的事件监听需要全局标记避免累积
let musicListenersAttached = false;

function initMgTabs(root: HTMLElement): void {
	const tabButtons = root.querySelectorAll<HTMLElement>(".mg-tab");
	if (tabButtons.length === 0) return;
	// 只用真正的 section 容器，避免误伤 filter / 分页按钮上的 data-section
	const sections = root.querySelectorAll<HTMLElement>(".mg-section");

	// clone 后重新绑定，避免 Swup 多事件触发导致 listener 累积
	tabButtons.forEach((btn) => {
		const clone = btn.cloneNode(true) as HTMLElement;
		btn.parentNode?.replaceChild(clone, btn);
	});

	root.querySelectorAll<HTMLElement>(".mg-tab").forEach((btn) => {
		btn.addEventListener("click", () => {
			const target = btn.dataset.tab;
			root.querySelectorAll<HTMLElement>(".mg-tab").forEach((b) => {
				b.classList.remove(...TAB_ACTIVE_CLASSES);
				b.classList.add(...TAB_INACTIVE_CLASSES);
			});
			btn.classList.remove(...TAB_INACTIVE_CLASSES);
			btn.classList.add(...TAB_ACTIVE_CLASSES);
			sections.forEach((section) => {
				section.classList.toggle("hidden", section.dataset.section !== target);
			});
		});
	});
}

function initMgFilters(root: HTMLElement): void {
	const filterButtons = root.querySelectorAll<HTMLElement>(".mg-filter-btn");
	if (filterButtons.length === 0) return;

	filterButtons.forEach((btn) => {
		const clone = btn.cloneNode(true) as HTMLElement;
		btn.parentNode?.replaceChild(clone, btn);
	});

	root.querySelectorAll<HTMLElement>(".mg-filter-btn").forEach((btn) => {
		btn.addEventListener("click", () => {
			const filter = btn.dataset.filter;
			const sectionId = btn.dataset.section;

			root
				.querySelectorAll<HTMLElement>(
					`[data-section="${sectionId}"].mg-filter-btn`,
				)
				.forEach((b) => {
					b.classList.remove(...FILTER_ACTIVE_CLASSES);
					b.classList.add(...FILTER_INACTIVE_CLASSES);
				});
			btn.classList.remove(...FILTER_INACTIVE_CLASSES);
			btn.classList.add(...FILTER_ACTIVE_CLASSES);

			root
				.querySelectorAll<HTMLElement>(`[data-item-section="${sectionId}"]`)
				.forEach((item) => {
					const show = filter === "all" || item.dataset.itemStatus === filter;
					item.classList.toggle("hidden", !show);
					item.style.display = show ? "block" : "none";
				});

			const pagination = root.querySelector<HTMLElement>(
				`[data-pagination-section="${sectionId}"]`,
			);
			if (pagination) {
				const visible = root.querySelectorAll(
					`[data-item-section="${sectionId}"]:not(.hidden)`,
				);
				pagination.dispatchEvent(
					new CustomEvent("updatePagination", {
						detail: { visibleCount: visible.length },
					}),
				);
			}
		});
	});
}

function initGamesTabs(root: HTMLElement): void {
	const tabButtons = root.querySelectorAll<HTMLElement>(".games-tab");
	if (tabButtons.length === 0) return;
	const sections = root.querySelectorAll<HTMLElement>(".games-section");

	tabButtons.forEach((btn) => {
		const clone = btn.cloneNode(true) as HTMLElement;
		btn.parentNode?.replaceChild(clone, btn);
	});

	root.querySelectorAll<HTMLElement>(".games-tab").forEach((btn) => {
		btn.addEventListener("click", () => {
			const target = btn.dataset.tab;
			root.querySelectorAll<HTMLElement>(".games-tab").forEach((b) => {
				b.classList.remove(...TAB_ACTIVE_CLASSES);
				b.classList.add(...TAB_INACTIVE_CLASSES);
			});
			btn.classList.remove(...TAB_INACTIVE_CLASSES);
			btn.classList.add(...TAB_ACTIVE_CLASSES);
			sections.forEach((section) => {
				section.classList.toggle("hidden", section.dataset.section !== target);
			});
		});
	});
}

// ============ 音乐卡片（影视和音乐页） ============

function getMgr(): MusicManager | undefined {
	return (window as unknown as { __fireflyMusic?: MusicManager })
		.__fireflyMusic;
}

function resolveMetingUrl(
	metingApi: string,
	server: string,
	id: string,
): string {
	if (!metingApi) return "";
	const s = encodeURIComponent(server || "");
	const i = encodeURIComponent(id || "");
	return metingApi
		.replace(":server", s)
		.replace(":type", "song")
		.replace(":id", i)
		.replace(":r", Date.now().toString());
}

async function resolveMusicPlaylist(data: MusicData): Promise<MusicTrack[]> {
	if (!data.playlist || data.playlist.length === 0) return [];
	const resolved = JSON.parse(JSON.stringify(data.playlist)) as MusicTrack[];
	for (const track of resolved) {
		if (track.metingServer && track.metingId && !track.url) {
			try {
				const url = resolveMetingUrl(
					data.metingApiUrl,
					track.metingServer,
					track.metingId,
				);
				const res = await fetch(url);
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const raw = (await res.json()) as
					| Array<{
							url?: string;
							pic?: string;
							lrc?: string;
							title?: string;
							author?: string;
							artist?: string;
					  }>
					| {
							url?: string;
							pic?: string;
							lrc?: string;
							title?: string;
							author?: string;
							artist?: string;
					  };
				const data2 = Array.isArray(raw) ? raw[0] : raw;
				if (data2) {
					if (data2.url) track.url = data2.url;
					if (data2.pic && !track.pic) track.pic = data2.pic;
					if (data2.lrc && !track.lrc) track.lrc = data2.lrc;
					track.artist = track.artist || data2.author || data2.artist || "";
					track.name =
						track.name && track.name !== track.metingId
							? track.name
							: data2.title || track.name;
				}
			} catch (err) {
				console.warn(
					"[MoviesGamesMusic] Meting resolve failed:",
					track.name,
					err,
				);
			}
		}
	}
	return resolved;
}

function updatePlayingVisual(currentName: string): void {
	document.querySelectorAll<HTMLElement>(".music-card").forEach((card) => {
		const titleEl = card.querySelector(".music-title");
		const title = titleEl ? titleEl.textContent : "";
		card.classList.toggle("playing", !!(currentName && title === currentName));
	});
}

async function playMusicByIndex(data: MusicData, index: number): Promise<void> {
	const mgr = getMgr();
	if (!mgr) {
		console.warn("[MoviesGamesMusic] Music manager not found");
		return;
	}
	const resolved = await resolveMusicPlaylist(data);
	mgr.setPlaylist(resolved);
	if (index >= 0 && index < resolved.length) {
		mgr.loadTrack(index, true);
		updatePlayingVisual(resolved[index].name);
	}
}

function initMusicCards(root: HTMLElement, data: MusicData): void {
	const section = root.querySelector('[data-section="music"]');
	if (!section) return;

	section
		.querySelectorAll<HTMLElement>('.music-card[data-has-audio="1"]')
		.forEach((card) => {
			const clone = card.cloneNode(true) as HTMLElement;
			card.parentNode?.replaceChild(clone, card);
		});

	section
		.querySelectorAll<HTMLElement>('.music-card[data-has-audio="1"]')
		.forEach((card) => {
			card.addEventListener("click", (e) => {
				e.preventDefault();
				const idx = parseInt(card.dataset.playlistIndex || "-1", 10);
				if (idx >= 0) {
					void playMusicByIndex(data, idx);
				}
			});
		});
}

function listenToPlayState(): void {
	const mgr = getMgr();
	if (!mgr || musicListenersAttached) return;
	musicListenersAttached = true;
	mgr.on("fm:track-loaded", (payload) => {
		const track = (payload as { track?: { name?: string } } | undefined)?.track;
		if (track && track.name) {
			updatePlayingVisual(track.name);
		}
	});
	mgr.on("fm:play-state", (payload) => {
		const isPlaying = (payload as { isPlaying?: boolean } | undefined)
			?.isPlaying;
		if (isPlaying === false) {
			updatePlayingVisual("");
		}
	});
}

function getMusicData(root: HTMLElement): MusicData | null {
	const el = root.querySelector<HTMLElement>("#mg-music-data");
	if (!el) return null;
	try {
		return JSON.parse(el.textContent || "{}") as MusicData;
	} catch {
		return null;
	}
}

/**
 * 页面级 tab 交互初始化入口。
 * 由 Layout.astro 在 DOMContentLoaded / astro:page-load / swup:contentReplaced
 * 时调用，自动检测当前页面包含的交互模块并初始化。
 */
export function initPageTabs(): void {
	const root = document.getElementById("swup-container");
	if (!root) return;

	const hasMgTabs = root.querySelector(".mg-tab") !== null;
	const hasMgFilters = root.querySelector(".mg-filter-btn") !== null;
	const hasGamesTabs = root.querySelector(".games-tab") !== null;
	const hasMusic = root.querySelector(".music-card") !== null;

	if (hasMgTabs) initMgTabs(root);
	if (hasMgFilters) initMgFilters(root);
	if (hasGamesTabs) initGamesTabs(root);
	if (hasMusic) {
		const data = getMusicData(root);
		if (data) {
			initMusicCards(root, data);
			listenToPlayState();
		}
	}
}
