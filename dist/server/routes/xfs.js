"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.xfsRouter = void 0;
const express_1 = require("express");
const xfsService_1 = require("../services/xfsService");
const router = (0, express_1.Router)();
exports.xfsRouter = router;
router.get('/detail', async (req, res) => {
    try {
        const { num_id } = req.query;
        if (!num_id) {
            return res.status(400).json({
                success: false,
                message: '请提供商品ID',
            });
        }
        const detail = await (0, xfsService_1.getProductDetail)(num_id);
        if (!detail) {
            return res.status(404).json({
                success: false,
                message: '未找到商品详情',
            });
        }
        res.json({
            success: true,
            message: '获取成功',
            data: detail,
        });
    }
    catch (error) {
        console.error('Get xfs product detail error:', error);
        const message = error instanceof Error ? error.message : '获取商品详情失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.get('/search', async (req, res) => {
    try {
        const { q, sort, page } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键字',
            });
        }
        const pageNum = page ? parseInt(page) : 1;
        const sortOption = sort || '';
        const result = await (0, xfsService_1.searchProducts)(q, sortOption, pageNum);
        res.json({
            success: true,
            message: '搜索成功',
            data: result,
        });
    }
    catch (error) {
        console.error('Search xfs products error:', error);
        const message = error instanceof Error ? error.message : '搜索失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
