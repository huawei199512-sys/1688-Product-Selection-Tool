"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.h51688Router = void 0;
const express_1 = require("express");
const _1688h5Service_1 = require("../services/1688h5Service");
const router = (0, express_1.Router)();
exports.h51688Router = router;
router.get('/proxy/status', (req, res) => {
    try {
        const status = (0, _1688h5Service_1.getProxyStatus)();
        res.json({
            success: true,
            message: '获取代理状态成功',
            data: status,
        });
    }
    catch (error) {
        console.error('Get proxy status error:', error);
        res.status(500).json({
            success: false,
            message: '获取代理状态失败',
        });
    }
});
router.post('/proxy/enable', (req, res) => {
    try {
        const { enabled } = req.body;
        if (typeof enabled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: '请提供enabled参数 (true/false)',
            });
        }
        const status = (0, _1688h5Service_1.setProxyEnabled)(enabled);
        res.json({
            success: true,
            message: enabled ? '代理已启用' : '代理已禁用',
            data: status,
        });
    }
    catch (error) {
        console.error('Set proxy enabled error:', error);
        res.status(500).json({
            success: false,
            message: '设置代理状态失败',
        });
    }
});
router.post('/proxy/refresh', async (req, res) => {
    try {
        const status = await (0, _1688h5Service_1.refreshProxies)();
        res.json({
            success: true,
            message: '代理池刷新成功',
            data: status,
        });
    }
    catch (error) {
        console.error('Refresh proxies error:', error);
        const message = error instanceof Error ? error.message : '刷新代理池失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.get('/detail/:offerId', async (req, res) => {
    try {
        const { offerId } = req.params;
        if (!offerId) {
            return res.status(400).json({
                success: false,
                message: '请提供商品ID (offerId)',
            });
        }
        const detail = await (0, _1688h5Service_1.getProductDetail)(offerId);
        if (!detail) {
            return res.status(404).json({
                success: false,
                message: '未找到商品详情',
            });
        }
        res.json({
            success: true,
            message: '获取商品详情成功',
            data: detail,
        });
    }
    catch (error) {
        console.error('Get detail error:', error);
        const message = error instanceof Error ? error.message : '获取商品详情失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { q, page, pageSize } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键字 (q)',
            });
        }
        const result = await (0, _1688h5Service_1.searchByKeyword)(q, parseInt(page) || 1, parseInt(pageSize) || 40);
        res.json({
            success: true,
            message: '搜索成功',
            data: result,
        });
    }
    catch (error) {
        console.error('Search error:', error);
        const message = error instanceof Error ? error.message : '搜索失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.post('/search', async (req, res) => {
    try {
        const { q, page, pageSize } = req.body;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键字 (q)',
            });
        }
        const result = await (0, _1688h5Service_1.searchByKeyword)(q, parseInt(page) || 1, parseInt(pageSize) || 40);
        res.json({
            success: true,
            message: '搜索成功',
            data: result,
        });
    }
    catch (error) {
        console.error('Search error:', error);
        const message = error instanceof Error ? error.message : '搜索失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
