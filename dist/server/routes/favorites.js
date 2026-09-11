"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.favoritesRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
exports.favoritesRouter = router;
const isPkg = !!process.pkg;
let favorites = [];
let saveFavorites = () => { };
if (!isPkg) {
    const FAVORITES_FILE = path_1.default.join(__dirname, '../data/favorites.json');
    const ensureFileExists = () => {
        const dir = path_1.default.dirname(FAVORITES_FILE);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(FAVORITES_FILE)) {
            fs_1.default.writeFileSync(FAVORITES_FILE, JSON.stringify([]));
        }
    };
    ensureFileExists();
    const data = fs_1.default.readFileSync(FAVORITES_FILE, 'utf-8');
    favorites = JSON.parse(data);
    saveFavorites = () => {
        const FAVORITES_FILE = path_1.default.join(__dirname, '../data/favorites.json');
        fs_1.default.writeFileSync(FAVORITES_FILE, JSON.stringify(favorites, null, 2));
    };
}
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userFavorites = favorites.filter((f) => f.userId === userId);
        userFavorites.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({
            success: true,
            message: '获取成功',
            data: userFavorites,
        });
    }
    catch (error) {
        console.error('Get favorites error:', error);
        res.status(500).json({
            success: false,
            message: '获取收藏失败',
        });
    }
});
router.post('/add', async (req, res) => {
    try {
        const { userId, productId, title, imageUrl, price, shopName } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID和商品ID',
            });
        }
        const existing = favorites.find((f) => f.userId === userId && f.productId === productId);
        if (existing) {
            return res.json({
                success: true,
                message: '已收藏',
                data: { added: false },
            });
        }
        const newFavorite = {
            id: Date.now().toString(),
            userId,
            productId,
            title: title || '',
            imageUrl: imageUrl || '',
            price: price || '',
            shopName: shopName || '',
            createdAt: new Date().toISOString(),
        };
        favorites.push(newFavorite);
        saveFavorites();
        res.json({
            success: true,
            message: '收藏成功',
            data: { added: true },
        });
    }
    catch (error) {
        console.error('Add favorite error:', error);
        res.status(500).json({
            success: false,
            message: '收藏失败',
        });
    }
});
router.post('/remove', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID和商品ID',
            });
        }
        const initialLength = favorites.length;
        favorites = favorites.filter((f) => !(f.userId === userId && f.productId === productId));
        if (favorites.length === initialLength) {
            return res.json({
                success: true,
                message: '未收藏该商品',
                data: { removed: false },
            });
        }
        saveFavorites();
        res.json({
            success: true,
            message: '取消收藏成功',
            data: { removed: true },
        });
    }
    catch (error) {
        console.error('Remove favorite error:', error);
        res.status(500).json({
            success: false,
            message: '取消收藏失败',
        });
    }
});
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        favorites = favorites.filter((f) => f.userId !== userId);
        saveFavorites();
        res.json({
            success: true,
            message: '清空收藏成功',
        });
    }
    catch (error) {
        console.error('Clear favorites error:', error);
        res.status(500).json({
            success: false,
            message: '清空收藏失败',
        });
    }
});
router.post('/check', async (req, res) => {
    try {
        const { userId, productId } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID和商品ID',
            });
        }
        const isFavorite = favorites.some((f) => f.userId === userId && f.productId === productId);
        res.json({
            success: true,
            message: '检查成功',
            data: { isFavorite },
        });
    }
    catch (error) {
        console.error('Check favorite error:', error);
        res.status(500).json({
            success: false,
            message: '检查失败',
        });
    }
});
