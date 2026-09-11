"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRouter = void 0;
const express_1 = require("express");
const router = (0, express_1.Router)();
exports.chatRouter = router;
router.post('/', async (req, res) => {
    try {
        const { history, message, lang } = req.body;
        if (!message) {
            return res.status(400).json({
                success: false,
                message: lang === 'en' ? 'Please enter a message' : '请输入消息',
            });
        }
        const response = await analyzeAndRespond(history, message, lang);
        res.json({
            success: true,
            message: '获取成功',
            data: response,
        });
    }
    catch (error) {
        console.error('Chat error:', error);
        const response = {
            response: '抱歉，我遇到了一些问题，请稍后再试。',
        };
        res.json({
            success: true,
            message: '获取成功',
            data: response,
        });
    }
});
// 商品「识图提问」：基于该商品数据生成回答
const buildProductAnswer = (product, question, lang) => {
    const en = lang === 'en';
    const p = product || {};
    const price = parseFloat(String(p.price || '').replace(/[^\d.]/g, '')) || 0;
    const sales = parseInt(String(p.sales || '').replace(/[^\d]/g, ''), 10) || 0;
    const title = p.title || (en ? '(no title)' : '(无标题)');
    const shop = p.shopName || (en ? 'unknown shop' : '未知店铺');
    const facts = [
        (en ? 'Product: ' : '商品：') + title,
        (en ? 'Price: ' : '价格：') + (price ? '¥' + price : '-'),
        (en ? 'Sales: ' : '成交：') + sales + (en ? '' : '件'),
        (en ? 'Shop: ' : '店铺：') + shop,
    ];
    if (p.minNum) {
        facts.push((en ? 'Min order qty: ' : '最小起批量：') + p.minNum);
    }
    const points = [];
    if (/物流|运费|发货|时效|shipping|delivery|freight/i.test(question)) {
        points.push(en ? 'Confirm shipping cost and lead time to your target country before deciding the quantity.' : '先向供应商确认到目标国家/地区的运费与发货时效，再决定采购数量。');
    }
    if (/质量|材质|成分|质检|material|quality/i.test(question)) {
        points.push(en ? 'Ask for material details and real photos, and buy 1 sample to verify quality first.' : '建议索要材质说明与实拍图，先买 1 件样品验货再批量下单。');
    }
    if (/价格|便宜|议价|降价|优惠|discount|price|cheaper/i.test(question)) {
        points.push(en ? 'Ask for tiered pricing and negotiate with a larger quantity; confirm whether tax/freight is included.' : '可要求阶梯报价，用更大数量议价，并确认报价是否含税与运费。');
    }
    if (/人群|客户|市场|卖点|target|market|customer/i.test(question)) {
        points.push(en ? 'Judge the target audience by style and price positioning; compare with similar listings before choosing.' : '结合款式与价格定位判断目标人群，建议先对比同款listing再决定主推方向。');
    }
    if (/定制|贴牌|logo|打样|custom|oem/i.test(question)) {
        points.push(en ? 'Ask about customization MOQ, sampling time and extra cost.' : '需确认定制起订量、打样周期与额外费用。');
    }
    if (/库存|现货|交期|stock|lead time/i.test(question)) {
        points.push(en ? 'Confirm stock availability and production lead time before promising delivery to buyers.' : '先确认现货库存与生产交期，避免对下游承诺无法履约。');
    }
    if (points.length === 0) {
        points.push(en ? 'You can ask about: price negotiation, samples, shipping, customization, stock, or target market.' : '可以问我：议价空间、样品验货、运费时效、定制贴牌、库存交期、目标人群等。');
    }
    if (sales >= 1000) {
        points.push(en ? 'Sales are relatively high (>1000), suggesting decent market acceptance.' : '成交量较高（>1000），说明市场接受度不错。');
    }
    else if (sales > 0 && sales < 100) {
        points.push(en ? 'Sales are low (<100); verify demand and quality carefully.' : '成交量偏低（<100），建议谨慎验证需求与质量。');
    }
    if (price > 0 && price <= 10) {
        points.push(en ? 'Low unit price: profit relies on volume, so calculate packaging and freight first.' : '单价偏低，利润依赖走量，务必先核算包装与运费成本。');
    }
    const lines = [
        (en ? 'Product snapshot' : '商品概况'),
        facts.join('　|　'),
        '',
        (en ? 'Your question: ' : '你的问题：') + question,
        '',
    ].concat(points.map((x) => '· ' + x));
    lines.push('');
    lines.push(en ? '(Answer generated from this product data, not an LLM output)' : '(回答基于该商品数据自动生成，非大模型输出)');
    return {
        response: lines.join('\n'),
        action: 'none',
    };
};
router.post('/product', async (req, res) => {
    try {
        const { product, question, lang } = req.body || {};
        if (!question || !String(question).trim()) {
            return res.status(400).json({ success: false, message: lang === 'en' ? 'Please enter a question' : '请输入问题' });
        }
        const data = buildProductAnswer(product, String(question).trim(), lang);
        res.json({ success: true, message: '获取成功', data });
    }
    catch (error) {
        console.error('Product QA error:', error);
        res.json({ success: true, message: '获取成功', data: { response: '抱歉，暂时无法回答，请稍后再试。', action: 'none' } });
    }
});
const analyzeAndRespond = async (history, message, lang) => {
    const lowerMessage = message.toLowerCase();
    const isEnglish = lang === 'en';
    const searchKeywords = [];
    let priceRange = [];
    let category = '';
    let action = 'none';
    let extractedKeyword = '';
    const brandAndProducts = [
        '旺旺雪饼', '旺旺仙贝', '旺仔牛奶', '旺仔小馒头',
        '乐事薯片', '可比克', '品客',
        '奥利奥', '趣多多', '太平饼干',
        '卫龙辣条', '辣条', '麻辣',
        '三只松鼠', '良品铺子', '百草味', '来伊份',
        '可口可乐', '百事可乐', '雪碧', '芬达',
        '农夫山泉', '怡宝', '娃哈哈',
        '康师傅', '统一', '方便面', '泡面',
        '蒙牛', '伊利', '光明', '三元',
        '华为', '小米', '苹果', '三星', 'OPPO', 'vivo',
        '耐克', '阿迪达斯', '李宁', '安踏',
        '优衣库', 'ZARA', 'HM', '森马',
        '美的', '格力', '海尔', '西门子',
        '小米电视', '创维', 'TCL', '海信',
        '九阳', '苏泊尔', '飞利浦', '松下',
        '雅诗兰黛', '兰蔻', '迪奥', '香奈儿',
        'SK-II', '资生堂', '欧莱雅', '玉兰油',
        '完美日记', '花西子', '珂拉琪',
        '乐高', '迪士尼', '芭比', '奥特曼',
        '好孩子', '帮宝适', '好奇', '花王',
    ];
    const categories = [
        '女装', '男装', '童装', '鞋', '包', '服饰', '服装', '衣服', '裤子', '裙子', '外套', '衬衫', 'T恤', '卫衣', '毛衣',
        '电子产品', '手机', '手机壳', '手机配件', '电脑', '耳机', '音响', '充电器', '数据线', '充电宝', '平板', '手表',
        '家居', '家具', '厨房', '卫浴', '收纳', '装饰', '摆件', '灯具', '窗帘', '地毯', '床上用品',
        '美妆', '护肤', '化妆品', '口红', '面膜', '香水', '彩妆', '粉底液', '眼霜', '面霜',
        '食品', '零食', '饮料', '坚果', '糖果', '饼干', '巧克力', '薯片', '方便面', '辣条',
        '玩具', '文具', '礼品', '饰品', '配件', '手办',
        '运动', '户外', '健身', '器材', '瑜伽', '跑步',
        '办公', '文具', '耗材', '打印机', '复印机',
        '宠物', '用品', '猫粮', '狗粮', '猫砂', '宠物玩具',
        '汽车', '配件', '用品', '坐垫', '脚垫', '行车记录仪',
        '母婴', '婴儿', '宝宝', '纸尿裤', '奶粉', '奶瓶',
        '图书', '书籍', '教材', '小说', '杂志',
        '生鲜', '水果', '蔬菜', '肉类', '海鲜',
        '酒水', '白酒', '红酒', '啤酒', '黄酒',
        '数码', '相机', '镜头', '三脚架', '存储卡',
    ];
    const pricePattern = /(\d+(\.\d+)?)\s*[元块]?\s*[-到至]\s*(\d+(\.\d+)?)\s*[元块]?/;
    const singlePricePattern = /(\d+(\.\d+)?)\s*[元块]/;
    let hasPriceLimit = false;
    if (lowerMessage.includes('便宜') || lowerMessage.includes('实惠') || lowerMessage.includes('低价') ||
        lowerMessage.includes('不贵') || lowerMessage.includes('性价比高')) {
        hasPriceLimit = true;
        priceRange = ['0', '50'];
    }
    for (const product of brandAndProducts) {
        if (message.includes(product)) {
            searchKeywords.push(product);
        }
    }
    for (const category of categories) {
        if (message.includes(category)) {
            searchKeywords.push(category);
        }
    }
    const priceMatch = message.match(pricePattern);
    if (priceMatch) {
        priceRange = [priceMatch[1], priceMatch[3]];
    }
    else if (!hasPriceLimit) {
        const singleMatch = message.match(singlePricePattern);
        if (singleMatch) {
            priceRange = ['0', singleMatch[1]];
        }
    }
    const keywordsToRemove = ['便宜', '实惠', '低价', '不贵', '性价比高', '搜索', '找', '买', '一款', '一个', '一件', '一些', '的'];
    let cleanMessage = message;
    keywordsToRemove.forEach(kw => {
        cleanMessage = cleanMessage.replace(new RegExp(kw, 'g'), '');
    });
    cleanMessage = cleanMessage.trim();
    if (lowerMessage.includes('图片') || lowerMessage.includes('照片') || lowerMessage.includes('上传')) {
        action = 'image_search';
    }
    if (lowerMessage.includes('搜索') || lowerMessage.includes('找') || lowerMessage.includes('买') || searchKeywords.length > 0 || message.length <= 10) {
        action = 'search';
    }
    if (action === 'search') {
        if (searchKeywords.length > 0) {
            extractedKeyword = searchKeywords.join(' ');
        }
        else {
            extractedKeyword = message.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, '').slice(0, 30);
            if (!extractedKeyword || extractedKeyword.trim() === '') {
                extractedKeyword = message.slice(0, 30);
            }
        }
    }
    let responseText = '';
    if (action === 'search') {
        if (searchKeywords.length > 0) {
            if (isEnglish) {
                responseText = `OK! Let me search for products related to [${searchKeywords.join(', ')}].`;
                if (priceRange.length > 0) {
                    responseText += ` Price range: ¥${priceRange[0]}-¥${priceRange[1]}`;
                }
                responseText += ' Searching...';
            }
            else {
                responseText = `好的！我来帮您搜索【${searchKeywords.join('、')}】相关的商品。`;
                if (priceRange.length > 0) {
                    responseText += ` 价格区间：¥${priceRange[0]}-¥${priceRange[1]}`;
                }
                responseText += ' 正在搜索中...';
            }
        }
        else {
            if (isEnglish) {
                responseText = `OK! Let me search for products related to [${extractedKeyword}]. Searching...`;
            }
            else {
                responseText = `好的！我来帮您搜索【${extractedKeyword}】相关的商品。正在搜索中...`;
            }
        }
    }
    else if (action === 'image_search') {
        if (isEnglish) {
            responseText = 'OK! I understand you want to do image search. Please upload a product image, and I will help you find similar products.';
        }
        else {
            responseText = '好的！我理解您想要进行图片搜索。请上传一张商品图片，我会帮您找到相似的商品。';
        }
    }
    else {
        const suggestions = isEnglish ? [
            'You can tell me what kind of products you are looking for, such as: women clothing, electronics, home goods, etc.',
            'You can also describe product features, such as: price range, usage, material, etc.',
            'Or upload a product image, and I will help you search for similar products.',
        ] : [
            '您可以告诉我您想找什么样的商品，比如：女装、电子产品、家居用品等',
            '也可以描述商品的特征，比如：价格区间、用途、材质等',
            '或者上传一张商品图片，我会帮您搜索相似商品',
        ];
        if (isEnglish) {
            responseText = `I understand your needs. ${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
        }
        else {
            responseText = `我理解您的需求。${suggestions[Math.floor(Math.random() * suggestions.length)]}`;
        }
        if (searchKeywords.length > 0) {
            if (isEnglish) {
                responseText += ` Are you looking for products related to [${searchKeywords.join(', ')}]?`;
            }
            else {
                responseText += ` 您是想找【${searchKeywords.join('、')}】相关的商品吗？`;
            }
            action = 'search';
            extractedKeyword = searchKeywords.join(' ');
        }
    }
    return {
        response: responseText,
        action,
        keyword: action === 'search' ? extractedKeyword : undefined,
        imageUrl: action === 'image_search' ? '' : undefined,
    };
};
