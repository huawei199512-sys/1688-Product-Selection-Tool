"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const match_1 = require("./routes/match");
const history_1 = require("./routes/history");
const aiSuggestion_1 = require("./routes/aiSuggestion");
const rank_1 = require("./routes/rank");
const search_1 = require("./routes/search");
const upload_1 = require("./routes/upload");
const chat_1 = require("./routes/chat");
const user_1 = require("./routes/user");
const favorites_1 = require("./routes/favorites");
const searchHistory_1 = require("./routes/searchHistory");
const order_1 = require("./routes/order");
const apiConfig_1 = require("./routes/apiConfig");
const xfs_1 = require("./routes/xfs");
const _1688h5_1 = require("./routes/1688h5");
const admin_1 = require("./routes/admin");
const imageProxy_1 = require("./routes/imageProxy");
const apiConfigService_1 = require("./services/apiConfigService");
const userStore_1 = require("./services/userStore");
const accessLog_1 = require("./services/accessLog");
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '3001', 10);
// 部署在 Render/Nginx 反向代理后，需要信任代理才能拿到真实客户端IP（X-Forwarded-For）
app.set('trust proxy', true);
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
const isPkg = !!process.pkg;
const appDir = isPkg ? path_1.default.dirname(process.execPath) : __dirname;
const resourcesPath = process.resourcesPath || appDir;
let distDir;
let indexHtmlContent = null;
let jsContent = new Map();
let cssContent = new Map();
const findDistDir = () => {
    console.log(`[DEBUG] isPkg: ${isPkg}`);
    console.log(`[DEBUG] appDir: ${appDir}`);
    console.log(`[DEBUG] resourcesPath: ${resourcesPath}`);
    console.log(`[DEBUG] __dirname: ${__dirname}`);
    console.log(`[DEBUG] process.cwd(): ${process.cwd()}`);
    const possibleDirs = [
        resourcesPath,
        path_1.default.join(resourcesPath, 'dist'),
        path_1.default.join(resourcesPath, '..', 'dist'),
        appDir,
        path_1.default.join(appDir, 'dist'),
        path_1.default.join(__dirname, '../dist'),
        path_1.default.join(__dirname, 'dist'),
        path_1.default.join(process.cwd(), 'dist'),
        process.cwd(),
        path_1.default.join(__dirname, '../../dist'),
        path_1.default.join(__dirname, '../../../dist')
    ];
    for (const dir of possibleDirs) {
        const indexPath = path_1.default.join(dir, 'index.html');
        console.log(`[DEBUG] Checking: ${indexPath} - exists: ${fs_1.default.existsSync(indexPath)}`);
        if (fs_1.default.existsSync(indexPath)) {
            console.log(`[DEBUG] Found dist directory: ${dir}`);
            return dir;
        }
    }
    console.error('[ERROR] Cannot find dist directory with index.html');
    return appDir;
};
const loadAssets = () => {
    try {
        const indexPath = path_1.default.join(distDir, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            indexHtmlContent = fs_1.default.readFileSync(indexPath, 'utf-8');
        }
        const assetsDir = path_1.default.join(distDir, 'assets');
        if (fs_1.default.existsSync(assetsDir)) {
            const files = fs_1.default.readdirSync(assetsDir);
            files.forEach(file => {
                const filePath = path_1.default.join(assetsDir, file);
                if (file.endsWith('.js')) {
                    jsContent.set(file, fs_1.default.readFileSync(filePath, 'utf-8'));
                }
                else if (file.endsWith('.css')) {
                    cssContent.set(file, fs_1.default.readFileSync(filePath, 'utf-8'));
                }
            });
        }
        console.log(`[DEBUG] Loaded assets: ${jsContent.size} JS files, ${cssContent.size} CSS files`);
    }
    catch (error) {
        console.error('[ERROR] Failed to load assets:', error);
    }
};
distDir = findDistDir();
loadAssets();
// 确保存在管理员账号（可用环境变量 ADMIN_USERNAME / ADMIN_PASSWORD 覆盖）
(0, userStore_1.ensureAdminAccount)(process.env.ADMIN_USERNAME || 'admin', process.env.ADMIN_PASSWORD || 'onebound', !!process.env.ADMIN_PASSWORD);
// 访问日志：按天记录「哪个IP访问了什么」（响应结束后写入，不影响请求耗时）
app.use((req, res, next) => {
    // 注意：必须在此处取路径。路由会把 req.url 改写为去掉挂载前缀后的值，
    // 若等到响应结束再读，/api/user/me 会被记成 /me
    const requestPath = req.path;
    const requestQuery = req.query;
    res.on('finish', () => {
        try {
            (0, accessLog_1.recordAccess)({
                ip: (0, accessLog_1.clientIp)(req),
                method: req.method,
                path: requestPath,
                query: requestQuery,
                status: res.statusCode,
                // 普通账号取 pmtUser，后台操作取 adminUser（后台路由不经过 /api 中间件）
                user: req.pmtUser ? req.pmtUser.username : (req.adminUser ? req.adminUser.username : ''),
                ua: req.get('user-agent') || '',
            });
        }
        catch (error) {
            // 日志失败不影响业务，但要能发现
            console.error('[accessLog] record failed:', error && error.message ? error.message : error);
        }
    });
    next();
});
// 按访客隔离 key：登录用户用自己的 key/秘钥，未登录访客用公共 key
app.use('/api', (req, res, next) => {
    try {
        const headerToken = req.get('x-user-token') || req.get('authorization') || '';
        const token = String(headerToken).replace(/^Bearer\s+/i, '').trim();
        const user = token ? (0, userStore_1.findUserByToken)(token) : null;
        req.pmtUser = user || null;
        const userConfig = user ? (0, userStore_1.getUserApiConfig)(user.id) : null;
        req.pmtApiConfig = userConfig && userConfig.key && userConfig.secret ? userConfig : null;
        if (req.pmtApiConfig) {
            return (0, apiConfigService_1.runWithApiConfig)(req.pmtApiConfig, () => next());
        }
    }
    catch (error) {
        console.error('[api] resolve user key failed:', error);
    }
    next();
});
app.use('/api/match', match_1.matchRouter);
app.use('/api/history', history_1.historyRouter);
app.use('/api/ai', aiSuggestion_1.aiSuggestionRouter);
app.use('/api/rank', rank_1.rankRouter);
app.use('/api/search', search_1.searchRouter);
app.use('/api/upload', upload_1.uploadRouter);
app.use('/api/chat', chat_1.chatRouter);
app.use('/api/user', user_1.userRouter);
app.use('/api/favorites', favorites_1.favoritesRouter);
app.use('/api/searchHistory', searchHistory_1.searchHistoryRouter);
app.use('/api/order', order_1.orderRouter);
app.use('/api/config', apiConfig_1.apiConfigRouter);
app.use('/api/xfs', xfs_1.xfsRouter);
app.use('/api/1688h5', _1688h5_1.h51688Router);
// 后端管理入口（管理员登录后可查看所有账号/配置/地址）
app.use('/admin', admin_1.adminRouter);
// 图片代理（绕过 alicdn/1688 的 Referer 防盗链）
app.use('/api/image', imageProxy_1.imageProxyRouter);
app.use('/uploads', express_1.default.static(path_1.default.join(appDir, 'uploads')));
if (!isPkg) {
    app.use('/assets', express_1.default.static(path_1.default.join(distDir, 'assets')));
    app.use(express_1.default.static(distDir));
}
else {
    jsContent.forEach((content, fileName) => {
        app.get('/assets/' + fileName, (req, res) => {
            res.set('Content-Type', 'application/javascript');
            res.send(content);
        });
    });
    cssContent.forEach((content, fileName) => {
        app.get('/assets/' + fileName, (req, res) => {
            res.set('Content-Type', 'text/css');
            res.send(content);
        });
    });
}
app.get('/vite.svg', (req, res) => {
    const svgContent = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">⚡</text></svg>';
    res.set('Content-Type', 'image/svg+xml');
    res.send(svgContent);
});
app.get('*', (req, res) => {
    if (indexHtmlContent) {
        res.set('Content-Type', 'text/html');
        res.send(indexHtmlContent);
    }
    else {
        const indexPath = path_1.default.join(distDir, 'index.html');
        if (fs_1.default.existsSync(indexPath)) {
            res.sendFile(indexPath);
        }
        else {
            res.status(500).send('Unable to serve index.html');
        }
    }
});
app.listen(PORT, '0.0.0.0', () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`=========================================`);
    console.log(`    Product Matching Tool is Running!`);
    console.log(`=========================================`);
    console.log(`Server is running on ${localUrl}`);
    console.log(`Local network access: http://127.0.0.1:${PORT}`);
    try {
        const os = require('os');
        const interfaces = os.networkInterfaces();
        Object.keys(interfaces).forEach(name => {
            interfaces[name]?.forEach((iface) => {
                if (iface.family === 'IPv4' && !iface.internal) {
                    console.log(`Local network access: http://${iface.address}:${PORT}`);
                }
            });
        });
    }
    catch {
        console.log('To share with others, find your IP address and use: http://<your-ip>:${PORT}');
    }
    const openBrowser = (url) => {
        const { exec } = require('child_process');
        const cmdPath = process.env.ComSpec || 'cmd.exe';
        console.log(`[DEBUG] ComSpec: ${cmdPath}`);
        exec(`${cmdPath} /c start "" "${url}"`, (error, stdout, stderr) => {
            if (error) {
                console.log(`[ERROR] Failed to open browser via cmd: ${error.message}`);
                console.log(`[DEBUG] stderr: ${stderr}`);
                exec('explorer.exe "' + url + '"', (err, out, errOut) => {
                    if (err) {
                        console.log(`[ERROR] Failed to open browser via explorer: ${err.message}`);
                        console.log(`[DEBUG] stderr: ${errOut}`);
                        exec('powershell.exe -Command "Start-Process \'' + url + '\'"', (e, o, eo) => {
                            if (e) {
                                console.log(`[ERROR] Failed to open browser via powershell: ${e.message}`);
                                console.log(`[DEBUG] stderr: ${eo}`);
                                console.log(`Failed to open browser automatically`);
                                console.log(`Please open your browser and visit: ${url}`);
                            }
                            else {
                                console.log(`Opening browser via powershell: ${url}`);
                            }
                        });
                    }
                    else {
                        console.log(`Opening browser via explorer: ${url}`);
                    }
                });
            }
            else {
                console.log(`Opening browser via cmd: ${url}`);
                console.log(`[DEBUG] stdout: ${stdout}`);
            }
        });
    };
    setTimeout(() => {
        openBrowser(localUrl);
    }, 1500);
});
