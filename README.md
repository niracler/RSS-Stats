# RSS-Stats

专为 Cloudflare Worker 设计的 RSS 订阅深度统计工具，现已升级 daisyUI Lofi 极简风格，并采用 D1 数据库进行高性能持久化存储。

## 核心特性
- **Lofi UI**: 基于 daisyUI 的极简黑白风格仪表盘，适配移动端。
- **D1 数据库**: 采用 SQLite (D1) 存储，支持十万级数据秒级查询，彻底解决 KV 列表性能瓶颈。
- **智能去重**:
  - **订阅者去重**: 基于 IP + User-Agent 组合判定唯一性。
  - **趋势去重**: 每日统计基于 Hash 去重，准确反映每日独立访客数。
- **深度统计**:
  - **趋势图表**: 支持 24h/7d/30d/90d/180d/365d 每日订阅趋势可视化。
  - **多维筛选**: 支持按 **客户端** 和 **国家/地区** 进行双重交叉筛选。
  - **Top 榜单**: 自动统计 Top 10 客户端与国家，并支持点击筛选。
- **智能识别**: 内置 50+ 种主流 RSS 阅读器 UA 识别逻辑（如 Feedly, Reeder, NetNewsWire 等）。
- **精准鉴权**:
  - **订阅阈值**: 普通访客需 72 小时内访问 3 次才计为有效订阅。
  - **已知客户端**: 识别为已知 RSS 阅读器的请求直接计为有效订阅（1次即生效）。
- **安全防护**: 支持自定义管理员账号密码，Cookie 持久化登录（1年）。

## 快速开始

### 1. 准备工作
- 一个 Cloudflare 账号。
- 在 Cloudflare 控制台创建好一个 D1 数据库。

### 2. 部署步骤 (网页版)
1. **创建 Worker**: 在 Cloudflare 控制台 "Workers & Pages" 中点击 "Create application" -> "Create Worker"。
2. **粘贴代码**: 将项目中的 `index.js` 内容全部复制并粘贴到 Worker 的编辑器中。
3. **绑定数据库**:
   - 进入 Worker 的 "Settings" -> "Bindings"。
   - 点击 "Add binding" -> "D1 database"。
   - 变量名必须设为 `DB`，数据库选择你刚才创建的 D1 数据库。
4. **配置环境变量**:
   - 在 Worker 的 "Settings" -> "Variables" 中找到 **Environment Variables** 部分（注意：不是 Secrets，Secrets 只能输入一个框且不可见，环境变量有“名称”和“值”两个输入框）。
   - 点击 "Add variable"，分别添加以下项：
     - `RSS_URL`: **(必须)** 原始 RSS 地址。
     - `STATS_PATH`: **(必须)** 统计页路径 (建议 `/stats/`)。
     - `FEED_PATHS`: **(必须)** 订阅入口路径 (建议 `/feed/`)。
     - `COOKIE_NAME`: (可选) 登录 Cookie 名称 (默认 `rss_stats_auth`)。
     - `COOKIE_MAX_AGE`: (可选) 登录有效期秒数 (默认 1年)。
     - `PER_PAGE`: (可选) 列表每页显示条数 (默认 20)。
5. **部署**: 点击 "Save and deploy"。

### 3. 初始化与使用
1. 访问 `https://你的域名/你的STATS_PATH`。
2. 系统会自动检测并提示初始化数据库（点击按钮即可自动建表）。
3. 首次使用会提示创建管理员账号（用户名/密码）。
4. 登录后即可看到仪表盘。

## 常见问题
- **Q: 为什么刚部署完显示 "Database not configured"?**
  - A: 请确保在 Cloudflare Worker 设置中正确绑定了 D1 数据库，且变量名为 `DB`。
- **Q: 24h 趋势图为什么只有一根柱子？**
  - A: 24h 统计展示的是“最近 24 小时内的总去重访客数”，由于底层采用按天存储的历史数据，因此不支持小时级的历史回溯，仅展示当日数据。
- **Q: 如何重置数据库？**
  - A: 目前可以在 Cloudflare D1 控制台手动删除表，或者在 Worker 代码中临时开启 `DROP TABLE` 逻辑（慎用）。

## API 说明
- `/feed/`: RSS 订阅入口，会自动记录统计信息并透传原始 RSS。
- `/stats/`: 统计仪表盘。
- `/stats/?action=chart_data&range=7d`: 获取图表数据的 JSON 接口。

## 技术细节
- **Frontend**: HTML5 + Tailwind CSS (CDN) + daisyUI.
- **Backend**: Cloudflare Workers (Node.js compability).
- **Database**: Cloudflare D1 (SQLite).
- **Timezone**: 强制 Asia/Shanghai (UTC+8).