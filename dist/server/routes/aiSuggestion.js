"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiSuggestionRouter = void 0;
const express_1 = require("express");
const matchService_1 = require("../services/matchService");
const apiConfigService_1 = require("../services/apiConfigService");
const router = (0, express_1.Router)();
exports.aiSuggestionRouter = router;
const generateAISuggestion = (productDetail) => {
    const title = productDetail.title || '商品';
    const price = parseFloat(productDetail.price || productDetail.mainPrice?.price || 0);
    const sales = parseInt(productDetail.sales || 0);
    const competitiveAnalysis = `【竞争力分析】
该商品"${title}"在市场上具有一定竞争力。
- 优势：价格适中，销量数据表现${sales > 10000 ? '优秀' : sales > 5000 ? '良好' : '一般'}，说明市场接受度较高
- 劣势：同类商品较多，需要通过差异化定位突出优势
- 建议：重点突出产品独特卖点，加强品牌包装`;
    const targetAudience = `【目标人群】
根据商品特性，目标人群主要包括：
- 年龄层：18-45岁消费群体
- 消费能力：中等及以上收入人群
- 消费场景：日常使用、礼品赠送、商务需求等
- 心理特征：注重品质、追求性价比、关注时尚潮流`;
    const pricingSuggestion = `【定价建议】
当前价格：¥${price || '待定'}
- 成本参考：建议成本控制在售价的60%-70%以内
- 定价策略：可采用阶梯定价，设置不同起订量对应不同价格
- 促销建议：可搭配优惠券、满减活动提升转化率
- 利润空间：建议保持20%-35%的毛利率`;
    const marketTrend = `【市场趋势】
- 行业趋势：当前市场整体呈${sales > 10000 ? '上升' : '平稳'}趋势，需求${sales > 5000 ? '旺盛' : '稳定'}
- 季节因素：建议关注季节性需求变化，提前备货
- 热点方向：可结合当下流行元素进行产品升级
- 竞争格局：市场竞争${sales > 20000 ? '激烈' : '适中'}，需持续优化产品和服务`;
    const profitMargin = `【利润空间】
- 采购成本：建议采购价控制在零售价的50%-60%
- 运营成本：包括物流、推广、人工等约占10%-15%
- 建议毛利率：25%-40%为健康区间
- 提升建议：通过批量采购降低成本，优化供应链管理`;
    const supplyChainSuggestion = `【供应链建议】
- 供应商评估：建议选择3-5家备选供应商，分散风险
- 交货周期：关注供应商交货能力，确保48小时内发货
- 库存管理：建议根据销量设置安全库存，避免积压或缺货
- 质检把控：建立完善的质检流程，确保产品质量稳定`;
    const riskWarning = `【风险提示】
- 市场风险：市场需求变化快，需及时调整产品策略
- 竞争风险：同类产品竞争激烈，需持续创新
- 供应链风险：供应商稳定性需持续监控
- 合规风险：确保产品符合相关法律法规要求
- 建议：建立风险预警机制，制定应急预案`;
    const opportunities = `【机会点】
- 细分市场：可针对特定人群开发细分产品
- 渠道拓展：多平台布局，扩大销售渠道
- 产品升级：根据用户反馈持续优化产品
- 品牌建设：打造品牌影响力，提升溢价能力
- 建议：抓住市场窗口期，快速抢占份额`;
    return {
        competitiveAnalysis,
        targetAudience,
        pricingSuggestion,
        marketTrend,
        profitMargin,
        supplyChainSuggestion,
        riskWarning,
        opportunities,
    };
};
router.post('/suggestion', async (req, res) => {
    try {
        const { num_iid, productInfo } = req.body;
        if (!num_iid && !productInfo) {
            return res.status(400).json({
                success: false,
                message: '请提供商品ID或商品信息',
            });
        }
        let productDetail = productInfo || {};
        if (!productDetail || Object.keys(productDetail).length === 0) {
            if (num_iid) {
                const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
                const detail = await (0, matchService_1.getProductDetail)(num_iid, API_KEY, API_SECRET);
                if (detail) {
                    productDetail = detail;
                }
            }
        }
        const suggestion = generateAISuggestion(productDetail);
        res.json({
            success: true,
            message: 'AI选品建议生成成功',
            data: suggestion,
        });
    }
    catch (error) {
        console.error('AI suggestion error:', error);
        const message = error instanceof Error ? error.message : '生成AI选品建议失败';
        const fallbackSuggestion = {
            competitiveAnalysis: '建议结合实际市场调研分析竞争力',
            targetAudience: '建议结合实际市场调研确定目标人群',
            pricingSuggestion: '建议参考同类商品定价',
            marketTrend: '建议关注行业动态和平台数据',
            profitMargin: '建议详细核算成本和定价策略',
            supplyChainSuggestion: '建议多渠道对比货源和物流方案',
            riskWarning: '建议评估市场风险和竞争压力',
            opportunities: '建议关注市场机会点和发展趋势',
        };
        res.json({
            success: true,
            message: message,
            data: fallbackSuggestion,
        });
    }
});
