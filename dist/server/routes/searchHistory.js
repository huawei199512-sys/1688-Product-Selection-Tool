"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchHistoryRouter = void 0;
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const router = (0, express_1.Router)();
exports.searchHistoryRouter = router;
const isPkg = !!process.pkg;
let searchHistory = [];
let saveSearchHistory = () => { };
if (!isPkg) {
    const SEARCH_HISTORY_FILE = path_1.default.join(__dirname, '../data/searchHistory.json');
    const ensureFileExists = () => {
        const dir = path_1.default.dirname(SEARCH_HISTORY_FILE);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(SEARCH_HISTORY_FILE)) {
            fs_1.default.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify([]));
        }
    };
    ensureFileExists();
    const data = fs_1.default.readFileSync(SEARCH_HISTORY_FILE, 'utf-8');
    searchHistory = JSON.parse(data);
    saveSearchHistory = () => {
        const SEARCH_HISTORY_FILE = path_1.default.join(__dirname, '../data/searchHistory.json');
        fs_1.default.writeFileSync(SEARCH_HISTORY_FILE, JSON.stringify(searchHistory, null, 2));
    };
}
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const userHistory = searchHistory.filter((h) => h.userId === userId);
        userHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        res.json({
            success: true,
            message: '获取成功',
            data: userHistory,
        });
    }
    catch (error) {
        console.error('Get search history error:', error);
        res.status(500).json({
            success: false,
            message: '获取搜索历史失败',
        });
    }
});
router.post('/add', async (req, res) => {
    try {
        const { userId, keyword, searchType } = req.body;
        if (!userId || !keyword) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID和搜索关键词',
            });
        }
        const existing = searchHistory.find((h) => h.userId === userId && h.keyword === keyword && h.searchType === searchType);
        if (existing) {
            searchHistory = searchHistory.filter((h) => h.id !== existing.id);
        }
        const newHistory = {
            id: Date.now().toString(),
            userId,
            keyword,
            searchType: searchType || 'keyword',
            createdAt: new Date().toISOString(),
        };
        searchHistory.unshift(newHistory);
        searchHistory = searchHistory.slice(0, 50);
        saveSearchHistory();
        res.json({
            success: true,
            message: '添加成功',
        });
    }
    catch (error) {
        console.error('Add search history error:', error);
        res.status(500).json({
            success: false,
            message: '添加失败',
        });
    }
});
router.post('/remove', async (req, res) => {
    try {
        const { userId, id } = req.body;
        if (!userId || !id) {
            return res.status(400).json({
                success: false,
                message: '请提供用户ID和记录ID',
            });
        }
        searchHistory = searchHistory.filter((h) => !(h.userId === userId && h.id === id));
        saveSearchHistory();
        res.json({
            success: true,
            message: '删除成功',
        });
    }
    catch (error) {
        console.error('Remove search history error:', error);
        res.status(500).json({
            success: false,
            message: '删除失败',
        });
    }
});
router.delete('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        searchHistory = searchHistory.filter((h) => h.userId !== userId);
        saveSearchHistory();
        res.json({
            success: true,
            message: '清空搜索历史成功',
        });
    }
    catch (error) {
        console.error('Clear search history error:', error);
        res.status(500).json({
            success: false,
            message: '清空搜索历史失败',
        });
    }
});
