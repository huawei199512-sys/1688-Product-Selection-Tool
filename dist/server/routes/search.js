"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchRouter = void 0;
const express_1 = require("express");
const matchService_1 = require("../services/matchService");
const apiGuard_1 = require("../services/apiGuard");
const router = (0, express_1.Router)();
exports.searchRouter = router;
router.get('/', async (req, res) => {
    try {
        const { q, cat, start_price, end_price, sort, page, page_size, filter, lang } = req.query;
        if (!q) {
            return res.status(400).json({
                success: false,
                message: '请提供搜索关键字',
            });
        }
        const result = await (0, matchService_1.searchByKeyword)({
            q: q,
            cat: cat,
            start_price: start_price,
            end_price: end_price,
            sort: sort,
            page: page,
            page_size: page_size,
            filter: filter,
            lang: lang,
        });
        res.json({
            success: true,
            message: '搜索成功',
            data: result,
        });
    }
    catch (error) {
        console.error('Search error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            return (0, apiGuard_1.replyPermission)(res, error.detail);
        }
        const message = error instanceof Error ? error.message : '搜索失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
