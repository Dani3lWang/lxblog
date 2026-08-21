/**
 * 豆瓣评分同步脚本
 *
 * 在 astro build 前运行，扫描 bangumi 内容集合中带 doubanId 的条目，
 * 从豆瓣 subject_abstract 接口抓取评分写入 src/constants/douban-ratings.json，
 * 供影视与音乐页卡片展示豆瓣评分（含豆瓣条目链接）。
 *
 * - 已有缓存且当天更新过的条目默认跳过（传 --refresh 强制重抓）
 * - 请求失败时保留旧缓存，不中断构建
 * - 条目删除后自动清理对应缓存
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { globSync } from "glob";
import matter from "gray-matter";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(__dirname, "../src/content/bangumi");
const OUTPUT_FILE = resolve(__dirname, "../src/constants/douban-ratings.json");

const DOUBAN_API = "https://movie.douban.com/j/subject_abstract";
const DOUBAN_REFERER = "https://movie.douban.com/";
const USER_AGENT =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const REQUEST_INTERVAL_MS = 300;
const REQUEST_TIMEOUT_MS = 10000;

interface DoubanSubject {
	id: string;
	title: string;
	rate: string;
	url: string;
	release_year?: string;
	region?: string;
	directors?: string[];
	types?: string[];
	episodes_count?: string;
}

export interface DoubanRatingEntry {
	title: string;
	rate: string;
	url: string;
	year?: string;
	region?: string;
	directors?: string[];
	types?: string[];
	episodes?: string;
	updatedAt: string;
}

type DoubanRatingMap = Record<string, DoubanRatingEntry>;

function todayStr(): string {
	return new Date().toISOString().slice(0, 10);
}

async function fetchSubject(id: string): Promise<DoubanSubject | null> {
	try {
		const res = await fetch(
			`${DOUBAN_API}?subject_id=${encodeURIComponent(id)}`,
			{
				headers: {
					"User-Agent": USER_AGENT,
					Referer: DOUBAN_REFERER,
				},
				signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
			},
		);
		if (!res.ok) {
			console.warn(`  HTTP ${res.status} for doubanId ${id}`);
			return null;
		}
		const json = (await res.json()) as { subject?: DoubanSubject };
		return json.subject ?? null;
	} catch (error) {
		console.warn(`  Request failed for doubanId ${id}: ${String(error)}`);
		return null;
	}
}

function toEntry(subject: DoubanSubject): DoubanRatingEntry {
	const entry: DoubanRatingEntry = {
		title: subject.title,
		rate: subject.rate,
		url: subject.url,
		updatedAt: todayStr(),
	};
	if (subject.release_year) entry.year = subject.release_year;
	if (subject.region) entry.region = subject.region;
	if (subject.directors?.length) entry.directors = subject.directors;
	if (subject.types?.length) entry.types = subject.types;
	if (subject.episodes_count) entry.episodes = subject.episodes_count;
	return entry;
}

function loadCache(): DoubanRatingMap {
	try {
		return JSON.parse(readFileSync(OUTPUT_FILE, "utf8")) as DoubanRatingMap;
	} catch {
		return {};
	}
}

async function main() {
	const refresh = process.argv.includes("--refresh");
	const today = todayStr();

	// 收集条目引用的 doubanId
	const files = globSync("**/*.{md,mdx,yaml,yml}", { cwd: CONTENT_DIR });
	const referencedIds: string[] = [];
	for (const file of files) {
		try {
			const { data } = matter(readFileSync(resolve(CONTENT_DIR, file), "utf8"));
			if (data.doubanId !== undefined && data.doubanId !== null) {
				referencedIds.push(String(data.doubanId));
			}
		} catch (error) {
			console.warn(`  Skip ${file}: ${String(error)}`);
		}
	}

	if (referencedIds.length === 0) {
		console.log("No doubanId references found, skipping.");
		return;
	}

	const cache = loadCache();
	const pending = referencedIds.filter(
		(id) => refresh || !cache[id] || cache[id].updatedAt !== today,
	);

	console.log(
		`Douban ratings: ${referencedIds.length} referenced, ${pending.length} to fetch${refresh ? " (--refresh)" : ""}`,
	);

	for (const id of pending) {
		process.stdout.write(`  Fetching ${id} ... `);
		const subject = await fetchSubject(id);
		if (subject && subject.rate) {
			cache[id] = toEntry(subject);
			console.log(`OK (${subject.rate})`);
		} else {
			// 保留旧缓存，降级不中断
			if (cache[id]) console.log("FAILED, keeping cached entry");
			else console.log("FAILED, no cached entry");
		}
		await new Promise((r) => setTimeout(r, REQUEST_INTERVAL_MS));
	}

	// 清理已不被引用的缓存
	let removed = 0;
	for (const id of Object.keys(cache)) {
		if (!referencedIds.includes(id)) {
			delete cache[id];
			removed++;
		}
	}
	if (removed > 0)
		console.log(`  Removed ${removed} stale entr${removed > 1 ? "ies" : "y"}`);

	writeFileSync(OUTPUT_FILE, `${JSON.stringify(cache, null, "\t")}\n`, "utf8");
	console.log(`Douban ratings written to ${OUTPUT_FILE}`);
}

main();
