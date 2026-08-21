import { defineCollection } from "astro:content";
import type { ImageMetadata } from "astro";
import type { CollectionConfig, SchemaContext } from "astro/content/config";
import { glob } from "astro/loaders";
import { type ZodType, z } from "astro/zod";
import type { MusicGenreId } from "./config/musicGenreConfig";
import { musicGenreIds } from "./config/musicGenreConfig";

type PostData = {
	title: string;
	published: Date;
	updated?: Date;
	draft: boolean;
	description: string;
	image: string;
	tags: string[];
	category: string | null;
	lang: string;
	pinned: boolean;
	author: string;
	sourceLink: string;
	licenseName: string;
	licenseUrl: string;
	comment: boolean;
	password: string;
	passwordHint: string;
	prevTitle: string;
	prevSlug: string;
	nextTitle: string;
	nextSlug: string;
};

type DynamicData = {
	published: Date;
	pinned: boolean;
	location: string;
};

type ContentCollection<T> = CollectionConfig<
	ZodType<T>,
	ReturnType<typeof glob>
>;

const postsCollection: ContentCollection<PostData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),
		comment: z.boolean().optional().default(true),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});

const specCollection: ContentCollection<Record<string, never>> =
	defineCollection({
		loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
		schema: z.object({}),
	});

const dynamicCollection: ContentCollection<DynamicData> = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "./src/content/dynamic" }),
	schema: z.object({
		published: z.date(),
		pinned: z.boolean().optional().default(false),
		location: z.string().optional().default(""),
	}),
});

type MomentData = {
	author: string;
	avatar: string;
	published: Date;
	images: (ImageMetadata | string)[] | string;
	tags: string[];
	location: string;
	device: string;
};

const momentsSchema: (ctx: SchemaContext) => ZodType<MomentData> = ({
	image,
}) =>
	z.object({
		author: z.string().optional().default(""),
		avatar: z.string().optional().default(""),
		published: z.date(),
		images: z
			.array(image().or(z.string()))
			.or(z.string())
			.optional()
			.default([]),
		tags: z.array(z.string()).optional().default([]),
		location: z.string().optional().default(""),
		device: z.string().optional().default(""),
	});

const momentsCollection: ContentCollection<MomentData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/moments" }),
	schema: momentsSchema,
});

type BangumiData = {
	title: string;
	name_cn?: string;
	category: "book" | "anime" | "music" | "game" | "real";
	subcategory?: "movie" | "tv" | "anime" | "documentary";
	status: number; // 1: 想看, 2: 看过, 3: 在看, 4: 搁置, 5: 抛弃
	image: ImageMetadata | string;
	link?: string;
	doubanId?: string | number; // 豆瓣条目 ID，构建时抓取豆瓣评分
	score?: number;
	comment?: string;
	tags: string[];
	published?: Date;
	// Music-specific fields
	artist?: string;
	genre?: MusicGenreId;
	audioUrl?: string;
	lrcUrl?: string;
	metingServer?: string;
	metingId?: string;
	musicType?: "album" | "single" | "ep";
	// 专辑曲目列表（按专辑内顺序）
	tracks?: string[];
};

const bangumiSchema: (ctx: SchemaContext) => ZodType<BangumiData> = ({
	image,
}) =>
	z.object({
		title: z.string(),
		name_cn: z.string().optional(),
		category: z
			.enum(["book", "anime", "music", "game", "real"])
			.default("anime"),
		subcategory: z.enum(["movie", "tv", "anime", "documentary"]).optional(),
		status: z.number().min(1).max(5).default(2), // 1: 想看, 2: 看过, 3: 在看, 4: 搁置, 5: 抛弃
		image: image().or(z.string()),
		link: z.string().optional(), // 对应文章的链接；为空时自动从文件路径推导
		doubanId: z.union([z.string(), z.number()]).optional(), // 豆瓣条目 ID，用于构建时抓取并展示豆瓣评分
		score: z.number().min(0).max(10).optional(),
		comment: z.string().optional(),
		tags: z.array(z.string()).optional().default([]),
		published: z.date().optional(),
		// Music-specific fields
		artist: z.string().optional(),
		genre: z.enum(musicGenreIds).optional(), // 音乐大类别（见 src/config/musicGenreConfig.ts）
		audioUrl: z.string().optional(),
		lrcUrl: z.string().optional(),
		metingServer: z.string().optional(),
		metingId: z.string().optional(),
		musicType: z.enum(["album", "single", "ep"]).optional(),
		// 专辑曲目列表（按专辑内顺序）
		tracks: z.array(z.string()).optional(),
	});

const bangumiCollection: ContentCollection<BangumiData> = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx,yaml,yml}",
		base: "./src/content/bangumi",
	}),
	schema: bangumiSchema,
});

type LifeData = {
	label: string;
	value: string;
	title: string;
	description: string;
	date?: Date;
	createdAt?: Date;
	completedAt?: Date;
	content: string;
	status?: "done" | "todo";
	// Notebook
	name: string;
	cover: string;
	summary: string;
	entries: number;
	updatedAt?: string | Date;
	tags: string[];
	// Plan
	planName: string;
	targetDesc: string;
	dailyTarget: number;
	monthlyTarget: number;
	checkins: Date[];
	// Place
	province: string;
	city: string;
	district: string;
	experience: string;
	visitCount: number;
	lat?: number;
	lng?: number;
	// Legacy fields (keep compatibility with existing data)
	waterCups?: number;
	meals: { name: string; value: string }[];
	streak: number;
	progress: number;
};

const lifeSchema: ZodType<LifeData> = z.object({
	label: z.string().optional().default(""),
	value: z.string().optional().default(""),
	title: z.string().optional().default(""),
	description: z.string().optional().default(""),
	date: z.coerce.date().optional(),
	createdAt: z.coerce.date().optional(),
	completedAt: z.coerce.date().optional(),
	content: z.string().optional().default(""),
	status: z.enum(["done", "todo"]).optional(),

	// Notebook
	name: z.string().optional().default(""),
	cover: z.string().optional().default(""),
	summary: z.string().optional().default(""),
	entries: z.number().optional().default(0),
	updatedAt: z.union([z.string(), z.date()]).optional(),
	tags: z.array(z.string()).optional().default([]),

	// Plan
	planName: z.string().optional().default(""),
	targetDesc: z.string().optional().default(""),
	dailyTarget: z.number().optional().default(1),
	monthlyTarget: z.number().optional().default(20),
	checkins: z.array(z.coerce.date()).optional().default([]),

	// Place
	province: z.string().optional().default(""),
	city: z.string().optional().default(""),
	district: z.string().optional().default(""),
	experience: z.string().optional().default(""),
	visitCount: z.number().optional().default(1),
	lat: z.number().optional(),
	lng: z.number().optional(),

	// Legacy fields (keep compatibility with existing data)
	waterCups: z.number().optional(),
	meals: z
		.array(z.object({ name: z.string(), value: z.string() }))
		.optional()
		.default([]),
	streak: z.number().optional().default(0),
	progress: z.number().min(0).max(100).optional().default(0),
});

const lifeCollection: ContentCollection<LifeData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/life" }),
	schema: lifeSchema,
});

type NotebooksData = {
	name: string;
	title: string;
	cover: string;
	summary: string;
	date?: Date;
	tags: string[];
};

const notebooksSchema: ZodType<NotebooksData> = z.object({
	name: z.string().optional().default("未命名日记本"),
	title: z.string().optional().default(""),
	cover: z.string().optional().default(""),
	summary: z.string().optional().default(""),
	date: z.coerce.date().optional(),
	tags: z.array(z.string()).optional().default([]),
});

const notebooksCollection: ContentCollection<NotebooksData> = defineCollection({
	loader: glob({
		pattern: "**/*.{md,json}",
		base: "./src/content/moments/notebooks",
	}),
	schema: notebooksSchema,
});

type RoutinesData = {
	name: string;
	time: string;
	description: string;
	icon: string;
	color: string;
	updatedAt?: Date;
};

const routinesSchema: ZodType<RoutinesData> = z.object({
	name: z.string(),
	time: z.string().optional().default(""),
	description: z.string().optional().default(""),
	icon: z.string().optional().default("📌"),
	color: z.string().optional().default(""),
	updatedAt: z.coerce.date().optional(),
});

const routinesCollection: ContentCollection<RoutinesData> = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/routines",
	}),
	schema: routinesSchema,
});

type AlbumData = {
	title: string;
	subtitle: string;
	cover?: ImageMetadata | string;
	date: Date;
	location: string;
	photos: (
		| ImageMetadata
		| string
		| { src: string; alt?: string; caption?: string }
	)[];
	tags: string[];
	draft: boolean;
};

const albumSchema: (ctx: SchemaContext) => ZodType<AlbumData> = ({ image }) =>
	z.object({
		title: z.string(),
		subtitle: z.string().optional().default(""),
		cover: image().or(z.string()).optional(),
		date: z.coerce.date(),
		location: z.string().optional().default(""),
		photos: z
			.array(
				image()
					.or(z.string())
					.or(
						z.object({
							src: z.string(),
							alt: z.string().optional(),
							caption: z.string().optional(),
						}),
					),
			)
			.optional()
			.default([]),
		tags: z.array(z.string()).optional().default([]),
		draft: z.boolean().optional().default(false),
	});

const albumCollection: ContentCollection<AlbumData> = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx,json}",
		base: "./src/content/album",
	}),
	schema: albumSchema,
});

type GameAchievementData = {
	name: string;
	image: string;
	url: string;
	achieved: boolean;
	unlock_time?: number;
};

type GameItemData = {
	name: string;
	hours: number;
	minutes: number;
	cover: string;
	last_played: string;
	store_url: string;
	earned_achievements: number;
	total_achievements: number;
	achievements: GameAchievementData[];
	// Steam appid（同步脚本写入）
	appid?: number;
};

const gameAchievementSchema = z.object({
	name: z.string().default(""),
	image: z.string().optional().default(""),
	url: z.string().optional().default(""),
	achieved: z.boolean().optional().default(false),
	unlock_time: z.number().optional(),
});

const gameItemSchema = z.object({
	name: z.string(),
	hours: z.number().optional().default(0),
	minutes: z.number().optional().default(0),
	cover: z.string().optional().default(""),
	last_played: z.string().optional().default(""),
	store_url: z.string().optional().default(""),
	earned_achievements: z.number().optional().default(0),
	total_achievements: z.number().optional().default(0),
	achievements: z.array(gameAchievementSchema).optional().default([]),
	// Steam appid（同步脚本写入）
	appid: z.number().optional(),
});

type GamesData = {
	steam: GameItemData[];
	switch: GameItemData[];
	xbox: GameItemData[];
	epic: GameItemData[];
	playstation: GameItemData[];
};

const gamesSchema: ZodType<GamesData> = z.object({
	steam: z.array(gameItemSchema).optional().default([]),
	switch: z.array(gameItemSchema).optional().default([]),
	xbox: z.array(gameItemSchema).optional().default([]),
	epic: z.array(gameItemSchema).optional().default([]),
	playstation: z.array(gameItemSchema).optional().default([]),
});

const gamesCollection: ContentCollection<GamesData> = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/games" }),
	schema: gamesSchema,
});

type ChangelogData = {
	version: string;
	date: Date;
	time?: string;
	type: "feature" | "improvement" | "fix" | "removal";
	description: string;
};

const changelogSchema: ZodType<ChangelogData> = z.object({
	version: z.string(),
	date: z.date(),
	time: z.string().optional(),
	type: z.enum(["feature", "improvement", "fix", "removal"]),
	description: z.string(),
});

const changelogCollection: ContentCollection<ChangelogData> = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/changelog" }),
	schema: changelogSchema,
});

export const collections: {
	dynamic: typeof dynamicCollection;
	posts: typeof postsCollection;
	spec: typeof specCollection;
	moments: typeof momentsCollection;
	bangumi: typeof bangumiCollection;
	life: typeof lifeCollection;
	notebooks: typeof notebooksCollection;
	routines: typeof routinesCollection;
	album: typeof albumCollection;
	games: typeof gamesCollection;
	changelog: typeof changelogCollection;
} = {
	dynamic: dynamicCollection,
	posts: postsCollection,
	spec: specCollection,
	moments: momentsCollection,
	bangumi: bangumiCollection,
	life: lifeCollection,
	notebooks: notebooksCollection,
	routines: routinesCollection,
	album: albumCollection,
	games: gamesCollection,
	changelog: changelogCollection,
};
