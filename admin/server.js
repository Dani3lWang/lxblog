/* 博客可视化管理端 — Astro (Firefly) 版
 * 用法：pnpm admin（或 node admin/server.js）
 * 环境变量：BLOG_ADMIN_PORT（默认 4788）、BLOG_ROOT（默认自动探测博客根目录）
 * 数据文件：src/content/{posts,bangumi,dynamic,changelog}
 */
import http from "http";
import fs from "fs";
import path from "path";
import { spawn } from "child_process";
import { fileURLToPath } from "url";
import * as yaml from "js-yaml";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.BLOG_ADMIN_PORT || 4788);
const DEFAULT_ROOT = path.resolve(process.env.BLOG_ROOT || findDefaultRoot());
const publicDir = path.join(__dirname, "public");
const JSON_SCHEMA = yaml.JSON_SCHEMA;

const BANGUMI_CATEGORIES = ["book", "anime", "music", "game", "real"];
const MOVIE_CATEGORIES = ["anime", "real"];
const SUB_CATEGORIES = ["movie", "tv", "anime", "documentary"];
const CHANGELOG_TYPES = ["feature", "improvement", "fix", "removal"];
const POST_KEYS = [
	"title",
	"published",
	"updated",
	"draft",
	"description",
	"image",
	"tags",
	"category",
	"lang",
	"pinned",
	"author",
	"sourceLink",
	"licenseName",
	"licenseUrl",
	"comment",
	"password",
	"passwordHint",
];
const BANGUMI_KEYS = [
	"title",
	"name_cn",
	"category",
	"subcategory",
	"status",
	"image",
	"link",
	"score",
	"comment",
	"tags",
	"published",
	"artist",
	"genre",
	"musicType",
	"audioUrl",
	"lrcUrl",
	"metingServer",
	"metingId",
];
const DYNAMIC_KEYS = ["published", "pinned", "location"];
const CHANGELOG_KEYS = ["version", "date", "time", "type", "description"];

function findDefaultRoot() {
	const candidates = [path.resolve(__dirname, ".."), process.cwd()];
	return (
		candidates.find(
			root =>
				(fs.existsSync(path.join(root, "astro.config.mjs")) ||
					fs.existsSync(path.join(root, "astro.config.js")) ||
					fs.existsSync(path.join(root, "astro.config.ts"))) &&
				fs.existsSync(path.join(root, "src", "content")),
		) || process.cwd()
	);
}

function send(res, status, body, type = "application/json") {
	const payload = type === "application/json" ? JSON.stringify(body) : body;
	res.writeHead(status, {
		"Content-Type": `${type}; charset=utf-8`,
		"Cache-Control": "no-store",
	});
	res.end(payload);
}

function bad(res, status, message) {
	send(res, status, { error: message });
}

function readBody(req) {
	return new Promise((resolve, reject) => {
		let body = "";
		req.on("data", chunk => {
			body += chunk;
			if (body.length > 24 * 1024 * 1024) {
				reject(new Error("请求内容太大"));
				req.destroy();
			}
		});
		req.on("end", () => {
			try {
				resolve(body ? JSON.parse(body) : {});
			} catch (error) {
				reject(new Error(`JSON 格式不正确：${error.message}`));
			}
		});
		req.on("error", reject);
	});
}

function rootFromQuery(url) {
	return path.resolve(url.searchParams.get("root") || DEFAULT_ROOT);
}

function rootFromRequest(req) {
	const parsed = new URL(req.url, `http://${req.headers.host}`);
	return rootFromQuery(parsed);
}

function assertBlogRoot(root) {
	const hasConfig =
		fs.existsSync(path.join(root, "astro.config.mjs")) ||
		fs.existsSync(path.join(root, "astro.config.js")) ||
		fs.existsSync(path.join(root, "astro.config.ts"));
	if (!hasConfig || !fs.existsSync(path.join(root, "src", "content"))) {
		throw new Error(`这里不像 Astro 博客根目录：${root}`);
	}
}

function ensureInside(root, target) {
	const resolvedRoot = path.resolve(root);
	const resolvedTarget = path.resolve(target);
	if (
		resolvedTarget !== resolvedRoot &&
		!resolvedTarget.startsWith(`${resolvedRoot}${path.sep}`)
	) {
		throw new Error(`拒绝访问博客目录外的文件：${resolvedTarget}`);
	}
	return resolvedTarget;
}

function contentDir(root, kind) {
	return path.join(root, "src", "content", kind);
}

function loadYamlFile(file, fallback) {
	if (!fs.existsSync(file)) return fallback;
	return yaml.load(fs.readFileSync(file, "utf8"), { schema: JSON_SCHEMA }) || fallback;
}

function parseFrontMatter(file, fallbackData = {}) {
	const source = fs.existsSync(file)
		? fs.readFileSync(file, "utf8")
		: `---\n${dumpYaml(fallbackData)}---\n`;
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\s*([\s\S]*)$/);
	if (!match) throw new Error(`${file} 没有标准 front matter`);
	return {
		data: yaml.load(match[1], { schema: JSON_SCHEMA }) || {},
		content: (match[2] || "").replace(/^\r?\n/, ""),
	};
}

function dumpYaml(data) {
	return yaml.dump(data, {
		schema: JSON_SCHEMA,
		lineWidth: -1,
		noRefs: true,
		sortKeys: false,
		quotingType: '"',
		forceQuotes: false,
	});
}

function backup(file) {
	if (!fs.existsSync(file)) return;
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	const resolved = path.resolve(file);
	const root = path.parse(resolved).root;
	const rootName = root.replace(/[\\/:]/g, "") || "root";
	const relative = path.relative(root, resolved);
	const backupFile = path.join(__dirname, "backups", rootName, `${relative}.${stamp}.bak`);
	fs.mkdirSync(path.dirname(backupFile), { recursive: true });
	fs.copyFileSync(resolved, backupFile);
}

function writeAtomic(file, content) {
	fs.mkdirSync(path.dirname(file), { recursive: true });
	backup(file);
	const temp = `${file}.${process.pid}.tmp`;
	fs.writeFileSync(temp, content, "utf8");
	fs.renameSync(temp, file);
}

function removeFileWithBackup(file) {
	if (!fs.existsSync(file)) return;
	backup(file);
	fs.unlinkSync(file);
}

function slugifySegment(text, fallback = "new-post") {
	const slug = String(text || "")
		.trim()
		.replace(/[\\/:*?"<>|#%{}^~[\]`;@=&]+/g, "-")
		.replace(/\s+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	return slug || fallback;
}

function slugifyPath(text, fallback = "new-post") {
	return String(text || "")
		.trim()
		.split("/")
		.map(segment => slugifySegment(segment, fallback))
		.join("/");
}

function normalizeArray(value) {
	if (Array.isArray(value))
		return value.map(item => String(item || "").trim()).filter(Boolean);
	return String(value || "")
		.split(/[,\n，]/)
		.map(item => item.trim())
		.filter(Boolean);
}

function normalizeLines(value) {
	if (Array.isArray(value))
		return value.map(item => String(item || "").trim()).filter(Boolean);
	return String(value || "")
		.split("\n")
		.map(item => item.trim())
		.filter(Boolean);
}

function dateValue(value) {
	const text = String(value || "");
	const match = text.match(
		/(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:[ T](\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/,
	);
	if (!match) return 0;
	const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
	return (
		new Date(
			Number(year),
			Number(month) - 1,
			Number(day),
			Number(hour),
			Number(minute),
			Number(second),
		).getTime() || 0
	);
}

function listMarkdownFiles(dir) {
	const results = [];
	if (!fs.existsSync(dir)) return results;
	for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) results.push(...listMarkdownFiles(full));
		else if (/\.(md|mdx)$/i.test(entry.name)) results.push(full);
	}
	return results;
}

function readItemFiles(dir, parse) {
	return listMarkdownFiles(dir).map(file => {
		const parsed = parseFrontMatter(file);
		const rel = path.relative(dir, file);
		const id = rel.split(path.sep).join("/");
		const item = parse(parsed.data, parsed.content, id);
		return {
			id,
			filename: id.replace(/\.(md|mdx)$/i, ""),
			...item,
			extra: Object.fromEntries(
				Object.entries(parsed.data).filter(([key]) => !item.knownKeys.has(key)),
			),
		};
	});
}

function readPosts(root) {
	const dir = contentDir(root, "posts");
	return readItemFiles(dir, (data, content) => {
		const item = {
			title: data.title || "",
			published: data.published || "",
			updated: data.updated || "",
			draft: Boolean(data.draft),
			description: data.description || "",
			image: data.image || "",
			tags: normalizeArray(data.tags),
			category: data.category || "",
			lang: data.lang || "",
			pinned: Boolean(data.pinned),
			author: data.author || "",
			sourceLink: data.sourceLink || "",
			licenseName: data.licenseName || "",
			licenseUrl: data.licenseUrl || "",
			comment: data.comment !== false,
			password: data.password || "",
			passwordHint: data.passwordHint || "",
			content,
			knownKeys: new Set(POST_KEYS),
		};
		return item;
	}).sort(
		(a, b) => dateValue(b.published) - dateValue(a.published) || a.title.localeCompare(b.title, "zh-Hans-CN"),
	);
}

function readBangumiDir(root, categoryDir, allowed) {
	const dir = contentDir(root, categoryDir);
	const bangumiRoot = contentDir(root, "bangumi");
	return listMarkdownFiles(dir).map(file => {
		const parsed = parseFrontMatter(file);
		const rel = path.relative(bangumiRoot, file);
		const id = rel.split(path.sep).join("/");
		const item = {
			title: parsed.data.title || "",
			name_cn: parsed.data.name_cn || "",
			category: allowed.includes(parsed.data.category) ? parsed.data.category : "",
			subcategory: parsed.data.subcategory || "",
			status: Number.isInteger(Number(parsed.data.status)) ? Number(parsed.data.status) : 2,
			image: parsed.data.image || "",
			link: parsed.data.link || "",
			score: parsed.data.score ?? "",
			comment: parsed.data.comment || "",
			tags: normalizeArray(parsed.data.tags),
			published: parsed.data.published || "",
			artist: parsed.data.artist || "",
			genre: parsed.data.genre || "",
			musicType: parsed.data.musicType || "",
			audioUrl: parsed.data.audioUrl || "",
			lrcUrl: parsed.data.lrcUrl || "",
			metingServer: parsed.data.metingServer || "",
			metingId: parsed.data.metingId || "",
			content: parsed.content,
			knownKeys: new Set(BANGUMI_KEYS),
		};
		return {
			id,
			filename: id.replace(/\.(md|mdx)$/i, ""),
			...item,
			extra: Object.fromEntries(
				Object.entries(parsed.data).filter(([key]) => !item.knownKeys.has(key)),
			),
		};
	}).sort(
		(a, b) => dateValue(b.published) - dateValue(a.published) || a.title.localeCompare(b.title, "zh-Hans-CN"),
	);
}

function readMoments(root) {
	const dir = contentDir(root, "dynamic");
	return readItemFiles(dir, (data, content) => {
		const item = {
			published: data.published || "",
			pinned: data.pinned === true || data.pinned === "true" || false,
			location: data.location || "",
			title: content ? content.slice(0, 40).replace(/\n/g, " ") : data.published || "",
			content,
			knownKeys: new Set(DYNAMIC_KEYS),
		};
		return item;
	}).sort((a, b) => dateValue(b.published) - dateValue(a.published));
}

function readChangelog(root) {
	const dir = contentDir(root, "changelog");
	return readItemFiles(dir, (data, content) => {
		const item = {
			version: data.version || "",
			date: data.date || "",
			time: data.time || "",
			type: data.type || "improvement",
			description: data.description || "",
			title: `${data.version || ""} ${data.description ? data.description.slice(0, 24) : ""}`.trim(),
			content,
			knownKeys: new Set(CHANGELOG_KEYS),
		};
		return item;
	}).sort((a, b) => dateValue(b.date) - dateValue(a.date));
}

function loadAll(root) {
	assertBlogRoot(root);
	const posts = readPosts(root);
	const books = readBangumiDir(root, "bangumi/book", ["book"]);
	const movies = [
		...readBangumiDir(root, "bangumi/anime", MOVIE_CATEGORIES),
		...readBangumiDir(root, "bangumi/real", MOVIE_CATEGORIES),
	].sort(
		(a, b) => dateValue(b.published) - dateValue(a.published) || a.title.localeCompare(b.title, "zh-Hans-CN"),
	);
	const music = readBangumiDir(root, "bangumi/music", ["music"]);
	const games = readBangumiDir(root, "bangumi/game", ["game"]);
	const moments = readMoments(root);
	const changelog = readChangelog(root);
	return {
		root,
		counts: {
			posts: posts.length,
			books: books.length,
			movies: movies.length,
			music: music.length,
			games: games.length,
			moments: moments.length,
			changelog: changelog.length,
		},
		posts,
		books,
		movies,
		music,
		games,
		moments,
		changelog,
	};
}

function normalizePost(post = {}) {
	const data = {};
	const title = String(post.title || "").trim() || "未命名文章";
	data.title = title;
	for (const key of [
		"published",
		"updated",
		"image",
		"category",
		"lang",
		"author",
		"sourceLink",
		"licenseName",
		"licenseUrl",
		"password",
		"passwordHint",
	]) {
		const value = String(post[key] ?? "").trim();
		if (value) data[key] = value;
	}
	const description = String(post.description ?? "").trim();
	if (description) data.description = description;
	data.draft = Boolean(post.draft);
	data.pinned = Boolean(post.pinned);
	data.comment = post.comment !== false;
	data.tags = normalizeArray(post.tags);
	for (const [key, value] of Object.entries(post.extra || {})) {
		if (!POST_KEYS.includes(key)) data[key] = value;
	}
	return {
		id: post.id || "",
		filename: slugifyPath(post.filename || title, "new-post"),
		data,
		content: String(post.content || "").replace(/\r\n/g, "\n"),
	};
}

function normalizeBangumi(entry = {}, defaultCategory) {
	const data = {};
	const title = String(entry.title || "").trim() || "未命名条目";
	data.title = title;
	const nameCn = String(entry.name_cn ?? "").trim();
	if (nameCn) data.name_cn = nameCn;
	data.category = BANGUMI_CATEGORIES.includes(entry.category) ? entry.category : defaultCategory;
	const subcategory = String(entry.subcategory ?? "").trim();
	if (SUB_CATEGORIES.includes(subcategory)) data.subcategory = subcategory;
	const status = Number(entry.status);
	data.status = Number.isInteger(status) && status >= 1 && status <= 5 ? status : 2;
	const image = String(entry.image ?? "").trim();
	if (image) data.image = image;
	const link = String(entry.link ?? "").trim();
	if (link) data.link = link;
	const score = String(entry.score ?? "").trim();
	if (score) {
		const number = Number(score);
		data.score = score && !Number.isNaN(number) ? number : score;
	}
	const comment = String(entry.comment ?? "").trim();
	if (comment) data.comment = comment;
	data.tags = normalizeArray(entry.tags);
	const published = String(entry.published ?? "").trim();
	if (published) data.published = published;
	for (const key of ["artist", "genre", "musicType", "audioUrl", "lrcUrl", "metingServer", "metingId"]) {
		const value = String(entry[key] ?? "").trim();
		if (value) data[key] = value;
	}
	for (const [key, value] of Object.entries(entry.extra || {})) {
		if (!BANGUMI_KEYS.includes(key)) data[key] = value;
	}
	return {
		id: entry.id || "",
		filename: slugifyPath(entry.filename || title, "new-item"),
		data,
		content: String(entry.content || "").replace(/\r\n/g, "\n"),
	};
}

function normalizeMoment(entry = {}) {
	const data = {};
	const published = String(entry.published ?? "").trim();
	if (published) data.published = published;
	if (entry.pinned === true || entry.pinned === "true") data.pinned = true;
	const location = String(entry.location ?? "").trim();
	if (location) data.location = location;
	for (const [key, value] of Object.entries(entry.extra || {})) {
		if (!DYNAMIC_KEYS.includes(key)) data[key] = value;
	}
	return {
		id: entry.id || "",
		filename: slugifyPath(entry.filename || published || "new-moment", "new-moment"),
		data,
		content: String(entry.content || "").replace(/\r\n/g, "\n"),
	};
}

function normalizeChangelog(entry = {}) {
	const data = {};
	data.version = String(entry.version || "").trim() || "0.0.0";
	data.date = String(entry.date || "").trim();
	const time = String(entry.time ?? "").trim();
	if (time) data.time = time;
	data.type = CHANGELOG_TYPES.includes(entry.type) ? entry.type : "improvement";
	data.description = String(entry.description || "").trim();
	for (const [key, value] of Object.entries(entry.extra || {})) {
		if (!CHANGELOG_KEYS.includes(key)) data[key] = value;
	}
	return {
		id: entry.id || "",
		filename: slugifyPath(entry.filename || `${data.date}-${data.version}`, "new-log"),
		data,
		content: String(entry.content || "").replace(/\r\n/g, "\n"),
	};
}

function deepEqual(a, b) {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		return a.length === b.length && a.every((value, index) => deepEqual(value, b[index]));
	}
	if (a && b && typeof a === "object" && typeof b === "object") {
		const keysA = Object.keys(a);
		const keysB = Object.keys(b);
		return (
			keysA.length === keysB.length &&
			keysA.every(key => deepEqual(a[key], b[key]))
		);
	}
	return false;
}

function writeMarkdownFile(root, dir, idBase, item, { defaultExt = ".md" } = {}) {
	const oldExt = /\.(md|mdx)$/i.test(item.id || "") ? path.extname(item.id).toLowerCase() : "";
	const ext = oldExt || defaultExt;
	const idName = item.id ? item.id.split("/").pop() : "";
	let filename = `${item.filename}${ext}`;
	let nextFile = ensureInside(root, path.join(dir, filename));
	let suffix = 2;
	while (fs.existsSync(nextFile) && idName.toLowerCase() !== filename.toLowerCase()) {
		filename = `${item.filename}-${suffix}${ext}`;
		nextFile = ensureInside(root, path.join(dir, filename));
		suffix += 1;
	}
	const oldFile =
		item.id && /\.(md|mdx)$/i.test(item.id)
			? ensureInside(root, path.join(idBase, item.id.split("/").join(path.sep)))
			: "";
	const body = item.content.trimEnd();
	const content = `---\n${dumpYaml(item.data)}---\n${body ? `\n${body}\n` : ""}`;
	if (
		fs.existsSync(nextFile) &&
		oldFile &&
		path.resolve(oldFile) === path.resolve(nextFile)
	) {
		try {
			const existing = parseFrontMatter(nextFile);
			if (
				deepEqual(existing.data, item.data) &&
				existing.content.trimEnd() === body
			) {
				return nextFile;
			}
		} catch {
			/* 解析失败则正常覆盖 */
		}
	}
	writeAtomic(nextFile, content);
	if (oldFile && path.resolve(oldFile) !== path.resolve(nextFile)) {
		removeFileWithBackup(oldFile);
	}
	return nextFile;
}

function bangumiDirFor(category, existingId) {
	if (existingId) {
		const first = path.dirname(existingId).split("/").filter(Boolean)[0] || "";
		return first;
	}
	return BANGUMI_CATEGORIES.includes(category) ? category : "anime";
}

function savePosts(root, posts) {
	const dir = contentDir(root, "posts");
	fs.mkdirSync(dir, { recursive: true });
	const seen = new Set();
	for (const rawPost of posts) {
		const post = normalizePost(rawPost);
		const file = writeMarkdownFile(root, dir, dir, post);
		seen.add(path.relative(dir, file).split(path.sep).join("/").toLowerCase());
	}
	pruneMissing(root, dir, seen);
}

function saveBangumi(root, items) {
	const seen = new Set();
	const bangumiRoot = contentDir(root, "bangumi");
	for (const rawItem of items) {
		const item = normalizeBangumi(rawItem, "anime");
		const category = BANGUMI_CATEGORIES.includes(item.data.category)
			? item.data.category
			: "anime";
		const sub = bangumiDirFor(category, item.id);
		const dir = path.join(bangumiRoot, sub);
		fs.mkdirSync(dir, { recursive: true });
		const file = writeMarkdownFile(root, dir, bangumiRoot, {
			...item,
			filename: item.filename.split("/").pop(),
		});
		seen.add(path.relative(bangumiRoot, file).split(path.sep).join("/").toLowerCase());
	}
	pruneMissing(root, bangumiRoot, seen);
}

function saveMoments(root, moments) {
	const dir = contentDir(root, "dynamic");
	fs.mkdirSync(dir, { recursive: true });
	const seen = new Set();
	for (const rawMoment of moments) {
		const moment = normalizeMoment(rawMoment);
		const file = writeMarkdownFile(root, dir, dir, moment);
		seen.add(path.relative(dir, file).split(path.sep).join("/").toLowerCase());
	}
	pruneMissing(root, dir, seen);
}

function saveChangelog(root, changelog) {
	const dir = contentDir(root, "changelog");
	fs.mkdirSync(dir, { recursive: true });
	const seen = new Set();
	for (const rawItem of changelog) {
		const item = normalizeChangelog(rawItem);
		const file = writeMarkdownFile(root, dir, dir, item);
		seen.add(path.relative(dir, file).split(path.sep).join("/").toLowerCase());
	}
	pruneMissing(root, dir, seen);
}

function pruneMissing(root, dir, seen) {
	for (const file of listMarkdownFiles(dir)) {
		const rel = path.relative(dir, file).split(path.sep).join("/").toLowerCase();
		if (!seen.has(rel)) removeFileWithBackup(ensureInside(root, file));
	}
	const dirs = [];
	const collectDirs = target => {
		if (!fs.existsSync(target)) return;
		for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
			if (entry.isDirectory()) {
				const full = path.join(target, entry.name);
				collectDirs(full);
				dirs.push(full);
			}
		}
	};
	collectDirs(dir);
	for (const target of dirs.sort((a, b) => b.split(path.sep).length - a.split(path.sep).length)) {
		if (fs.existsSync(target) && fs.readdirSync(target).length === 0) {
			fs.rmdirSync(target);
		}
	}
}

function saveAll(root, payload) {
	assertBlogRoot(root);
	if (Array.isArray(payload.posts)) savePosts(root, payload.posts);
	if (
		Array.isArray(payload.books) ||
		Array.isArray(payload.movies) ||
		Array.isArray(payload.music) ||
		Array.isArray(payload.games)
	) {
		saveBangumi(root, [
			...(Array.isArray(payload.books) ? payload.books : []),
			...(Array.isArray(payload.movies) ? payload.movies : []),
			...(Array.isArray(payload.music) ? payload.music : []),
			...(Array.isArray(payload.games) ? payload.games : []),
		]);
	}
	if (Array.isArray(payload.moments)) saveMoments(root, payload.moments);
	if (Array.isArray(payload.changelog)) saveChangelog(root, payload.changelog);
}

function runCommand(root, action, res) {
	assertBlogRoot(root);
	const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
	let output = "";
	const child = spawn(command, [action], {
		cwd: root,
		shell: process.platform === "win32",
		env: { ...process.env, FORCE_COLOR: "0" },
	});
	child.stdout.on("data", chunk => {
		output += chunk.toString();
	});
	child.stderr.on("data", chunk => {
		output += chunk.toString();
	});
	child.on("error", error =>
		send(res, 500, { code: -1, output: `${output}\n${error.message}` }),
	);
	child.on("close", code =>
		code === 0
			? send(res, 200, { code: 0, output })
			: send(res, 500, { code, output }),
	);
}

function mediaFile(req, res, requestUrl) {
	const root = rootFromQuery(requestUrl);
	assertBlogRoot(root);
	const raw = requestUrl.searchParams.get("path") || "";
	if (!raw || /^(https?:)?\/\//i.test(raw) || /^data:/i.test(raw)) {
		return bad(res, 400, "不是本地图片路径");
	}

	let target;
	const decoded = decodeURIComponent(raw.split("#")[0].split("?")[0]);
	if (/^[A-Za-z]:[\\/]/.test(decoded)) {
		target = ensureInside(root, decoded);
	} else {
		const clean = decoded.replace(/^\/+/, "");
		const candidates = [
			path.join(root, clean),
			path.join(root, "public", clean),
			path.join(root, "src", "assets", clean),
		];
		target = candidates
			.map(file => {
				try {
					return ensureInside(root, file);
				} catch {
					return "";
				}
			})
			.find(file => file && fs.existsSync(file));
	}

	if (!target || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
		return bad(res, 404, "图片不存在");
	}
	const ext = path.extname(target).toLowerCase();
	const types = {
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
		".gif": "image/gif",
		".webp": "image/webp",
		".svg": "image/svg+xml",
		".avif": "image/avif",
		".bmp": "image/bmp",
	};
	send(res, 200, fs.readFileSync(target), types[ext] || "application/octet-stream");
}

function staticFile(req, res, pathname) {
	const safePath = pathname === "/" ? "/index.html" : pathname;
	const target = path.resolve(publicDir, `.${safePath}`);
	if (!target.startsWith(publicDir)) return bad(res, 403, "拒绝访问");
	if (!fs.existsSync(target) || fs.statSync(target).isDirectory()) {
		return bad(res, 404, "文件不存在");
	}
	const types = {
		".html": "text/html",
		".css": "text/css",
		".js": "application/javascript",
		".svg": "image/svg+xml",
		".jpg": "image/jpeg",
		".jpeg": "image/jpeg",
		".png": "image/png",
	};
	send(
		res,
		200,
		fs.readFileSync(target),
		types[path.extname(target).toLowerCase()] || "text/plain",
	);
}

async function route(req, res) {
	const url = new URL(req.url, `http://${req.headers.host}`);
	try {
		if (url.pathname === "/api/content" && req.method === "GET") {
			return send(res, 200, loadAll(rootFromQuery(url)));
		}
		if (url.pathname === "/api/content" && req.method === "PUT") {
			const body = await readBody(req);
			const root = path.resolve(body.root || DEFAULT_ROOT);
			saveAll(root, body);
			return send(res, 200, loadAll(root));
		}
		if (url.pathname === "/api/action" && req.method === "POST") {
			const body = await readBody(req);
			const actions = { build: "build", check: "check", "type-check": "type-check" };
			if (!actions[body.action]) return bad(res, 400, "未知操作");
			return runCommand(path.resolve(body.root || DEFAULT_ROOT), actions[body.action], res);
		}
		if (url.pathname === "/api/media" && req.method === "GET") {
			return mediaFile(req, res, url);
		}
		return staticFile(req, res, url.pathname);
	} catch (error) {
		return bad(res, 500, error.message);
	}
}

http.createServer(route).listen(PORT, () => {
	console.log(`博客可视化管理端已启动：http://localhost:${PORT}`);
	console.log(`默认博客根目录：${DEFAULT_ROOT}`);
});
