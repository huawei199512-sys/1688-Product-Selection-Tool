# 图片选品工具 (Web版) — 1688商品匹配

React + Express 单服务应用（前端产物 + 后端 API 一起部署）

## 功能

web测试地址：https://product-matching-tool-web.onrender.com/
Web testing address: https://product-matching-tool-web.onrender.com/


- **图片搜索**：本地上传 / 图片URL / 图片ID 三种方式，先 `upload_img` 取图片ID再 `item_search_img`，快且稳
- **关键词搜索**、热门榜单、商品详情（含 SKU、最小起批量、详情图）
- **账号体系**：注册 / 登录（密码 scrypt 哈希存储）
- **按账号隔离 Key**：未登录用公共 key 浏览；登录后可配置自己的 key/秘钥，该账号的搜索/详情/图搜/下单全部走自己的 key
- **购物车下单**：按卖家自动拆分订单（同一卖家合并、不同卖家分单）；下单须登录且已配置自己的 key
- **识图提问**：商品卡片悬停出现按钮，弹框内针对该商品提问


## 本地运行

```bash
npm install
npm start
# 访问 http://localhost:3001    后台 http://localhost:3001/admin
```

默认管理员账号：`admin` / `onebound`（可用环境变量覆盖）

## 主要接口

| 接口 | 说明 |
|---|---|
| `GET /api/search?q=` | 关键词搜索 |
| `GET /api/match/detail/:num_iid` | 商品详情 |
| `POST /api/upload/image` | 取图片ID，body: `{imgcode}`（base64 或图片URL） |
| `POST /api/upload/image/file` | 取图片ID，body 为二进制图片 |
| `POST /api/match` | 图搜，body: `{imgid}` 或 `{imageUrl}` |
| `POST /api/chat/product` | 商品识图提问 |
| `POST /api/order/create` | 创建订单（自动按卖家拆单） |
| `GET /api/image?url=` | 图片代理 |


- 免费方案 15 分钟无访问会休眠，冷启动约 30–60 秒
- 商品图片务必通过 `/api/image` 代理访问，直连 alicdn 会因 Referer 防盗链返回 403
