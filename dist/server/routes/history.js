"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.historyRouter = void 0;
const express_1 = require("express");
const historyService_1 = require("../services/historyService");
const router = (0, express_1.Router)();
exports.historyRouter = router;
router.get('/', async (req, res) => {
    try {
        const history = await (0, historyService_1.getHistory)();
        res.json({
            success: true,
            data: history,
        });
    }
    catch (error) {
        console.error('Get history error:', error);
        res.status(500).json({
            success: false,
            message: '获取历史记录失败',
        });
    }
});
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await (0, historyService_1.deleteHistoryItem)(id);
        res.json({
            success: true,
            message: '删除成功',
        });
    }
    catch (error) {
        console.error('Delete history error:', error);
        res.status(500).json({
            success: false,
            message: '删除失败',
        });
    }
});
router.delete('/', async (req, res) => {
    try {
        await (0, historyService_1.clearHistory)();
        res.json({
            success: true,
            message: '清空成功',
        });
    }
    catch (error) {
        console.error('Clear history error:', error);
        res.status(500).json({
            success: false,
            message: '清空失败',
        });
    }
});
