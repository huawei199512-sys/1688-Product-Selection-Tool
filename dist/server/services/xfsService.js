"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchProducts = exports.getProductDetail = void 0;
const axios_1 = __importDefault(require("axios"));
const BASE_URL = 'https://www.xfs.com';
const DEFAULT_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cookie': 'province=110000; city=110100; area=110108',
};
const getProductDetail = async (num_id) => {
    try {
        const url = `${BASE_URL}/productsku/${num_id}.html`;
        console.log('Fetching product detail:', url);
        const response = await axios_1.default.get(url, {
            headers: DEFAULT_HEADERS,
            timeout: 30000,
        });
        const html = response.data;
        const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
        const title = titleMatch ? titleMatch[1].trim() : '';
        const mainImageMatch = html.match(/<img[^>]*class=["']main-img["'][^>]*src=["']([^"']+)["']/);
        let mainImage = mainImageMatch ? mainImageMatch[1] : '';
        if (mainImage && !mainImage.startsWith('http')) {
            mainImage = BASE_URL + (mainImage.startsWith('/') ? '' : '/') + mainImage;
        }
        const priceMatch = html.match(/<span[^>]*class=["']price["'][^>]*>([^<]+)<\/span>/);
        const price = priceMatch ? priceMatch[1].trim().replace(/[^\d.]/g, '') : '';
        const minOrderMatch = html.match(/最少起订量[^>]*>\s*(\d+)/i);
        const minOrder = minOrderMatch ? parseInt(minOrderMatch[1]) : 1;
        const productCodeMatch = html.match(/商品编码[^>]*>\s*([^<]+)/i);
        const productCode = productCodeMatch ? productCodeMatch[1].trim() : '';
        const specs = {};
        const specMatches = html.match(/<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>\s*<\/tr>/gi);
        if (specMatches) {
            specMatches.forEach(match => {
                const tdMatches = match.match(/<td[^>]*>([^<]+)<\/td>/gi);
                if (tdMatches && tdMatches.length >= 2) {
                    const name = tdMatches[0].replace(/<\/?td[^>]*>/g, '').trim();
                    const value = tdMatches[1].replace(/<\/?td[^>]*>/g, '').trim();
                    if (name && value) {
                        specs[name] = value;
                    }
                }
            });
        }
        const skus = [];
        const skuMatches = html.match(/<div[^>]*class=["']sku-item["'][^>]*>/gi);
        if (skuMatches) {
            skuMatches.forEach(skuHtml => {
                const skuNameMatch = skuHtml.match(/<span[^>]*class=["']sku-name["'][^>]*>([^<]+)<\/span>/);
                const skuValueMatch = skuHtml.match(/<span[^>]*class=["']sku-value["'][^>]*>([^<]+)<\/span>/);
                const skuPriceMatch = skuHtml.match(/<span[^>]*class=["']sku-price["'][^>]*>([^<]+)<\/span>/);
                if (skuNameMatch && skuValueMatch) {
                    skus.push({
                        name: skuNameMatch[1].trim(),
                        value: skuValueMatch[1].trim(),
                        price: skuPriceMatch ? skuPriceMatch[1].trim().replace(/[^\d.]/g, '') : price,
                    });
                }
            });
        }
        const categoryMatch = html.match(/<div[^>]*class=["']breadcrumb["'][^>]*>(.*?)<\/div>/si);
        let category = '';
        if (categoryMatch) {
            const linkMatches = categoryMatch[1].match(/<a[^>]*>([^<]+)<\/a>/gi);
            if (linkMatches) {
                category = linkMatches.map(l => l.replace(/<\/?a[^>]*>/g, '').trim()).filter(c => c).join(' > ');
            }
        }
        const descImages = [];
        const descImgMatches = html.match(/<div[^>]*class=["']product-desc["'][^>]*>(.*?)<\/div>/si);
        if (descImgMatches) {
            const imgMatches = descImgMatches[1].match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi);
            if (imgMatches) {
                imgMatches.forEach(imgMatch => {
                    const srcMatch = imgMatch.match(/src=["']([^"']+)["']/);
                    if (srcMatch) {
                        let imgUrl = srcMatch[1];
                        if (imgUrl && !imgUrl.startsWith('http')) {
                            imgUrl = BASE_URL + (imgUrl.startsWith('/') ? '' : '/') + imgUrl;
                        }
                        descImages.push(imgUrl);
                    }
                });
            }
        }
        if (!title && !mainImage && !price) {
            console.warn('Product detail returned empty data');
            return null;
        }
        return {
            num_id,
            title,
            mainImage,
            price,
            minOrder,
            productCode,
            specs,
            skus,
            category,
            descImages,
        };
    }
    catch (error) {
        console.error('Get product detail error:', error);
        return null;
    }
};
exports.getProductDetail = getProductDetail;
const searchProducts = async (q, sort, page = 1) => {
    try {
        const encodedQ = encodeURIComponent(q);
        const url = `${BASE_URL}/searchPro/${encodedQ}.html?jsthty=1&stype=3&page=${page}`;
        console.log('Fetching search results:', url);
        const response = await axios_1.default.get(url, {
            headers: DEFAULT_HEADERS,
            timeout: 30000,
        });
        const html = response.data;
        const products = [];
        const productMatches = html.match(/<div[^>]*class=["']product-item["'][^>]*>(.*?)<\/div>/gi);
        if (productMatches) {
            productMatches.forEach(productHtml => {
                const idMatch = productHtml.match(/href=["']\/productsku\/(\d+)\.html["']/);
                const titleMatch = productHtml.match(/<h3[^>]*>([^<]+)<\/h3>/);
                const imageMatch = productHtml.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/i);
                const priceMatch = productHtml.match(/<span[^>]*class=["']price["'][^>]*>([^<]+)<\/span>/);
                const specCountMatch = productHtml.match(/<span[^>]*class=["']spec-count["'][^>]*>(\d+)/);
                if (idMatch && titleMatch && imageMatch) {
                    let imgUrl = imageMatch[1];
                    if (imgUrl && !imgUrl.startsWith('http')) {
                        imgUrl = BASE_URL + (imgUrl.startsWith('/') ? '' : '/') + imgUrl;
                    }
                    products.push({
                        id: idMatch[1],
                        title: titleMatch[1].trim(),
                        mainImage: imgUrl,
                        price: priceMatch ? priceMatch[1].trim().replace(/[^\d.]/g, '') : '',
                        specCount: specCountMatch ? parseInt(specCountMatch[1]) : 0,
                    });
                }
            });
        }
        if (sort) {
            if (sort === 'sales_asc') {
                products.sort((a, b) => parseInt(a.price) - parseInt(b.price));
            }
            else if (sort === 'sales_desc') {
                products.sort((a, b) => parseInt(b.price) - parseInt(a.price));
            }
            else if (sort === 'price_asc') {
                products.sort((a, b) => parseInt(a.price || '0') - parseInt(b.price || '0'));
            }
            else if (sort === 'price_desc') {
                products.sort((a, b) => parseInt(b.price || '0') - parseInt(a.price || '0'));
            }
        }
        const totalPagesMatch = html.match(/<span[^>]*class=["']total-pages["'][^>]*>(\d+)/);
        const totalPages = totalPagesMatch ? parseInt(totalPagesMatch[1]) : 1;
        const totalResultsMatch = html.match(/<span[^>]*class=["']total-count["'][^>]*>(\d+)/);
        const totalResults = totalResultsMatch ? parseInt(totalResultsMatch[1]) : products.length;
        return {
            products,
            totalResults,
            totalPages,
            currentPage: page,
        };
    }
    catch (error) {
        console.error('Search products error:', error);
        return {
            products: [],
            totalResults: 0,
            totalPages: 0,
            currentPage: page,
        };
    }
};
exports.searchProducts = searchProducts;
