"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyManager = void 0;
const axios_1 = __importDefault(require("axios"));
const https_proxy_agent_1 = require("https-proxy-agent");
const http_proxy_agent_1 = require("http-proxy-agent");
const socks_proxy_agent_1 = require("socks-proxy-agent");
class ProxyManager {
    constructor() {
        this.knownGoodProxies = [];
        this.proxies = [];
        this.badProxies = new Map();
        this.usedCount = new Map();
        this.enabled = true;
        this.maxUsesPerProxy = 5;
        this.lastRefreshTime = 0;
        this.refreshInterval = 300;
        this.badProxyTTL = 60;
        this.proxyIndex = 0;
        this.knownGoodProxies = [];
        this.proxies = [...this.knownGoodProxies];
    }
    getProxyProtocol(proxy) {
        if (proxy.startsWith('socks5://'))
            return 'socks5';
        if (proxy.startsWith('socks4://'))
            return 'socks4';
        if (proxy.startsWith('https://'))
            return 'https';
        return 'http';
    }
    normalizeProxy(proxy) {
        if (proxy.startsWith('socks') || proxy.startsWith('http'))
            return proxy;
        return `http://${proxy}`;
    }
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    isEnabled() {
        return this.enabled;
    }
    getStatus() {
        return {
            proxy_enabled: this.enabled,
            proxy_count: this.proxies.length,
            known_good_count: this.knownGoodProxies.length,
            bad_proxy_count: this.badProxies.size,
            max_uses_per_proxy: this.maxUsesPerProxy,
            mode: '纯代理模式（强制，不回退直连）',
        };
    }
    createAgent(proxy) {
        const protocol = this.getProxyProtocol(proxy);
        const proxyUrl = this.normalizeProxy(proxy);
        if (protocol === 'socks5' || protocol === 'socks4') {
            return new socks_proxy_agent_1.SocksProxyAgent(proxyUrl);
        }
        if (protocol === 'https') {
            return new https_proxy_agent_1.HttpsProxyAgent(proxyUrl);
        }
        return new http_proxy_agent_1.HttpProxyAgent(proxyUrl);
    }
    async fetchFromProxyScrape() {
        try {
            const url = 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=http&timeout=8000&country=all&ssl=all&anonymity=all';
            const response = await axios_1.default.get(url, { timeout: 10000 });
            return response.data
                .split('\r\n')
                .filter((p) => p && p.includes(':'))
                .map((p) => p.trim());
        }
        catch {
            return [];
        }
    }
    async fetchFromGeonode() {
        try {
            const url = 'https://proxylist.geonode.com/api/proxy-list?limit=100&page=1&sort_by=lastChecked&sort_type=desc&protocols=http';
            const response = await axios_1.default.get(url, { timeout: 10000 });
            if (response.data && response.data.data) {
                return response.data.data
                    .map((p) => `${p.ip}:${p.port}`)
                    .filter((p) => p && p !== ':');
            }
            return [];
        }
        catch {
            return [];
        }
    }
    async fetchFromSocksProxyScrape() {
        try {
            const url = 'https://api.proxyscrape.com/v2/?request=getproxies&protocol=socks5&timeout=8000&country=all';
            const response = await axios_1.default.get(url, { timeout: 10000 });
            return response.data
                .split('\r\n')
                .filter((p) => p && p.includes(':'))
                .map((p) => `socks5://${p.trim()}`);
        }
        catch {
            return [];
        }
    }
    async fetchFromTheSpeedX() {
        try {
            const url = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt';
            const response = await axios_1.default.get(url, { timeout: 15000 });
            return response.data
                .split('\n')
                .filter((p) => p && p.includes(':'))
                .map((p) => p.trim())
                .slice(0, 500);
        }
        catch {
            return [];
        }
    }
    async fetchFromTheSpeedXSocks() {
        try {
            const url = 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt';
            const response = await axios_1.default.get(url, { timeout: 15000 });
            return response.data
                .split('\n')
                .filter((p) => p && p.includes(':'))
                .map((p) => `socks5://${p.trim()}`)
                .slice(0, 300);
        }
        catch {
            return [];
        }
    }
    async fetchFromFreeProxyList() {
        try {
            const url = 'https://raw.githubusercontent.com/fate0/proxylist/master/proxy.list';
            const response = await axios_1.default.get(url, { timeout: 15000 });
            const lines = response.data.split('\n').filter(Boolean);
            const result = [];
            for (const line of lines) {
                try {
                    const obj = JSON.parse(line);
                    if (obj.host && obj.port) {
                        result.push(`${obj.host}:${obj.port}`);
                    }
                }
                catch {
                    continue;
                }
            }
            return result.slice(0, 300);
        }
        catch {
            return [];
        }
    }
    async fetchProxiesFast() {
        console.log('[1688Proxy] 获取代理列表...');
        const allProxies = new Set();
        const sources = [
            this.fetchFromProxyScrape(),
            this.fetchFromGeonode(),
            this.fetchFromTheSpeedX(),
            this.fetchFromFreeProxyList(),
            this.fetchFromSocksProxyScrape(),
            this.fetchFromTheSpeedXSocks(),
        ];
        const results = await Promise.allSettled(sources);
        results.forEach((result) => {
            if (result.status === 'fulfilled' && result.value) {
                result.value.forEach((p) => allProxies.add(p));
            }
        });
        console.log(`[1688Proxy] 获取到 ${allProxies.size} 个代理`);
        return Array.from(allProxies);
    }
    async refreshProxies(force = false) {
        const now = Date.now() / 1000;
        if (!force && now - this.lastRefreshTime < this.refreshInterval && this.proxies.length > 0) {
            return this.proxies;
        }
        try {
            const existingGood = this.proxies.filter((p) => !this.badProxies.has(p));
            const newProxies = await this.fetchProxiesFast();
            const merged = new Set([...this.knownGoodProxies, ...existingGood, ...newProxies]);
            const finalList = Array.from(merged).filter((p) => !this.badProxies.has(p));
            this.proxies = finalList;
            this.usedCount.clear();
            this.lastRefreshTime = now;
            console.log(`[1688Proxy] 刷新完成: ${finalList.length} 个代理`);
            return finalList;
        }
        catch (e) {
            console.error('[1688Proxy] 刷新失败:', e.message);
            this.proxies = [...this.knownGoodProxies];
            return this.proxies;
        }
    }
    getProxy() {
        if (!this.enabled) {
            return null;
        }
        const now = Date.now();
        this.badProxies.forEach((timestamp, proxy) => {
            if (proxy.startsWith('__'))
                return;
            if (now - timestamp > this.badProxyTTL * 1000) {
                this.badProxies.delete(proxy);
                this.badProxies.delete('__fail_count_' + proxy);
            }
        });
        const preferred = this.knownGoodProxies.filter((p) => !this.badProxies.has(p) &&
            (this.badProxies.get('__fail_count_' + p) || 0) === 0 &&
            (this.usedCount.get(p) || 0) < this.maxUsesPerProxy);
        if (preferred.length > 0) {
            const proxy = preferred[Math.floor(Math.random() * preferred.length)];
            const count = this.usedCount.get(proxy) || 0;
            this.usedCount.set(proxy, count + 1);
            return proxy;
        }
        const available = this.proxies.filter((p) => !this.badProxies.has(p) &&
            !this.knownGoodProxies.includes(p) &&
            (this.usedCount.get(p) || 0) < this.maxUsesPerProxy);
        if (available.length > 0) {
            this.proxyIndex = (this.proxyIndex + 1) % available.length;
            const proxy = available[this.proxyIndex];
            const count = this.usedCount.get(proxy) || 0;
            this.usedCount.set(proxy, count + 1);
            return proxy;
        }
        if (this.proxies.length > 0) {
            const nonBad = this.proxies.filter((p) => !this.badProxies.has(p));
            if (nonBad.length > 0) {
                this.usedCount.clear();
                this.proxyIndex = (this.proxyIndex + 1) % nonBad.length;
                const proxy = nonBad[this.proxyIndex];
                this.usedCount.set(proxy, 1);
                return proxy;
            }
        }
        if (this.knownGoodProxies.length > 0) {
            const proxy = this.knownGoodProxies[Math.floor(Math.random() * this.knownGoodProxies.length)];
            this.badProxies.delete(proxy);
            this.badProxies.delete('__fail_count_' + proxy);
            return proxy;
        }
        return null;
    }
    markFailed(proxy) {
        const isKnownGood = this.knownGoodProxies.includes(proxy);
        const failCount = (this.badProxies.get('__fail_count_' + proxy) || 0) + 1;
        if (isKnownGood) {
            if (failCount >= 3) {
                this.badProxies.set(proxy, Date.now());
                this.badProxies.set('__fail_count_' + proxy, 0);
                console.log(`[1688Proxy] 已知代理 ${proxy} 失败3次，暂时跳过`);
            }
            else {
                this.badProxies.set('__fail_count_' + proxy, failCount);
            }
        }
        else {
            this.badProxies.set(proxy, Date.now());
            this.proxies = this.proxies.filter((p) => p !== proxy);
            this.usedCount.delete(proxy);
        }
    }
    markSuccess(proxy) {
        this.badProxies.delete('__fail_count_' + proxy);
        this.badProxies.delete(proxy);
        if (!this.knownGoodProxies.includes(proxy) && this.knownGoodProxies.length < 20) {
            this.knownGoodProxies.push(proxy);
            console.log(`[1688Proxy] 代理 ${proxy} 成功，加入已知好代理列表 (共${this.knownGoodProxies.length}个)`);
        }
    }
    getRandomUA() {
        const uas = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
            'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        ];
        return uas[Math.floor(Math.random() * uas.length)];
    }
}
exports.proxyManager = new ProxyManager();
