"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const userStore_1 = require("../services/userStore");
const mask_1 = require("../services/mask");
const accessLog_1 = require("../services/accessLog");
const router = (0, express_1.Router)();
exports.adminRouter = router;
const PAGE = [
    '<!DOCTYPE html>',
    '<html lang="zh-CN">',
    '<head>',
    '<meta charset="UTF-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
    '<title>后端管理 - 账号与配置</title>',
    '<style>',
    '*{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"PingFang SC","Microsoft YaHei",sans-serif;background:#f5f6f8;color:#1f2937}',
    '.wrap{max-width:1100px;margin:0 auto;padding:24px}',
    'h1{font-size:18px;margin:0 0 16px}',
    '.card{background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:20px;box-shadow:0 1px 3px rgba(0,0,0,.04)}',
    '#loginBox{max-width:360px;margin:80px auto}',
    'input{width:100%;padding:10px 12px;margin-bottom:12px;border:1px solid #d1d5db;border-radius:8px;font-size:14px;outline:none}',
    'input:focus{border-color:#2563eb}',
    'button{cursor:pointer;border:0;border-radius:8px;padding:10px 16px;font-size:14px;background:#2563eb;color:#fff}',
    'button:hover{background:#1d4ed8}',
    'button.ghost{background:#eef2ff;color:#3730a3}',
    '.msg{min-height:20px;font-size:13px;color:#dc2626;margin-top:8px}',
    '.topbar{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;gap:12px;flex-wrap:wrap}',
    '.summary{display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap}',
    '.stat{background:#fff;border:1px solid #e5e7eb;border-radius:10px;padding:12px 16px;min-width:140px}',
    '.stat b{display:block;font-size:20px;margin-top:4px}',
    'table{width:100%;border-collapse:collapse;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden}',
    'th,td{padding:10px 12px;text-align:left;font-size:13px;border-bottom:1px solid #f1f3f5;vertical-align:top}',
    'th{background:#f9fafb;font-weight:600;white-space:nowrap}',
    'tr:last-child td{border-bottom:0}',
    'code{background:#f3f4f6;padding:2px 6px;border-radius:6px;font-size:12px}',
    '.muted{color:#9ca3af}',
    '.addr{font-size:12px;color:#4b5563;line-height:1.7}',
    '.badge{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;background:#eef2ff;color:#3730a3}',
    '</style>',
    '</head>',
    '<body>',
    '<div class="wrap">',
    '  <div id="loginBox" class="card">',
    '    <h1>后端管理登录</h1>',
    '    <input id="u" placeholder="管理员账号" autocomplete="username">',
    '    <input id="p" type="password" placeholder="密码" autocomplete="current-password">',
    '    <button style="width:100%" onclick="doLogin()">登录</button>',
    '    <div id="msg" class="msg"></div>',
    '  </div>',
    '  <div id="panel" style="display:none">',
    '    <div class="topbar">',
    '      <h1 id="title">账号与配置总览</h1>',
    '      <div><button class="ghost" id="tabUsers" onclick="switchTab(\'users\')">账号与配置</button> <button class="ghost" id="tabAccess" onclick="switchTab(\'access\')">访问统计</button> <span id="who" class="muted"></span> <button class="ghost" onclick="load()">刷新</button> <button class="ghost" onclick="doLogout()">退出</button></div>',
    '    </div>',
    '    <div id="summary" class="summary"></div>',
    '    <div id="list"></div>',
    '    <div id="accessBox" style="display:none">',
    '      <div id="accessSummary" class="summary"></div>',
    '      <div class="topbar">',
    '        <div>日期：<select id="accessDate" onchange="loadAccess(el(\'accessDate\').value)"></select></div>',
    '        <div class="muted">记录每个 IP 当天访问了哪些页面与接口（静态资源、图片代理不计入）</div>',
    '      </div>',
    '      <div id="accessIps"></div>',
    '      <h1 style="font-size:15px;margin:20px 0 10px">访问明细（最近 200 条）</h1>',
    '      <div id="accessEntries"></div>',
    '    </div>',
    '  </div>',
    '</div>',
    '<script>',
    'var token = sessionStorage.getItem("adminToken") || "";',
    'function el(id){return document.getElementById(id)}',
    'function esc(v){if(v===null||v===undefined)return "";return String(v).replace(/[&<>"]/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;","\\"":"&quot;"}[c]})}',
    'function api(path, opts){',
    '  opts = opts || {};',
    '  opts.headers = Object.assign({"Content-Type":"application/json"}, opts.headers || {});',
    '  if(token) opts.headers["x-user-token"] = token;',
    '  return fetch(path, opts).then(function(r){return r.json()});',
    '}',
    'function doLogin(){',
    '  el("msg").textContent = "";',
    '  api("/admin/api/login", {method:"POST", body:JSON.stringify({username:el("u").value, password:el("p").value})})',
    '    .then(function(d){',
    '      if(d.success){ token = d.data.token; sessionStorage.setItem("adminToken", token); showPanel(d.data.username); load(); }',
    '      else { el("msg").textContent = d.message || "登录失败"; }',
    '    })',
    '    .catch(function(){ el("msg").textContent = "请求失败"; });',
    '}',
    'function doLogout(){',
    '  api("/admin/api/logout", {method:"POST"}).catch(function(){});',
    '  token = ""; sessionStorage.removeItem("adminToken");',
    '  el("panel").style.display = "none"; el("loginBox").style.display = "block";',
    '}',
    'function showPanel(name){',
    '  el("loginBox").style.display = "none"; el("panel").style.display = "block";',
    '  el("who").textContent = "当前管理员: " + name;',
    '  switchTab("users");',
    '}',
    'function load(){',
    '  api("/admin/api/users").then(function(d){',
    '    if(!d.success){ el("panel").style.display="none"; el("loginBox").style.display="block"; el("msg").textContent = d.message || "需要重新登录"; return; }',
    '    var users = d.data.users || [];',
    '    var withKey = users.filter(function(u){return u.hasApiConfig}).length;',
    '    el("summary").innerHTML =',
    '      \'<div class="stat">账号总数<b>\' + users.length + \'</b></div>\' +',
    '      \'<div class="stat">已配置key<b>\' + withKey + \'</b></div>\';',
    '    var html = "<table><thead><tr><th>账号</th><th>角色</th><th>API Key</th><th>API Secret</th><th>收货地址</th><th>注册时间</th></tr></thead><tbody>";',
    '    users.forEach(function(u){',
    '      var cfg = u.apiConfig || {};',
    '      var addrs = (u.addresses || []).map(function(a){',
    '        return \'<div class="addr">· \' + esc(a.fullName) + " " + esc(a.mobile||a.mobilePhone) + "<br>&nbsp;&nbsp;" + esc((a.provinceText||"")+(a.cityText||"")+(a.areaText||"")+(a.address||"")) + "</div>";',
    '      }).join("");',
    '      html += "<tr>";',
    '      html += "<td><b>" + esc(u.username) + "</b><br><span class=\\"muted\\">" + esc(u.id) + "</span></td>";',
    '      html += "<td><span class=\\"badge\\">" + esc(u.role) + "</span></td>";',
    '      html += "<td>" + (cfg.key ? "<code>" + esc(cfg.key) + "</code>" : "<span class=\\"muted\\">未配置</span>") + "</td>";',
    '      html += "<td>" + (cfg.secret ? "<code>" + esc(cfg.secret) + "</code>" : "<span class=\\"muted\\">未配置</span>") + "</td>";',
    '      html += "<td>" + (addrs || "<span class=\\"muted\\">暂无</span>") + "</td>";',
    '      html += "<td><span class=\\"muted\\">" + esc((u.createdAt||"").replace("T"," ").substring(0,19)) + "</span></td>";',
    '      html += "</tr>";',
    '    });',
    '    html += "</tbody></table>";',
    '    el("list").innerHTML = html;',
    '  }).catch(function(){ el("msg").textContent = "加载失败"; });',
    '}',
    'function switchTab(tab){',
    '  var isUsers = tab === "users";',
    '  el("summary").style.display = isUsers ? "flex" : "none";',
    '  el("list").style.display = isUsers ? "block" : "none";',
    '  el("accessBox").style.display = isUsers ? "none" : "block";',
    '  el("title").textContent = isUsers ? "账号与配置总览" : "访问统计";',
    '  el("tabUsers").className = isUsers ? "" : "ghost";',
    '  el("tabAccess").className = isUsers ? "ghost" : "";',
    '  if(!isUsers){ loadAccess(); }',
    '}',
    'function fmtTime(ts){',
    '  if(!ts){ return ""; }',
    '  var d = new Date(ts);',
    '  function p(n){ return (n < 10 ? "0" : "") + n; }',
    '  return p(d.getMonth()+1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds());',
    '}',
    'function loadAccess(date){',
    '  var url = "/admin/api/access" + (date ? ("?date=" + encodeURIComponent(date)) : "");',
    '  api(url).then(function(d){',
    '    if(!d.success){ el("msg").textContent = d.message || "加载失败"; return; }',
    '    var s = d.data.stats, day = d.data.day;',
    '    el("accessSummary").innerHTML =',
    '      \'<div class="stat">总访问<b>\' + s.total + \'</b></div>\' +',
    '      \'<div class="stat">今日访问<b>\' + s.today + \'</b></div>\' +',
    '      \'<div class="stat">今日独立IP<b>\' + s.todayIps + \'</b></div>\' +',
    '      \'<div class="stat">累计独立IP<b>\' + s.uniqueIps + \'</b></div>\';',
    '    var days = s.days || [];',
    '    el("accessDate").innerHTML = days.map(function(x){',
    '      return \'<option value="\' + x.date + \'"\' + (x.date === day ? " selected" : "") + \'>\' + x.date + "（" + x.count + "）</option>";',
    '    }).join("") || (\'<option value="\' + day + \'">\' + day + "</option>");',
    '    var rows = d.data.ips || [];',
    '    var h = "<table><thead><tr><th>IP</th><th>访问次数</th><th>访问了哪些内容（Top 8）</th><th>登录账号</th><th>首次访问</th><th>最后访问</th></tr></thead><tbody>";',
    '    rows.forEach(function(g){',
    '      var paths = (g.topPaths || []).map(function(p){ return \'<div class="addr">· <code>\' + esc(p.path) + "</code> ×" + p.count + "</div>"; }).join("");',
    '      h += "<tr>";',
    '      h += "<td><b>" + esc(g.ip) + "</b><br><span class=\\"muted\\">" + esc((g.ua || "").substring(0, 52)) + "</span></td>";',
    '      h += "<td>" + g.count + \'<br><span class="muted">页面 \' + g.pageCount + " / 接口 " + g.apiCount + (g.adminCount ? (" / 后台 " + g.adminCount) : "") + "</span></td>";',
    '      h += "<td>" + (paths || \'<span class="muted">-</span>\') + "</td>";',
    '      h += "<td>" + ((g.users && g.users.length) ? esc(g.users.join("、")) : \'<span class="muted">未登录</span>\') + "</td>";',
    '      h += \'<td><span class="muted">\' + fmtTime(g.firstAt) + "</span></td>";',
    '      h += \'<td><span class="muted">\' + fmtTime(g.lastAt) + "</span></td>";',
    '      h += "</tr>";',
    '    });',
    '    h += "</tbody></table>";',
    '    el("accessIps").innerHTML = rows.length ? h : \'<div class="card">当天暂无访问记录</div>\';',
    '    var list = d.data.entries || [];',
    '    var e = "<table><thead><tr><th>时间</th><th>IP</th><th>方式</th><th>访问内容</th><th>账号</th><th>状态</th></tr></thead><tbody>";',
    '    list.forEach(function(r){',
    '      e += \'<tr><td><span class="muted">\' + fmtTime(r.ts) + "</span></td>";',
    '      e += "<td>" + esc(r.ip) + "</td><td>" + esc(r.method) + "</td>";',
    '      e += \'<td><code>\' + esc(r.path) + (r.query ? ("?" + esc(r.query)) : "") + \'</code> <span class="badge">\' + esc(r.type) + "</span></td>";',
    '      e += "<td>" + (r.user ? esc(r.user) : \'<span class="muted">-</span>\') + "</td><td>" + r.status + "</td></tr>";',
    '    });',
    '    e += "</tbody></table>";',
    '    el("accessEntries").innerHTML = list.length ? e : "";',
    '  }).catch(function(){ el("msg").textContent = "加载失败"; });',
    '}',
    'if(token){ showPanel(""); load(); }',
    'el("p").addEventListener("keydown", function(e){ if(e.key === "Enter") doLogin(); });',
    '</script>',
    '</body>',
    '</html>',
].join('\n');
const requireAdmin = (req, res, next) => {
    const token = req.get('x-user-token') || req.query.token || '';
    const user = (0, userStore_1.findUserByToken)(String(token).trim());
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ success: false, code: 'NEED_ADMIN_LOGIN', message: '请先登录管理员账号' });
    }
    req.adminUser = user;
    next();
};
router.get('/', (req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(PAGE);
});
router.post('/api/login', (req, res) => {
    try {
        const { username, password } = req.body || {};
        const user = (0, userStore_1.findUserByUsername)(String(username || '').trim());
        if (!user || user.role !== 'admin' || !(0, userStore_1.verifyUserPassword)(user, password)) {
            return res.status(401).json({ success: false, message: '账号或密码错误' });
        }
        const token = (0, userStore_1.createSession)(user.id);
        console.log(`[admin] 管理员登录: ${user.username}`);
        res.json({ success: true, message: '登录成功', data: { username: user.username, token } });
    }
    catch (error) {
        console.error('Admin login error:', error);
        res.status(500).json({ success: false, message: '登录失败: ' + (error instanceof Error ? error.message : String(error)) });
    }
});
router.post('/api/logout', requireAdmin, (req, res) => {
    const token = req.get('x-user-token') || '';
    (0, userStore_1.removeSession)(String(token).trim());
    res.json({ success: true, message: '已退出' });
});
router.get('/api/users', requireAdmin, (req, res) => {
    try {
        const users = (0, mask_1.maskUsersForAdmin)((0, userStore_1.listUsers)());
        res.json({ success: true, message: '获取成功', data: { total: users.length, users } });
    }
    catch (error) {
        console.error('Admin users error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
// 访问统计：按天查看「哪个 IP 访问了什么」
router.get('/api/access', requireAdmin, (req, res) => {
    try {
        const stats = (0, accessLog_1.getAccessStats)();
        const detail = (0, accessLog_1.getAccessByDate)(req.query.date);
        res.json({
            success: true,
            message: '获取成功',
            data: {
                stats,
                day: detail.date,
                total: detail.total,
                ipCount: detail.ipCount,
                ips: detail.ips,
                entries: detail.entries,
            },
        });
    }
    catch (error) {
        console.error('Admin access error:', error);
        res.status(500).json({ success: false, message: '获取失败' });
    }
});
