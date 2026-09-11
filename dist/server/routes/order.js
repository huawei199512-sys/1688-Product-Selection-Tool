"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = require("express");
const orderService_1 = require("../services/orderService");
const apiGuard_1 = require("../services/apiGuard");
const userStore_1 = require("../services/userStore");
const router = (0, express_1.Router)();
exports.orderRouter = router;
// 下单/支付等交易类接口必须：已登录 + 已配置自己的 key 和秘钥
router.use((req, res, next) => {
    if (!req.pmtUser) {
        return res.json({
            success: false,
            code: 'NEED_LOGIN',
            message: '需要登录并配置正确的key和秘钥',
        });
    }
    if (!req.pmtApiConfig) {
        return (0, apiGuard_1.replyConfigRequired)(res);
    }
    next();
});
router.post('/analyze-pay', async (req, res) => {
    try {
        const { orderIds } = req.body;
        if (!orderIds || !Array.isArray(orderIds)) {
            return res.status(400).json({ success: false, message: '请提供订单ID列表' });
        }
        const result = await (0, orderService_1.analyzeOrderPay)(orderIds);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Order analyze pay error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/wangwang-url', async (req, res) => {
    try {
        const { toOpenUid } = req.body;
        if (!toOpenUid) {
            return res.status(400).json({ success: false, message: '请提供OpenUid' });
        }
        const result = await (0, orderService_1.getWangwangUrl)(toOpenUid);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get wangwang url error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/wangwang-decrypt', async (req, res) => {
    try {
        const { openUid } = req.body;
        if (!openUid) {
            return res.status(400).json({ success: false, message: '请提供OpenUid' });
        }
        const result = await (0, orderService_1.decryptWangwangNick)(openUid);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Decrypt wangwang nick error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/address-parse', async (req, res) => {
    try {
        const { addressInfo } = req.body;
        if (!addressInfo) {
            return res.status(400).json({ success: false, message: '请提供地址信息' });
        }
        const result = await (0, orderService_1.parseAddressCode)(addressInfo);
        res.json({ success: true, message: '解析成功', data: result });
    }
    catch (error) {
        console.error('Parse address code error:', error);
        res.status(500).json({ success: false, message: '解析失败' });
    }
});
router.get('/address-list', async (req, res) => {
    try {
        const result = await (0, orderService_1.getReceiveAddress)();
        // 把该账号的收货地址快照存到后端，便于后端查看
        try {
            const items = result && result.response && Array.isArray(result.response.receiveAddressItems)
                ? result.response.receiveAddressItems
                : [];
            if (req.pmtUser) {
                (0, userStore_1.setUserAddresses)(req.pmtUser.id, items);
            }
        }
        catch (snapshotError) {
            console.error('Save address snapshot error:', snapshotError);
        }
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get receive address error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
// 从 1688 返回中提取订单号
const extractOrderId = (result) => {
    if (!result || typeof result !== 'object') {
        return null;
    }
    const response = result.response || {};
    return response.orderId || (response.result && response.result.orderId) || null;
};
// 从 1688 返回中提取失败原因
const extractOrderError = (result) => {
    if (!result || typeof result !== 'object') {
        return '';
    }
    const response = result.response || {};
    const failed = Array.isArray(response.failedOfferList) ? response.failedOfferList[0] : null;
    if (failed) {
        return failed.errorMessage || failed.errorCode || '';
    }
    return response.error || result.error || result.message || '';
};
// 按卖家分组：同一卖家合并为一个订单，不同卖家拆分
const groupCargoBySeller = (cargoParamList) => {
    const groups = new Map();
    cargoParamList.forEach((item, index) => {
        const sellerKey = String(item.sellerId || item.seller_id || item.shopName || item.shop_name || '').trim() || ('__unknown_' + index);
        if (!groups.has(sellerKey)) {
            groups.set(sellerKey, []);
        }
        groups.get(sellerKey).push(item);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({ key, items }));
};
router.post('/create', async (req, res) => {
    try {
        const { flow = 'general', addressParam, cargoParamList } = req.body;
        if (!addressParam || !cargoParamList || !Array.isArray(cargoParamList)) {
            return res.status(400).json({ success: false, message: '请提供完整的订单参数' });
        }
        const groups = groupCargoBySeller(cargoParamList);
        // 只有一个卖家：保持原有返回结构
        if (groups.length <= 1) {
            const result = await (0, orderService_1.fastCreateOrder)(flow, addressParam, cargoParamList);
            const orderId = extractOrderId(result);
            return res.json({
                success: true,
                message: orderId ? '创建成功' : '创建失败',
                data: Object.assign({}, result, {
                    multi: false,
                    orders: [{ shopName: groups[0] ? groups[0].key : '', orderId, error: orderId ? '' : extractOrderError(result) }],
                }),
            });
        }
        // 多个卖家：逐个卖家创建订单
        console.log(`[order] 拆分创建订单，共 ${groups.length} 个卖家`);
        const orders = [];
        for (const group of groups) {
            try {
                const result = await (0, orderService_1.fastCreateOrder)(flow, addressParam, group.items);
                let orderId = extractOrderId(result);
                let error = orderId ? '' : extractOrderError(result);
                // 同组内有多个商品但整体下单失败时，降级为逐个商品下单
                if (!orderId && group.items.length > 1) {
                    console.log(`[order] 卖家 ${group.key} 合并下单失败，降级为逐单创建`);
                    for (const item of group.items) {
                        try {
                            const single = await (0, orderService_1.fastCreateOrder)(flow, addressParam, [item]);
                            const singleId = extractOrderId(single);
                            orders.push({
                                shopName: group.key,
                                offerId: item.offerId,
                                orderId: singleId,
                                error: singleId ? '' : extractOrderError(single),
                                raw: single,
                            });
                        }
                        catch (singleError) {
                            orders.push({
                                shopName: group.key,
                                offerId: item.offerId,
                                orderId: null,
                                error: singleError instanceof Error ? singleError.message : String(singleError),
                            });
                        }
                    }
                    continue;
                }
                orders.push({ shopName: group.key, orderId, error, raw: result });
            }
            catch (groupError) {
                orders.push({
                    shopName: group.key,
                    orderId: null,
                    error: groupError instanceof Error ? groupError.message : String(groupError),
                });
            }
        }
        const succeeded = orders.filter((o) => o.orderId).length;
        res.json({
            success: true,
            message: `已创建 ${succeeded}/${orders.length} 个订单（按卖家拆分）`,
            data: { multi: true, orders },
        });
    }
    catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ success: false, message: '创建失败' });
    }
});
router.post('/inquiry', async (req, res) => {
    try {
        const { orderIdList, question } = req.body;
        if (!orderIdList || !Array.isArray(orderIdList) || !question) {
            return res.status(400).json({ success: false, message: '请提供订单ID列表和问题' });
        }
        const result = await (0, orderService_1.batchOrderInquiry)(orderIdList, question);
        res.json({ success: true, message: '询盘成功', data: result });
    }
    catch (error) {
        console.error('Batch order inquiry error:', error);
        res.status(500).json({ success: false, message: '询盘失败' });
    }
});
router.post('/preview', async (req, res) => {
    try {
        const { flow = 'general', addressParam, cargoParamList } = req.body;
        if (!addressParam || !cargoParamList || !Array.isArray(cargoParamList)) {
            return res.status(400).json({ success: false, message: '请提供完整的订单参数' });
        }
        const result = await (0, orderService_1.previewOrder)(flow, addressParam, cargoParamList);
        res.json({ success: true, message: '预览成功', data: result });
    }
    catch (error) {
        console.error('Preview order error:', error);
        res.status(500).json({ success: false, message: '预览失败' });
    }
});
router.post('/buyerView', async (req, res) => {
    try {
        const { webSite = '1688', orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: '请提供订单ID' });
        }
        const result = await (0, orderService_1.getOrderBuyerView)(webSite, orderId);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get order buyerView error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/pay/alipay', async (req, res) => {
    try {
        const { orderIdList } = req.body;
        if (!orderIdList || !Array.isArray(orderIdList)) {
            return res.status(400).json({ success: false, message: '请提供订单ID列表' });
        }
        const result = await (0, orderService_1.getAlipayUrl)(orderIdList);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get alipay url error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/pay/cross-border', async (req, res) => {
    try {
        const { orderIdList } = req.body;
        if (!orderIdList || !Array.isArray(orderIdList)) {
            return res.status(400).json({ success: false, message: '请提供订单ID列表' });
        }
        const result = await (0, orderService_1.getCrossBorderPayUrl)(orderIdList);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get cross border pay url error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/pay/credit', async (req, res) => {
    try {
        const { orderIdList } = req.body;
        if (!orderIdList || !Array.isArray(orderIdList)) {
            return res.status(400).json({ success: false, message: '请提供订单ID列表' });
        }
        const result = await (0, orderService_1.getCreditPayUrl)(orderIdList);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get credit pay url error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/pay/query-way', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: '请提供订单ID' });
        }
        const result = await (0, orderService_1.queryPayWay)(orderId);
        res.json({ success: true, message: '查询成功', data: result });
    }
    catch (error) {
        console.error('Query pay way error:', error);
        res.status(500).json({ success: false, message: '查询失败' });
    }
});
router.get('/pay/protocol-isopen', async (req, res) => {
    try {
        const result = await (0, orderService_1.isProtocolPayOpen)();
        res.json({ success: true, message: '查询成功', data: result });
    }
    catch (error) {
        console.error('Check protocol pay error:', error);
        res.status(500).json({ success: false, message: '查询失败' });
    }
});
router.post('/pay/protocol-prepare', async (req, res) => {
    try {
        const { orderId } = req.body;
        if (!orderId) {
            return res.status(400).json({ success: false, message: '请提供订单ID' });
        }
        const result = await (0, orderService_1.prepareProtocolPay)(orderId);
        res.json({ success: true, message: '准备成功', data: result });
    }
    catch (error) {
        console.error('Prepare protocol pay error:', error);
        res.status(500).json({ success: false, message: '准备失败' });
    }
});
router.get('/buyer-list', async (req, res) => {
    try {
        const result = await (0, orderService_1.getBuyerOrderList)(req.query);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get buyer order list error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
router.post('/cancel', async (req, res) => {
    try {
        const { webSite = '1688', tradeID, cancelReason, remark } = req.body;
        if (!tradeID || !cancelReason) {
            return res.status(400).json({ success: false, message: '请提供订单ID和取消原因' });
        }
        const result = await (0, orderService_1.cancelOrder)(webSite, tradeID, cancelReason, remark);
        res.json({ success: true, message: '取消成功', data: result });
    }
    catch (error) {
        console.error('Cancel order error:', error);
        res.status(500).json({ success: false, message: '取消失败' });
    }
});
router.post('/freight-estimate', async (req, res) => {
    try {
        const { offerId, toProvinceCode, toCityCode, toCountryCode, totalNum, logisticsSkuNumModels } = req.body;
        if (!offerId || !toProvinceCode || !toCityCode || !toCountryCode || !totalNum) {
            return res.status(400).json({ success: false, message: '请提供完整的运费预估参数' });
        }
        const result = await (0, orderService_1.estimateFreight)({
            offerId,
            toProvinceCode,
            toCityCode,
            toCountryCode,
            totalNum,
            logisticsSkuNumModels,
        });
        res.json({ success: true, message: '预估成功', data: result });
    }
    catch (error) {
        console.error('Estimate freight error:', error);
        res.status(500).json({ success: false, message: '预估失败' });
    }
});
router.get('/account-period', async (req, res) => {
    try {
        const { pageIndex, pageSize, sellerLoginId } = req.query;
        const result = await (0, orderService_1.getAccountPeriodList)(pageIndex, pageSize, sellerLoginId);
        res.json({ success: true, message: '获取成功', data: result });
    }
    catch (error) {
        console.error('Get account period list error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
