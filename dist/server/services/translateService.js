"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.translateProducts = exports.translateProduct = exports.translateText = void 0;
const axios_1 = __importDefault(require("axios"));
const CACHE = {};
const TRANSLATION_DICT = {
    '手机': 'Mobile Phone',
    '智能手机': 'Smartphone',
    '全网通': 'Unlocked',
    '5G': '5G',
    '安卓': 'Android',
    '苹果': 'Apple',
    'iPhone': 'iPhone',
    'Pro': 'Pro',
    'Max': 'Max',
    '迷你': 'Mini',
    '批发': 'Wholesale',
    '工厂': 'Factory',
    '直销': 'Direct Sale',
    '爆款': 'Hot Sale',
    '热销': 'Bestseller',
    '新品': 'New Arrival',
    '正品': 'Genuine',
    '原封': 'Sealed',
    '未拆封': 'Unopened',
    '跨境': 'Cross-border',
    '外贸': 'Foreign Trade',
    '代发': 'Drop Shipping',
    '特价': 'Special Price',
    '便宜': 'Cheap',
    '学生': 'Student',
    '老人': 'Elderly',
    '备用机': 'Backup Phone',
    '游戏': 'Gaming',
    '拍照': 'Camera',
    '大屏': 'Large Screen',
    '高清': 'HD',
    '内存': 'Memory',
    '存储': 'Storage',
    '双卡': 'Dual SIM',
    '双待': 'Dual Standby',
    '谷歌': 'Google',
    '国际版': 'International Version',
    '全球通': 'Global',
    '钥匙扣': 'Keychain',
    '钥匙圈': 'Key Ring',
    '挂件': 'Pendant',
    '饰品': 'Accessories',
    '不锈钢': 'Stainless Steel',
    '金属': 'Metal',
    '硅胶': 'Silicone',
    '亚克力': 'Acrylic',
    'DIY': 'DIY',
    '手工': 'Handmade',
    '批发价': 'Wholesale Price',
    '工厂价': 'Factory Price',
    '厂家直销': 'Factory Direct',
    '源头厂家': 'Source Factory',
    '特价手机': 'Budget Phone',
    '便宜手机': 'Cheap Phone',
    '二手手机': 'Used Phone',
    '未知店铺': 'Unknown Shop',
    '热销店铺': 'Hot Sales Store',
    '精选店铺': 'Selection Store',
    '品质店铺': 'Quality Store',
    '优惠店铺': 'Discount Store',
    '新品店铺': 'New Arrival Store',
    '数码专营店': 'Digital Store',
    '美妆旗舰店': 'Beauty Flagship Store',
    '运动户外店': 'Sports Outdoor Store',
    '母婴生活馆': 'Maternity Living Store',
    '食品旗舰店': 'Food Flagship Store',
    '时尚服饰店': 'Fashion Store',
    '家居装饰馆': 'Home Decor Store',
    '办公文具店': 'Office Stationery Store',
    '宠物用品店': 'Pet Supplies Store',
    '综合榜': 'Comprehensive',
    '热卖榜': 'Hot Sales',
    '好价榜': 'Best Price',
    '纸箱包装': 'Carton Packaging',
    '快递': 'Express',
    '天': 'days',
    '品牌': 'Brand',
    '材质': 'Material',
    '产地': 'Origin',
    '风格': 'Style',
    '通用': 'Universal',
    '时尚简约': 'Fashion Simple',
    '女装': 'Women\'s Clothing',
    '连衣裙': 'Dress',
    '短袖': 'Short Sleeve',
    '长裙': 'Long Dress',
    '短裙': 'Mini Dress',
    '新款': 'New Style',
    '夏季': 'Summer',
    '印花': 'Printed',
    '百褶': 'Pleated',
    '度假风': 'Vacation Style',
    '荷叶边': 'Ruffled',
    '优雅': 'Elegant',
    '浪漫': 'Romantic',
    '性感': 'Sexy',
    '蕾丝': 'Lace',
    '吊带': 'Spaghetti Strap',
    '拼接': 'Patchwork',
    '大码': 'Plus Size',
    '纯色': 'Solid Color',
    '深V': 'Deep V-neck',
    '口袋': 'Pockets',
    '方领': 'Square Neck',
    '腰部': 'Waist',
    '褶皱': 'Ruched',
    '下摆': 'Hem',
    '防晒': 'Sun Protection',
    '口罩': 'Mask',
    '冰丝': 'Ice Silk',
    '无痕': 'Seamless',
    '凉感': 'Cool Feeling',
    '透气': 'Breathable',
    '防紫外线': 'UV Protection',
    '面罩': 'Face Cover',
    '护眼角': 'Eye Protection',
    'Ebay': 'Ebay',
    '亚马逊': 'Amazon',
    '奢华': 'Luxury',
    '粉底液': 'Foundation',
    '粉底': 'Foundation',
    '彩妆': 'Cosmetics',
    '护肤': 'Skincare',
    '化妆品': 'Cosmetics',
    '口红': 'Lipstick',
    '眼影': 'Eye Shadow',
    '腮红': 'Blush',
    '睫毛膏': 'Mascara',
    '香水': 'Perfume',
    '包包': 'Bag',
    '手提包': 'Handbag',
    '背包': 'Backpack',
    '钱包': 'Wallet',
    '鞋': 'Shoes',
    '运动鞋': 'Sneakers',
    '凉鞋': 'Sandals',
    '高跟鞋': 'High Heels',
    'T恤': 'T-shirt',
    '衬衫': 'Shirt',
    '外套': 'Jacket',
    '裤子': 'Pants',
    '牛仔裤': 'Jeans',
    '裙子': 'Skirt',
    '内衣': 'Underwear',
    '睡衣': 'Sleepwear',
    '帽子': 'Hat',
    '围巾': 'Scarf',
    '手套': 'Gloves',
    '腰带': 'Belt',
    '太阳镜': 'Sunglasses',
    '手表': 'Watch',
    '珠宝': 'Jewelry',
    '项链': 'Necklace',
    '耳环': 'Earrings',
    '手链': 'Bracelet',
    '戒指': 'Ring',
    '发饰': 'Hair Accessories',
    '儿童': 'Children',
    '童装': 'Kids Clothing',
    '玩具': 'Toys',
    '文具': 'Stationery',
    '书包': 'School Bag',
    '运动': 'Sports',
    '户外': 'Outdoor',
    '健身': 'Fitness',
    '瑜伽': 'Yoga',
    '跑步': 'Running',
    '篮球': 'Basketball',
    '足球': 'Football',
    '家居': 'Home',
    '家具': 'Furniture',
    '厨具': 'Kitchenware',
    '餐具': 'Tableware',
    '收纳': 'Storage',
    '装饰': 'Decoration',
    '窗帘': 'Curtain',
    '地毯': 'Carpet',
    '床上用品': 'Bedding',
    '家纺': 'Home Textiles',
    '电子': 'Electronics',
    '电脑': 'Computer',
    '平板': 'Tablet',
    '耳机': 'Headphones',
    '音响': 'Speaker',
    '充电器': 'Charger',
    '数据线': 'Data Cable',
    '充电宝': 'Power Bank',
    '摄像头': 'Camera',
    '监控': 'CCTV',
    '汽车': 'Car',
    '配件': 'Accessories',
    '车载': 'Car-mounted',
    '宠物': 'Pet',
    '猫粮': 'Cat Food',
    '狗粮': 'Dog Food',
    '宠物用品': 'Pet Supplies',
    '食品': 'Food',
    '零食': 'Snacks',
    '饮料': 'Beverages',
    '咖啡': 'Coffee',
    '茶叶': 'Tea',
    '保健品': 'Health Products',
    '礼品': 'Gift',
    '礼盒': 'Gift Box',
    '节日': 'Festival',
    '圣诞': 'Christmas',
    '新年': 'New Year',
    '婚礼': 'Wedding',
    '生日': 'Birthday',
    '派对': 'Party',
    '促销': 'Promotion',
    '折扣': 'Discount',
    '满减': 'Spend Save',
    '包邮': 'Free Shipping',
    '赠品': 'Free Gift',
    '限量': 'Limited Edition',
    '现货': 'In Stock',
    '预售': 'Pre-order',
    '定制': 'Customized',
    '个性': 'Personalized',
    '创意': 'Creative',
    '时尚': 'Fashion',
    '潮流': 'Trendy',
    '复古': 'Vintage',
    '简约': 'Minimalist',
    '可爱': 'Cute',
    '精致': 'Exquisite',
    '高档': 'High-end',
    '实用': 'Practical',
    '便携': 'Portable',
    '环保': 'Eco-friendly',
    '安全': 'Safe',
    '耐用': 'Durable',
    '优质': 'High Quality',
    '专业': 'Professional',
};
const isEnglishText = (text) => {
    if (!text)
        return false;
    const chineseChars = text.match(/[\u4e00-\u9fa5]/g) || [];
    const englishChars = text.match(/[a-zA-Z]/g) || [];
    if (chineseChars.length === 0 && englishChars.length > 0)
        return true;
    if (englishChars.length > chineseChars.length * 2)
        return true;
    return false;
};
const translateWithDict = (text) => {
    if (isEnglishText(text)) {
        return text;
    }
    let result = text;
    for (const [chinese, english] of Object.entries(TRANSLATION_DICT)) {
        result = result.replace(new RegExp(chinese, 'g'), ` ${english} `);
    }
    result = result.replace(/\s+/g, ' ').trim();
    return result;
};
const translateText = async (text, targetLang = 'en') => {
    if (!text || !text.trim()) {
        return text;
    }
    if (isEnglishText(text)) {
        return text;
    }
    if (CACHE[`${text}:${targetLang}`]) {
        return CACHE[`${text}:${targetLang}`];
    }
    try {
        const response = await axios_1.default.get('https://translate.googleapis.com/translate_a/single', {
            params: {
                client: 'gtx',
                sl: 'zh-CN',
                tl: targetLang,
                dt: 't',
                q: text,
            },
            timeout: 8000,
        });
        if (response.data && Array.isArray(response.data[0])) {
            const translated = response.data[0].map((item) => item[0]).join('');
            CACHE[`${text}:${targetLang}`] = translated;
            return translated;
        }
    }
    catch (error) {
        console.error('Translate API error, using dictionary fallback:', error);
    }
    const dictResult = translateWithDict(text);
    CACHE[`${text}:${targetLang}`] = dictResult;
    return dictResult;
};
exports.translateText = translateText;
const translateProduct = async (product, targetLang = 'en') => {
    if (targetLang === 'zh' || targetLang === 'zh-CN') {
        return product;
    }
    try {
        const translatedProduct = { ...product };
        if (product.title) {
            translatedProduct.title = await (0, exports.translateText)(product.title, targetLang);
        }
        if (product.shopName && product.shopName !== '未知店铺') {
            translatedProduct.shopName = await (0, exports.translateText)(product.shopName, targetLang);
        }
        else if (product.shopName === '未知店铺') {
            translatedProduct.shopName = 'Unknown Shop';
        }
        if (product.desc) {
            translatedProduct.desc = await (0, exports.translateText)(product.desc, targetLang);
        }
        if (product.skus && Array.isArray(product.skus)) {
            translatedProduct.skus = await Promise.all(product.skus.map(async (sku) => {
                const translatedSku = { ...sku };
                if (sku.name) {
                    translatedSku.name = await (0, exports.translateText)(sku.name, targetLang);
                }
                if (sku.properties) {
                    translatedSku.properties = await (0, exports.translateText)(sku.properties, targetLang);
                }
                if (sku.specAttrs) {
                    translatedSku.specAttrs = await (0, exports.translateText)(sku.specAttrs, targetLang);
                }
                return translatedSku;
            }));
        }
        if (product.attributes && Array.isArray(product.attributes)) {
            translatedProduct.attributes = await Promise.all(product.attributes.map(async (attr) => {
                const translatedAttr = { ...attr };
                if (attr.name) {
                    translatedAttr.name = await (0, exports.translateText)(attr.name, targetLang);
                }
                if (attr.value) {
                    translatedAttr.value = await (0, exports.translateText)(attr.value, targetLang);
                }
                return translatedAttr;
            }));
        }
        if (product.packInfo) {
            const translatedPackInfo = { ...product.packInfo };
            if (product.packInfo.packType) {
                translatedPackInfo.packType = await (0, exports.translateText)(product.packInfo.packType, targetLang);
            }
            if (product.packInfo.weight) {
                translatedPackInfo.weight = await (0, exports.translateText)(product.packInfo.weight, targetLang);
            }
            if (product.packInfo.size) {
                translatedPackInfo.size = await (0, exports.translateText)(product.packInfo.size, targetLang);
            }
            translatedProduct.packInfo = translatedPackInfo;
        }
        if (product.shippingServices) {
            const translatedShipping = { ...product.shippingServices };
            if (product.shippingServices.deliveryType) {
                translatedShipping.deliveryType = await (0, exports.translateText)(product.shippingServices.deliveryType, targetLang);
            }
            if (product.shippingServices.estimatedDeliveryDays) {
                translatedShipping.estimatedDeliveryDays = await (0, exports.translateText)(product.shippingServices.estimatedDeliveryDays, targetLang);
            }
            translatedProduct.shippingServices = translatedShipping;
        }
        return translatedProduct;
    }
    catch (error) {
        console.error('Translate product error:', error);
        return product;
    }
};
exports.translateProduct = translateProduct;
const translateProducts = async (products, targetLang = 'en') => {
    if (targetLang === 'zh' || targetLang === 'zh-CN') {
        return products;
    }
    return Promise.all(products.map((product) => (0, exports.translateProduct)(product, targetLang)));
};
exports.translateProducts = translateProducts;
