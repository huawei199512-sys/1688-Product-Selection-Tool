"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFreeLimit = exports.checkAndCount = void 0;
// 免费试用额度：未登录（或未配置自己 key）的访客按 IP 累计，超过上限后提示注册登录并配置 key
const fs = require("fs");
const path = require("path");
const userStore = require("./userStore");
const DEFAULT_LIMIT = 50; // 默认免费次数，可用环境变量 FREE_REQUEST_LIMIT 覆盖
const SAVE_DELAY = 2000; // 落盘节流（毫秒）
let usage = {};
let loaded = false;
let saveTimer = null;
const getFreeLimit = () => {
    const n = parseInt(process.env.FREE_REQUEST_LIMIT || '', 10);
    return Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT;
};
exports.getFreeLimit = getFreeLimit;
const usageFile = () => path.join(userStore.getDataDir(), 'rateLimit.json');
const ensureDir = () => {
    const dir = userStore.getDataDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
const load = () => {
    try {
        ensureDir();
        if (fs.existsSync(usageFile())) {
            const raw = JSON.parse(fs.readFileSync(usageFile(), 'utf-8') || '{}');
            usage = raw && typeof raw === 'object' ? raw : {};
        }
    }
    catch (error) {
        console.error('Rate limit load error:', error);
        usage = {};
    }
    loaded = true;
};
load();
const scheduleSave = () => {
    if (saveTimer) {
        return;
    }
    saveTimer = setTimeout(() => {
        saveTimer = null;
        try {
            ensureDir();
            fs.writeFileSync(usageFile(), JSON.stringify(usage));
        }
        catch (error) {
            console.error('Rate limit save error:', error);
        }
    }, SAVE_DELAY);
    if (saveTimer.unref) {
        saveTimer.unref();
    }
};
// 计数并判断是否放行：已用完则拒绝且不再累加
const checkAndCount = (ip) => {
    if (!loaded) {
        load();
    }
    const limit = getFreeLimit();
    const key = String(ip || 'unknown');
    if (!usage[key]) {
        usage[key] = { count: 0, firstAt: Date.now(), lastAt: 0 };
    }
    const entry = usage[key];
    if (entry.count >= limit) {
        return { allowed: false, used: entry.count, limit, remaining: 0 };
    }
    entry.count += 1;
    entry.lastAt = Date.now();
    scheduleSave();
    return { allowed: true, used: entry.count, limit, remaining: Math.max(0, limit - entry.count) };
};
exports.checkAndCount = checkAndCount;
