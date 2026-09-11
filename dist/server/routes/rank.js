"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rankRouter = void 0;
const express_1 = require("express");
const matchService_1 = require("../services/matchService");
const router = (0, express_1.Router)();
exports.rankRouter = router;
router.get('/', async (req, res) => {
    try {
        const { lang } = req.query;
        const products = await (0, matchService_1.getRankList)('complex', lang);
        res.json({
            success: true,
            message: '获取成功',
            data: products,
        });
    }
    catch (error) {
        console.error('Get rank list error:', error);
        const message = error instanceof Error ? error.message : '获取榜单失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.get('/:rankType', async (req, res) => {
    try {
        const { rankType } = req.params;
        const { lang } = req.query;
        const validTypes = ['complex', 'hot', 'goodPrice'];
        if (!validTypes.includes(rankType)) {
            return res.status(400).json({
                success: false,
                message: '无效的榜单类型，支持：complex(综合榜), hot(热卖榜), goodPrice(好价榜)',
            });
        }
        const products = await (0, matchService_1.getRankList)(rankType, lang);
        res.json({
            success: true,
            message: '获取成功',
            data: products,
        });
    }
    catch (error) {
        console.error('Get rank list error:', error);
        const message = error instanceof Error ? error.message : '获取榜单失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
