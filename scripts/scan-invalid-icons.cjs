// 一键校验仓库内所有 (name|icon)="prefix:rest" 是否存在于本地 iconify 包
const fs = require("fs");
const path = require("path");

const cfg = {
	"material-symbols": "@iconify-json/material-symbols/icons.json",
	"fa7-brands": "@iconify-json/fa7-brands/icons.json",
	"fa7-regular": "@iconify-json/fa7-regular/icons.json",
	"fa7-solid": "@iconify-json/fa7-solid/icons.json",
	"simple-icons": "@iconify-json/simple-icons/icons.json",
	mdi: "@iconify-json/mdi/icons.json",
	mingcute: "@iconify-json/mingcute/icons.json",
};

const sets = {};
const missing = [];
for (const [k, rel] of Object.entries(cfg)) {
	const p = path.join("node_modules", rel);
	if (!fs.existsSync(p)) {
		missing.push(k);
		continue;
	}
	sets[k] = new Set(Object.keys(JSON.parse(fs.readFileSync(p, "utf8")).icons));
}
if (missing.length) console.error("⚠ 缺失 iconify 包:", missing.join(", "));

function walk(dir) {
	const out = [];
	for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
		if (e.name === "node_modules" || e.name.startsWith(".")) continue;
		const p = path.join(dir, e.name);
		if (e.isDirectory()) out.push(...walk(p));
		else if (/\.(astro|svelte|ts|tsx|js|jsx|mjs)$/.test(e.name)) out.push(p);
	}
	return out;
}

const files = walk("src");
const re = /(?:name|icon)="([a-z0-9-]+):([a-z0-9-]+)"/gi;
const bad = [];

for (const f of files) {
	const src = fs.readFileSync(f, "utf8");
	let m;
	re.lastIndex = 0;
	while ((m = re.exec(src))) {
		const prefix = m[1];
		const name = m[2];
		if (!(prefix in sets)) continue;
		if (!sets[prefix].has(name)) {
			const line = src.slice(0, m.index).split(/\n/).length;
			bad.push({
				file: f.replace(/\\/g, "/"),
				line,
				name: m[0],
			});
		}
	}
}

if (bad.length === 0) console.log("✅ 所有图标名都存在于本地 iconify 包中");
else {
	console.log("❌ 以下 " + bad.length + " 个图标名在本地包中不存在:");
	for (const b of bad) console.log("  " + b.file + ":" + b.line + "  " + b.name);
}
