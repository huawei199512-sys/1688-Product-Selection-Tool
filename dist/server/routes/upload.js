"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRouter = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const matchService_1 = require("../services/matchService");
const apiConfigService_1 = require("../services/apiConfigService");
const apiGuard_1 = require("../services/apiGuard");
const router = express_1.default.Router();
const getUploadsDir = () => {
    const isPkg = !!process.pkg;
    // 与 server.js 的静态目录保持一致：非打包时为 dist/server/uploads
    const appDir = isPkg ? path_1.default.dirname(process.execPath) : path_1.default.join(__dirname, '..');
    return path_1.default.join(appDir, 'uploads');
};
// 保存本地副本（可选，便于排查）
const saveLocalCopy = (base64Data) => {
    const matches = String(base64Data || '').match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
        return null;
    }
    const ext = matches[1].split('/')[1] || 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const uploadsDir = getUploadsDir();
    if (!fs_1.default.existsSync(uploadsDir)) {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    const filename = `${Date.now()}.${ext}`;
    fs_1.default.writeFileSync(path_1.default.join(uploadsDir, filename), buffer);
    return filename;
};
const resolveImgcode = (body) => {
    const imgcode = (body && (body.imgcode || body.base64 || body.imageUrl || body.image)) || '';
    return String(imgcode).trim();
};
// 统一定义：拿到 imgid 的公共逻辑
const handleImageUpload = async (req, res) => {
    try {
        const imgcode = resolveImgcode(req.body);
        if (!imgcode) {
            return res.status(400).json({ success: false, message: '请提供 imgcode(base64) 或 imageUrl' });
        }
        const { key, secret } = (0, apiConfigService_1.getApiConfig)();
        const isUrl = /^https?:\/\//i.test(imgcode);
        const isBase64 = /^data:([A-Za-z-+/]+);base64,/i.test(imgcode);
        if (!isUrl && !isBase64) {
            return res.status(400).json({ success: false, message: 'imgcode 必须是 base64(data:image/...;base64,...) 或图片URL' });
        }
        let localFile = null;
        console.log(`[upload] 获取图片ID，类型=${isBase64 ? 'base64' : 'url'}，长度=${imgcode.length}`);
        const started = Date.now();
        const imgid = await (0, matchService_1.uploadImage)(imgcode, key, secret);
        if (!imgid) {
            return (0, apiGuard_1.replyPermission)(res, { error: 'upload_img 未返回 imgid' });
        }
        console.log(`[upload] 图片ID=${imgid}，耗时=${Date.now() - started}ms`);
        res.json({
            success: true,
            message: '上传成功',
            data: { imgid, type: isBase64 ? 'base64' : 'url', localFile },
        });
    }
    catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ success: false, message: '上传失败: ' + (error instanceof Error ? error.message : String(error)) });
    }
};
// POST /api/upload/image  { imgcode | base64 | imageUrl }
router.post('/image', handleImageUpload);
// POST /api/upload/image/file  直接上传二进制文件体（Content-Type: image/*）
router.post('/image/file', express_1.default.raw({ type: ['image/*', 'application/octet-stream'], limit: '25mb' }), async (req, res) => {
    try {
        const buffer = Buffer.isBuffer(req.body) ? req.body : null;
        if (!buffer || buffer.length === 0) {
            return res.status(400).json({ success: false, message: '未收到图片文件内容' });
        }
        const mime = (req.get('content-type') || 'image/jpeg').split(';')[0];
        const base64 = `data:${mime};base64,${buffer.toString('base64')}`;
        const { key, secret } = (0, apiConfigService_1.getApiConfig)();
        console.log(`[upload] 文件上传，大小=${buffer.length} 字节`);
        const started = Date.now();
        const imgid = await (0, matchService_1.uploadImage)(base64, key, secret);
        if (!imgid) {
            return (0, apiGuard_1.replyPermission)(res, { error: 'upload_img 未返回 imgid' });
        }
        console.log(`[upload] 图片ID=${imgid}，耗时=${Date.now() - started}ms`);
        res.json({ success: true, message: '上传成功', data: { imgid, type: 'file' } });
    }
    catch (error) {
        console.error('Image file upload error:', error);
        res.status(500).json({ success: false, message: '上传失败: ' + (error instanceof Error ? error.message : String(error)) });
    }
});
// 兼容旧接口：本地保存图片（不调用万邦）
router.post('/', (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ success: false, message: '缺少图片数据' });
        }
        const matches = image.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return res.status(400).json({ success: false, message: '无效的图片格式' });
        }
        const filename = saveLocalCopy(image);
        const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;
        res.json({
            success: true,
            message: '上传成功',
            data: {
                url,
                filename,
            },
        });
    }
    catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ success: false, message: '上传失败' });
    }
});
exports.uploadRouter = router;
