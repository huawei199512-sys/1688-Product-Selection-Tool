"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureAdminAccount = exports.verifyUserPassword = exports.getAdminKey = exports.hashPassword = exports.hasUserApiConfig = exports.listUsers = exports.getUserAddresses = exports.setUserAddresses = exports.getUserApiConfig = exports.setUserApiConfig = exports.removeSession = exports.createSession = exports.findUserByToken = exports.findUserById = exports.findUserByUsername = exports.createUser = exports.getSessions = exports.getUsers = exports.getDataDir = void 0;
// 用户数据存储：账号/密码(哈希) + 每个账号自己的 key/秘钥 + 收货地址快照
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const getDataDir = () => {
    if (process.env.DATA_DIR) {
        return process.env.DATA_DIR;
    }
    return path.join(__dirname, '..', 'data');
};
exports.getDataDir = getDataDir;
const usersFile = () => path.join(getDataDir(), 'users.json');
const sessionsFile = () => path.join(getDataDir(), 'sessions.json');
let users = [];
let sessions = [];
const ensureDir = () => {
    const dir = getDataDir();
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};
const load = () => {
    try {
        ensureDir();
        users = fs.existsSync(usersFile()) ? JSON.parse(fs.readFileSync(usersFile(), 'utf-8') || '[]') : [];
        sessions = fs.existsSync(sessionsFile()) ? JSON.parse(fs.readFileSync(sessionsFile(), 'utf-8') || '[]') : [];
    }
    catch (error) {
        console.error('[userStore] load failed:', error);
        users = [];
        sessions = [];
    }
};
load();
const saveUsers = () => {
    ensureDir();
    fs.writeFileSync(usersFile(), JSON.stringify(users, null, 2));
};
const saveSessions = () => {
    ensureDir();
    fs.writeFileSync(sessionsFile(), JSON.stringify(sessions, null, 2));
};
// ---- 密码哈希（scrypt，不可逆）----
const hashPassword = (password) => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
    return `scrypt$${salt}$${hash}`;
};
exports.hashPassword = hashPassword;
const isHashed = (value) => typeof value === 'string' && value.startsWith('scrypt$');
const verifyUserPassword = (user, password) => {
    if (!user) {
        return false;
    }
    if (isHashed(user.passwordHash)) {
        try {
            const parts = user.passwordHash.split('$');
            const salt = parts[1];
            const expected = parts[2];
            const actual = crypto.scryptSync(String(password), salt, 64).toString('hex');
            const a = Buffer.from(actual, 'hex');
            const b = Buffer.from(expected, 'hex');
            return a.length === b.length && crypto.timingSafeEqual(a, b);
        }
        catch (error) {
            return false;
        }
    }
    // 兼容历史明文密码
    return typeof user.password === 'string' && user.password === password;
};
exports.verifyUserPassword = verifyUserPassword;
// 管理员查看密钥：优先环境变量 ADMIN_KEY，否则本地生成并持久化到 data/admin.key
const adminKeyFile = () => path.join(getDataDir(), 'admin.key');
const getAdminKey = () => {
    if (process.env.ADMIN_KEY) {
        return process.env.ADMIN_KEY;
    }
    try {
        ensureDir();
        if (fs.existsSync(adminKeyFile())) {
            const key = fs.readFileSync(adminKeyFile(), 'utf-8').trim();
            if (key) {
                return key;
            }
        }
        const key = crypto.randomBytes(24).toString('hex');
        fs.writeFileSync(adminKeyFile(), key);
        console.log(`[userStore] 已生成后端查看密钥(admin.key): ${key}`);
        return key;
    }
    catch (error) {
        console.error('[userStore] getAdminKey failed:', error);
        return '';
    }
};
exports.getAdminKey = getAdminKey;
// 一次性迁移：把历史明文密码升级为哈希（不可逆）
const migratePasswords = () => {
    let changed = false;
    users.forEach((u) => {
        if (u.password && !isHashed(u.passwordHash)) {
            u.passwordHash = hashPassword(u.password);
            delete u.password;
            changed = true;
        }
    });
    if (changed) {
        saveUsers();
        console.log('[userStore] 已将历史明文密码迁移为哈希');
    }
};
migratePasswords();
const getUsers = () => users;
exports.getUsers = getUsers;
const getSessions = () => sessions;
exports.getSessions = getSessions;
const findUserByUsername = (username) => users.find((u) => u.username === username);
exports.findUserByUsername = findUserByUsername;
const findUserById = (id) => users.find((u) => u.id === id);
exports.findUserById = findUserById;
const findUserByToken = (token) => {
    const value = String(token || '').trim();
    if (!value) {
        return null;
    }
    const session = sessions.find((s) => s.token === value && (!s.expiresAt || new Date(s.expiresAt) > new Date()));
    if (!session) {
        return null;
    }
    return findUserById(session.userId) || null;
};
exports.findUserByToken = findUserByToken;
const createUser = (username, password, extra) => {
    const user = Object.assign({
        id: Date.now().toString(),
        username,
        passwordHash: hashPassword(password),
        createdAt: new Date().toISOString(),
    }, extra || {});
    users.push(user);
    saveUsers();
    return user;
};
exports.createUser = createUser;
const createSession = (userId) => {
    const token = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessions.push({
        userId,
        token,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
    saveSessions();
    return token;
};
exports.createSession = createSession;
const removeSession = (token) => {
    sessions = sessions.filter((s) => s.token !== token);
    saveSessions();
};
exports.removeSession = removeSession;
const getUserApiConfig = (userId) => {
    const user = findUserById(userId);
    if (user && user.apiConfig && user.apiConfig.key && user.apiConfig.secret) {
        return { key: user.apiConfig.key, secret: user.apiConfig.secret };
    }
    return null;
};
exports.getUserApiConfig = getUserApiConfig;
const setUserApiConfig = (userId, config) => {
    const user = findUserById(userId);
    if (!user) {
        throw new Error('用户不存在');
    }
    user.apiConfig = { key: config.key, secret: config.secret, updatedAt: new Date().toISOString() };
    saveUsers();
    return user.apiConfig;
};
exports.setUserApiConfig = setUserApiConfig;
const setUserAddresses = (userId, addresses) => {
    const user = findUserById(userId);
    if (!user) {
        return;
    }
    user.addresses = Array.isArray(addresses) ? addresses : [];
    user.addressUpdatedAt = new Date().toISOString();
    saveUsers();
};
exports.setUserAddresses = setUserAddresses;
const getUserAddresses = (userId) => {
    const user = findUserById(userId);
    return user && Array.isArray(user.addresses) ? user.addresses : [];
};
exports.getUserAddresses = getUserAddresses;
const hasUserApiConfig = (userId) => !!getUserApiConfig(userId);
exports.hasUserApiConfig = hasUserApiConfig;
// 后端查看：所有用户及其配置/地址（密码只标记已加密，不返回明文）
const listUsers = () => users.map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role || 'user',
    passwordProtected: isHashed(u.passwordHash),
    createdAt: u.createdAt,
    hasApiConfig: !!(u.apiConfig && u.apiConfig.key && u.apiConfig.secret),
    apiConfig: u.apiConfig || null,
    addresses: Array.isArray(u.addresses) ? u.addresses : [],
    addressUpdatedAt: u.addressUpdatedAt || null,
}));
exports.listUsers = listUsers;
// 创建/确保管理员账号（密码为哈希存储）
const ensureAdminAccount = (username, password, forceReset) => {
    let user = findUserByUsername(username);
    if (!user) {
        user = createUser(username, password, { role: 'admin' });
        console.log(`[userStore] 已创建管理员账号: ${username}`);
        return user;
    }
    let changed = false;
    if (user.role !== 'admin') {
        user.role = 'admin';
        changed = true;
    }
    if (forceReset && !verifyUserPassword(user, password)) {
        user.passwordHash = hashPassword(password);
        delete user.password;
        changed = true;
        console.log(`[userStore] 已按环境变量重置管理员密码: ${username}`);
    }
    if (changed) {
        saveUsers();
    }
    return user;
};
exports.ensureAdminAccount = ensureAdminAccount;
