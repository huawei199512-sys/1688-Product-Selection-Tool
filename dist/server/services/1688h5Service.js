"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshProxies = exports.setProxyEnabled = exports.getProxyStatus = exports.searchByKeyword = exports.getProductDetail = void 0;
const axios_1 = __importDefault(require("axios"));
const proxyManager_1 = require("./proxyManager");
const DETAIL_PAGE_URL = 'https://detail.1688.com/offer/{offerId}.html';
const LAPUTA_DETAIL_API = 'https://laputa.1688.com/offer/ajax/WidgetOfferDetail.do';
const LAPUTA_REALTIME_API = 'https://laputa.1688.com/offer/ajax/OfferDetailWidget.do';
const LAPUTA_DESC_API = 'https://laputa.1688.com/offer/ajax/OfferDesc.do';
const SEARCH_PAGE_URL = 'https://s.1688.com/selloffer/offer_search.htm';
const PROXY_TIMEOUT_MS = 8000;
const MAX_TOTAL_MS = 60000;
const MAX_PROXY_ATTEMPTS = 15;
const CONCURRENT_PER_ROUND = 3;
const MAX_ROUNDS = 8;
const getRandomCallback = () => {
    return 'jsonp' + Date.now() + Math.floor(Math.random() * 1000);
};
const parseJSONP = (jsonp) => {
    if (!jsonp)
        return null;
    try {
        const text = typeof jsonp === 'string' ? jsonp : String(jsonp);
        const match = text.match(/\((\{.*\})\)\s*;?\s*$/s) || text.match(/\((\{.*\})\)/s);
        if (match) {
            return JSON.parse(match[1]);
        }
        return JSON.parse(text);
    }
    catch {
        return null;
    }
};
const createProxyAxios = (proxyStr) => {
    const agent = proxyManager_1.proxyManager.createAgent(proxyStr);
    return axios_1.default.create({
        timeout: PROXY_TIMEOUT_MS,
        httpAgent: agent,
        httpsAgent: agent,
        proxy: false,
        validateStatus: () => true,
        maxRedirects: 3,
        headers: {
            'User-Agent': proxyManager_1.proxyManager.getRandomUA(),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        },
    });
};
const withTimeout = (promise, ms) => {
    return new Promise((resolve, reject) => {
        const controller = new AbortController();
        const timer = setTimeout(() => {
            controller.abort();
            reject(new Error(`请求超时 ${ms}ms`));
        }, ms);
        promise.then((value) => {
            clearTimeout(timer);
            resolve(value);
        }, (reason) => {
            clearTimeout(timer);
            reject(reason);
        });
    });
};
const tryProxyRequest = async (url, options = {}) => {
    const proxy = proxyManager_1.proxyManager.getProxy();
    if (!proxy) {
        return { success: false, data: null, proxy: '', error: '无可用代理' };
    }
    try {
        const instance = createProxyAxios(proxy);
        const headers = {
            ...options.headers,
            Referer: options.referer || 'https://www.1688.com/',
        };
        if (options.needPageFirst) {
            try {
                await instance.get(options.referer || url, { headers, timeout: PROXY_TIMEOUT_MS });
            }
            catch {
                // 预热失败也继续尝试主请求
            }
        }
        const response = await instance({
            method: options.method || 'GET',
            url,
            data: options.data,
            headers,
            timeout: PROXY_TIMEOUT_MS,
        });
        if (response.status === 200 && response.data) {
            proxyManager_1.proxyManager.markSuccess(proxy);
            return { success: true, data: response.data, proxy };
        }
        else {
            proxyManager_1.proxyManager.markFailed(proxy);
            return { success: false, data: null, proxy, error: `HTTP ${response.status}` };
        }
    }
    catch (error) {
        proxyManager_1.proxyManager.markFailed(proxy);
        const errName = error.name || '';
        const errCode = error.code || '';
        if (errName === 'CanceledError' || errName === 'AbortError' || errCode === 'ERR_CANCELED') {
            return { success: false, data: null, proxy, error: '请求超时' };
        }
        return { success: false, data: null, proxy, error: error.message || '请求失败' };
    }
};
const requestWithProxyRace = async (url, options = {}) => {
    if (!proxyManager_1.proxyManager.isEnabled()) {
        throw new Error('代理模式未启用');
    }
    const deadline = Date.now() + MAX_TOTAL_MS;
    let lastError = '';
    for (let round = 0; round < MAX_ROUNDS; round++) {
        if (Date.now() > deadline) {
            throw new Error(`总超时，最后错误: ${lastError}`);
        }
        const promises = [];
        for (let i = 0; i < CONCURRENT_PER_ROUND; i++) {
            promises.push(tryProxyRequest(url, options));
        }
        try {
            const results = await Promise.allSettled(promises);
            for (const result of results) {
                if (result.status === 'fulfilled' && result.value.success) {
                    return result.value.data;
                }
                else if (result.status === 'fulfilled') {
                    lastError = result.value.error || lastError;
                }
            }
        }
        catch (error) {
            lastError = error.message;
        }
    }
    throw new Error(`所有代理尝试失败，最后错误: ${lastError}`);
};
const generateMockDetail = (offerId) => {
    const mockImages = [
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=1688%20product%20detail%20ecommerce&image_size=square`,
        `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=1688%20product%20detail%20image%202&image_size=landscape_16_9`,
    ];
    return {
        offerId,
        subject: '1688商品（示例数据 - 代理请求失败）',
        price: '0.00',
        priceRange: [],
        saleNum: '0',
        shopName: '未知店铺',
        shopUrl: '',
        images: mockImages,
        descImages: [],
        skus: [],
        attributes: [],
        detailUrl: `https://detail.1688.com/offer/${offerId}.html`,
        stock: 0,
        moq: 1,
        freight: {},
        seller: {},
        rawData: { note: '代理请求失败，返回示例数据' },
    };
};
const generateMockSearch = (keyword, page, pageSize) => {
    const mockProducts = [];
    for (let i = 0; i < Math.min(pageSize, 5); i++) {
        const id = `${Date.now()}${i}`;
        mockProducts.push({
            offerId: id,
            subject: `${keyword} - 示例商品 ${i + 1}（代理请求失败）`,
            price: `${(Math.random() * 100 + 10).toFixed(2)}`,
            saleNum: `${Math.floor(Math.random() * 10000) + 100}+`,
            shopName: '示例店铺',
            imageUrl: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=1688%20${encodeURIComponent(keyword)}&image_size=square`,
            detailUrl: `https://detail.1688.com/offer/${id}.html`,
        });
    }
    return {
        products: mockProducts,
        totalCount: mockProducts.length,
        page,
        pageSize,
    };
};
const getProductDetail = async (offerId) => {
    console.log(`[1688H5] 获取商品详情(无cookie+代理): ${offerId}`);
    try {
        await proxyManager_1.proxyManager.refreshProxies();
        const referer = DETAIL_PAGE_URL.replace('{offerId}', offerId);
        const detailUrl = `${LAPUTA_DETAIL_API}?offerId=${offerId}&callback=${getRandomCallback()}`;
        console.log(`[1688H5] 调用 laputa 详情接口: ${detailUrl}`);
        const detailResult = await requestWithProxyRace(detailUrl, {
            needPageFirst: true,
            referer,
        });
        const detailData = parseJSONP(detailResult);
        if (!detailData) {
            console.warn('[1688H5] 详情接口返回数据解析失败，尝试备用接口');
            return await getProductDetailFallback(offerId, referer);
        }
        let realtimeData = null;
        try {
            const realtimeUrl = `${LAPUTA_REALTIME_API}?offerId=${offerId}&callback=${getRandomCallback()}`;
            const realtimeResult = await requestWithProxyRace(realtimeUrl, { referer });
            realtimeData = parseJSONP(realtimeResult);
        }
        catch (error) {
            console.warn('[1688H5] 实时库存价格接口失败:', error.message);
        }
        let descImages = [];
        try {
            const descUrl = `${LAPUTA_DESC_API}?offerId=${offerId}&callback=${getRandomCallback()}`;
            const descResult = await requestWithProxyRace(descUrl, { referer });
            const descData = parseJSONP(descResult);
            if (descData && descData.content) {
                const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
                let imgMatch;
                while ((imgMatch = imgRegex.exec(descData.content)) !== null) {
                    const imgUrl = imgMatch[1];
                    if (imgUrl && (imgUrl.startsWith('http://') || imgUrl.startsWith('https://') || imgUrl.startsWith('//'))) {
                        const fullUrl = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl;
                        descImages.push(fullUrl);
                    }
                }
            }
        }
        catch (error) {
            console.warn('[1688H5] 详情图接口失败:', error.message);
        }
        const subject = detailData.subject || detailData.title || '';
        const price = detailData.price || (realtimeData && realtimeData.price) || '';
        const priceRange = detailData.priceRanges || detailData.priceRange || [];
        const saleNum = detailData.saleNum || detailData.saleCount || (realtimeData && realtimeData.saleCount) || '0';
        const shopName = detailData.seller?.companyName || detailData.seller?.shopName || detailData.companyName || '';
        const shopUrl = detailData.seller?.shopUrl || detailData.sellerUrl || '';
        const detailUrl2 = `https://detail.1688.com/offer/${offerId}.html`;
        const images = [];
        if (detailData.imageList && Array.isArray(detailData.imageList)) {
            detailData.imageList.forEach((img) => {
                const imgUrl = img.originalImageURI || img.imageUrl || img.url || '';
                if (imgUrl) {
                    const fullUrl = imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl;
                    images.push(fullUrl);
                }
            });
        }
        if (images.length === 0 && detailData.picUrl) {
            const fullUrl = detailData.picUrl.startsWith('//') ? 'https:' + detailData.picUrl : detailData.picUrl;
            images.push(fullUrl);
        }
        const skus = [];
        const skuInfoMap = detailData.skuInfoMap || detailData.skuMap || {};
        const skuImgMap = detailData.skuImgMap || detailData.mainSkuImgs || {};
        if (Array.isArray(detailData.skuList)) {
            detailData.skuList.forEach((sku) => {
                skus.push({
                    skuId: String(sku.skuId || ''),
                    specAttrs: sku.specAttrs || sku.propertiesName || sku.name || '',
                    price: sku.price || '',
                    discountPrice: sku.discountPrice || sku.discount_price || '',
                    saleCount: sku.saleCount || 0,
                    canBookCount: sku.canBookCount || 0,
                    stock: sku.quantity || sku.stock || 0,
                    skuImg: sku.skuImg || sku.imageUrl || '',
                });
            });
        }
        else {
            Object.entries(skuInfoMap).forEach(([specKey, skuInfo]) => {
                const skuId = skuInfo.skuId || '';
                const skuImg = skuImgMap[skuId] || '';
                skus.push({
                    skuId: String(skuId),
                    specAttrs: specKey,
                    price: skuInfo.price || '',
                    discountPrice: skuInfo.discountPrice || '',
                    saleCount: skuInfo.saleCount || 0,
                    canBookCount: skuInfo.canBookCount || 0,
                    stock: skuInfo.quantity || skuInfo.stock || 0,
                    skuImg,
                });
            });
        }
        const attributes = [];
        if (detailData.propsList && Array.isArray(detailData.propsList)) {
            detailData.propsList.forEach((prop) => {
                attributes.push({
                    name: prop.name || prop.label || '',
                    value: prop.value || prop.attrValue || '',
                });
            });
        }
        else if (detailData.props && Array.isArray(detailData.props)) {
            detailData.props.forEach((prop) => {
                attributes.push({
                    name: prop.name || '',
                    value: prop.value || '',
                });
            });
        }
        const stock = realtimeData?.quantity || detailData.canBookCount || detailData.stock || 0;
        const moq = detailData.moq || realtimeData?.moq || 1;
        console.log(`[1688H5] 商品详情获取成功: ${offerId}, 图片:${images.length}, SKU:${skus.length}, 属性:${attributes.length}`);
        return {
            offerId,
            subject,
            price,
            priceRange,
            saleNum: String(saleNum),
            shopName,
            shopUrl,
            images,
            descImages,
            skus,
            attributes,
            detailUrl: detailUrl2,
            stock,
            moq,
            freight: detailData.freightModel || detailData.freight || {},
            seller: detailData.seller || {},
            rawData: { detail: detailData, realtime: realtimeData },
        };
    }
    catch (error) {
        console.error('[1688H5] 获取商品详情失败:', error.message);
        return generateMockDetail(offerId);
    }
};
exports.getProductDetail = getProductDetail;
const getProductDetailFallback = async (offerId, referer) => {
    try {
        console.log('[1688H5] 尝试备用方案：直接解析商品详情页HTML');
        const pageUrl = DETAIL_PAGE_URL.replace('{offerId}', offerId);
        const htmlResult = await requestWithProxyRace(pageUrl, { referer: 'https://www.1688.com/' });
        let html = '';
        if (typeof htmlResult === 'string') {
            html = htmlResult;
        }
        else if (htmlResult && htmlResult.data) {
            html = typeof htmlResult.data === 'string' ? htmlResult.data : JSON.stringify(htmlResult.data);
        }
        let subject = '';
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch) {
            subject = titleMatch[1].replace(/-.*$/, '').trim();
        }
        const ldMatch = html.match(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i);
        let ldData = null;
        if (ldMatch) {
            try {
                ldData = JSON.parse(ldMatch[1].trim());
            }
            catch {
                // 忽略解析错误
            }
        }
        if (ldData) {
            const images = [];
            if (ldData.image) {
                const imgArr = Array.isArray(ldData.image) ? ldData.image : [ldData.image];
                imgArr.forEach((img) => {
                    if (typeof img === 'string') {
                        const fullUrl = img.startsWith('//') ? 'https:' + img : img;
                        images.push(fullUrl);
                    }
                });
            }
            return {
                offerId,
                subject: ldData.name || subject,
                price: ldData.offers?.price || '',
                priceRange: [],
                saleNum: '0',
                shopName: '',
                shopUrl: '',
                images,
                descImages: [],
                skus: [],
                attributes: [],
                detailUrl: `https://detail.1688.com/offer/${offerId}.html`,
                stock: 0,
                moq: 1,
                freight: {},
                seller: {},
                rawData: { source: 'html_ld', ldData },
            };
        }
        return generateMockDetail(offerId);
    }
    catch (error) {
        console.error('[1688H5] 备用方案也失败:', error.message);
        return generateMockDetail(offerId);
    }
};
const searchByKeyword = async (keyword, page = 1, pageSize = 40) => {
    console.log(`[1688H5] 关键字搜索(无cookie+代理): ${keyword}, 第${page}页`);
    try {
        await proxyManager_1.proxyManager.refreshProxies();
        const url = `${SEARCH_PAGE_URL}?keywords=${encodeURIComponent(keyword)}&pageno=${page}`;
        console.log(`[1688H5] 调用搜索页: ${url}`);
        const htmlResult = await requestWithProxyRace(url, { referer: 'https://www.1688.com/' });
        let html = '';
        if (typeof htmlResult === 'string') {
            html = htmlResult;
        }
        else if (htmlResult && htmlResult.data) {
            html = typeof htmlResult.data === 'string' ? htmlResult.data : JSON.stringify(htmlResult.data);
        }
        if (!html) {
            console.warn('[1688H5] 搜索页返回空内容');
            return generateMockSearch(keyword, page, pageSize);
        }
        const products = [];
        const beginIdx = html.indexOf('window.__INIT_DATA__');
        const endIdx = html.indexOf('</script>', beginIdx);
        if (beginIdx !== -1 && endIdx !== -1) {
            const scriptContent = html.substring(beginIdx, endIdx);
            const jsonMatch = scriptContent.match(/=\s*(\{[\s\S]*\})\s*;?\s*$/);
            if (jsonMatch) {
                try {
                    const initData = JSON.parse(jsonMatch[1]);
                    const offerList = initData?.data?.offerList || initData?.offerList || [];
                    offerList.forEach((item) => {
                        const offerId = String(item.offerId || item.id || '');
                        if (!offerId)
                            return;
                        const imgUrl = item.picUrl || item.image?.url || '';
                        const fullImgUrl = imgUrl && imgUrl.startsWith('//') ? 'https:' + imgUrl : imgUrl;
                        products.push({
                            offerId,
                            subject: item.title || item.subject || '',
                            price: item.price || item.priceInfo?.price || '',
                            saleNum: String(item.saleNum || item.salesCount || item.monthSold || ''),
                            shopName: item.companyName || item.shopName || '',
                            imageUrl: fullImgUrl,
                            detailUrl: `https://detail.1688.com/offer/${offerId}.html`,
                        });
                    });
                }
                catch (e) {
                    console.warn('[1688H5] 解析INIT_DATA失败:', e.message);
                }
            }
        }
        if (products.length === 0) {
            const offerRegex = /href=["']https?:\/\/detail\.1688\.com\/offer\/(\d+)\.html["'][^>]*>([\s\S]*?)<\/a>/gi;
            let match;
            while ((match = offerRegex.exec(html)) !== null) {
                const offerId = match[1];
                const block = match[2];
                const titleMatch = block.match(/title=["']([^"']+)["']/i) || block.match(/>([^<]{5,})</);
                const imgMatch = block.match(/src=["']([^"']+)["']/i);
                const priceMatch = block.match(/["']?price["']?\s*[:=]\s*["']?([\d.]+)/i);
                const title = titleMatch ? titleMatch[1].trim() : '';
                const img = imgMatch ? imgMatch[1] : '';
                const fullImg = img && img.startsWith('//') ? 'https:' + img : img;
                const price = priceMatch ? priceMatch[1] : '';
                if (offerId && title) {
                    products.push({
                        offerId,
                        subject: title,
                        price,
                        saleNum: '',
                        shopName: '',
                        imageUrl: fullImg,
                        detailUrl: `https://detail.1688.com/offer/${offerId}.html`,
                    });
                }
            }
        }
        let totalCount = products.length;
        const totalMatch = html.match(/["']?totalCount["']?\s*[:=]\s*(\d+)/i) ||
            html.match(/共\s*(\d+)\s*条/i) ||
            html.match(/(\d+)\s*件商品/i);
        if (totalMatch) {
            totalCount = parseInt(totalMatch[1]);
        }
        const limited = products.slice(0, pageSize);
        console.log(`[1688H5] 搜索成功: 解析到${limited.length}个商品, 总数:${totalCount}`);
        return {
            products: limited,
            totalCount,
            page,
            pageSize,
        };
    }
    catch (error) {
        console.error('[1688H5] 关键字搜索失败:', error.message);
        return generateMockSearch(keyword, page, pageSize);
    }
};
exports.searchByKeyword = searchByKeyword;
const getProxyStatus = () => {
    return proxyManager_1.proxyManager.getStatus();
};
exports.getProxyStatus = getProxyStatus;
const setProxyEnabled = (enabled) => {
    proxyManager_1.proxyManager.setEnabled(enabled);
    return proxyManager_1.proxyManager.getStatus();
};
exports.setProxyEnabled = setProxyEnabled;
const refreshProxies = async () => {
    const proxies = await proxyManager_1.proxyManager.refreshProxies(true);
    return {
        ...proxyManager_1.proxyManager.getStatus(),
        proxies_count: proxies.length,
    };
};
exports.refreshProxies = refreshProxies;
