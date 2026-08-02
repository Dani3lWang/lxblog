// 音乐大类别分类标准
// 数据来源：网易云歌单 957385831（1079 首歌曲）按艺人主类别归纳统计
// 顺序即展示顺序：按歌单内歌曲数量从多到少排列
import I18nKey from "../i18n/i18nKey";
import type { MusicGenreCategory } from "../types/musicGenreConfig";

// 有效的 genre 值列表（frontmatter genre 字段取值）
export const musicGenreIds = [
	"rnb-soul",
	"hip-hop-rap",
	"pop",
	"indie-alt",
	"latin-world",
	"folk",
	"rock",
	"electronic",
	"soundtrack",
] as const;

export type MusicGenreId = (typeof musicGenreIds)[number];

export const musicGenreCategories: MusicGenreCategory[] = [
	{
		id: "rnb-soul",
		label: "R&B/灵魂",
		i18nKey: I18nKey.musicGenreRnBSoul,
	},
	{
		id: "hip-hop-rap",
		label: "说唱/嘻哈",
		i18nKey: I18nKey.musicGenreHipHopRap,
	},
	{
		id: "pop",
		label: "流行",
		i18nKey: I18nKey.musicGenrePop,
	},
	{
		id: "indie-alt",
		label: "独立/另类",
		i18nKey: I18nKey.musicGenreIndieAlt,
	},
	{
		id: "latin-world",
		label: "拉丁/世界",
		i18nKey: I18nKey.musicGenreLatinWorld,
	},
	{
		id: "folk",
		label: "民谣",
		i18nKey: I18nKey.musicGenreFolk,
	},
	{
		id: "rock",
		label: "摇滚",
		i18nKey: I18nKey.musicGenreRock,
	},
	{
		id: "electronic",
		label: "电子",
		i18nKey: I18nKey.musicGenreElectronic,
	},
	{
		id: "soundtrack",
		label: "影视/游戏原声",
		i18nKey: I18nKey.musicGenreSoundtrack,
	},
];
