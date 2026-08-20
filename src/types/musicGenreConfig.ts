// 音乐大类别分类配置类型
import type I18nKey from "../i18n/i18nKey";

// 音乐大类别分类项
export type MusicGenreCategory = {
	// 分类标识（用于 frontmatter genre 字段）
	id: string;
	// 分类中文名（fallback 展示用）
	label: string;
	// i18n 翻译 key
	i18nKey: I18nKey;
};
