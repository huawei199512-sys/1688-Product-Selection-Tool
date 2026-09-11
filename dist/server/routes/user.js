"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const userStore_1 = require("../services/userStore");
const mask_1 = require("../services/mask");
const router = (0, express_1.Router)();
exports.userRouter = router;
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入用户名和密码',
            });
        }
        if ((0, userStore_1.findUserByUsername)(username)) {
            return res.status(400).json({
                success: false,
                message: '用户名已存在',
            });
        }
        const user = (0, userStore_1.createUser)(username, password);
        const token = (0, userStore_1.createSession)(user.id);
        res.json({
            success: true,
            message: '注册成功',
            data: {
                id: user.id,
                username: user.username,
                token,
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({
            success: false,
            message: '注册失败: ' + (error instanceof Error ? error.message : String(error)),
        });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: '请输入用户名和密码',
            });
        }
        const user = (0, userStore_1.findUserByUsername)(username);
        if (!user || !(0, userStore_1.verifyUserPassword)(user, password)) {
            return res.status(401).json({
                success: false,
                message: '用户名或密码错误',
            });
        }
        const token = (0, userStore_1.createSession)(user.id);
        res.json({
            success: true,
            message: '登录成功',
            data: {
                id: user.id,
                username: user.username,
                token,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: '登录失败: ' + (error instanceof Error ? error.message : String(error)),
        });
    }
});
router.post('/logout', async (req, res) => {
    try {
        const token = req.body.token || req.get('x-user-token');
        if (!token) {
            return res.status(400).json({
                success: false,
                message: '请提供token',
            });
        }
        (0, userStore_1.removeSession)(token);
        res.json({
            success: true,
            message: '退出成功',
        });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: '退出失败',
        });
    }
});
router.post('/verify', async (req, res) => {
    try {
        const token = req.body.token || req.get('x-user-token');
        if (!token) {
            return res.json({
                success: false,
                message: '未登录',
            });
        }
        const user = (0, userStore_1.findUserByToken)(token);
        if (!user) {
            return res.json({
                success: false,
                message: '登录已过期',
            });
        }
        res.json({
            success: true,
            message: '验证成功',
            data: {
                id: user.id,
                username: user.username,
            },
        });
    }
    catch (error) {
        console.error('Verify error:', error);
        res.json({
            success: false,
            message: '验证失败',
        });
    }
});
// 后端查看：所有注册账号及其 key/秘钥、收货地址等
// 必须携带管理员密钥：?key=xxx 或请求头 x-admin-key（环境变量 ADMIN_KEY，未设置则用 data/admin.key）
router.get('/list', async (req, res) => {
    try {
        const adminKey = (0, userStore_1.getAdminKey)();
        const provided = req.query.key || req.get('x-admin-key') || '';
        if (!adminKey || provided !== adminKey) {
            return res.status(403).json({ success: false, code: 'NEED_ADMIN_KEY', message: '需要正确的管理员密钥才能查看' });
        }
        const users = (0, mask_1.maskUsersForAdmin)((0, userStore_1.listUsers)());
        res.json({
            success: true,
            message: '获取成功',
            data: { total: users.length, users },
        });
    }
    catch (error) {
        console.error('List users error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
// 当前登录用户信息（含是否已配置 key、已存地址）
router.get('/me', async (req, res) => {
    try {
        const user = (0, userStore_1.findUserByToken)(req.get('x-user-token'));
        if (!user) {
            return res.json({ success: false, code: 'NEED_LOGIN', message: '未登录' });
        }
        res.json({
            success: true,
            message: '获取成功',
            data: {
                id: user.id,
                username: user.username,
                hasApiConfig: (0, userStore_1.hasUserApiConfig)(user.id),
                addresses: (0, userStore_1.getUserAddresses)(user.id),
            },
        });
    }
    catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
