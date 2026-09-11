"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.estimateFreight = exports.cancelOrder = exports.getAccountPeriodList = exports.getBuyerOrderList = exports.prepareProtocolPay = exports.isProtocolPayOpen = exports.queryPayWay = exports.getCreditPayUrl = exports.getCrossBorderPayUrl = exports.getAlipayUrl = exports.getOrderBuyerView = exports.previewOrder = exports.batchOrderInquiry = exports.fastCreateOrder = exports.getReceiveAddress = exports.parseAddressCode = exports.decryptWangwangNick = exports.getWangwangUrl = exports.analyzeOrderPay = void 0;
const axios_1 = __importDefault(require("axios"));
const apiConfigService_1 = require("./apiConfigService");
const API_BASE_URL = 'https://api-gw.onebound.cn/1688global';
const buildCustomUrl = (method, args) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    const params = new URLSearchParams({
        key: API_KEY,
        method,
        _o_args: JSON.stringify(args),
        lang: 'zh-CN',
        secret: API_SECRET,
    });
    return `${API_BASE_URL}/custom/?${params.toString()}`;
};
const buildUrl = (path, params) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    const searchParams = new URLSearchParams({
        key: API_KEY,
        secret: API_SECRET,
        lang: 'zh-CN',
        ...params,
    });
    return `${API_BASE_URL}${path}/?${searchParams.toString()}`;
};
const analyzeOrderPay = async (orderIds) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/trade.orderpay.analysis', {
            orderIds: JSON.stringify(orderIds),
            payChannel: 'kjpayV2',
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('analyzeOrderPay error:', error);
        return { success: false, message: 'Failed to analyze order pay' };
    }
};
exports.analyzeOrderPay = analyzeOrderPay;
const getWangwangUrl = async (toOpenUid) => {
    try {
        const url = buildCustomUrl('com.alibaba.account/account.wangwangUrl.get', {
            toOpenUid,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getWangwangUrl error:', error);
        return { success: false, message: 'Failed to get wangwang url' };
    }
};
exports.getWangwangUrl = getWangwangUrl;
const decryptWangwangNick = async (openUid) => {
    try {
        const url = buildCustomUrl('com.alibaba.account/wangwangnick.openuid.decrypt', {
            openUid,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('decryptWangwangNick error:', error);
        return { success: false, message: 'Failed to decrypt wangwang nick' };
    }
};
exports.decryptWangwangNick = decryptWangwangNick;
const parseAddressCode = async (addressInfo) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.addresscode.parse', {
            addressInfo,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('parseAddressCode error:', error);
        return { success: false, message: 'Failed to parse address code' };
    }
};
exports.parseAddressCode = parseAddressCode;
const getReceiveAddress = async () => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.receiveAddress.get', {});
        const response = await axios_1.default.get(url);
        const text = response.data;
        const data = typeof text === 'object' ? text : JSON.parse(text);
        // 规范化收货地址字段，前端依赖 provinceText/cityText/areaText/mobile/postCode/fullName
        if (data && data.response && Array.isArray(data.response.receiveAddressItems)) {
            data.response.receiveAddressItems = data.response.receiveAddressItems.map((addr) => {
                const codeTextParts = (addr.addressCodeText || '').split(/\s+/).filter(Boolean);
                return {
                    ...addr,
                    mobile: addr.mobilePhone || addr.mobile || addr.phone || '',
                    phone: addr.mobilePhone || addr.phone || '',
                    postCode: addr.post || addr.postCode || addr.zipcode || '',
                    fullName: addr.fullName || addr.contactName || '',
                    address: addr.address || '',
                    townText: addr.townName || addr.townText || '',
                    provinceText: codeTextParts[0] || addr.provinceText || '',
                    cityText: codeTextParts[1] || addr.cityText || '',
                    areaText: codeTextParts[2] || addr.areaText || '',
                    isDefault: !!addr.isDefault,
                };
            });
        }
        return data;
    }
    catch (error) {
        console.error('getReceiveAddress error:', error);
        return { success: false, message: 'Failed to get receive address' };
    }
};
exports.getReceiveAddress = getReceiveAddress;
const fastCreateOrder = async (flow, addressParam, cargoParamList) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.fastCreateOrder', {
            flow,
            addressParam,
            cargoParamList,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('fastCreateOrder error:', error);
        return { success: false, message: 'Failed to create order' };
    }
};
exports.fastCreateOrder = fastCreateOrder;
const batchOrderInquiry = async (orderIdList, question) => {
    try {
        const url = buildCustomUrl('com.alibaba.fenxiao.crossborder/inquiry.task.batchOrder', {
            orderIdList: JSON.stringify(orderIdList),
            question,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('batchOrderInquiry error:', error);
        return { success: false, message: 'Failed to batch order inquiry' };
    }
};
exports.batchOrderInquiry = batchOrderInquiry;
const previewOrder = async (flow, addressParam, cargoParamList) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.createOrder.preview', {
            flow,
            addressParam,
            cargoParamList,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('previewOrder error:', error);
        return { success: false, message: 'Failed to preview order' };
    }
};
exports.previewOrder = previewOrder;
const getOrderBuyerView = async (webSite, orderId) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.get.buyerView', {
            webSite,
            orderId,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getOrderBuyerView error:', error);
        return { success: false, message: 'Failed to get order buyerView' };
    }
};
exports.getOrderBuyerView = getOrderBuyerView;
const getAlipayUrl = async (orderIdList) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.alipay.url.get', {
            orderIdList,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getAlipayUrl error:', error);
        return { success: false, message: 'Failed to get alipay url' };
    }
};
exports.getAlipayUrl = getAlipayUrl;
const getCrossBorderPayUrl = async (orderIdList) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.crossBorderPay.url.get', {
            orderIdList,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getCrossBorderPayUrl error:', error);
        return { success: false, message: 'Failed to get cross border pay url' };
    }
};
exports.getCrossBorderPayUrl = getCrossBorderPayUrl;
const getCreditPayUrl = async (orderIdList) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.creditPay.url.get', {
            orderIdList,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getCreditPayUrl error:', error);
        return { success: false, message: 'Failed to get credit pay url' };
    }
};
exports.getCreditPayUrl = getCreditPayUrl;
const queryPayWay = async (orderId) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.payWay.query', {
            orderId,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('queryPayWay error:', error);
        return { success: false, message: 'Failed to query pay way' };
    }
};
exports.queryPayWay = queryPayWay;
const isProtocolPayOpen = async () => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.pay.protocolPay.isopen', {});
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('isProtocolPayOpen error:', error);
        return { success: false, message: 'Failed to check protocol pay' };
    }
};
exports.isProtocolPayOpen = isProtocolPayOpen;
const prepareProtocolPay = async (orderId) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.pay.protocolPay.preparePay', {
            tradeWithholdPreparePayParam: { orderId },
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('prepareProtocolPay error:', error);
        return { success: false, message: 'Failed to prepare protocol pay' };
    }
};
exports.prepareProtocolPay = prepareProtocolPay;
const getBuyerOrderList = async (params = {}) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.getBuyerOrderList', params);
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getBuyerOrderList error:', error);
        return { success: false, message: 'Failed to get buyer order list' };
    }
};
exports.getBuyerOrderList = getBuyerOrderList;
const cancelOrder = async (webSite, tradeID, cancelReason, remark) => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.trade.cancel', {
            webSite,
            tradeID,
            cancelReason,
            remark: remark || '',
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('cancelOrder error:', error);
        return { success: false, message: 'Failed to cancel order' };
    }
};
exports.cancelOrder = cancelOrder;
const estimateFreight = async (params) => {
    try {
        const url = buildCustomUrl('com.alibaba.fenxiao.crossborder/product.freight.estimate', {
            productFreightQueryParamsNew: params,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('estimateFreight error:', error);
        return { success: false, message: 'Failed to estimate freight' };
    }
};
exports.estimateFreight = estimateFreight;
const getAccountPeriodList = async (pageIndex = '1', pageSize = '20', sellerLoginId = '') => {
    try {
        const url = buildCustomUrl('com.alibaba.trade/alibaba.accountPeriod.list.buyerView', {
            pageIndex: String(pageIndex),
            pageSize: String(pageSize),
            sellerLoginId: sellerLoginId || undefined,
        });
        const response = await axios_1.default.get(url);
        const text = response.data;
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        }
        catch {
            return { success: false, message: 'Invalid response' };
        }
    }
    catch (error) {
        console.error('getAccountPeriodList error:', error);
        return { success: false, message: 'Failed to get account period list' };
    }
};
exports.getAccountPeriodList = getAccountPeriodList;
