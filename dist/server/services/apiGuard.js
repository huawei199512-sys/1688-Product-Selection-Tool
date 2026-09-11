"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replyConfigRequired = exports.replyPermission = exports.isEmptyPayload = exports.isPermissionError = exports.permissionError = exports.API_CONFIG_MESSAGE = exports.API_PERMISSION_MESSAGE = exports.CODE_API_CONFIG = exports.CODE_API_PERMISSION = void 0;
// 统一的接口鉴权/配置校验
const CODE_API_PERMISSION = 'API_PERMISSION';
exports.CODE_API_PERMISSION = CODE_API_PERMISSION;
const CODE_API_CONFIG = 'NEED_API_CONFIG';
exports.CODE_API_CONFIG = CODE_API_CONFIG;
const API_PERMISSION_MESSAGE = '请检查对应APIkey的权限';
exports.API_PERMISSION_MESSAGE = API_PERMISSION_MESSAGE;
const API_CONFIG_MESSAGE = '需要登录并配置正确的key和秘钥';
exports.API_CONFIG_MESSAGE = API_CONFIG_MESSAGE;
// 万邦返回的错误信息中出现以下关键字，判定为该 key 无权限/失效
const PERMISSION_PATTERN = /(key|secret|sign|auth|permission|denied|forbidden|invalid|unauthor|expired|quota|balance|权限|鉴权|授权|无效|未授权|过期|欠费|余额|未开通|额度)/i;
const isPermissionError = (payload) => {
    if (payload == null) {
        return true;
    }
    if (typeof payload === 'string') {
        return PERMISSION_PATTERN.test(payload);
    }
    if (typeof payload !== 'object') {
        return false;
    }
    const parts = [payload.error, payload.error_message, payload.errorMessage, payload.message, payload.reason, payload.msg];
    for (const part of parts) {
        if (typeof part === 'string' && part && PERMISSION_PATTERN.test(part)) {
            return true;
        }
    }
    return false;
};
exports.isPermissionError = isPermissionError;
// 判定接口返回的业务数据是否为空（无商品/无条目/无详情）
const isEmptyPayload = (payload) => {
    if (payload == null) {
        return true;
    }
    if (Array.isArray(payload)) {
        return payload.length === 0;
    }
    if (typeof payload !== 'object') {
        return false;
    }
    const items = payload.items || payload.result || payload.item;
    if (items !== undefined) {
        if (Array.isArray(items)) {
            return items.length === 0;
        }
        if (items && typeof items === 'object') {
            if (Array.isArray(items.item)) {
                return items.item.length === 0;
            }
            return Object.keys(items).length === 0;
        }
        return !items;
    }
    return false;
};
exports.isEmptyPayload = isEmptyPayload;
// 构造带 code 的错误，供上层路由识别
const permissionError = (detail) => {
    const error = new Error(API_PERMISSION_MESSAGE);
    error.code = CODE_API_PERMISSION;
    error.detail = detail;
    return error;
};
exports.permissionError = permissionError;
const replyPermission = (res, detail) => {
    return res.json({
        success: false,
        code: CODE_API_PERMISSION,
        message: API_PERMISSION_MESSAGE,
        data: detail === undefined ? null : detail,
    });
};
exports.replyPermission = replyPermission;
const replyConfigRequired = (res) => {
    return res.json({
        success: false,
        code: CODE_API_CONFIG,
        message: API_CONFIG_MESSAGE,
    });
};
exports.replyConfigRequired = replyConfigRequired;
