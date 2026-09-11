"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.maskUsersForAdmin = exports.maskUserForAdmin = exports.maskAddress = exports.maskPhone = exports.maskName = exports.maskText = void 0;
// 后台查看时的脱敏处理：姓名 / 电话 / 收货地址 / 邮编
const maskText = (value, keepStart, keepEnd) => {
    const text = String(value === null || value === undefined ? '' : value);
    if (!text) {
        return text;
    }
    const start = keepStart || 0;
    const end = keepEnd || 0;
    if (text.length <= start + end) {
        return text.charAt(0) + '*'.repeat(Math.max(text.length - 1, 1));
    }
    return text.substring(0, start) + '*'.repeat(Math.min(text.length - start - end, 6)) + text.substring(text.length - end);
};
exports.maskText = maskText;
// 姓名：保留姓氏，其余打码（石华伟 -> 石**）
const maskName = (name) => {
    const text = String(name || '').trim();
    if (!text) {
        return '';
    }
    if (text.length === 1) {
        return text;
    }
    return text.charAt(0) + '*'.repeat(text.length - 1);
};
exports.maskName = maskName;
// 电话：保留前3后4（15083963051 -> 150****3051）
const maskPhone = (phone) => {
    const text = String(phone || '').trim();
    if (!text) {
        return '';
    }
    if (text.length <= 4) {
        return '*'.repeat(text.length);
    }
    if (text.length <= 7) {
        return text.substring(0, 3) + '*'.repeat(text.length - 3);
    }
    return text.substring(0, 3) + '****' + text.substring(text.length - 4);
};
exports.maskPhone = maskPhone;
// 地址：保留前3后2（北湖东路曼福特国际广场21楼万邦科技 -> 北湖东路****科技）
const maskAddress = (address) => {
    const text = String(address || '').trim();
    if (!text) {
        return '';
    }
    if (text.length <= 5) {
        return text.charAt(0) + '*'.repeat(Math.max(text.length - 1, 1));
    }
    return text.substring(0, 3) + '****' + text.substring(text.length - 2);
};
exports.maskAddress = maskAddress;
const maskAddressItem = (item) => {
    if (!item || typeof item !== 'object') {
        return item;
    }
    return {
        id: item.id,
        isDefault: !!item.isDefault,
        fullName: (0, exports.maskName)(item.fullName || item.contactName),
        mobile: (0, exports.maskPhone)(item.mobile || item.mobilePhone || item.phone),
        phone: (0, exports.maskPhone)(item.phone || item.mobilePhone),
        postCode: (0, exports.maskText)(item.postCode || item.post, 2, 0),
        provinceText: item.provinceText || '',
        cityText: item.cityText || '',
        areaText: item.areaText || '',
        townText: item.townText || '',
        address: (0, exports.maskAddress)(item.address),
    };
};
// 单个用户的后台展示数据（地址全部脱敏）
const maskUserForAdmin = (user) => {
    if (!user || typeof user !== 'object') {
        return user;
    }
    return Object.assign({}, user, {
        addresses: Array.isArray(user.addresses) ? user.addresses.map(maskAddressItem) : [],
    });
};
exports.maskUserForAdmin = maskUserForAdmin;
const maskUsersForAdmin = (users) => (Array.isArray(users) ? users.map(maskUserForAdmin) : []);
exports.maskUsersForAdmin = maskUsersForAdmin;
