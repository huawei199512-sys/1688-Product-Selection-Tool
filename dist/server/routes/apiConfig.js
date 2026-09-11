"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiConfigRouter = void 0;
const express_1 = require("express");
const userStore_1 = require("../services/userStore");
const router = (0, express_1.Router)();
exports.apiConfigRouter = router;
// 读取「当前登录用户」自己的 key/秘钥
router.get('/', async (req, res) => {
    try {
        const user = req.pmtUser;
        if (!user) {
            return res.json({
                success: true,
                message: '未登录',
                data: { key: '', secret: '', loggedIn: false, username: '' },
            });
        }
        const config = (0, userStore_1.getUserApiConfig)(user.id) || { key: '', secret: '' };
        res.json({
            success: true,
            message: '获取成功',
            data: { key: config.key, secret: config.secret, loggedIn: true, username: user.username },
        });
    }
    catch (error) {
        console.error('Get API config error:', error);
        res.status(500).json({ success: false, message: '获取失败: ' + (error instanceof Error ? error.message : String(error)) });
    }
});
// 保存到「当前登录用户」名下
router.post('/', async (req, res) => {
    try {
        const user = req.pmtUser;
        if (!user) {
            return res.json({ success: false, code: 'NEED_LOGIN', message: '请先登录后再配置key和秘钥' });
        }
        const { key, secret } = req.body || {};
        if (!key || !secret) {
            return res.status(400).json({ success: false, message: '请提供key和secret' });
        }
        const saved = (0, userStore_1.setUserApiConfig)(user.id, { key, secret });
        console.log(`[config] user "${user.username}" saved api key: ${key}`);
        res.json({
            success: true,
            message: '保存成功',
            data: { key: saved.key, secret: saved.secret, loggedIn: true, username: user.username },
        });
    }
    catch (error) {
        console.error('Save API config error:', error);
        res.status(500).json({ success: false, message: '保存失败: ' + (error instanceof Error ? error.message : String(error)) });
    }
});
router.post('/validate', async (req, res) => {
    try {
        const { key, secret } = req.body || {};
        const isValid = !!(key && secret);
        res.json({ success: true, message: isValid ? '配置有效' : '配置无效', data: { isValid } });
    }
    catch (error) {
        console.error('Validate API config error:', error);
        res.status(500).json({ success: false, message: '验证失败' });
    }
});
