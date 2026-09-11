"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasUserApiConfig = exports.runWithApiConfig = exports.validateApiConfig = exports.saveApiConfig = exports.getApiConfig = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const async_hooks_1 = require("async_hooks");
// 按请求/按用户隔离 key：中间件把「当前登录用户自己的key」放进这个上下文
const apiConfigStorage = new async_hooks_1.AsyncLocalStorage();
const runWithApiConfig = (config, fn) => {
    return apiConfigStorage.run(config, fn);
};
exports.runWithApiConfig = runWithApiConfig;
// 未登录访客使用的公共 key（可用环境变量覆盖）
const DEFAULT_PUBLIC_CONFIG = {
    key: process.env.PUBLIC_API_KEY || 'tel15083963051',
    secret: process.env.PUBLIC_API_SECRET || '20200512',
};
const getUserDataDir = () => {
    if (process.env.APPDATA) {
        return path_1.default.join(process.env.APPDATA, 'product-matching-tool');
    }
    if (process.env.HOME) {
        return path_1.default.join(process.env.HOME, '.product-matching-tool');
    }
    return path_1.default.join(process.cwd(), '.product-matching-tool');
};
const configDir = getUserDataDir();
const configFile = path_1.default.join(configDir, 'apiConfig.json');
console.log(`[DEBUG] API Config Directory: ${configDir}`);
console.log(`[DEBUG] API Config File: ${configFile}`);
const ensureConfigDir = () => {
    try {
        if (!fs_1.default.existsSync(configDir)) {
            fs_1.default.mkdirSync(configDir, { recursive: true });
            console.log(`[DEBUG] Created config directory: ${configDir}`);
        }
    }
    catch (error) {
        console.error(`[ERROR] Cannot create config directory ${configDir}:`, error);
        throw new Error('Cannot create config directory: ' + error.message);
    }
};
const getApiConfig = () => {
    // 1) 登录用户自己的 key 优先
    const scoped = apiConfigStorage.getStore();
    if (scoped && scoped.key && scoped.secret) {
        return { key: scoped.key, secret: scoped.secret };
    }
    // 2) 全局配置文件（部署方自定义公共 key）
    try {
        ensureConfigDir();
        if (fs_1.default.existsSync(configFile)) {
            const content = fs_1.default.readFileSync(configFile, 'utf-8');
            console.log(`[DEBUG] Loaded API config from: ${configFile}`);
            const parsed = JSON.parse(content);
            if (parsed && parsed.key && parsed.secret) {
                return parsed;
            }
        }
        console.log(`[DEBUG] Config file not found, using default public config`);
    }
    catch (error) {
        console.error('[ERROR] Failed to read API config:', error);
    }
    // 3) 内置公共 key
    return { ...DEFAULT_PUBLIC_CONFIG };
};
exports.getApiConfig = getApiConfig;
const saveApiConfig = (config) => {
    try {
        ensureConfigDir();
        fs_1.default.writeFileSync(configFile, JSON.stringify(config, null, 2));
        console.log(`[DEBUG] Saved API config to: ${configFile}`);
        console.log(`[DEBUG] Config content:`, JSON.stringify(config));
    }
    catch (error) {
        console.error('[ERROR] Failed to save API config:', error);
        throw new Error('Cannot save config: ' + error.message);
    }
};
exports.saveApiConfig = saveApiConfig;
const validateApiConfig = (config) => {
    return !!config.key && !!config.secret;
};
exports.validateApiConfig = validateApiConfig;
// 仅当用户在本机保存过 key/secret 时才返回 true（用于区分「公共默认key」与「用户自有key」）
const hasUserApiConfig = () => {
    try {
        if (!fs_1.default.existsSync(configFile)) {
            return false;
        }
        const content = fs_1.default.readFileSync(configFile, 'utf-8');
        const config = JSON.parse(content);
        return !!(config && config.key && config.secret);
    }
    catch (error) {
        console.error('[ERROR] Failed to check user API config:', error);
        return false;
    }
};
exports.hasUserApiConfig = hasUserApiConfig;
