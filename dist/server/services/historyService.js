"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearHistory = exports.deleteHistoryItem = exports.saveHistory = exports.getHistory = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const isPkg = !!process.pkg;
let history = [];
let saveHistoryFile = () => { };
if (!isPkg) {
    const HISTORY_FILE = path_1.default.join(__dirname, '../data/history.json');
    const ensureFileExists = () => {
        const dir = path_1.default.dirname(HISTORY_FILE);
        if (!fs_1.default.existsSync(dir)) {
            fs_1.default.mkdirSync(dir, { recursive: true });
        }
        if (!fs_1.default.existsSync(HISTORY_FILE)) {
            fs_1.default.writeFileSync(HISTORY_FILE, JSON.stringify([]));
        }
    };
    ensureFileExists();
    const data = fs_1.default.readFileSync(HISTORY_FILE, 'utf-8');
    history = JSON.parse(data);
    saveHistoryFile = (items) => {
        const HISTORY_FILE = path_1.default.join(__dirname, '../data/history.json');
        const trimmedHistory = items.slice(0, 10);
        fs_1.default.writeFileSync(HISTORY_FILE, JSON.stringify(trimmedHistory, null, 2));
    };
}
const getHistory = async () => {
    return history;
};
exports.getHistory = getHistory;
const saveHistory = async (items) => {
    history = items.slice(0, 10);
    saveHistoryFile(history);
};
exports.saveHistory = saveHistory;
const deleteHistoryItem = async (id) => {
    history = history.filter((item) => item.id !== id);
    saveHistoryFile(history);
};
exports.deleteHistoryItem = deleteHistoryItem;
const clearHistory = async () => {
    history = [];
    saveHistoryFile(history);
};
exports.clearHistory = clearHistory;
