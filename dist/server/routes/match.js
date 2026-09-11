"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchRouter = void 0;
const express_1 = require("express");
const matchService_1 = require("../services/matchService");
const apiConfigService_1 = require("../services/apiConfigService");
const apiGuard_1 = require("../services/apiGuard");
const router = (0, express_1.Router)();
exports.matchRouter = router;
router.post('/', async (req, res) => {
    try {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const imageUrl = body.imageUrl || '';
        const imgid = body.imgid || '';
        console.log('match route received:', imgid ? `imgid=${imgid}` : (imageUrl.startsWith('data:') ? 'base64 image' : String(imageUrl).substring(0, 60)));
        if (!imageUrl && !imgid) {
            return res.status(400).json({
                success: false,
                message: '请上传图片或提供图片ID',
            });
        }
        const { lang } = body;
        // 有图片ID时直接图搜（最快）；否则先 upload_img 拿ID再搜索
        const products = await (0, matchService_1.matchProducts)(imageUrl, lang, imgid);
        res.json({
            success: true,
            message: '匹配成功',
            data: products,
        });
    }
    catch (error) {
        console.error('Match error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            return (0, apiGuard_1.replyPermission)(res, error.detail);
        }
        const message = error instanceof Error ? error.message : '匹配失败，请稍后重试';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
router.get('/detail/:num_iid', async (req, res) => {
    try {
        const { num_iid } = req.params;
        const { lang } = req.query;
        const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
        if (!num_iid) {
            return res.status(400).json({
                success: false,
                message: '请提供商品ID',
            });
        }
        const detail = await (0, matchService_1.getProductDetail)(num_iid, API_KEY, API_SECRET, lang);
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
        console.error('Get detail error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            return (0, apiGuard_1.replyPermission)(res, error.detail);
        }
        const message = error instanceof Error ? error.message : '获取商品详情失败';
        res.status(500).json({
            success: false,
            message,
        });
    }
});
