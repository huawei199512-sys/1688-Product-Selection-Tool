"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.imageProxyRouter = void 0;
// 图片代理：解决 alicdn/1688 CDN 的 Referer 防盗链（浏览器带本地 Referer 会被 403，并被 ORB 拦截）
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.imageProxyRouter = router;
// 仅允许代理这些图片站，避免被当成任意请求转发器
const ALLOW_SUFFIX = [
    'alicdn.com',
    '1688.com',
    'taobao.com',
    'tmall.com',
    'alibaba.com',
    'mchost.guru',
    'pixabay.com',
    'unsplash.com',
    'weserv.nl',
    'ibb.co',
    'postimg.cc',
    'catbox.moe',
    'uguu.se',
    'transfer.sh',
    'googleusercontent.com',
];
const isPrivateHost = (host) => {
    if (!host) {
        return true;
    }
    if (host === 'localhost' || host.endsWith('.local')) {
        return true;
    }
    const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4) {
        const a = parseInt(ipv4[1], 10);
        const b = parseInt(ipv4[2], 10);
        if (a === 10 || a === 127 || a === 0 || (a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31) || (a === 169 && b === 254)) {
            return true;
        }
    }
    return false;
};
const isAllowed = (hostname) => {
    const host = String(hostname || '').toLowerCase();
    if (isPrivateHost(host)) {
        return false;
    }
    return ALLOW_SUFFIX.some((suffix) => host === suffix || host.endsWith('.' + suffix));
};
router.get('/', async (req, res) => {
    const raw = req.query.url;
    if (!raw) {
        return res.status(400).json({ success: false, message: '请提供 url 参数' });
    }
    let target;
    try {
        target = new URL(String(raw));
    }
    catch (error) {
        return res.status(400).json({ success: false, message: 'url 格式不正确' });
    }
    if (target.protocol !== 'http:' && target.protocol !== 'https:') {
        return res.status(400).json({ success: false, message: '仅支持 http/https' });
    }
    if (!isAllowed(target.hostname)) {
        return res.status(403).json({ success: false, message: '该图片域名不在允许列表内' });
    }
    try {
        const upstream = await fetch(target.toString(), {
            headers: {
                // 关键：带上 1688 的 Referer，绕开防盗链
                'Referer': 'https://www.1688.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
                'Accept-Language': 'zh-CN,zh;q=0.9',
            },
        });
        if (!upstream.ok) {
            console.warn(`[image] 上游返回 ${upstream.status}: ${target.hostname}`);
            return res.status(502).json({ success: false, message: '图片拉取失败(' + upstream.status + ')' });
        }
        const contentType = upstream.headers.get('content-type') || 'image/jpeg';
        if (contentType.indexOf('image/') !== 0) {
            console.warn(`[image] 上游非图片类型 ${contentType}: ${target.hostname}`);
            return res.status(502).json({ success: false, message: '上游返回的不是图片' });
        }
        const buffer = Buffer.from(await upstream.arrayBuffer());
        res.set('Content-Type', contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.set('X-Image-Proxy', 'hit');
        res.send(buffer);
    }
    catch (error) {
        console.error('[image] 代理失败:', error);
        res.status(502).json({ success: false, message: '图片代理失败' });
    }
});
