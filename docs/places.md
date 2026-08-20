# 足迹系统（Places）使用说明

足迹系统用于在 Firefly 博客中展示「去过的地方」，以 Markdown 数据驱动，并在页面中用 ECharts 中国地图做可视化呈现。

---

## 1. 功能开关

足迹页面由 `src/config/siteConfig.ts` 中的 `pages.places` 控制：

```ts
pages: {
  // 足迹页面开关
  places: true,
}
```

- 设为 `true`：页面可访问，主导航「记录」菜单和二级导航会显示「足迹」入口。
- 设为 `false`：页面本身不会被删除，但导航入口会移除，用户需手动知道 URL 才能访问。

类型声明在 `src/types/siteConfig.ts`：

```ts
places: boolean; // 足迹页面开关
```

---

## 2. 数据格式

足迹数据来自 `src/content/life/places/` 目录下的 Markdown/MDX 文件，使用 `life` 内容集合。

### 2.1 字段定义

`src/content.config.ts` 中 `lifeCollection` 的 `Place` 字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| `province` | `string` | 省份（必填，用于地图匹配） |
| `city` | `string` | 城市 |
| `district` | `string` | 区县/景点 |
| `experience` | `string` | 体验/备注 |
| `visitCount` | `number` | 到访次数，默认 `1` |
| `date` | `date` | 到访日期 |
| `lat` | `number` | 纬度（已定义，暂未渲染） |
| `lng` | `number` | 经度（已定义，暂未渲染） |

### 2.2 新增一条足迹

在 `src/content/life/places/` 下新建 `.md` 文件，例如 `hangzhou.md`：

```md
---
province: 浙江
city: 杭州
district: 西湖区
experience: 西湖断桥赏荷，灵隐寺祈福
visitCount: 3
date: 2025-10-01
---

杭州秋天的桂花香很好闻。
```

> 提示：若 `province` 为空，地图会无法着色；`visitCount` 为空时按 `1` 计算。

---

## 3. 页面展示

页面文件：`src/pages/places.astro`

页面由三部分组成：

### 3.1 顶部统计卡片

- 去过城市
- 总到访次数
- 今年出行
- 总地点

### 3.2 足迹地图

使用 Apache ECharts 绘制中国地图，按省份到访次数热力着色。

### 3.3 地点列表

按日期倒序展示所有地点卡片，包含省/市、体验、到访次数和日期。

---

## 4. 地图渲染

地图脚本在 `src/pages/places.astro` 底部，通过 `define:vars` 把 `clientSortedPlaces` 注入到客户端脚本。

### 4.1 资源加载

1. ECharts 库：`https://cdn.jsdelivr.net/npm/echarts@5.4.3/dist/echarts.min.js`
2. 中国地图 GeoJSON：
   - 优先读取站点本地文件：`/china-map.json`
   - 失败时回退 CDN：`https://cdn.jsdelivr.net/npm/echarts@5.4.3/map/json/china.json`

### 4.2 省份匹配规则

页面会把省份名和地图数据中的名称去掉后缀「省/自治区/特别行政区」后再比较：

```js
var normalizedName = name.replace(/省|自治区|特别行政区/g, '');
```

因此 Markdown 中写 `浙江`、`浙江省` 或 `浙江自治区` 都能匹配（但建议按常规写法填写）。

### 4.3 热力分档

按当前最大到访次数 `maxVisits` 动态分成 4 档：

| 区间 | 颜色 |
|------|------|
| `> 0.8 * maxVisits` | 深红 `#cc0000` |
| `0.5 * maxVisits ~ 0.8 * maxVisits` | 红 `#ff4444` |
| `1 ~ 0.5 * maxVisits` | 浅红 `#ff8888` |
| `0` | 灰 `#e8e8e8` |

### 4.4 交互与兼容性

- `hover` 到省份时显示 tooltip，列出该省前 5 个城市及到访次数。
- 监听 `resize` 自动重绘。
- 监听 `prefers-color-scheme: dark` 变化，销毁并重绘。
- 监听 `astro:after-swap` 事件，适配 SPA 页面切换。

---

## 5. 导航入口

### 5.1 主导航

`src/config/navBarConfig.ts` 在「记录」菜单下动态添加「足迹」入口：

```ts
if (siteConfig.pages.places) {
  recordChildren.push(LinkPresets.Places);
}
```

入口信息：

```ts
Places: {
  name: "足迹",
  url: "/places/",
  icon: "material-symbols:location-on-outline",
}
```

### 5.2 二级导航

`src/components/pages/life/LifeNavTabs.astro` 在 `mode="records"` 时显示「足迹」Tab，当前路径匹配 `/places/` 会高亮。

---

## 6. 统计联动

侧边栏组件 `src/components/widget/LifeStats.astro` 会统计 `life/places/` 下的数据：

- **去过城市**：按 `city` 去重计数
- **足迹记录**：总条目数

这些统计会展示在侧边栏「生活统计」小部件中。

---

## 7. 快速使用流程

| 步骤 | 操作 |
|------|------|
| 1. 开启功能 | 设置 `src/config/siteConfig.ts` 中 `pages.places: true` |
| 2. 添加数据 | 在 `src/content/life/places/` 下新建 `.md` 文件，填写 `province`、`city`、`experience`、`date`、`visitCount` |
| 3. 准备地图（可选） | 如需离线地图，把 `china-map.json` 放到 `public/china-map.json` |
| 4. 验证 | 运行 `pnpm check` → `pnpm format` → `pnpm build` → `pnpm preview` |

---

## 8. 注意事项

1. **地图数据**：ECharts 中国地图依赖 GeoJSON。首次加载时如果没有本地 `china-map.json`，会从 CDN 下载，海外或网络受限环境可能较慢。
2. **省份名称**：建议写标准省份名，如 `浙江`、`四川`、`新疆`，避免写 `新疆维吾尔自治区` 这类长名称（虽然脚本会去掉后缀，但短名更稳妥）。
3. **坐标字段**：`lat` 和 `lng` 当前仅作数据保留，页面尚未渲染点标记，后续可扩展。
4. **无需修改页面代码**：只要添加 Markdown 文件并开启开关即可使用。

---

## 9. 相关文件速查

| 文件 | 作用 |
|------|------|
| `src/config/siteConfig.ts` | 页面开关 `pages.places` |
| `src/types/siteConfig.ts` | 类型定义 |
| `src/config/navBarConfig.ts` | 主导航入口 |
| `src/components/pages/life/LifeNavTabs.astro` | 二级导航 |
| `src/components/widget/LifeStats.astro` | 侧边栏统计 |
| `src/content.config.ts` | `life` collection 字段定义 |
| `src/pages/places.astro` | 页面渲染与地图脚本 |
| `src/content/life/places/` | 足迹数据目录 |
