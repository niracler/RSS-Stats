/**
 * RSS-Stats
 * 增加了深度统计、筛选、排序、分页以及可视化仪表盘
 */

// 辅助函数：从环境变量获取配置
function getConfig(env) {
  const config = {
    RSS_URL: env.RSS_URL,
    STATS_PATH: env.STATS_PATH,
    FEED_PATHS: env.FEED_PATHS,
    COOKIE_NAME: env.COOKIE_NAME || 'rss_stats_auth',
    COOKIE_MAX_AGE: parseInt(env.COOKIE_MAX_AGE) || 31536000,
    PER_PAGE: parseInt(env.PER_PAGE) || 20
  };

  // 必须配置项校验
  const required = ['RSS_URL', 'STATS_PATH', 'FEED_PATHS'];
  for (const key of required) {
    if (!config[key]) {
      throw new Error(`缺少必须的环境变量配置: ${key}`);
    }
  }

  return config;
}

// 辅助函数：解析 UA 简单识别客户端 (返回对象)
const getClientInfo = (ua) => {
  ua = (ua || '').toLowerCase();
  
  // 常见的 RSS 阅读器和抓取机器人
  if (ua.includes('netnewswire')) return { name: 'NetNewsWire', type: 'app' };
  if (ua.includes('reeder')) return { name: 'Reeder', type: 'app' };
  if (ua.includes('tinytinyrss') || ua.includes('ttrss') || ua.includes('tiny tiny rss')) return { name: 'TT-RSS', type: 'service' };
  if (ua.includes('freshrss')) return { name: 'FreshRSS', type: 'service' };
  if (ua.includes('feedly')) return { name: 'Feedly', type: 'service' };
  if (ua.includes('inoreader')) return { name: 'Inoreader', type: 'service' };
  if (ua.includes('thunderbird')) return { name: 'Thunderbird', type: 'app' };
  if (ua.includes('fluent-reader')) return { name: 'Fluent Reader', type: 'app' };
  if (ua.includes('read-you') || ua.includes('readyou')) return { name: 'Read You', type: 'app' };
  if (ua.includes('feedburner')) return { name: 'FeedBurner', type: 'service' };
  if (ua.includes('glean')) return { name: 'Glean', type: 'bot' };
  if (ua.includes('yarr')) return { name: 'Yarr', type: 'service' };
  if (ua.includes('rsstt')) return { name: 'RSStT (Telegram)', type: 'bot' };
  if (ua.includes('irreader')) return { name: 'irreader', type: 'app' };
  if (ua.includes('spacecowboys')) return { name: 'SpaceCowboys Reader', type: 'app' };
  
  // 极客与终端工具
  if (ua.includes('newsboat')) return { name: 'Newsboat', type: 'cli' };
  if (ua.includes('liferea')) return { name: 'Liferea', type: 'app' };
  if (ua.includes('akregator')) return { name: 'Akregator', type: 'app' };
  if (ua.includes('rssguard')) return { name: 'RSS Guard', type: 'app' };
  
  // 自托管服务
  if (ua.includes('commafeed')) return { name: 'CommaFeed', type: 'service' };
  if (ua.includes('stringer')) return { name: 'Stringer', type: 'service' };
  if (ua.includes('nextcloud-news')) return { name: 'Nextcloud News', type: 'service' };
  if (ua.includes('miniflux')) return { name: 'Miniflux', type: 'service' };
  
  // AI 摘要与稍后读
  if (ua.includes('briefly')) return { name: 'Briefly (AI)', type: 'bot' };
  if (ua.includes('omnivore')) return { name: 'Omnivore', type: 'service' };
  if (ua.includes('matter')) return { name: 'Matter', type: 'service' };
  if (ua.includes('pocket')) return { name: 'Pocket', type: 'service' };
  if (ua.includes('readwise')) return { name: 'Readwise', type: 'service' };
  if (ua.includes('1space')) return { name: '1Space', type: 'service' };
  
  // 自动化与集成
  if (ua.includes('home-assistant')) return { name: 'Home Assistant', type: 'bot' };
  if (ua.includes('zapier')) return { name: 'Zapier', type: 'bot' };
  if (ua.includes('ifttt')) return { name: 'IFTTT', type: 'bot' };
  
  // 社交与机器人
  if (ua.includes('discordbot')) return { name: 'Discord Bot', type: 'bot' };
  if (ua.includes('mastodon')) return { name: 'Mastodon', type: 'bot' };
  if (ua.includes('archive.org_bot')) return { name: 'Archive.org', type: 'bot' };
  if (ua.includes('boyouquanspider')) return { name: 'Boyouquanspider', type: 'bot' };
  
  // 谨慎匹配
  if (/reader\/\d/i.test(ua)) return { name: 'Reader (Marco Arment)', type: 'app' };
  if (ua.includes('palabre')) return { name: 'Palabre', type: 'app' };
  if (ua.includes('greader')) return { name: 'gReader', type: 'app' };
  
  if (ua.includes('unread')) return { name: 'Unread', type: 'app' };
  if (ua.includes('fiery feeds')) return { name: 'Fiery Feeds', type: 'app' };
  if (ua.includes('netvibes')) return { name: 'Netvibes', type: 'service' };
  if (ua.includes('newsexplorer')) return { name: 'NewsExplorer', type: 'app' };
  if (ua.includes('rsshub')) return { name: 'RSSHub', type: 'bot' };
  if (ua.includes('feedme')) return { name: 'FeedMe', type: 'app' };
  if (ua.includes('an otter')) return { name: 'An Otter RSS', type: 'app' };
  if (ua.includes('superfeedr')) return { name: 'Superfeedr', type: 'bot' };
  if (ua.includes('feeder.co')) return { name: 'Feeder', type: 'service' };
  if (ua.includes('flipboard')) return { name: 'Flipboard', type: 'service' };
  if (ua.includes('googlebot') || ua.includes('google-x-publisher')) return { name: 'Google Bot', type: 'bot' };
  if (ua.includes('follow')) return { name: 'Follow', type: 'app' };
  if (ua.includes('theoldreader')) return { name: 'The Old Reader', type: 'service' };
  if (ua.includes('vienna')) return { name: 'Vienna', type: 'app' };
  if (ua.includes('bazqux')) return { name: 'BazQux', type: 'service' };
  if (ua.includes('rssant')) return { name: 'RSSAnt', type: 'service' };
  if (ua.includes('rssbot')) return { name: 'RSSBot', type: 'bot' };
  if (ua.includes('feedbin')) return { name: 'Feedbin', type: 'service' };
  if (ua.includes('newsblur')) return { name: 'NewsBlur', type: 'service' };
  if (ua.includes('egoreader')) return { name: 'Ego Reader', type: 'app' };
  if (ua.includes('feedparser')) return { name: 'FeedParser (Library)', type: 'bot' };
  if (ua.includes('rss-parser')) return { name: 'RSS Parser (Library)', type: 'bot' };
  if (ua.includes('go-http-client') || ua.includes('gofeed')) return { name: 'Go Client/Gofeed', type: 'bot' };
  if (ua.includes('python-requests')) return { name: 'Python Requests', type: 'bot' };
  if (ua.includes('hutool')) return { name: 'Hutool (Library)', type: 'bot' };
  if (ua.includes('hackney')) return { name: 'Hackney (Library)', type: 'bot' };
  if (ua.includes('ruby')) return { name: 'Ruby (Library)', type: 'bot' };
  if (ua.includes('feedburner')) return { name: 'FeedBurner', type: 'service' };
  if (ua.includes('yarr')) return { name: 'Yarr', type: 'service' };
  if (ua.includes('curl')) return { name: 'cURL', type: 'bot' };
  if (ua.includes('wget')) return { name: 'Wget', type: 'bot' };
  if (ua.includes('facebookexternalhit')) return { name: 'Facebook Bot', type: 'bot' };
  if (ua.includes('twitterbot')) return { name: 'Twitter Bot', type: 'bot' };
  if (ua.includes('slackbot')) return { name: 'Slack Bot', type: 'bot' };
  if (ua.includes('telegrambot')) return { name: 'Telegram Bot', type: 'bot' };
  
  if (ua.includes('mozilla') || ua.includes('chrome') || ua.includes('safari')) {
    return { name: 'Browser', type: 'browser' };
  }
  
  return { name: 'Other', type: 'unknown' };
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      const config = getConfig(env);

      if (path === '/') {
        return new Response(`
          <!DOCTYPE html>
          <html data-theme="lofi">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>RSS-STATS</title>
            <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body class="bg-base-200 h-screen flex flex-col items-center justify-center">
            <h1 class="text-6xl md:text-9xl font-black uppercase tracking-tighter select-none">RSS-STATS</h1>
            <footer class="absolute bottom-8 text-sm opacity-30 hover:opacity-100 transition-opacity">
              <a href="https://github.com/SpatioStu/RSS-Stats" target="_blank" class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
                GitHub: SpatioStu/RSS-Stats
              </a>
            </footer>
          </body>
          </html>
        `, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }

      if (path === config.STATS_PATH) {
        return await handleStats(request, env, ctx, config);
      }

      // 精确匹配 feed 路径，避免 / 误触
      if (path === config.FEED_PATHS || path.startsWith('/feed/')) {
        if (request.headers.get('X-RSS-Source')) {
          return await fetch(config.RSS_URL);
        }

        const ip = request.headers.get('cf-connecting-ip') || 'unknown';
        const ua = request.headers.get('user-agent') || 'unknown';
        const country = request.headers.get('cf-ipcountry') || 'unknown';
        const asn = request.headers.get('cf-connecting-asn') || 'unknown';
        const colo = request.cf ? request.cf.colo : 'unknown';
        const protocol = request.cf ? request.cf.httpProtocol : 'unknown';

        if (ctx && typeof ctx.waitUntil === 'function') {
          ctx.waitUntil(logVisit(env, { ip, ua, country, asn, colo, protocol }).catch(e => console.error('Log Error:', e)));
        } else {
          // Fallback if ctx is missing (should not happen in Workers, but for safety)
          await logVisit(env, { ip, ua, country, asn, colo, protocol }).catch(e => console.error('Log Error:', e));
        }

    const resp = await fetch(config.RSS_URL, { headers: { 'X-RSS-Source': 'true' } });
    const xml = await resp.text();
    
    return new Response(xml, {
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
        'X-RSS-Stats': 'Active',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    });
  }

      const response = new Response('Not Found', { status: 404 });
      response.headers.set('X-RSS-Stats-Debug', 'Alive');
      return response;
    } catch (err) {
      return new Response(`Error: ${err.message}`, { status: 500 });
    }
  }
};

async function ensureTables(env) {
  try {
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS visitors (
        ip TEXT,
        ua TEXT,
        firstSeen INTEGER,
        lastSeen INTEGER,
        count INTEGER DEFAULT 1,
        country TEXT,
        asn TEXT,
        colo TEXT,
        protocol TEXT,
        client_name TEXT,
        PRIMARY KEY (ip, ua)
      )
    `).run();

    // 尝试添加 client_name 字段 (如果是旧表)
    try {
      await env.DB.prepare("ALTER TABLE visitors ADD COLUMN client_name TEXT").run();
    } catch (e) {
      // 忽略字段已存在错误
    }
    
    await env.DB.prepare(`
      CREATE INDEX IF NOT EXISTS idx_lastSeen ON visitors(lastSeen)
    `).run();

    // 尝试为旧数据填充 client_name (优先更新可能是误判为 Browser 的记录)
    const recordsToUpdate = await env.DB.prepare(`
      SELECT ip, ua, client_name FROM visitors 
      WHERE client_name IS NULL 
      OR client_name = 'Browser' 
      OR client_name = 'Other'
      LIMIT 500
    `).all();
    if (recordsToUpdate.results && recordsToUpdate.results.length > 0) {
      for (const row of recordsToUpdate.results) {
        const info = getClientInfo(row.ua);
        if (info.name !== row.client_name) {
          await env.DB.prepare("UPDATE visitors SET client_name = ? WHERE ip = ? AND ua = ?")
            .bind(info.name, row.ip, row.ua).run();
        }
      }
    }
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `).run();
    
    await env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS analytics (
        date TEXT,
        hash TEXT,
        PRIMARY KEY (date, hash)
      )
    `).run();
  } catch (e) {
    console.error('Table Init Error:', e);
  }
}

async function logVisit(env, meta) {
  if (!env.DB) return;

  const now = Date.now();
  const safeUA = meta.ua.slice(0, 500);
  const clientInfo = getClientInfo(safeUA);
  const clientName = clientInfo.name;

  try {
    // 1. 查找是否存在该记录
    const existing = await env.DB.prepare(
      "SELECT count, firstSeen, lastSeen FROM visitors WHERE ip = ? AND ua = ?"
    ).bind(meta.ip, safeUA).first();

    const isKnownClient = clientInfo.name !== 'Other' && clientInfo.name !== 'Browser';
    // 如果是已知 RSS 客户端，直接视为有效订阅者（count >= 3）
    // 或者保持原有逻辑但加速升级
    
    if (existing) {
      const timeSinceFirst = now - existing.firstSeen;
      const timeSinceLast = now - existing.lastSeen;
      
      // 判定逻辑优化：
      // 1. 如果是已知客户端，直接升级为真订阅者 (count = 3)
      // 2. 否则走原有 3 次逻辑
      
      if (existing.count < 3) {
        if (isKnownClient) {
           // 已知客户端，直接升级
           await env.DB.prepare(
            "UPDATE visitors SET count = 3, lastSeen = ?, country = ?, asn = ?, colo = ?, protocol = ?, client_name = ? WHERE ip = ? AND ua = ?"
          ).bind(now, meta.country, meta.asn, meta.colo, meta.protocol, clientName, meta.ip, safeUA).run();
        } else if (timeSinceFirst <= 259200000) { // 72小时
          await env.DB.prepare(
            "UPDATE visitors SET count = count + 1, lastSeen = ?, country = ?, asn = ?, colo = ?, protocol = ?, client_name = ? WHERE ip = ? AND ua = ?"
          ).bind(now, meta.country, meta.asn, meta.colo, meta.protocol, clientName, meta.ip, safeUA).run();
        } else {
          // 超过72小时还没满3次，重置为1，重新计时
          await env.DB.prepare(
            "UPDATE visitors SET count = 1, firstSeen = ?, lastSeen = ?, country = ?, asn = ?, colo = ?, protocol = ?, client_name = ? WHERE ip = ? AND ua = ?"
          ).bind(now, now, meta.country, meta.asn, meta.colo, meta.protocol, clientName, meta.ip, safeUA).run();
        }
      } else {
        // 已经是真正的订阅者了
        if (timeSinceLast > 10800000) { // 3小时冷却
          await env.DB.prepare(
            "UPDATE visitors SET count = count + 1, lastSeen = ?, country = ?, asn = ?, colo = ?, protocol = ?, client_name = ? WHERE ip = ? AND ua = ?"
          ).bind(now, meta.country, meta.asn, meta.colo, meta.protocol, clientName, meta.ip, safeUA).run();
        }
      }
    } else {
      // 首次访问
      const initialCount = isKnownClient ? 3 : 1;
      await env.DB.prepare(
        "INSERT INTO visitors (ip, ua, firstSeen, lastSeen, count, country, asn, colo, protocol, client_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      ).bind(meta.ip, safeUA, now, now, initialCount, meta.country, meta.asn, meta.colo, meta.protocol, clientName).run();
    }

    // 4. 每日去重统计 (仅针对有效订阅者)
    // 如果是已知客户端，或者 count 已经 >= 3 (或刚达到 3)，则计入趋势
    const isSubscriber = isKnownClient || (existing ? (existing.count >= 3 || (existing.count >= 2 && timeSinceFirst <= 259200000)) : false);
    
    if (isSubscriber) {
      const today = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Shanghai'});
      const visitHash = meta.ip + '|' + safeUA;
      await env.DB.prepare(
        "INSERT OR IGNORE INTO analytics (date, hash) VALUES (?, ?)"
      ).bind(today, visitHash).run().catch(() => {});
    }
  } catch (e) {
    console.error('D1 Log Error:', e);
  }
}

async function handleStats(request, env, ctx, config) {
  const url = new URL(request.url);

  // --- 处理退出登录 ---
  if (url.searchParams.has('logout')) {
    return new Response('Redirecting...', {
      status: 302,
      headers: {
        'Location': config.STATS_PATH,
        'Set-Cookie': `${config.COOKIE_NAME}=; Path=/; HttpOnly; Max-Age=0; SameSite=Lax`
      }
    });
  }
  
  // 确保数据库表结构完整
  if (env.DB) {
    ctx.waitUntil(ensureTables(env));
  }

  // --- 处理数据库初始化请求 ---
  if (url.searchParams.has('init') && request.method === 'POST') {
    if (!env.DB) {
      return new Response('错误：未检测到数据库绑定。请检查 Cloudflare 设置中是否添加了名为 DB 的 D1 绑定。', { status: 500 });
    }
    try {
      // 分开执行 SQL，避免 exec 可能带来的 duration 错误
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS visitors (
          ip TEXT,
          ua TEXT,
          firstSeen INTEGER,
          lastSeen INTEGER,
          count INTEGER DEFAULT 1,
          country TEXT,
          asn TEXT,
          colo TEXT,
          protocol TEXT,
          PRIMARY KEY (ip, ua)
        )
      `).run();
      
      await env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_lastSeen ON visitors(lastSeen)
      `).run();
      
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS config (
          key TEXT PRIMARY KEY,
          value TEXT
        )
      `).run();
      
      await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS analytics (
          date TEXT,
          hash TEXT,
          PRIMARY KEY (date, hash)
        )
      `).run();

      return new Response('初始化成功！正在跳转...', {
        status: 302,
        headers: { 'Location': config.STATS_PATH }
      });
    } catch (e) {
      return new Response('初始化失败: ' + e.message + '\n\n提示：请确保你已经创建了 D1 数据库并绑定到了名为 DB 的变量上。', { status: 500 });
    }
  }

  // --- 处理初始设置 (用户名/密码) ---
  if (url.searchParams.has('setup') && request.method === 'POST') {
    const formData = await request.formData();
    const user = formData.get('username');
    const pass = formData.get('password');
    if (user && pass) {
      await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('username', ?), ('password', ?)")
        .bind(user, pass).run();
      return new Response('设置成功！请登录', {
        status: 302,
        headers: { 'Location': config.STATS_PATH }
      });
    }
  }

  // --- 处理修改设置 ---
  if (url.searchParams.has('update_auth') && request.method === 'POST') {
    const formData = await request.formData();
    const user = formData.get('username');
    const pass = formData.get('password');
    // 验证当前会话 (这里简化处理，如果能到这里说明已经登录)
    if (user && pass) {
      await env.DB.prepare("INSERT OR REPLACE INTO config (key, value) VALUES ('username', ?), ('password', ?)")
        .bind(user, pass).run();
      return new Response('修改成功', {
        status: 302,
        headers: { 'Location': config.STATS_PATH }
      });
    }
  }

  // 获取数据库中的账号密码
  let dbUser, dbPass;
  try {
    const authData = await env.DB.prepare("SELECT key, value FROM config WHERE key IN ('username', 'password')").all();
    const authMap = Object.fromEntries(authData.results.map(r => [r.key, r.value]));
    dbUser = authMap.username;
    dbPass = authMap.password;
  } catch (e) {
    if (e.message.includes('no such table')) {
      return new Response(getInitPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
  }

  // 如果表存在但没设置账号密码，显示设置页面
  if (!dbUser || !dbPass) {
    return new Response(getSetupPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
  }

  const cookie = request.headers.get('Cookie') || '';
  const expectedCookie = `${config.COOKIE_NAME}=${btoa(dbUser + ':' + dbPass)}`;
  const isAuthed = cookie.includes(expectedCookie);

  if (request.method === 'POST' && !url.searchParams.has('setup') && !url.searchParams.has('update_auth')) {
    const formData = await request.formData();
    if (formData.get('username') === dbUser && formData.get('password') === dbPass) {
      const authVal = btoa(dbUser + ':' + dbPass);
      return new Response('Success', {
        status: 302,
        headers: {
          'Location': config.STATS_PATH,
          'Set-Cookie': `${config.COOKIE_NAME}=${authVal}; Path=/; HttpOnly; Max-Age=${config.COOKIE_MAX_AGE}; SameSite=Lax`
        }
      });
    }
    return new Response('账号或密码错误', { status: 403 });
  }

  if (!isAuthed) return new Response(getLoginPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });


  // --- 处理图表数据 API ---
  // --- 尝试获取数据，如果报错（表不存在），则显示初始化页面 ---
  try {
    const range = url.searchParams.get('range') || 'all';
    const sort = url.searchParams.get('sort') || 'lastSeen';
    const order = url.searchParams.get('order') || 'desc';
    const page = parseInt(url.searchParams.get('page') || '1');
    const now = Date.now();

    // 默认只显示“真订阅者” (请求次数 >= 3)
    let whereClause = "WHERE count >= 3";
    const params = [];
    
    // 筛选参数
    const filterClient = url.searchParams.get('client');
    const filterCountry = url.searchParams.get('country');
    
    if (filterClient) {
      whereClause += " AND client_name = ?";
      params.push(filterClient);
    }
    
    if (filterCountry) {
      whereClause += " AND country = ?";
      params.push(filterCountry);
    }

    if (range === '24h') whereClause += " AND lastSeen > " + (now - 86400000);
    else if (range === '7d') whereClause += " AND lastSeen > " + (now - 86400000 * 7);
    else if (range === '30d') whereClause += " AND lastSeen > " + (now - 86400000 * 30);

    // 1. 获取全局总数 (用于统计概览)
    const globalTotalResult = await env.DB.prepare("SELECT count(*) as total FROM visitors WHERE count >= 3").first();
    const globalTotal = globalTotalResult ? globalTotalResult.total : 0;

    // 2. 获取当前时间范围内的总数 (作为 Top 列表的基准值)
    let rangeWhere = "WHERE count >= 3";
    if (range === '24h') rangeWhere += " AND lastSeen > " + (now - 86400000);
    else if (range === '7d') rangeWhere += " AND lastSeen > " + (now - 86400000 * 7);
    else if (range === '30d') rangeWhere += " AND lastSeen > " + (now - 86400000 * 30);
    
    const rangeTotalResult = await env.DB.prepare(`SELECT count(*) as total FROM visitors ${rangeWhere}`).first();
    const rangeTotal = rangeTotalResult ? rangeTotalResult.total : 0;

    // 3. 获取筛选后的总数
    const totalResult = await env.DB.prepare(`SELECT count(*) as total FROM visitors ${whereClause}`).bind(...params).first();
    const total = totalResult.total;
    const totalPages = Math.ceil(total / config.PER_PAGE);
    
    // 4. 获取分页数据
    const offset = (page - 1) * config.PER_PAGE;
    const visitors = await env.DB.prepare(
      `SELECT * FROM visitors ${whereClause} ORDER BY ${sort} ${order.toUpperCase()} LIMIT ? OFFSET ?`
    ).bind(...params, config.PER_PAGE, offset).all();

    // 5. 统计 Top 列表 (应受 range 影响，但不受 client/country 筛选影响，以便对比)
    
    // Top Countries
    const topCountriesResult = await env.DB.prepare(
      `SELECT country, count(*) as count FROM visitors ${rangeWhere} AND country != 'unknown' AND country != 'XX' GROUP BY country ORDER BY count DESC LIMIT 10`
    ).all();
    const topCountries = topCountriesResult.results.map(r => [r.country, r.count]);

    // Top Clients
    const allUAResult = await env.DB.prepare(`SELECT ua, client_name FROM visitors ${rangeWhere}`).all();
    const clientStats = {};
    allUAResult.results.forEach(r => {
      const name = r.client_name || getClientInfo(r.ua).name;
      clientStats[name] = (clientStats[name] || 0) + 1;
    });
    let topClients = Object.entries(clientStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    // 如果 Other 没在 Top 10，但有数据，则添加它（或者如果当前筛选了它）
    if (clientStats['Other'] && !topClients.find(c => c[0] === 'Other')) {
       topClients.push(['Other', clientStats['Other']]);
    }
    // 如果当前筛选了某个客户端，且不在列表里，也加上
    if (filterClient && filterClient !== 'Other' && !topClients.find(c => c[0] === filterClient)) {
       topClients.push([filterClient, clientStats[filterClient] || 0]);
    }

    // 统计活跃人数 (Global)
    const active24hResult = await env.DB.prepare("SELECT count(*) as count FROM visitors WHERE count >= 3 AND lastSeen > ?").bind(now - 86400000).first();
    const active7dResult = await env.DB.prepare("SELECT count(*) as count FROM visitors WHERE count >= 3 AND lastSeen > ?").bind(now - 86400000 * 7).first();
    
    // 7天趋势数据 (小的趋势图)
    const trendStartDate = new Date(now - 6 * 86400000).toLocaleDateString('en-CA', {timeZone: 'Asia/Shanghai'});
    const trendData = await env.DB.prepare(
      "SELECT a.date, count(*) as count FROM analytics a JOIN visitors v ON a.hash = (v.ip || '|' || v.ua) WHERE a.date >= ? AND v.count >= 3 GROUP BY a.date ORDER BY a.date ASC"
    ).bind(trendStartDate).all();
    const trendMap = new Map();
    trendData.results.forEach(r => trendMap.set(r.date, r.count));
    const trendBars = [];
    const trendMax = Math.max(...trendData.results.map(r => r.count), 1);
    
    for (let i = 0; i < 7; i++) {
       const d = new Date(now - (6 - i) * 86400000);
       const dateStr = d.toLocaleDateString('en-CA', {timeZone: 'Asia/Shanghai'});
       const count = trendMap.get(dateStr) || 0;
       trendBars.push({ count, h: (count / trendMax) * 100 });
    }

    // 渲染页面
    return new Response(getStatsPage({
      visitors: visitors.results,
      total,
      globalTotal,
      active24h: active24hResult.count,
      active7d: active7dResult.count,
      trendBars,
      allVisitorsCount: rangeTotal,
      topCountries,
      topClients,
      range,
      sort,
      order,
      page,
      totalPages,
      filterClient,
      filterCountry
    }), {
      headers: { 'Content-Type': 'text/html; charset=utf-8' } 
    });
  } catch (e) {
    // 如果错误信息包含 "no such table"，说明数据库还没准备好
    if (e.message.includes('no such table')) {
      return new Response(getInitPage(), { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
    }
    return new Response('数据库查询出错: ' + e.message, { status: 500 });
  }
}

function getLoginPage() {
  return `
<!DOCTYPE html>
<html data-theme="lofi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录 - RSS Stats</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200 min-h-screen flex items-center justify-center">
  <div class="card w-96 bg-base-100 shadow-xl border border-base-300">
    <div class="card-body">
      <h2 class="card-title justify-center text-2xl font-black uppercase tracking-tighter mb-4">RSS STATS LOGIN</h2>
      <form method="POST" class="space-y-4">
        <div class="form-control">
          <label class="label"><span class="label-text font-bold">用户名</span></label>
          <input type="text" name="username" placeholder="Username" class="input input-bordered w-full" required autofocus>
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text font-bold">密码</span></label>
          <input type="password" name="password" placeholder="Password" class="input input-bordered w-full" required>
        </div>
        <button type="submit" class="btn btn-primary w-full uppercase font-bold">登录</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

function getSetupPage() {
  return `
<!DOCTYPE html>
<html data-theme="lofi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>设置账号 - RSS Stats</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-base-200 min-h-screen flex items-center justify-center">
  <div class="card w-96 bg-base-100 shadow-xl border border-primary">
    <div class="card-body">
      <h2 class="card-title justify-center text-2xl font-black uppercase tracking-tighter mb-2 text-primary">创建管理员账号</h2>
      <p class="text-xs text-center opacity-60 mb-4">这是第一次设置，请牢记你的账号密码</p>
      <form action="?setup=1" method="POST" class="space-y-4">
        <div class="form-control">
          <label class="label"><span class="label-text font-bold">管理员用户名</span></label>
          <input type="text" name="username" placeholder="例如: admin" class="input input-bordered w-full" required autofocus>
        </div>
        <div class="form-control">
          <label class="label"><span class="label-text font-bold">设置登录密码</span></label>
          <input type="password" name="password" placeholder="建议包含字母和数字" class="input input-bordered w-full" required>
        </div>
        <button type="submit" class="btn btn-primary w-full uppercase font-bold">保存并进入后台</button>
      </form>
    </div>
  </div>
</body>
</html>`;
}

// 新增：初始化引导页面
function getInitPage() {
  return `
    <!DOCTYPE html>
    <html lang="zh-CN" data-theme="lofi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>数据库初始化 - RSS Stats</title>
      <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="min-h-screen flex items-center justify-center bg-base-200">
      <div class="card w-96 bg-base-100 shadow-xl">
        <div class="card-body items-center text-center">
          <h2 class="card-title text-2xl font-bold mb-4">欢迎使用 RSS Stats</h2>
          <p class="text-sm opacity-70 mb-6">检测到数据库表尚未创建，请点击下方按钮完成自动初始化。</p>
          <div class="card-actions">
            <form action="?init=1" method="POST">
              <button type="submit" class="btn btn-primary px-8">立即初始化数据库</button>
            </form>
          </div>
          <div class="mt-4 text-[10px] opacity-30">
            这将在 D1 数据库中创建 visitors 表并建立索引
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

function getStatsPage({ visitors, total, globalTotal, active24h, active7d, trendBars, allVisitorsCount, topCountries, topClients, range, sort, order, page, totalPages, filterClient, filterCountry }) {
  // 生成查询字符串的辅助函数
  const makeQuery = (params) => {
    const p = new URLSearchParams();
    if (range) p.set('range', range);
    if (sort) p.set('sort', sort);
    if (order) p.set('order', order);
    if (page > 1) p.set('page', page);
    if (filterClient) p.set('client', filterClient);
    if (filterCountry) p.set('country', filterCountry);
    
    // 合并新参数
    for (const [k, v] of Object.entries(params)) {
      if (v === null) {
        p.delete(k);
      } else {
        p.set(k, v);
      }
      
      // 核心修复：如果设置了筛选/排序/范围，但没有明确指定 page，则重置 page 为 1
      if (['client', 'country', 'range', 'sort', 'order'].includes(k) && !params.hasOwnProperty('page')) {
        p.delete('page');
      }
    }
    return '?' + p.toString();
  };

  return `
<!DOCTYPE html>
<html data-theme="lofi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>RSS 仪表盘</title>
  <link href="https://cdn.jsdelivr.net/npm/daisyui@4.4.19/dist/full.css" rel="stylesheet" type="text/css" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    .sort-link { text-decoration: none; color: inherit; display: flex; align-items: center; gap: 4px; }
    .sort-active { color: var(--p); font-weight: bold; }
  </style>
</head>
<body class="bg-base-200 min-h-screen p-4 md:p-8">
  <div class="max-w-7xl mx-auto">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      <div>
        <h1 class="text-4xl font-black uppercase tracking-tighter">RSS STATS</h1>
        <p class="text-sm opacity-50">实时订阅深度统计</p>
      </div>
      <div class="flex gap-2">
        <div class="join">
          <a href="${makeQuery({range: '24h'})}" class="join-item btn btn-sm ${range === '24h' ? 'btn-active' : ''}">24h</a>
          <a href="${makeQuery({range: '7d'})}" class="join-item btn btn-sm ${range === '7d' ? 'btn-active' : ''}">7d</a>
          <a href="${makeQuery({range: '30d'})}" class="join-item btn btn-sm ${range === '30d' ? 'btn-active' : ''}">30d</a>
        </div>
        <button onclick="auth_modal.showModal()" class="btn btn-sm btn-outline">安全设置</button>
        <a href="?logout=1" class="btn btn-sm btn-ghost text-error">退出</a>
      </div>
    </div>
    
    <!-- 筛选状态 -->
    ${(filterClient || filterCountry) ? `
      <div class="mb-4 flex items-center gap-2">
        <span class="text-sm font-bold opacity-50">当前筛选:</span>
        ${filterClient ? `<div class="badge badge-primary gap-2">${filterClient} <a href="${makeQuery({client: null})}" class="opacity-50 hover:opacity-100">×</a></div>` : ''}
        ${filterCountry ? `<div class="badge badge-secondary gap-2">${filterCountry} <a href="${makeQuery({country: null})}" class="opacity-50 hover:opacity-100">×</a></div>` : ''}
        <a href="?range=${range}" class="btn btn-xs btn-ghost text-xs">清除全部</a>
      </div>
    ` : ''}
    
    <!-- 密码修改 Modal -->
    <dialog id="auth_modal" class="modal">
      <div class="modal-box max-w-sm">
        <h3 class="font-bold text-lg mb-4">修改管理员账号</h3>
        <form action="?update_auth=1" method="POST" class="space-y-4">
          <div class="form-control">
            <label class="label"><span class="label-text">新用户名</span></label>
            <input type="text" name="username" placeholder="Username" class="input input-bordered" required>
          </div>
          <div class="form-control">
            <label class="label"><span class="label-text">新密码</span></label>
            <input type="password" name="password" placeholder="Password" class="input input-bordered" required>
          </div>
          <div class="modal-action">
            <button type="submit" class="btn btn-primary">确认修改</button>
            <button type="button" onclick="auth_modal.close()" class="btn">取消</button>
          </div>
        </form>
      </div>
    </dialog>
    
    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div class="stats shadow bg-base-100 border-2 border-primary">
        <div class="stat">
          <div class="stat-title text-xs uppercase font-bold">有效订阅人数</div>
          <div class="stat-value text-primary text-3xl">${total}</div>
          <div class="stat-desc">72h内请求满3次 (或已知客户端)</div>
        </div>
      </div>
      <div class="stats shadow bg-base-100">
        <div class="stat">
          <div class="stat-title text-xs uppercase font-bold">24h 活跃订阅者</div>
          <div class="stat-value text-secondary text-3xl">${active24h}</div>
          <div class="stat-desc">已确认身份的活跃用户</div>
        </div>
      </div>
      <div class="stats shadow bg-base-100">
        <div class="stat p-2 flex flex-col justify-center items-center">
          <div class="stat-title text-xs uppercase font-bold mb-1 w-full text-left px-4">最近 7 天活跃趋势</div>
          <div class="flex items-end gap-1 h-[60px] w-full px-4">
             ${trendBars ? trendBars.map(bar => `
               <div class="bg-primary flex-1 rounded-t-sm relative group" style="height: ${Math.max(bar.h, 5)}%; opacity: ${0.3 + bar.h/200}">
                 <div class="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-black text-white text-[10px] rounded whitespace-nowrap z-10">
                   ${bar.count}
                 </div>
               </div>
             `).join('') : '<div class="text-xs opacity-50 w-full text-center">暂无数据</div>'}
          </div>
        </div>
      </div>
      <div class="stats shadow bg-base-100">
        <div class="stat">
          <div class="stat-title text-xs uppercase font-bold">最近 7d</div>
          <div class="stat-value text-3xl">${active7d}</div>
          <div class="stat-desc">活跃留存率 ${((active7d/Math.max(globalTotal,1))*100).toFixed(1)}%</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
      <!-- Left Sidebar: Top Lists -->
      <div class="space-y-6">
        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <h3 class="font-bold text-sm uppercase mb-4">Top 国家/地区</h3>
            <div class="space-y-3">
              ${topCountries.map(([code, count]) => `
                <a href="${makeQuery({country: code})}" class="flex justify-between items-center hover:bg-base-200 p-1 rounded transition cursor-pointer">
                  <span class="text-sm flex items-center gap-2">
                    <span class="badge badge-sm badge-outline">${code}</span>
                  </span>
                  <div class="flex items-center gap-2">
                    <progress class="progress progress-secondary w-16" value="${count}" max="${allVisitorsCount || 1}"></progress>
                    <span class="font-mono text-xs">${count}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card bg-base-100 shadow-sm border border-base-300">
          <div class="card-body p-4">
            <h3 class="font-bold text-sm uppercase mb-4">Top 客户端</h3>
            <div class="space-y-3">
              ${topClients.map(([name, count]) => `
                <a href="${makeQuery({client: name})}" class="flex justify-between items-center hover:bg-base-200 p-1 rounded transition cursor-pointer">
                  <span class="text-sm">${name}</span>
                  <div class="flex items-center gap-2">
                    <progress class="progress progress-primary w-16" value="${count}" max="${allVisitorsCount || 1}"></progress>
                    <span class="font-mono text-xs">${count}</span>
                  </div>
                </a>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Main Table -->
      <div class="lg:col-span-3">
        <div class="card bg-base-100 shadow-xl overflow-hidden border border-base-300">
          <div class="overflow-x-auto">
            <table class="table table-sm md:table-md table-zebra w-full">
              <thead>
                <tr class="bg-base-200">
                  <th>IP 地址 / 位置</th>
                  <th>
                    <a href="${makeQuery({sort: 'lastSeen', order: sort === 'lastSeen' && order === 'desc' ? 'asc' : 'desc'})}" class="sort-link ${sort === 'lastSeen' ? 'sort-active' : ''}">
                      最后活动 ${sort === 'lastSeen' ? (order === 'desc' ? '↓' : '↑') : ''}
                    </a>
                  </th>
                  <th>
                    <a href="${makeQuery({sort: 'firstSeen', order: sort === 'firstSeen' && order === 'desc' ? 'asc' : 'desc'})}" class="sort-link ${sort === 'firstSeen' ? 'sort-active' : ''}">
                      首次活动 ${sort === 'firstSeen' ? (order === 'desc' ? '↓' : '↑') : ''}
                    </a>
                  </th>
                  <th>客户端/协议</th>
                </tr>
              </thead>
              <tbody>
                ${visitors.length === 0 ? '<tr><td colspan="4" class="text-center py-8 opacity-50">暂无符合条件的数据</td></tr>' : visitors.map(v => `
                  <tr>
                    <td>
                      <div class="font-mono font-bold">${v.ip}</div>
                      <div class="text-[10px] opacity-40">
                        ${v.country && v.country !== 'XX' && v.country !== 'unknown' ? `<span class="badge badge-xs badge-outline mr-1">${v.country}</span>` : ''}
                        ${v.asn && v.asn !== 'unknown' ? v.asn : ''} 
                        ${v.colo && v.colo !== 'unknown' ? (v.asn && v.asn !== 'unknown' ? '/ ' : '') + v.colo : ''}
                      </div>
                    </td>
                    <td class="text-xs whitespace-nowrap">
                      ${new Date(v.lastSeen).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td class="text-xs whitespace-nowrap opacity-60">
                      ${new Date(v.firstSeen).toLocaleString('zh-CN', {timeZone: 'Asia/Shanghai', month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit'})}
                    </td>
                    <td class="max-w-xs">
                      <div class="flex items-center gap-1 mb-1">
                        <span class="badge badge-primary badge-sm">${v.client_name || getClientInfo(v.ua).name}</span>
                        <span class="text-[10px] opacity-40 uppercase">${v.protocol || ''}</span>
                      </div>
                      <div class="text-[10px] opacity-40 truncate" title="${v.ua}">${v.ua}</div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Pagination -->
          ${totalPages > 1 ? `
            <div class="p-4 flex justify-center bg-base-200 border-t border-base-300">
              <div class="join">
                ${(() => {
                  const current = page;
                  const total = totalPages;
                  if (total <= 10) {
                    return [...Array(total)].map((_, i) => i + 1).map(p => 
                      `<a href="${makeQuery({page: p})}" class="join-item btn btn-sm ${current === p ? 'btn-active' : ''}">${p}</a>`
                    ).join('');
                  }

                  let pages = new Set();
                  // 始终显示第一页
                  pages.add(1);
                  
                  // 当前页附近的窗口 (至少5页)
                  let start = Math.max(1, current - 2);
                  let end = Math.min(total, current + 2);
                  if (current <= 3) end = Math.min(total, 5);
                  if (current >= total - 2) start = Math.max(1, total - 4);
                  
                  for (let i = start; i <= end; i++) pages.add(i);
                  
                  // 最后5页
                  for (let i = Math.max(1, total - 4); i <= total; i++) pages.add(i);

                  const sortedPages = Array.from(pages).sort((a, b) => a - b);
                  const result = [];
                  let prev = 0;
                  
                  for (const p of sortedPages) {
                    if (prev > 0) {
                      if (p - prev === 2) result.push(prev + 1);
                      else if (p - prev > 2) result.push('...');
                    }
                    result.push(p);
                    prev = p;
                  }

                  return result.map(p => {
                    if (p === '...') {
                      return `<span class="join-item btn btn-sm btn-disabled opacity-50">...</span>`;
                    }
                    return `<a href="${makeQuery({page: p})}" class="join-item btn btn-sm ${current === p ? 'btn-active' : ''}">${p}</a>`;
                  }).join('');
                })()}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>

    <!-- Footer -->
    <footer class="mt-12 pb-8 text-center text-xs opacity-30 hover:opacity-100 transition-opacity">
      <a href="https://github.com/SpatioStu/RSS-Stats" target="_blank" class="inline-flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>
        GitHub: SpatioStu/RSS-Stats
      </a>
    </footer>
  </div>
</body>
</html>`;
}


