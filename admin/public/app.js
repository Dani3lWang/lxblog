const APP_NAME = "Lxblog 博客编辑器";
const state = { root: "", tab: "posts", selected: 0, data: null, dirty: false };

const selectOptions = {
  status: [
    ["1", "想看"],
    ["2", "看过"],
    ["3", "在看"],
    ["4", "搁置"],
    ["5", "抛弃"],
  ],
  categoryBook: [["book", "书籍"]],
  categoryMovie: [
    ["anime", "动画"],
    ["real", "影视"],
  ],
  categoryMusic: [["music", "音乐"]],
  categoryGame: [["game", "游戏"]],
  subcategory: [
    ["movie", "电影"],
    ["tv", "电视剧"],
    ["anime", "动画"],
    ["documentary", "纪录片"],
  ],
  genre: [
    ["rnb-soul", "R&B/灵魂"],
    ["hip-hop-rap", "说唱/嘻哈"],
    ["pop", "流行"],
    ["indie-alt", "独立/另类"],
    ["latin-world", "拉丁/世界"],
    ["folk", "民谣"],
    ["rock", "摇滚"],
    ["electronic", "电子"],
    ["soundtrack", "影视/游戏原声"],
  ],
  musicType: [
    ["album", "专辑"],
    ["single", "单曲"],
    ["ep", "EP"],
  ],
  changelogType: [
    ["feature", "新功能"],
    ["improvement", "改进"],
    ["fix", "修复"],
    ["removal", "移除"],
  ],
};

const bangumiCommon = [
  ["title", "标题", "text"],
  ["name_cn", "原名/外文名", "text"],
  ["score", "评分(0-10)", "text"],
  ["image", "封面图", "url"],
  ["link", "对应文章链接", "url"],
  ["comment", "短评", "textarea"],
  ["tags", "标签", "tags"],
  ["published", "发布时间(YYYY-MM-DD)", "text"],
];

const musicFields = [
  ["artist", "艺人", "text"],
  ["genre", "音乐大类", "genre"],
  ["musicType", "类型", "musicType"],
  ["audioUrl", "音频地址", "url"],
  ["lrcUrl", "歌词地址", "url"],
  ["metingServer", "Meting 服务器", "text"],
  ["metingId", "Meting ID", "text"],
];

const fieldSets = {
  posts: [
    ["filename", "文件名(相对路径,不含扩展名)", "text"],
    ["title", "标题", "text"],
    ["published", "发布日期(YYYY-MM-DD)", "text"],
    ["updated", "更新时间", "text"],
    ["draft", "草稿", "boolean"],
    ["description", "摘要", "textarea"],
    ["image", "封面图", "url"],
    ["tags", "标签", "tags"],
    ["category", "分类(单个)", "text"],
    ["lang", "语言", "text"],
    ["pinned", "置顶", "boolean"],
    ["author", "作者", "text"],
    ["sourceLink", "原文链接", "url"],
    ["licenseName", "许可名称", "text"],
    ["licenseUrl", "许可链接", "url"],
    ["comment", "允许评论", "boolean"],
    ["password", "访问密码(留空不加密)", "text"],
    ["passwordHint", "密码提示", "text"],
    ["content", "Markdown 正文", "markdown"],
  ],
  books: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["category", "大类", "categoryBook"],
    ["status", "状态", "status"],
    ...bangumiCommon,
    ["content", "补充说明", "markdown"],
  ],
  movies: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["category", "大类", "categoryMovie"],
    ["subcategory", "子类", "subcategory"],
    ["status", "状态", "status"],
    ...bangumiCommon,
    ["content", "补充说明", "markdown"],
  ],
  music: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["category", "大类", "categoryMusic"],
    ["status", "状态", "status"],
    ...bangumiCommon,
    ...musicFields,
    ["content", "补充说明", "markdown"],
  ],
  games: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["category", "大类", "categoryGame"],
    ["status", "状态", "status"],
    ...bangumiCommon,
    ["content", "补充说明", "markdown"],
  ],
  moments: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["published", "发布时间(YYYY-MM-DD)", "text"],
    ["pinned", "置顶", "boolean"],
    ["location", "地点", "text"],
    ["content", "动态内容", "markdown"],
  ],
  changelog: [
    ["filename", "文件名(不含扩展名)", "text"],
    ["version", "版本号", "text"],
    ["date", "日期(YYYY-MM-DD)", "text"],
    ["time", "时间", "text"],
    ["type", "类型", "changelogType"],
    ["description", "描述", "textarea"],
    ["content", "正文", "markdown"],
  ],
};

const els = {
  rootInput: document.querySelector("#rootInput"),
  loadBtn: document.querySelector("#loadBtn"),
  saveBtn: document.querySelector("#saveBtn"),
  checkBtn: document.querySelector("#checkBtn"),
  typecheckBtn: document.querySelector("#typecheckBtn"),
  buildBtn: document.querySelector("#buildBtn"),
  addBtn: document.querySelector("#addBtn"),
  moveUpBtn: document.querySelector("#moveUpBtn"),
  moveDownBtn: document.querySelector("#moveDownBtn"),
  deleteBtn: document.querySelector("#deleteBtn"),
  searchInput: document.querySelector("#searchInput"),
  status: document.querySelector("#status"),
  list: document.querySelector("#list"),
  editor: document.querySelector("#editor"),
  tabs: [...document.querySelectorAll(".tab")],
};

function setStatus(text) {
  els.status.textContent = text;
}
function markDirty() {
  state.dirty = true;
  document.title = `${APP_NAME} *`;
}
function clearDirty() {
  state.dirty = false;
  document.title = APP_NAME;
}

function padTime(value) {
  return String(value).padStart(2, "0");
}
function formatDateTime(date = new Date()) {
  return `${date.getFullYear()}-${padTime(date.getMonth() + 1)}-${padTime(date.getDate())} ${padTime(date.getHours())}:${padTime(date.getMinutes())}:${padTime(date.getSeconds())}`;
}

function collection() {
  if (!state.data) return [];
  return state.data[state.tab] || [];
}

function titleOf(item) {
  if (!item) return "";
  if (state.tab === "changelog") {
    const label =
      selectOptions.changelogType.find(([v]) => v === item.type)?.[1] || item.type || "";
    return [item.version, label, item.description].filter(Boolean).join(" · ") || "未命名条目";
  }
  if (state.tab === "moments") return item.content?.trim() ? item.content.slice(0, 30) : item.published || "未命名动态";
  return item.title || "未命名条目";
}

function statusLabel(item) {
  return selectOptions.status.find(([v]) => String(v) === String(item.status))?.[1] || "";
}

function metaOf(item) {
  if (!item) return "";
  if (state.tab === "posts") {
    return [item.published, item.category, (item.tags || []).join(", ")].filter(Boolean).join(" · ");
  }
  if (state.tab === "books" || state.tab === "music" || state.tab === "games") {
    return [statusLabel(item), item.score ? `${item.score}分` : "", item.published, item.artist].filter(Boolean).join(" · ");
  }
  if (state.tab === "movies") {
    const sub = selectOptions.subcategory.find(([v]) => v === item.subcategory)?.[1] || "";
    return [sub, statusLabel(item), item.score ? `${item.score}分` : "", item.published].filter(Boolean).join(" · ");
  }
  if (state.tab === "moments") {
    return [item.published, item.location].filter(Boolean).join(" · ");
  }
  if (state.tab === "changelog") {
    return [item.date, item.time].filter(Boolean).join(" · ");
  }
  return "";
}

function filteredItems() {
  const q = els.searchInput.value.trim().toLowerCase();
  return collection().map((item, index) => ({ item, index })).filter(({ item }) => !q || JSON.stringify(item).toLowerCase().includes(q));
}

function renderTabs() {
  for (const tab of els.tabs) tab.classList.toggle("active", tab.dataset.tab === state.tab);
  const reorder = canReorder();
  els.moveUpBtn.disabled = !reorder || state.selected <= 0;
  els.moveDownBtn.disabled = !reorder || state.selected >= collection().length - 1;
  document.querySelector("#postCount").textContent = state.data?.posts.length || 0;
  document.querySelector("#bookCount").textContent = state.data?.books.length || 0;
  document.querySelector("#movieCount").textContent = state.data?.movies.length || 0;
  document.querySelector("#musicCount").textContent = state.data?.music.length || 0;
  document.querySelector("#gameCount").textContent = state.data?.games.length || 0;
  document.querySelector("#momentCount").textContent = state.data?.moments.length || 0;
  document.querySelector("#changelogCount").textContent = state.data?.changelog.length || 0;
}

function renderList() {
  els.list.innerHTML = "";
  const items = filteredItems();
  if (!items.length) {
    els.list.innerHTML = '<div class="empty">没有匹配的条目</div>';
    return;
  }
  for (const { item, index } of items) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `list-item${index === state.selected ? " active" : ""}`;
    button.innerHTML = `<span class="list-title">${escapeHtml(titleOf(item))}</span><span class="list-meta">${escapeHtml(metaOf(item))}</span>`;
    button.addEventListener("click", () => {
      state.selected = index;
      render();
    });
    els.list.append(button);
  }
}

function fieldValue(item, key, type) {
  const value = item[key];
  if (type === "lines") return Array.isArray(value) ? value.join("\n") : value || "";
  if (type === "tags") return Array.isArray(value) ? value.join(", ") : value || "";
  if (type === "boolean") return Boolean(value);
  if (selectOptions[type]) return String(value || "");
  return value ?? "";
}

function parseValue(value, type) {
  if (type === "lines") return String(value).split("\n").map(line => line.trim()).filter(Boolean);
  if (type === "tags") return String(value).split(/[,\n，]/).map(tag => tag.trim()).filter(Boolean);
  if (selectOptions[type]) return String(value || "").trim();
  if (type === "boolean") {
    if (typeof value === "boolean") return value;
    const text = String(value ?? "").trim().toLowerCase();
    return ["1", "true", "yes", "on"].includes(text);
  }
  return value;
}

function createField(item, key, label, type, onChange) {
  if (type === "markdown") return createMarkdownField(item, key, label, onChange);
  const wrap = document.createElement("div");
  wrap.className = `field${["textarea", "lines"].includes(type) ? " full" : ""}`;
  const id = `field-${key}-${Math.random().toString(36).slice(2)}`;
  const labelEl = document.createElement("label");
  labelEl.htmlFor = id;
  labelEl.textContent = label;
  const input = selectOptions[type] ? document.createElement("select") : ["textarea", "lines"].includes(type) ? document.createElement("textarea") : document.createElement("input");
  input.id = id;
  input.name = key;
  const isBoolean = type === "boolean";
  const inputType = type === "url" ? "url" : type;
  if (input.tagName === "INPUT") input.type = isBoolean ? "checkbox" : inputType;
  if (selectOptions[type]) {
    input.innerHTML = selectOptions[type].map(([value, text]) => `<option value="${escapeAttr(value)}">${escapeHtml(text)}</option>`).join("");
  }
  if (isBoolean) input.checked = Boolean(fieldValue(item, key, type));
  else input.value = fieldValue(item, key, type);
  input.addEventListener(isBoolean || selectOptions[type] ? "change" : "input", () => {
    item[key] = parseValue(isBoolean ? input.checked : input.value, type);
    markDirty();
    onChange?.();
  });
  wrap.append(labelEl, input);
  return wrap;
}

function createMarkdownField(item, key, label, onChange) {
  const wrap = document.createElement("div");
  wrap.className = "field full markdown-field";
  const head = document.createElement("div");
  head.className = "markdown-head";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const tools = document.createElement("div");
  tools.className = "md-tools";
  const textarea = document.createElement("textarea");
  textarea.className = "markdown-input";
  textarea.value = fieldValue(item, key, "markdown");
  const preview = document.createElement("div");
  preview.className = "markdown-preview";

  const buttons = [
    ["H1", "# 标题", 3], ["H2", "## 标题", 4], ["B", "**加粗**", 2], ["I", "*斜体*", 1],
    ["UL", "- 列表项", 4], ["OL", "1. 列表项", 5], [">", "> 引用", 3],
    ["{}", "```\n代码\n```", 4], ["$", "$\\int_0^1 x^2 dx$", 1], ["$$", "$$\\frac{1}{2}\\int_0^\\infty e^{-x^2} dx$$", 2], ["表", "|表头|表头|\n|-|-|\n|内容|内容|", 0],
  ];
  for (const [text, snippet, selectOffset] of buttons) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = text;
    btn.title = snippet.replace(/\\n/g, "\n");
    btn.addEventListener("click", () => insertSnippet(textarea, snippet.replace(/\\n/g, "\n"), selectOffset, () => {
      item[key] = textarea.value;
      updatePreview();
      markDirty();
      onChange?.();
    }));
    tools.append(btn);
  }

  function updatePreview() {
    preview.innerHTML = renderMarkdown(textarea.value);
  }
  textarea.addEventListener("input", () => {
    item[key] = textarea.value;
    updatePreview();
    markDirty();
    onChange?.();
  });
  head.append(labelEl, tools);
  const grid = document.createElement("div");
  grid.className = "markdown-grid";
  grid.append(textarea, preview);
  wrap.append(head, grid);
  updatePreview();
  return wrap;
}

function insertSnippet(textarea, snippet, selectOffset, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.slice(start, end);
  const text = selected && snippet.includes("标题") ? snippet.replace("标题", selected) : selected && snippet.includes("列表项") ? snippet.replace("列表项", selected) : selected && snippet.includes("加粗") ? snippet.replace("加粗", selected) : selected && snippet.includes("斜体") ? snippet.replace("斜体", selected) : snippet;
  textarea.value = textarea.value.slice(0, start) + text + textarea.value.slice(end);
  textarea.focus();
  const pos = start + Math.max(0, text.length - selectOffset);
  textarea.setSelectionRange(pos, pos);
  after();
}

function renderEditor() {
  els.editor.innerHTML = "";
  const item = collection()[state.selected];
  if (!item) {
    const empty = document.createElement("div");
    empty.className = "empty full";
    empty.textContent = "请选择或新增一个条目";
    els.editor.append(empty);
    return;
  }
  for (const [key, label, type] of fieldSets[state.tab] || []) {
    els.editor.append(createField(item, key, label, type, () => { renderTabs(); renderList(); }));
  }
  if (state.tab === "music") {
    els.editor.append(renderTracksEditor(item));
  }
  if (state.tab !== "moments" && state.tab !== "changelog") {
    els.editor.append(renderExtraJson(item, "extra", "额外 front matter"));
  }
}

// 音乐条目曲目列表可视化编辑器(曲目 = 字符串仅展示 | 对象携带音源/外链)
function renderTracksEditor(item) {
  ensureTracksStyles();
  const wrap = document.createElement("div");
  wrap.className = "field full";
  const label = document.createElement("label");
  label.textContent = "曲目列表(名称必填;本地音频填 url,平台曲目填 meting 服务器+ID,外部播放页填 link)";
  const list = document.createElement("div");
  list.className = "tracks-list";
  if (!Array.isArray(item.tracks)) item.tracks = [];

  function rerender() {
    list.innerHTML = "";
    if (item.tracks.length === 0) {
      const empty = document.createElement("div");
      empty.className = "tracks-empty";
      empty.textContent = "暂无曲目,点击下方按钮添加";
      list.append(empty);
    }
    item.tracks.forEach((track, index) => {
      list.append(rowEl(track, index));
    });
  }

  function fieldInput(track, key, placeholder) {
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = placeholder;
    input.value = track[key] || "";
    input.addEventListener("input", () => {
      track[key] = input.value;
      markDirty();
    });
    return input;
  }

  function rowEl(track, index) {
    const row = document.createElement("div");
    row.className = "track-row";

    const top = document.createElement("div");
    top.className = "track-row-top";
    const no = document.createElement("span");
    no.className = "track-no";
    no.textContent = String(index + 1).padStart(2, "0");
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.className = "track-name";
    nameInput.placeholder = "曲名(必填)";
    nameInput.value = track.name || "";
    nameInput.addEventListener("input", () => {
      track.name = nameInput.value;
      markDirty();
    });
    const ops = document.createElement("span");
    ops.className = "track-ops";
    for (const [opText, opTitle, fn] of [
      ["↑", "上移", () => {
        if (index === 0) return;
        const arr = item.tracks;
        [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
        markDirty();
        rerender();
      }],
      ["↓", "下移", () => {
        if (index >= item.tracks.length - 1) return;
        const arr = item.tracks;
        [arr[index + 1], arr[index]] = [arr[index], arr[index + 1]];
        markDirty();
        rerender();
      }],
      ["×", "删除曲目", () => {
        item.tracks.splice(index, 1);
        markDirty();
        rerender();
      }],
    ]) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "track-op";
      btn.textContent = opText;
      btn.title = opTitle;
      btn.addEventListener("click", fn);
      ops.append(btn);
    }
    top.append(no, nameInput, ops);

    const fields = document.createElement("div");
    fields.className = "track-row-fields";
    fields.append(
      fieldInput(track, "url", "/assets/music/xxx.mp3(本地音频)"),
    );
    const serverSelect = document.createElement("select");
    serverSelect.innerHTML = ["", "netease", "tencent", "kugou", "xiami", "baidu"]
      .map(v => `<option value="${v}"${track.metingServer === v ? " selected" : ""}>${v ? v + "(Meting)" : "平台(无)"}</option>`)
      .join("");
    serverSelect.addEventListener("change", () => {
      track.metingServer = serverSelect.value;
      markDirty();
    });
    fields.append(
      serverSelect,
      fieldInput(track, "metingId", "Meting 歌曲 ID"),
      fieldInput(track, "link", "https://… 外部播放页"),
      fieldInput(track, "lrc", "歌词 .lrc 路径"),
    );

    row.append(top, fields);
    return row;
  }

  const addBtn = document.createElement("button");
  addBtn.type = "button";
  addBtn.className = "tracks-add";
  addBtn.textContent = "+ 添加曲目";
  addBtn.addEventListener("click", () => {
    item.tracks.push({ name: "", url: "", lrc: "", metingServer: "", metingId: "", link: "" });
    markDirty();
    rerender();
    list.scrollTop = list.scrollHeight;
  });

  wrap.append(label, list, addBtn);
  rerender();
  return wrap;
}

function ensureTracksStyles() {
  if (document.getElementById("tracks-editor-style")) return;
  const style = document.createElement("style");
  style.id = "tracks-editor-style";
  style.textContent = `
    .tracks-list { display:flex; flex-direction:column; gap:6px; max-height:420px; overflow:auto; }
    .tracks-empty { color:#999; font-size:12px; padding:6px 2px; }
    .track-row { border:1px solid #ddd; border-radius:8px; padding:8px; display:flex; flex-direction:column; gap:6px; background:#fafafa; }
    .track-row-top { display:flex; gap:6px; align-items:center; }
    .track-no { flex-shrink:0; font-size:12px; font-weight:600; color:#888; font-variant-numeric:tabular-nums; }
    .track-row-top .track-name { flex:1; }
    .track-ops { display:flex; gap:4px; flex-shrink:0; }
    .track-op { padding:2px 8px; border:1px solid #ccc; border-radius:6px; background:#fff; cursor:pointer; font-size:12px; }
    .track-op:hover { border-color:var(--accent,#4f8cff); color:var(--accent,#4f8cff); }
    .track-row-fields { display:grid; grid-template-columns:repeat(4,1fr); gap:6px; }
    .track-row-fields input, .track-row-fields select { width:100%; box-sizing:border-box; font-size:12px; }
    .tracks-add { margin-top:8px; align-self:flex-start; padding:4px 12px; border:1px solid #ccc; border-radius:6px; background:#fff; cursor:pointer; }
    .tracks-add:hover { border-color:var(--accent,#4f8cff); color:var(--accent,#4f8cff); }
    @media (max-width:700px) { .track-row-fields { grid-template-columns:1fr 1fr; } }
  `;
  document.head.append(style);
}

function renderExtraJson(item, key, label) {
  const wrap = document.createElement("div");
  wrap.className = "field full";
  const labelEl = document.createElement("label");
  labelEl.textContent = label;
  const textarea = document.createElement("textarea");
  textarea.value = JSON.stringify(item[key] || {}, null, 2);
  textarea.addEventListener("input", () => {
    try {
      item[key] = textarea.value.trim() ? JSON.parse(textarea.value) : {};
      textarea.classList.remove("invalid");
      markDirty();
    } catch {
      textarea.classList.add("invalid");
    }
  });
  wrap.append(labelEl, textarea);
  return wrap;
}

function render() {
  renderTabs();
  renderList();
  renderEditor();
}

function renderMarkdown(source) {
  const lines = String(source || "").split(/\r?\n/);
  let html = "";
  let inCode = false;
  let inMath = false;
  let math = [];
  let code = [];
  let inUl = false;
  let inOl = false;
  const closeLists = () => {
    if (inUl) { html += "</ul>"; inUl = false; }
    if (inOl) { html += "</ol>"; inOl = false; }
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^```/.test(line.trim())) {
      if (inCode) {
        html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`;
        code = [];
        inCode = false;
      } else {
        closeLists();
        inCode = true;
      }
      continue;
    }
    if (/^\$\$\s*$/.test(line.trim()) || (/^\$\$/.test(line.trim()) && /\$\$$/.test(line.trim()) && line.trim().length > 4)) {
      closeLists();
      const trimmed = line.trim();
      if (trimmed.length > 4 && trimmed.endsWith("$$")) {
        html += `<div class="math-block">\\[${escapeHtml(trimmed.slice(2, -2).trim())}\\]</div>`;
      } else if (inMath) {
        html += `<div class="math-block">\\[${escapeHtml(math.join("\n"))}\\]</div>`;
        math = [];
        inMath = false;
      } else {
        inMath = true;
      }
      continue;
    }
    if (inCode) { code.push(line); continue; }
    if (inMath) { math.push(line); continue; }
    if (!line.trim()) { closeLists(); continue; }
    if (/^\|.+\|$/.test(line) && lines[i + 1] && /^\|?[\s:-]+\|/.test(lines[i + 1])) {
      closeLists();
      const heads = line.split("|").filter(Boolean).map(cell => cell.trim());
      i += 1;
      const rows = [];
      while (lines[i + 1] && /^\|.+\|$/.test(lines[i + 1])) rows.push(lines[++i].split("|").filter(Boolean).map(cell => cell.trim()));
      html += `<table><thead><tr>${heads.map(h => `<th>${inlineMd(h)}</th>`).join("")}</tr></thead><tbody>${rows.map(row => `<tr>${row.map(c => `<td>${inlineMd(c)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      closeLists();
      const level = heading[1].length;
      const labels = ["一级标题", "二级标题", "三级标题", "四级标题", "五级标题", "六级标题"];
      html += `<h${level} data-md-label="<${labels[level - 1]}>">${inlineMd(heading[2])}</h${level}>`;
      continue;
    }
    if (/^\s*[-*+]\s+/.test(line)) {
      if (!inUl) { closeLists(); html += "<ul>"; inUl = true; }
      html += `<li>${inlineMd(line.replace(/^\s*[-*+]\s+/, ""))}</li>`;
      continue;
    }
    if (/^\s*\d+\.\s+/.test(line)) {
      if (!inOl) { closeLists(); html += "<ol>"; inOl = true; }
      html += `<li>${inlineMd(line.replace(/^\s*\d+\.\s+/, ""))}</li>`;
      continue;
    }
    if (/^>\s?/.test(line)) { closeLists(); html += `<blockquote>${inlineMd(line.replace(/^>\s?/, ""))}</blockquote>`; continue; }
    if (/^---+$/.test(line.trim())) { closeLists(); html += "<hr>"; continue; }
    closeLists();
    html += `<p>${inlineMd(line)}</p>`;
  }
  closeLists();
  if (inCode) html += `<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`;
  if (inMath) html += `<div class="math-block">\\[${escapeHtml(math.join("\n"))}\\]</div>`;
  return html || '<p class="preview-empty">这里会显示 Markdown 可视化效果</p>';
}

function inlineMd(text) {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/\$([^$]+)\$/g, (_, expr) => `<span class="math-inline">\\(${expr}\\)</span>`)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt, src) => `<span class="image-token">图片：${escapeHtml(alt || unescapeHtml(src))}</span>`)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
}

function unescapeHtml(text) {
  return String(text).replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function escapeAttr(text) {
  return String(text || "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

async function loadContent() {
  setStatus("正在读取博客文件...");
  const root = els.rootInput.value.trim();
  const res = await fetch(`/api/content?root=${encodeURIComponent(root)}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "读取失败");
  state.root = body.root;
  state.data = body;
  state.selected = 0;
  els.rootInput.value = body.root;
  clearDirty();
  render();
  const c = body.counts;
  setStatus(`已读取：${body.root}\n文章 ${c.posts} 篇，书籍 ${c.books}，影视 ${c.movies}，音乐 ${c.music}，游戏 ${c.games}\n动态 ${c.moments}，更新日志 ${c.changelog}`);
}

async function saveContent() {
  if (!state.data) return;
  setStatus("正在保存，并生成 .bak 备份...");
  const res = await fetch("/api/content", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      root: els.rootInput.value.trim(),
      posts: state.data.posts,
      books: state.data.books,
      movies: state.data.movies,
      music: state.data.music,
      games: state.data.games,
      moments: state.data.moments,
      changelog: state.data.changelog,
    }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "保存失败");
  state.root = body.root;
  state.data = body;
  clearDirty();
  render();
  setStatus(`保存完成：${new Date().toLocaleString()}\n已写入 ${body.root}`);
}

async function runAction(action) {
  if (state.dirty) await saveContent();
  const labels = { check: "pnpm check", build: "pnpm build", "type-check": "pnpm type-check" };
  setStatus(`正在执行 ${labels[action] || action}...`);
  const res = await fetch("/api/action", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ root: els.rootInput.value.trim(), action }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.output || body.error || "操作失败");
  setStatus(body.output || `${labels[action] || action} 完成`);
}

function addItem() {
  const items = collection();
  const today = new Date().toISOString().slice(0, 10);
  const now = formatDateTime();
  const bangumiBase = {
    id: "", filename: "new-item", title: "", name_cn: "", score: "", image: "",
    link: "", comment: "", tags: [], published: today, status: 2, artist: "",
    genre: "", musicType: "", audioUrl: "", lrcUrl: "", metingServer: "",
    metingId: "", doubanId: "", tracks: [], extra: {}, content: "",
  };
  let item;
  if (state.tab === "posts") {
    item = { id: "", filename: `new-post-${today}`, title: "新文章", published: today, updated: "", draft: false, description: "", image: "", tags: [], category: "", lang: "", pinned: false, author: "", sourceLink: "", licenseName: "", licenseUrl: "", comment: true, password: "", passwordHint: "", extra: {}, content: "" };
  } else if (state.tab === "books") {
    item = { ...bangumiBase, filename: "new-book", category: "book" };
  } else if (state.tab === "movies") {
    item = { ...bangumiBase, filename: "new-movie", category: "anime", subcategory: "movie" };
  } else if (state.tab === "music") {
    item = { ...bangumiBase, filename: "new-music", category: "music" };
  } else if (state.tab === "games") {
    item = { ...bangumiBase, filename: "new-game", category: "game" };
  } else if (state.tab === "moments") {
    item = { id: "", filename: "new-moment", published: today, pinned: false, location: "", content: "" };
  } else {
    item = { id: "", filename: `new-log-${today}`, version: "", date: today, time: "", type: "feature", description: "", content: "" };
  }
  items.unshift(item);
  state.selected = 0;
  markDirty();
  render();
}

function deleteItem() {
  const items = collection();
  if (!items[state.selected]) return;
  if (!confirm(`删除「${titleOf(items[state.selected])}」？保存后会从博客源文件中移除。`)) return;
  items.splice(state.selected, 1);
  state.selected = Math.max(0, state.selected - 1);
  markDirty();
  render();
}

function canReorder() {
  return false;
}

function wire() {
  els.loadBtn.addEventListener("click", () => loadContent().catch(err => setStatus(err.message)));
  els.saveBtn.addEventListener("click", () => saveContent().catch(err => setStatus(err.message)));
  els.checkBtn.addEventListener("click", () => runAction("check").catch(err => setStatus(err.message)));
  els.typecheckBtn.addEventListener("click", () => runAction("type-check").catch(err => setStatus(err.message)));
  els.buildBtn.addEventListener("click", () => runAction("build").catch(err => setStatus(err.message)));
  els.addBtn.addEventListener("click", addItem);
  els.moveUpBtn.addEventListener("click", () => moveItem(-1));
  els.moveDownBtn.addEventListener("click", () => moveItem(1));
  els.deleteBtn.addEventListener("click", deleteItem);
  els.searchInput.addEventListener("input", renderList);
  for (const tab of els.tabs) {
    tab.addEventListener("click", () => {
      state.tab = tab.dataset.tab;
      state.selected = 0;
      els.searchInput.value = "";
      render();
    });
  }
  document.querySelector(".traffic-dot.close")?.addEventListener("click", () => appCommand("close"));
  document.querySelector(".traffic-dot.minimize")?.addEventListener("click", () => appCommand("minimize"));
  document.querySelector(".traffic-dot.zoom")?.addEventListener("click", () => appCommand("toggleMaximize"));
  document.querySelector(".window-bar")?.addEventListener("dblclick", event => {
    if (event.target.closest(".traffic-lights")) return;
    appCommand("toggleMaximize");
  });
  document.querySelector(".window-bar")?.addEventListener("mousedown", event => {
    if (event.button !== 0 || event.target.closest(".traffic-lights")) return;
    appCommand("dragWindow");
  });
  document.querySelectorAll(".resize-hit").forEach(hit => {
    hit.addEventListener("mousedown", event => {
      if (event.button !== 0) return;
      appCommand(`resize:${hit.dataset.resize}`);
    });
  });
  window.addEventListener("beforeunload", event => {
    if (!state.dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function appCommand(command) {
  if (window.chrome?.webview) {
    window.chrome.webview.postMessage(command);
  } else if (command === "close") {
    window.close();
  }
}

wire();
loadContent().catch(err => setStatus(err.message));
