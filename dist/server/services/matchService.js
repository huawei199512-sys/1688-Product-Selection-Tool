"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchByKeyword = exports.getRankList = exports.matchProducts = exports.getProductDetail = exports.searchByImage = exports.uploadBase64Image = exports.uploadImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const axios_1 = __importDefault(require("axios"));
const apiConfigService_1 = require("./apiConfigService");
const apiGuard_1 = require("./apiGuard");
const API_BASE_URL = 'https://api-gw.onebound.cn/1688global';
const buildUrl = (path, params) => {
    const searchParams = new URLSearchParams(params);
    return `${API_BASE_URL}${path}/?${searchParams.toString()}`;
};
const uploadBase64ToServer = (base64Data) => {
    try {
        const matches = base64Data.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return null;
        }
        const ext = matches[1].split('/')[1] || 'jpg';
        const data = matches[2];
        const buffer = Buffer.from(data, 'base64');
        const isPkg = !!process.pkg;
        const appDir = isPkg ? path_1.default.dirname(process.execPath) : __dirname;
        const uploadDir = path_1.default.join(appDir, 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        const filename = `${Date.now()}.${ext}`;
        const filePath = path_1.default.join(uploadDir, filename);
        fs_1.default.writeFileSync(filePath, buffer);
        return `http://localhost:${process.env.PORT || 3001}/uploads/${filename}`;
    }
    catch (error) {
        console.error('Upload base64 to server error:', error);
        return null;
    }
};
const uploadToPostImg = async (base64Data) => {
    try {
        const pureBase64 = base64Data.split(';base64,').pop() || base64Data;
        const buffer = Buffer.from(pureBase64, 'base64');
        console.log('=== uploadToPostImg ===');
        console.log('File size:', buffer.length, 'bytes');
        const formData = new (await Promise.resolve().then(() => __importStar(require('form-data')))).default();
        formData.append('image', buffer, { filename: `image_${Date.now()}.jpg` });
        const response = await axios_1.default.post('https://postimg.cc/json/upload', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data).substring(0, 500));
        if (response.data && response.data.success && response.data.url) {
            console.log('Upload to postimg.cc success, url:', response.data.url);
            return response.data.url;
        }
        console.error('Upload to postimg.cc failed:', response.data);
        return null;
    }
    catch (error) {
        console.error('Upload to postimg.cc error:', error);
        return null;
    }
};
const uploadToImgbb = async (base64Data) => {
    try {
        const IMGBB_API_KEY = 'e1c28f7178767890035f8c566a920987';
        const pureBase64 = base64Data.split(';base64,').pop() || base64Data;
        const formData = new (await Promise.resolve().then(() => __importStar(require('form-data')))).default();
        formData.append('key', IMGBB_API_KEY);
        formData.append('image', pureBase64);
        const response = await axios_1.default.post('https://api.imgbb.com/1/upload', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data).substring(0, 500));
        if (response.data && response.data.success && response.data.data && response.data.data.url) {
            console.log('Upload to imgbb success, url:', response.data.data.url);
            return response.data.data.url;
        }
        console.error('Upload to imgbb failed:', response.data);
        return null;
    }
    catch (error) {
        console.error('Upload to imgbb error:', error);
        return null;
    }
};
const uploadToTransferSh = async (base64Data) => {
    try {
        const pureBase64 = base64Data.split(';base64,').pop() || base64Data;
        const buffer = Buffer.from(pureBase64, 'base64');
        console.log('=== uploadToTransferSh ===');
        console.log('File size:', buffer.length, 'bytes');
        const response = await axios_1.default.put('https://transfer.sh/image.jpg', buffer, {
            headers: {
                'Content-Type': 'image/jpeg',
                'Content-Length': buffer.length,
            },
            timeout: 30000,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        if (response.data && typeof response.data === 'string' && response.data.startsWith('https://')) {
            console.log('Upload to transfer.sh success, url:', response.data.trim());
            return response.data.trim();
        }
        console.error('Upload to transfer.sh failed:', response.data);
        return null;
    }
    catch (error) {
        console.error('Upload to transfer.sh error:', error);
        return null;
    }
};
const uploadToCatbox = async (base64Data) => {
    try {
        const pureBase64 = base64Data.split(';base64,').pop() || base64Data;
        const buffer = Buffer.from(pureBase64, 'base64');
        console.log('=== uploadToCatbox ===');
        console.log('File size:', buffer.length, 'bytes');
        const formData = new (await Promise.resolve().then(() => __importStar(require('form-data')))).default();
        formData.append('reqtype', 'fileupload');
        formData.append('fileToUpload', buffer, { filename: `image_${Date.now()}.jpg` });
        const response = await axios_1.default.post('https://catbox.moe/user/api.php', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', response.data);
        if (response.data && typeof response.data === 'string' && response.data.startsWith('https://')) {
            console.log('Upload to catbox.moe success, url:', response.data.trim());
            return response.data.trim();
        }
        console.error('Upload to catbox.moe failed:', response.data);
        return null;
    }
    catch (error) {
        console.error('Upload to catbox.moe error:', error);
        return null;
    }
};
const uploadToUguu = async (base64Data) => {
    try {
        const pureBase64 = base64Data.split(';base64,').pop() || base64Data;
        const buffer = Buffer.from(pureBase64, 'base64');
        console.log('=== uploadToUguu ===');
        console.log('File size:', buffer.length, 'bytes');
        const formData = new (await Promise.resolve().then(() => __importStar(require('form-data')))).default();
        formData.append('files[]', buffer, { filename: `image_${Date.now()}.jpg` });
        const response = await axios_1.default.post('https://uguu.se/upload.php', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000,
        });
        console.log('Response status:', response.status);
        console.log('Response data:', JSON.stringify(response.data).substring(0, 500));
        if (response.data && response.data.files && response.data.files[0] && response.data.files[0].url) {
            console.log('Upload to uguu.se success, url:', response.data.files[0].url);
            return response.data.files[0].url;
        }
        console.error('Upload to uguu.se failed:', response.data);
        return null;
    }
    catch (error) {
        console.error('Upload to uguu.se error:', error);
        return null;
    }
};
const uploadImage = async (imgcode, key, secret) => {
    try {
        if (imgcode.startsWith('data:')) {
            return await uploadImageByPost(imgcode, key, secret);
        }
        const url = buildUrl('/upload_img', {
            key,
            imgcode,
            cache: 'no',
            lang: 'zh-CN',
            secret,
        });
        console.log('=== uploadImage (GET) ===');
        console.log('URL:', url.substring(0, 300));
        console.log('imgcode length:', imgcode.length);
        const response = await fetch(url);
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response text length:', text.length);
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Upload image API returned non-JSON:', text.substring(0, 800));
            return null;
        }
        console.log('Response data keys:', Object.keys(data));
        const item = data.items && data.items.item;
        if (item && (item.imgid || item.name)) {
            const imgid = item.imgid || item.name;
            console.log('Upload image success, imgid:', imgid);
            return imgid;
        }
        else if (data.result && (data.result.imgid || data.result.name)) {
            const imgid = data.result.imgid || data.result.name;
            console.log('Upload image success, imgid:', imgid);
            return imgid;
        }
        else if (data.imgid || data.name) {
            const imgid = data.imgid || data.name;
            console.log('Upload image success, imgid:', imgid);
            return imgid;
        }
        console.error('Upload image failed:', JSON.stringify(data).substring(0, 500));
        return null;
    }
    catch (error) {
        console.error('Upload image error:', error);
        return null;
    }
};
exports.uploadImage = uploadImage;
const uploadImageByPost = async (base64Data, key, secret) => {
    try {
        const baseUrl = buildUrl('/upload_img', {
            key,
            cache: 'no',
            lang: 'zh-CN',
            secret,
        });
        console.log('=== uploadImageByPost (POST) ===');
        console.log('Base URL:', baseUrl);
        console.log('Base64 data length:', base64Data.length);
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `imgcode=${encodeURIComponent(base64Data)}`,
        });
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response text length:', text.length);
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Upload image POST API returned non-JSON:', text.substring(0, 800));
            return null;
        }
        console.log('Response data keys:', Object.keys(data));
        const item = data.items && data.items.item;
        if (item && (item.imgid || item.name)) {
            const imgid = item.imgid || item.name;
            console.log('Upload image POST success, imgid:', imgid);
            return imgid;
        }
        else if (data.result && (data.result.imgid || data.result.name)) {
            const imgid = data.result.imgid || data.result.name;
            console.log('Upload image POST success, imgid:', imgid);
            return imgid;
        }
        else if (data.imgid || data.name) {
            const imgid = data.imgid || data.name;
            console.log('Upload image POST success, imgid:', imgid);
            return imgid;
        }
        console.error('Upload image POST failed:', JSON.stringify(data).substring(0, 500));
        return null;
    }
    catch (error) {
        console.error('Upload image POST error:', error);
        return null;
    }
};
const uploadBase64Image = async (base64Data, key, secret) => {
    try {
        const url = buildUrl('/upload_img', {
            key,
            imgcode: base64Data,
            cache: 'no',
            lang: 'zh-CN',
            secret,
        });
        console.log('Calling upload_img API with base64...');
        const response = await fetch(url);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Upload base64 image API returned non-JSON:', text.substring(0, 500));
            return null;
        }
        if (data.items && data.items.item && data.items.item.imgid) {
            console.log('Upload base64 image success, imgid:', data.items.item.imgid);
            return data.items.item.imgid;
        }
        else if (data.result && data.result.imgid) {
            console.log('Upload base64 image success, imgid:', data.result.imgid);
            return data.result.imgid;
        }
        console.error('Upload base64 image failed:', data);
        return null;
    }
    catch (error) {
        console.error('Upload base64 image error:', error);
        return null;
    }
};
exports.uploadBase64Image = uploadBase64Image;
const searchByImage = async (imgid, key, secret, lang) => {
    try {
        const url = buildUrl('/item_search_img', {
            key,
            imgid,
            cache: 'no',
            lang: lang === 'en' ? 'en' : 'zh-CN',
            secret,
        });
        console.log('=== searchByImage ===');
        console.log('URL:', url);
        console.log('imgid:', imgid);
        const response = await fetch(url);
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response text length:', text.length);
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Search API returned non-JSON:', text.substring(0, 800));
            throw (0, apiGuard_1.permissionError)({ error: 'item_search_img returned non-JSON', raw: text.substring(0, 300) });
        }
        console.log('Search API response structure:', Object.keys(data));
        console.log('Full response:', JSON.stringify(data).substring(0, 1000));
        if (data.result && data.result.items) {
            console.log('Search success, found:', data.result.items.length, 'items');
            return data.result.items;
        }
        if (data.result && data.result.item) {
            console.log('Search success with result.item structure, found:', Array.isArray(data.result.item) ? data.result.item.length : 1, 'items');
            return Array.isArray(data.result.item) ? data.result.item : [data.result.item];
        }
        if (data.items && data.items.item) {
            console.log('Search success with items.item structure, found:', Array.isArray(data.items.item) ? data.items.item.length : 1, 'items');
            return Array.isArray(data.items.item) ? data.items.item : [data.items.item];
        }
        if (data.item) {
            console.log('Search success with item structure, found:', Array.isArray(data.item) ? data.item.length : 1, 'items');
            return Array.isArray(data.item) ? data.item : [data.item];
        }
        console.error('Search by image failed:', JSON.stringify(data).substring(0, 800));
        throw (0, apiGuard_1.permissionError)({
            error: data.error || data.error_message || 'no data',
            error_code: data.error_code,
        });
    }
    catch (error) {
        console.error('Search by image error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            throw error;
        }
        throw (0, apiGuard_1.permissionError)({ error: error instanceof Error ? error.message : String(error) });
    }
};
exports.searchByImage = searchByImage;
// 直接用图片URL搜索
const searchByImageUrl = async (imageUrl, key, secret, lang) => {
    try {
        const url = buildUrl('/item_search_img', {
            key,
            imgid: imageUrl,
            cache: 'no',
            lang: lang === 'en' ? 'en' : 'zh-CN',
            secret,
        });
        console.log('=== searchByImageUrl ===');
        console.log('URL:', url);
        console.log('imageUrl:', imageUrl);
        const response = await fetch(url);
        console.log('Response status:', response.status);
        const text = await response.text();
        console.log('Response text length:', text.length);
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Search API returned non-JSON:', text.substring(0, 800));
            throw (0, apiGuard_1.permissionError)({ error: 'item_search_img returned non-JSON', raw: text.substring(0, 300) });
        }
        console.log('Search API response structure:', Object.keys(data));
        console.log('Full response:', JSON.stringify(data).substring(0, 1000));
        if (data.result && data.result.items) {
            console.log('Search success, found:', data.result.items.length, 'items');
            return data.result.items;
        }
        if (data.result && data.result.item) {
            console.log('Search success with result.item structure, found:', Array.isArray(data.result.item) ? data.result.item.length : 1, 'items');
            return Array.isArray(data.result.item) ? data.result.item : [data.result.item];
        }
        if (data.items && data.items.item) {
            console.log('Search success with items.item structure, found:', Array.isArray(data.items.item) ? data.items.item.length : 1, 'items');
            return Array.isArray(data.items.item) ? data.items.item : [data.items.item];
        }
        if (data.item) {
            console.log('Search success with item structure, found:', Array.isArray(data.item) ? data.item.length : 1, 'items');
            return Array.isArray(data.item) ? data.item : [data.item];
        }
        console.error('Search by image URL failed:', JSON.stringify(data).substring(0, 800));
        throw (0, apiGuard_1.permissionError)({
            error: data.error || data.error_message || 'no data',
            error_code: data.error_code,
        });
    }
    catch (error) {
        console.error('Search by image URL error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            throw error;
        }
        throw (0, apiGuard_1.permissionError)({ error: error instanceof Error ? error.message : String(error) });
    }
};
const testUrlCompatibility = async (imageUrl, key, secret) => {
    try {
        const url = buildUrl('/item_search_img', {
            key,
            imgid: imageUrl,
            cache: 'no',
            lang: 'zh-CN',
            secret,
        });
        const response = await fetch(url);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            return false;
        }
        const errorCode = data.error_code || (data.result && data.result.error_code);
        if (errorCode === '0000' || errorCode === 0) {
            return true;
        }
        return false;
    }
    catch (error) {
        return false;
    }
};
const getProductDetail = async (num_iid, key, secret, lang) => {
    try {
        const url = buildUrl('/item_get', {
            key,
            num_iid,
            cache: 'no',
            lang: lang === 'en' ? 'en' : 'zh-CN',
            secret,
        });
        console.log('Calling item_get API:', url);
        const response = await fetch(url);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Product detail API returned non-JSON:', text);
            throw (0, apiGuard_1.permissionError)({ error: 'item_get returned non-JSON', raw: text.substring(0, 300) });
        }
        const item = data.item || {};
        const product = item.prodct_array || item;
        const sellerInfo = product.seller_info || {};
        const title = product.title || '';
        const price = product.price || '';
        const sales = product.total_sold || product.sales || '';
        const shopName = sellerInfo.shop_name || sellerInfo.nick || product.nick || '';
        const itemUrl = product.detail_url || sellerInfo.zhuy || '';
        let images = [];
        if (product.item_imgs && product.item_imgs.item_img) {
            images = Array.isArray(product.item_imgs.item_img)
                ? product.item_imgs.item_img.map((img) => img.url || img)
                : [product.item_imgs.item_img];
        }
        else if (product.pic_url) {
            images = [product.pic_url];
        }
        let descText = product.desc || '';
        let descImages = [];
        if (descText) {
            const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
            let imgMatch;
            while ((imgMatch = imgRegex.exec(descText)) !== null) {
                descImages.push(imgMatch[1]);
            }
        }
        descImages = descImages.filter(img => img && (img.startsWith('http://') || img.startsWith('https://')));
        if (product.desc_img && Array.isArray(product.desc_img)) {
            descImages.push(...product.desc_img.filter((img) => img && (img.startsWith('http://') || img.startsWith('https://'))));
        }
        const skus = [];
        if (product.skus && product.skus.sku) {
            const skuList = Array.isArray(product.skus.sku) ? product.skus.sku : [product.skus.sku];
            skuList.forEach((sku) => {
                skus.push({
                    price: sku.price || sku.onepiece_price || '',
                    name: sku.properties_name || sku.specAttrs || '',
                    skuId: sku.sku_id || '',
                    specId: sku.spec_id || '',
                    quantity: sku.quantity || '',
                    properties: sku.properties || '',
                    discountPrice: sku.discountPrice || '',
                    saleCount: sku.saleCount || '',
                    specAttrs: sku.specAttrs || '',
                    canBookCount: sku.canBookCount || '',
                });
            });
        }
        const attributes = [];
        if (product.props && Array.isArray(product.props)) {
            product.props.forEach((prop) => {
                attributes.push({
                    name: prop.name || prop.label || '',
                    value: prop.value || prop.attrValue || '',
                });
            });
        }
        const packInfo = product.packInfo || product.productPackInfo || product.pieceWeightScaleInfo || {};
        const shippingServices = product.shippingServices || product.deliveryFee || product.freightInfo || {};
        const productEvaluation = product.productEvaluation || {};
        const promotionBanner = product.promotionBanner || {};
        const mainPrice = product.mainPrice || {
            price,
            priceModel: product.priceModel || {},
            finalPriceModel: product.finalPriceModel || {},
        };
        const gallery = product.gallery || {
            mainImage: images,
            offerImgList: images,
        };
        if (!title && !price && images.length === 0) {
            console.warn('Product detail API returned empty data:', num_iid);
            throw (0, apiGuard_1.permissionError)({
                error: data.error || data.error_message || 'no data',
                error_code: data.error_code,
            });
        }
        console.log('Get product detail success:', num_iid, 'images:', images.length, 'skus:', skus.length, 'descImages:', descImages.length, 'attributes:', attributes.length);
        const productDetail = {
            num_iid,
            title,
            desc: descText,
            descImages,
            price,
            sales: sales?.toString() || '',
            shopName,
            images,
            skus,
            url: itemUrl,
            minNum: parseInt(product.min_num || '1'),
            packInfo,
            attributes,
            shippingServices,
            productEvaluation,
            promotionBanner,
            mainPrice,
            gallery,
            rawData: product,
        };
        return productDetail;
    }
    catch (error) {
        console.error('Get product detail error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            throw error;
        }
        throw (0, apiGuard_1.permissionError)({ error: error instanceof Error ? error.message : String(error) });
    }
};
exports.getProductDetail = getProductDetail;
const generateMockProductDetail = (num_iid) => {
    const mockImages = [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20image%20main%20ecommerce&image_size=square',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20image%20detail%201&image_size=landscape_16_9',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20image%20detail%202&image_size=landscape_16_9',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20image%20detail%203&image_size=landscape_16_9',
    ];
    const mockDescImages = [
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20description%20image%201&image_size=landscape_16_9',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20description%20image%202&image_size=landscape_16_9',
        'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=product%20description%20image%203&image_size=landscape_16_9',
    ];
    return {
        num_iid,
        title: '爆款热销商品，品质保证，限时特惠',
        desc: '<div><p>【商品特点】</p><ul><li>高品质材料，经久耐用</li><li>时尚设计，百搭款式</li><li>性价比高，物超所值</li></ul><p>【适用场景】</p><p>适合日常穿搭、办公休闲等多种场合</p></div>',
        descImages: mockDescImages,
        price: '29.9',
        sales: '99999',
        shopName: '热销店铺',
        images: mockImages,
        skus: [
            {
                price: '29.9',
                name: '颜色:红色;尺码:S',
                skuId: '1',
                quantity: '1000',
                properties: '红色,S',
                discountPrice: '25.9',
                saleCount: '5000',
                specAttrs: '红色,S',
                canBookCount: '100',
            },
            {
                price: '29.9',
                name: '颜色:红色;尺码:M',
                skuId: '2',
                quantity: '800',
                properties: '红色,M',
                discountPrice: '25.9',
                saleCount: '3000',
                specAttrs: '红色,M',
                canBookCount: '80',
            },
            {
                price: '32.9',
                name: '颜色:蓝色;尺码:S',
                skuId: '3',
                quantity: '600',
                properties: '蓝色,S',
                discountPrice: '28.9',
                saleCount: '2000',
                specAttrs: '蓝色,S',
                canBookCount: '60',
            },
            {
                price: '32.9',
                name: '颜色:蓝色;尺码:M',
                skuId: '4',
                quantity: '500',
                properties: '蓝色,M',
                discountPrice: '28.9',
                saleCount: '1500',
                specAttrs: '蓝色,M',
                canBookCount: '50',
            },
        ],
        url: `https://www.1688.com/offer/${num_iid}.html`,
        packInfo: {
            packType: '纸箱包装',
            weight: '0.5kg',
            size: '30x20x10cm',
        },
        attributes: [
            { name: '品牌', value: '知名品牌' },
            { name: '材质', value: '优质面料' },
            { name: '产地', value: '中国' },
            { name: '适用人群', value: '通用' },
            { name: '风格', value: '时尚简约' },
        ],
        shippingServices: {
            deliveryType: '快递',
            freeShipping: true,
            estimatedDeliveryDays: '3-5天',
        },
        productEvaluation: {
            rating: 4.8,
            reviewCount: 12345,
            goodRate: 98,
        },
        promotionBanner: {
            title: '限时特惠',
            discount: '满100减20',
        },
        mainPrice: {
            price: '29.9',
            priceModel: {},
            finalPriceModel: {},
        },
        gallery: {
            mainImage: mockImages,
            offerImgList: mockImages,
        },
        rawData: {},
    };
};
const withTimeout = (promise, ms, errorMessage) => {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            reject(new Error(errorMessage));
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
// 快速图搜链路：已有图片ID直接搜；否则先 upload_img 拿ID，再 item_search_img
const matchProducts = async (imageInput, lang, imgidInput) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    if (!API_KEY || !API_SECRET) {
        throw (0, apiGuard_1.permissionError)({ error: 'API key/secret not configured' });
    }
    try {
        let imgid = String(imgidInput || '').trim();
        if (imgid) {
            console.log('[match] 使用已有图片ID直接图搜:', imgid);
        }
        else {
            if (!imageInput) {
                throw (0, apiGuard_1.permissionError)({ error: 'no image input' });
            }
            console.log('[match] 调用 upload_img 获取图片ID，输入类型:', imageInput.startsWith('data:') ? 'base64' : 'url');
            const uploadStarted = Date.now();
            imgid = await (0, exports.uploadImage)(imageInput, API_KEY, API_SECRET);
            console.log(`[match] upload_img 耗时 ${Date.now() - uploadStarted}ms，imgid=${imgid}`);
            if (!imgid) {
                throw (0, apiGuard_1.permissionError)({ error: 'upload_img 未返回 imgid' });
            }
        }
        const searchStarted = Date.now();
        const items = await (0, exports.searchByImage)(imgid, API_KEY, API_SECRET, lang);
        console.log(`[match] item_search_img 耗时 ${Date.now() - searchStarted}ms，命中 ${items ? items.length : 0} 条`);
        if (!items || items.length === 0) {
            throw (0, apiGuard_1.permissionError)({ error: 'no data' });
        }
        const products = items.map((item) => {
            const num_iid = item.num_iid || item.id;
            return {
                id: num_iid?.toString() || Date.now().toString(),
                title: item.title || '',
                imageUrl: item.pic_url || item.image || '',
                price: item.price || '',
                sales: item.sales_count || item.sales || '',
                shopName: item.nick || item.shop_name || '未知店铺',
                url: item.url || '',
                detail: undefined,
            };
        });
        console.log(`[match] 返回 ${products.length} 个商品，imgid=${imgid}`);
        return products;
    }
    catch (error) {
        console.error('=== matchProducts error ===', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            throw error;
        }
        throw (0, apiGuard_1.permissionError)({ error: error instanceof Error ? error.message : String(error) });
    }
};
exports.matchProducts = matchProducts;
const generateMockProducts = (lang) => {
    const isEnglish = lang === 'en';
    return [
        {
            id: '1053776622666',
            title: isEnglish ? 'New Fashion Women Dress Korean Style Slim Elegant Long Dress' : '新款时尚女装连衣裙韩版修身显瘦气质长裙',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20women%20dress%20elegant%20style%20product%20photo&image_size=square',
            price: '59.9',
            sales: '12580',
            shopName: isEnglish ? 'Fashion Women Clothing Factory' : '时尚女装工厂店',
            url: 'https://www.1688.com/offer/1053776622666.html',
        },
        {
            id: '1053776622667',
            title: isEnglish ? 'Summer Breathable Sports Shoes Men Lightweight Running Shoes Casual Versatile' : '夏季透气运动鞋男轻便跑步鞋休闲百搭',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=men%20sports%20shoes%20running%20casual%20product%20photo&image_size=square',
            price: '89.0',
            sales: '8920',
            shopName: isEnglish ? 'Shoes Wholesale Mall' : '鞋业批发商城',
            url: 'https://www.1688.com/offer/1053776622667.html',
        },
        {
            id: '1053776622668',
            title: isEnglish ? 'Home Kitchen Storage Box Plastic Transparent Organizer Bin' : '家用厨房收纳盒塑料透明整理箱储物盒',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=kitchen%20storage%20box%20plastic%20transparent%20product%20photo&image_size=square',
            price: '19.9',
            sales: '23450',
            shopName: isEnglish ? 'Home Supplies Wholesale' : '家居用品批发',
            url: 'https://www.1688.com/offer/1053776622668.html',
        },
        {
            id: '1053776622669',
            title: isEnglish ? 'Hot Selling Phone Case for iPhone 14 Silicone Shockproof Protective Cover' : '网红爆款手机壳适用苹果14硅胶防摔保护套',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=phone%20case%20colorful%20silicone%20protective%20product%20photo&image_size=square',
            price: '12.9',
            sales: '35680',
            shopName: isEnglish ? 'Digital Accessories Wholesale' : '数码配件批发',
            url: 'https://www.1688.com/offer/1053776622669.html',
        },
        {
            id: '1053776622670',
            title: isEnglish ? 'Cotton T-shirt Men Summer Short Sleeve Loose Versatile Base Shirt' : '纯棉T恤男夏季短袖宽松百搭打底衫',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=men%20cotton%20t-shirt%20summer%20short%20sleeve%20product%20photo&image_size=square',
            price: '29.9',
            sales: '18920',
            shopName: isEnglish ? 'Men Clothing Wholesale' : '男装批发基地',
            url: 'https://www.1688.com/offer/1053776622670.html',
        },
        {
            id: '1053776622671',
            title: isEnglish ? 'Children Toy Building Blocks Educational Assembly Enlightenment Toys' : '儿童玩具积木益智拼装启蒙教育玩具',
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=children%20toy%20building%20blocks%20educational%20colorful%20product%20photo&image_size=square',
            price: '49.9',
            sales: '15680',
            shopName: isEnglish ? 'Toys Wholesale Mall' : '玩具批发商城',
            url: 'https://www.1688.com/offer/1053776622671.html',
        },
    ];
};
const getRankList = async (rankType, lang) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    if (!API_KEY || !API_SECRET) {
        console.warn('API credentials not configured, returning mock rank data');
        return generateMockRankProducts(rankType, lang);
    }
    try {
        // item_search_best 需单独购买权限（当前key未开通），统一改用 item_search 拉取真实榜单数据
        return await searchByKeywordForRank(rankType, lang);
    }
    catch (error) {
        console.error('Get rank list error:', error);
        console.warn('Falling back to keyword search for rank data');
        return await searchByKeywordForRank(rankType, lang);
    }
};
exports.getRankList = getRankList;
const searchByKeywordForRank = async (rankType, lang) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    const keywordsByRank = {
        complex: '',
        hot: '',
        goodPrice: '',
    };
    const sortByRank = {
        complex: '',
        hot: '_sale',
        goodPrice: 'bid',
    };
    try {
        const searchParams = {
            key: API_KEY,
            q: keywordsByRank[rankType] || (lang === 'en' ? 'hot sale' : '热销商品'),
            page: '1',
            page_size: '15',
            cat: '0',
            start_price: '0',
            end_price: '0',
            cache: 'no',
            lang: lang === 'en' ? 'en' : 'zh-CN',
            secret: API_SECRET,
        };
        const sort = sortByRank[rankType];
        if (sort)
            searchParams.sort = sort;
        const url = buildUrl('/item_search', searchParams);
        console.log('Calling item_search API for rank fallback:', url);
        const response = await fetch(url);
        const text = await response.text();
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Rank fallback search API returned non-JSON:', text);
            return generateMockRankProducts(rankType);
        }
        let items = [];
        if (data.items && Array.isArray(data.items)) {
            items = data.items;
        }
        else if (data.items && data.items.item) {
            items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
        }
        else if (data.result && Array.isArray(data.result)) {
            items = data.result;
        }
        else if (data.result && data.result.item) {
            items = Array.isArray(data.result.item) ? data.result.item : [data.result.item];
        }
        else if (data.result && data.result.items) {
            items = Array.isArray(data.result.items) ? data.result.items : [data.result.items];
        }
        else if (data.item) {
            items = Array.isArray(data.item) ? data.item : [data.item];
        }
        console.log('Rank fallback search items:', items.length);
        if (!items || items.length === 0) {
            console.warn('No products found from fallback search');
            return generateMockRankProducts(rankType);
        }
        const products = items.map((item) => {
            const num_iid = item.num_iid || item.id;
            return {
                id: num_iid?.toString() || Date.now().toString(),
                title: item.title || '',
                imageUrl: item.pic_url || item.image || '',
                price: item.price || '',
                sales: item.sales_count || item.sales || '',
                shopName: item.nick || item.shop_name || '未知店铺',
                url: item.url || '',
                detail: undefined,
            };
        });
        console.log(`Returning ${products.length} fallback products for rank type: ${rankType}`);
        return products;
    }
    catch (error) {
        console.error('Rank fallback search error:', error);
        return generateMockRankProducts(rankType, lang);
    }
};
const generateMockRankProducts = (rankType, lang) => {
    const isEnglish = lang === 'en';
    const rankNames = isEnglish ? {
        complex: 'Comprehensive',
        hot: 'Hot Sales',
        goodPrice: 'Best Price',
    } : {
        complex: '综合榜',
        hot: '热卖榜',
        goodPrice: '好价榜',
    };
    const mockProducts = [
        {
            id: '1001',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #1: Hot selling product, quality guaranteed, limited time offer` : `${rankNames[rankType] || '榜单'}第1名：爆款热销商品，品质保证，限时特惠`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20selling%20product%20top%20rank%20ecommerce&image_size=square',
            price: '29.9',
            sales: '99999',
            shopName: isEnglish ? 'Hot Sales Store' : '热销店铺',
            url: 'https://www.1688.com/offer/1001.html',
        },
        {
            id: '1002',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #2: Popular selection, fashionable and versatile, great value` : `${rankNames[rankType] || '榜单'}第2名：人气精选，时尚百搭，超值之选`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=popular%20product%20selection%20ecommerce&image_size=square',
            price: '49.9',
            sales: '88888',
            shopName: isEnglish ? 'Selection Store' : '精选店铺',
            url: 'https://www.1688.com/offer/1002.html',
        },
        {
            id: '1003',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #3: Quality choice, premium materials, exquisite craftsmanship` : `${rankNames[rankType] || '榜单'}第3名：品质之选，高端材质，精工制作`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=quality%20product%20premium%20ecommerce&image_size=square',
            price: '69.9',
            sales: '77777',
            shopName: isEnglish ? 'Quality Store' : '品质店铺',
            url: 'https://www.1688.com/offer/1003.html',
        },
        {
            id: '1004',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #4: Great discount, high cost performance, sales leader` : `${rankNames[rankType] || '榜单'}第4名：超值优惠，性价比高，销量领先`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20product%20sale%20ecommerce&image_size=square',
            price: '19.9',
            sales: '66666',
            shopName: isEnglish ? 'Discount Store' : '优惠店铺',
            url: 'https://www.1688.com/offer/1004.html',
        },
        {
            id: '1005',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #5: New arrival, trendy design, fashion leader` : `${rankNames[rankType] || '榜单'}第5名：新品上架，潮流设计，引领时尚`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20product%20arrival%20ecommerce&image_size=square',
            price: '39.9',
            sales: '55555',
            shopName: isEnglish ? 'New Arrival Store' : '新品店铺',
            url: 'https://www.1688.com/offer/1005.html',
        },
        {
            id: '1006',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #6: Home essential, practical and convenient, quality life` : `${rankNames[rankType] || '榜单'}第6名：居家必备，实用便捷，品质生活`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20essential%20product%20practical%20ecommerce&image_size=square',
            price: '25.9',
            sales: '44444',
            shopName: isEnglish ? 'Home Living Store' : '居家生活馆',
            url: 'https://www.1688.com/offer/1006.html',
        },
        {
            id: '1007',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #7: Digital accessories, tech style, excellent quality` : `${rankNames[rankType] || '榜单'}第7名：数码配件，科技感十足，品质卓越`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20accessories%20tech%20product%20ecommerce&image_size=square',
            price: '59.9',
            sales: '33333',
            shopName: isEnglish ? 'Digital Store' : '数码专营店',
            url: 'https://www.1688.com/offer/1007.html',
        },
        {
            id: '1008',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #8: Beauty skincare, natural ingredients, skin care` : `${rankNames[rankType] || '榜单'}第8名：美妆护肤，天然成分，呵护肌肤`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beauty%20skincare%20cosmetics%20natural%20ecommerce&image_size=square',
            price: '89.9',
            sales: '22222',
            shopName: isEnglish ? 'Beauty Flagship Store' : '美妆旗舰店',
            url: 'https://www.1688.com/offer/1008.html',
        },
        {
            id: '1009',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #9: Sports outdoor, professional equipment, enjoy sports` : `${rankNames[rankType] || '榜单'}第9名：运动户外，专业装备，畅享运动`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20outdoor%20equipment%20professional%20ecommerce&image_size=square',
            price: '129.9',
            sales: '11111',
            shopName: isEnglish ? 'Sports Outdoor Store' : '运动户外店',
            url: 'https://www.1688.com/offer/1009.html',
        },
        {
            id: '1010',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #10: Maternity products, safe and reliable, mother's first choice` : `${rankNames[rankType] || '榜单'}第10名：母婴用品，安全可靠，妈妈首选`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=baby%20products%20maternity%20safe%20reliable%20ecommerce&image_size=square',
            price: '45.9',
            sales: '10000',
            shopName: isEnglish ? 'Maternity Living Store' : '母婴生活馆',
            url: 'https://www.1688.com/offer/1010.html',
        },
        {
            id: '1011',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #11: Food snacks, delicious and healthy choice` : `${rankNames[rankType] || '榜单'}第11名：食品零食，美味可口，健康之选`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=food%20snacks%20delicious%20healthy%20ecommerce&image_size=square',
            price: '18.9',
            sales: '9999',
            shopName: isEnglish ? 'Food Flagship Store' : '食品旗舰店',
            url: 'https://www.1688.com/offer/1011.html',
        },
        {
            id: '1012',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #12: Fashion clothing shoes bags, trendy style, quality guaranteed` : `${rankNames[rankType] || '榜单'}第12名：服饰鞋包，时尚潮流，品质保证`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20clothing%20shoes%20bags%20trendy%20ecommerce&image_size=square',
            price: '79.9',
            sales: '8888',
            shopName: isEnglish ? 'Fashion Store' : '时尚服饰店',
            url: 'https://www.1688.com/offer/1012.html',
        },
        {
            id: '1013',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #13: Home decoration, warm and cozy, enhance style` : `${rankNames[rankType] || '榜单'}第13名：家居装饰，温馨舒适，提升格调`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20decor%20decoration%20cozy%20elegant%20ecommerce&image_size=square',
            price: '35.9',
            sales: '7777',
            shopName: isEnglish ? 'Home Decor Store' : '家居装饰馆',
            url: 'https://www.1688.com/offer/1013.html',
        },
        {
            id: '1014',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #14: Office stationery, efficient and practical, essential for study` : `${rankNames[rankType] || '榜单'}第14名：办公文具，高效实用，学习必备`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=office%20stationery%20school%20supplies%20ecommerce&image_size=square',
            price: '22.9',
            sales: '6666',
            shopName: isEnglish ? 'Office Stationery Store' : '办公文具店',
            url: 'https://www.1688.com/offer/1014.html',
        },
        {
            id: '1015',
            title: isEnglish ? `${rankNames[rankType] || 'Ranking'} #15: Pet supplies, pet care, quality life` : `${rankNames[rankType] || '榜单'}第15名：宠物用品，关爱宠物，品质生活`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pet%20supplies%20pet%20care%20quality%20ecommerce&image_size=square',
            price: '39.9',
            sales: '5555',
            shopName: isEnglish ? 'Pet Supplies Store' : '宠物用品店',
            url: 'https://www.1688.com/offer/1015.html',
        },
    ];
    return mockProducts;
};
const searchByKeyword = async (params) => {
    const { key: API_KEY, secret: API_SECRET } = (0, apiConfigService_1.getApiConfig)();
    const page = parseInt(params.page || '1');
    const pageSize = parseInt(params.page_size || '40');
    if (!API_KEY || !API_SECRET) {
        throw (0, apiGuard_1.permissionError)({ error: 'API key/secret not configured' });
    }
    try {
        const searchParams = {
            key: API_KEY,
            q: params.q,
            page: params.page || '1',
            page_size: params.page_size || '40',
            cat: params.cat || '0',
            start_price: params.start_price || '0',
            end_price: params.end_price || '0',
            cache: 'no',
            lang: params.lang === 'en' ? 'en' : 'zh-CN',
            secret: API_SECRET,
        };
        if (params.sort)
            searchParams.sort = params.sort;
        if (params.filter)
            searchParams.filter = params.filter;
        const url = buildUrl('/item_search', searchParams);
        console.log('Calling item_search API:', url);
        const response = await fetch(url);
        const text = await response.text();
        console.log('Search API response status:', response.status);
        console.log('Search API response text (first 1000 chars):', text.substring(0, 1000));
        let data;
        try {
            data = JSON.parse(text);
        }
        catch {
            console.error('Search API returned non-JSON:', text);
            throw (0, apiGuard_1.permissionError)({ error: 'item_search returned non-JSON', raw: text.substring(0, 300) });
        }
        console.log('Search API parsed data keys:', Object.keys(data));
        console.log('Search API error_code:', data.error_code);
        console.log('Search API message:', data.message);
        let items = [];
        let totalResults = 0;
        let totalPages = 1;
        if (data.items) {
            if (Array.isArray(data.items)) {
                items = data.items;
            }
            else if (data.items.item) {
                items = Array.isArray(data.items.item) ? data.items.item : [data.items.item];
            }
            totalResults = parseInt(data.items.total_results || data.items.total || '0');
            const pagecount = parseInt(data.items.pagecount || data.items.page_count || '1');
            totalPages = pagecount > 0 ? pagecount : Math.ceil(totalResults / pageSize);
        }
        else if (data.result) {
            if (Array.isArray(data.result)) {
                items = data.result;
            }
            else if (data.result.item) {
                items = Array.isArray(data.result.item) ? data.result.item : [data.result.item];
            }
            else if (data.result.items) {
                items = Array.isArray(data.result.items) ? data.result.items : [data.result.items];
            }
            totalResults = parseInt(data.result.total_results || data.result.total || '0');
            const pagecount = parseInt(data.result.pagecount || data.result.page_count || '1');
            totalPages = pagecount > 0 ? pagecount : Math.ceil(totalResults / pageSize);
        }
        else if (data.item) {
            items = Array.isArray(data.item) ? data.item : [data.item];
        }
        console.log('Search API items:', items.length);
        if (!items || items.length === 0) {
            console.warn('No search products found for keyword:', params.q);
            throw (0, apiGuard_1.permissionError)({
                error: data.error || data.error_message || 'no data',
                error_code: data.error_code,
            });
        }
        const products = items.map((item) => {
            const num_iid = item.num_iid || item.id;
            return {
                id: num_iid?.toString() || Date.now().toString(),
                title: item.title || '',
                imageUrl: item.pic_url || item.image || '',
                price: item.price || '',
                sales: item.sales_count || item.sales || '',
                shopName: item.nick || item.shop_name || '未知店铺',
                url: item.url || '',
                detail: undefined,
            };
        });
        console.log(`Returning ${products.length} search products for keyword: ${params.q}`);
        return {
            products,
            totalResults: totalResults > 0 ? totalResults : products.length * totalPages,
            totalPages: totalPages > 0 ? totalPages : Math.ceil(totalResults / pageSize),
            currentPage: page,
        };
    }
    catch (error) {
        console.error('Search by keyword error:', error);
        if (error && error.code === apiGuard_1.CODE_API_PERMISSION) {
            throw error;
        }
        throw (0, apiGuard_1.permissionError)({ error: error instanceof Error ? error.message : String(error) });
    }
};
exports.searchByKeyword = searchByKeyword;
const generateMockSearchProducts = (keyword, lang) => {
    const isEnglish = lang === 'en';
    const mockProducts = [
        {
            id: '1001',
            title: isEnglish ? `${keyword} - Hot Selling Product, Quality Guaranteed, Limited Time Offer` : `${keyword} - 爆款热销商品，品质保证，限时特惠`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=hot%20selling%20product%20ecommerce&image_size=square',
            price: '29.9',
            sales: '99999',
            shopName: isEnglish ? 'Hot Sales Store' : '热销店铺',
            url: 'https://www.1688.com/offer/1001.html',
        },
        {
            id: '1002',
            title: isEnglish ? `${keyword} - Popular Selection, Fashionable and Versatile, Great Value` : `${keyword} - 人气精选，时尚百搭，超值之选`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=popular%20product%20ecommerce&image_size=square',
            price: '49.9',
            sales: '88888',
            shopName: isEnglish ? 'Selection Store' : '精选店铺',
            url: 'https://www.1688.com/offer/1002.html',
        },
        {
            id: '1003',
            title: isEnglish ? `${keyword} - Quality Choice, Premium Materials, Exquisite Craftsmanship` : `${keyword} - 品质之选，高端材质，精工制作`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=quality%20product%20premium%20ecommerce&image_size=square',
            price: '69.9',
            sales: '77777',
            shopName: isEnglish ? 'Quality Store' : '品质店铺',
            url: 'https://www.1688.com/offer/1003.html',
        },
        {
            id: '1004',
            title: isEnglish ? `${keyword} - Great Discount, High Cost Performance, Sales Leader` : `${keyword} - 超值优惠，性价比高，销量领先`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=discount%20product%20sale%20ecommerce&image_size=square',
            price: '19.9',
            sales: '66666',
            shopName: isEnglish ? 'Discount Store' : '优惠店铺',
            url: 'https://www.1688.com/offer/1004.html',
        },
        {
            id: '1005',
            title: isEnglish ? `${keyword} - New Arrival, Trendy Design, Fashion Leader` : `${keyword} - 新品上架，潮流设计，引领时尚`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=new%20product%20arrival%20ecommerce&image_size=square',
            price: '39.9',
            sales: '55555',
            shopName: isEnglish ? 'New Arrival Store' : '新品店铺',
            url: 'https://www.1688.com/offer/1005.html',
        },
        {
            id: '1006',
            title: isEnglish ? `${keyword} - Home Essential, Practical and Convenient, Quality Life` : `${keyword} - 居家必备，实用便捷，品质生活`,
            imageUrl: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=home%20essential%20product%20practical%20ecommerce&image_size=square',
            price: '25.9',
            sales: '44444',
            shopName: isEnglish ? 'Home Living Store' : '居家生活馆',
            url: 'https://www.1688.com/offer/1006.html',
        },
    ];
    return mockProducts;
};
