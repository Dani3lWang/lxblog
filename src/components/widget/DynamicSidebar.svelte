<script lang="ts">
/**
 * 侧边栏动态组件 - 从 API 获取数据
 * 支持自定义 API 地址，方便接入第三方后端
 */
import I18nKey from "@i18n/i18nKey";
import { i18n } from "@i18n/translation";
import { onMount } from "svelte";
import { formatDynamicDate } from "@/utils/date-utils";
import { fetchWithDedup } from "@/utils/fetch-dedup";
import { fetchMemos } from "@/utils/memos-adapter";
import { url } from "@/utils/url-utils";

interface DynamicEntry {
	id: string;
	published: number;
	html: string;
	images?: Array<{ alt: string; src: string; title?: string }>;
	searchText?: string;
	pinned?: boolean;
}

interface MemosConfig {
	enable: boolean;
	apiUrl: string;
	parent?: string;
}

interface Props {
	apiUrl: string;
	limit: number;
	memos?: MemosConfig;
	avatarSrc: string;
	authorName: string;
}

let { apiUrl, limit, memos, avatarSrc, authorName }: Props = $props();

let entries: DynamicEntry[] = $state([]);
let totalCount = $state(0);
let loading = $state(true);
let error = $state(false);

onMount(async () => {
	try {
		let data: DynamicEntry[];
		if (memos?.enable) {
			data = await fetchMemos(memos.apiUrl, { parent: memos.parent });
		} else {
			data = await fetchWithDedup(apiUrl);
		}

		totalCount = data.length;
		entries = data.slice(0, limit);
		updateCountBadge();
	} catch {
		error = true;
	} finally {
		loading = false;
	}
});

function updateCountBadge() {
	const badge = document.querySelector("[data-dynamic-count]");
	if (badge && totalCount > 0) {
		badge.textContent = `(${totalCount})`;
	}
}

// 从 HTML 中提取纯文本摘要
function getPlainText(html: string): string {
	const div = document.createElement("div");
	div.innerHTML = html;
	return div.textContent?.trim() || "";
}

// 格式化日期
// 本地 API 使用 formatDynamicDate（带时区转换）
// 第三方 API 和 Memos 使用浏览器本地时区，不做额外转换
function formatDate(timestamp: number): string {
	if (apiUrl.startsWith("http") || memos?.enable) {
		return new Date(timestamp).toLocaleDateString("zh-CN", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
		});
	}
	return formatDynamicDate(new Date(timestamp));
}
</script>

<div class="flex flex-col gap-1.5">
	{#if loading}
		<div class="flex justify-center p-3">
			<svg class="size-5 animate-spin text-(--primary)" viewBox="0 0 24 24" fill="none">
				<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" opacity="0.25"/>
				<path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
			</svg>
		</div>
	{:else if error || entries.length === 0}
		<p class="m-0 p-3 text-center text-sm text-neutral-500">
			{i18n(I18nKey.dynamicEmpty)}
		</p>
	{:else}
		{#each entries as entry (entry.id)}
			{@const text = getPlainText(entry.html)}
			{@const image = entry.images?.[0]}
			<a
				href={url(`/dynamic/#dynamic-${entry.id}`)}
				class="group flex min-w-0 items-center gap-2.5 rounded-lg border border-transparent p-2
					transition-colors duration-150
					hover:border-(--primary)/40 hover:bg-(--btn-plain-bg-hover)"
				aria-label={`${i18n(I18nKey.dynamic)}: ${text}`}
			>
				{#if avatarSrc}
					<img
						src={avatarSrc}
						alt={authorName}
						class="size-9 shrink-0 rounded-full border-2 border-(--primary) object-cover"
						loading="lazy"
						decoding="async"
					/>
				{/if}
				<div class="min-w-0 flex-1">
					<div class="flex items-baseline justify-between gap-2 text-xs leading-4">
						<strong class="truncate font-semibold text-(--text-color) transition-colors group-hover:text-(--primary)">
							{authorName}
						</strong>
						<time
							datetime={new Date(entry.published).toISOString()}
							class="shrink-0 text-(--content-meta)"
						>
							{formatDate(entry.published)}
						</time>
					</div>
					<p class="m-0 mt-0.5 line-clamp-2 text-sm leading-[1.35rem] text-(--text-color)">
						{text}
					</p>
					{#if entry.pinned}
						<span class="mt-1 inline-flex items-center gap-0.5 rounded bg-(--primary)/10 px-1 py-0.5 text-[10px] font-medium text-(--primary)">
							<svg class="size-3" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2z"/></svg>
							{i18n(I18nKey.pinned)}
						</span>
					{/if}
				</div>
				{#if image}
					<img
						src={image.src}
						alt={image.alt}
						class="size-12 shrink-0 rounded-lg bg-(--btn-plain-bg-hover) object-cover"
						loading="lazy"
						decoding="async"
					/>
				{/if}
			</a>
		{/each}
	{/if}
</div>
