import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { musicGenreIds } from "./config/musicGenreConfig";

const postsCollection = defineCollection({
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

const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

const momentsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/moments" }),
	schema: ({ image }) =>
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
		}),
});

const bangumiCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx,yaml,yml}",
		base: "./src/content/bangumi",
	}),
	schema: ({ image }) =>
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
		}),
});

const lifeCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/life" }),
	schema: z.object({
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
	}),
});

const notebooksCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,json}",
		base: "./src/content/moments/notebooks",
	}),
	schema: z.object({
		name: z.string().optional().default("未命名日记本"),
		title: z.string().optional().default(""),
		cover: z.string().optional().default(""),
		summary: z.string().optional().default(""),
		date: z.coerce.date().optional(),
		tags: z.array(z.string()).optional().default([]),
	}),
});

const routinesCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx}",
		base: "./src/content/routines",
	}),
	schema: z.object({
		name: z.string(),
		time: z.string().optional().default(""),
		description: z.string().optional().default(""),
		icon: z.string().optional().default("📌"),
		color: z.string().optional().default(""),
		updatedAt: z.coerce.date().optional(),
	}),
});

const albumCollection = defineCollection({
	loader: glob({
		pattern: "**/*.{md,mdx,json}",
		base: "./src/content/album",
	}),
	schema: ({ image }) =>
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
		}),
});

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

const gamesCollection = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "./src/content/games" }),
	schema: z.object({
		steam: z.array(gameItemSchema).optional().default([]),
		switch: z.array(gameItemSchema).optional().default([]),
		xbox: z.array(gameItemSchema).optional().default([]),
		epic: z.array(gameItemSchema).optional().default([]),
		playstation: z.array(gameItemSchema).optional().default([]),
	}),
});

const changelogCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/changelog" }),
	schema: z.object({
		version: z.string(),
		date: z.date(),
		time: z.string().optional(),
		type: z.enum(["feature", "improvement", "fix", "removal"]),
		description: z.string(),
	}),
});

export const collections = {
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
