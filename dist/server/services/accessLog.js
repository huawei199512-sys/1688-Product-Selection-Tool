"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordAccess = exports.clientIp = exports.getAccessByDate = exports.getAccessStats = void 0;
// 访问日志：按天记录「哪个IP访问了什么」，供管理员后台查看
const fs = require("fs");
const path = require("path");
const userStore = require("./userStore");
const MAX_RECORDS = 3000; // 内存中保留的最大记录条数
const SAVE_DELAY = 2000; // 落盘节流（毫秒）
// 不计入日志的请求：静态资源、图片代理（一次搜索会产生几十条图片请求）、上传文件
const SKIP_EXT = /\.(js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|eot|txt)$/i;
const SKIP_PREFIX = ['/api/image', '/uploads'];
// 只保留这些查询参数，避免把 key/secret/token 等敏感信息写进日志
const KEEP_QUERY = new Set(['q', 'keyword', 'page', 'page_size', 'lang', 'num_iid', 'offerid', 'imgid', 'type', 'sort', 'from']);
let records = [];
let saveTimer = null;
let loaded = false;
const logFile = () => path.join(userStore.getDataDir(), 'accessLog.json');
const ensureDir = () => {
    const dir = userStore.getDataDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
const load = () => {
    try {
        ensureDir();
        if (fs.existsSync(logFile())) {
            const raw = JSON.parse(fs.readFileSync(logFile(), 'utf-8') || '[]');
            records = Array.isArray(raw) ? raw : [];
        }
    }
    catch (error) {
        console.error('Access log load error:', error);
        records = [];
    }
    loaded = true;
};
// 启动时载入已有日志
load();
const scheduleSave = () => {
    if (saveTimer) {
        return;
    }
    saveTimer = setTimeout(() => {
        saveTimer = null;
        try {
            ensureDir();
            fs.writeFileSync(logFile(), JSON.stringify(records.slice(-MAX_RECORDS)));
        }
        catch (error) {
            console.error('Access log save error:', error);
        }
    }, SAVE_DELAY);
    if (saveTimer.unref) {
        saveTimer.unref();
    }
};
const pad = (n) => String(n).padStart(2, '0');
const dayKey = (ts) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
// 取真实客户端IP：优先 X-Forwarded-For（Render/Nginx 反向代理），并去掉 IPv6 映射前缀
const clientIp = (req) => {
    const xff = String((req.headers && req.headers['x-forwarded-for']) || '').split(',')[0].trim();
    let ip = xff || req.ip || (req.socket && req.socket.remoteAddress) || '';
    ip = String(ip).replace(/^::ffff:/, '').trim();
    if (ip === '::1') {
        ip = '127.0.0.1';
    }
    return ip || 'unknown';
};
exports.clientIp = clientIp;
const sanitizeQuery = (query) => {
    const parts = [];
    Object.keys(query || {}).forEach((k) => {
        if (!KEEP_QUERY.has(String(k).toLowerCase())) {
            return;
        }
        const value = String(query[k] || '').slice(0, 60);
        if (value) {
            parts.push(`${k}=${value}`);
        }
    });
    return parts.join('&');
};
const classify = (p) => {
    if (p.indexOf('/admin') === 0) {
        return 'admin';
    }
    if (p.indexOf('/api') === 0) {
        return 'api';
    }
    return 'page';
};
// 记录一条访问（在响应结束后调用，此时已能拿到登录账号与状态码）
const recordAccess = (info) => {
    try {
        if (!loaded) {
            load();
        }
        const requestPath = String(info.path || '/');
        if (SKIP_EXT.test(requestPath)) {
            return;
        }
        if (SKIP_PREFIX.some((prefix) => requestPath.indexOf(prefix) === 0)) {
            return;
        }
        const ts = Date.now();
        records.push({
            ts,
            day: dayKey(ts),
            ip: String(info.ip || 'unknown'),
            method: String(info.method || 'GET').toUpperCase(),
            path: requestPath,
            query: sanitizeQuery(info.query),
            type: classify(requestPath),
            status: Number(info.status) || 0,
            user: String(info.user || ''),
            ua: String(info.ua || '').slice(0, 120),
        });
        if (records.length > MAX_RECORDS) {
            records = records.slice(-MAX_RECORDS);
        }
        scheduleSave();
    }
    catch (error) {
        console.error('Record access error:', error);
    }
};
exports.recordAccess = recordAccess;
// 总览：总访问、今日访问、独立IP、按天统计
const getAccessStats = () => {
    const today = dayKey(Date.now());
    const todayList = records.filter((r) => r.day === today);
    const byDay = {};
    records.forEach((r) => {
        byDay[r.day] = (byDay[r.day] || 0) + 1;
    });
    const days = Object.keys(byDay)
        .sort()
        .reverse()
        .map((date) => ({ date, count: byDay[date] }));
    return {
        total: records.length,
        today: todayList.length,
        todayIps: new Set(todayList.map((r) => r.ip)).size,
        uniqueIps: new Set(records.map((r) => r.ip)).size,
        maxRecords: MAX_RECORDS,
        days,
    };
};
exports.getAccessStats = getAccessStats;
// 指定日期（默认今天）的访问详情：按IP聚合 + 明细
const getAccessByDate = (date) => {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(String(date || '')) ? String(date) : dayKey(Date.now());
    const list = records.filter((r) => r.day === day);
    const grouped = new Map();
    list.forEach((r) => {
        if (!grouped.has(r.ip)) {
            grouped.set(r.ip, {
                ip: r.ip,
                count: 0,
                users: [],
                paths: {},
                uas: {},
                pageCount: 0,
                apiCount: 0,
                adminCount: 0,
                firstTs: r.ts,
                lastTs: r.ts,
            });
        }
        const group = grouped.get(r.ip);
        group.count += 1;
        group.firstTs = Math.min(group.firstTs, r.ts);
        group.lastTs = Math.max(group.lastTs, r.ts);
        if (r.user && group.users.indexOf(r.user) === -1) {
            group.users.push(r.user);
        }
        const pathKey = r.path + (r.query ? `?${r.query}` : '');
        group.paths[pathKey] = (group.paths[pathKey] || 0) + 1;
        if (r.type === 'admin') {
            group.adminCount += 1;
        }
        else if (r.type === 'api') {
            group.apiCount += 1;
        }
        else {
            group.pageCount += 1;
        }
        if (r.ua) {
            group.uas[r.ua] = (group.uas[r.ua] || 0) + 1;
        }
    });
    const ips = [...grouped.values()]
        .map((g) => ({
        ip: g.ip,
        count: g.count,
        users: g.users,
        pageCount: g.pageCount,
        apiCount: g.apiCount,
        adminCount: g.adminCount,
        firstAt: g.firstTs,
        lastAt: g.lastTs,
        ua: Object.keys(g.uas).sort((a, b) => g.uas[b] - g.uas[a])[0] || '',
        topPaths: Object.keys(g.paths)
            .sort((a, b) => g.paths[b] - g.paths[a])
            .slice(0, 8)
            .map((p) => ({ path: p, count: g.paths[p] })),
    }))
        .sort((a, b) => b.count - a.count);
    return {
        date: day,
        total: list.length,
        ipCount: ips.length,
        ips,
        entries: list.slice(-200).reverse(),
    };
};
exports.getAccessByDate = getAccessByDate;
