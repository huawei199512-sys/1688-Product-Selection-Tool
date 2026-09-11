# 图片选品工具 (Web版) — 1688商品匹配

React + Express 单服务应用

## 功能

web测试地址：https://product-matching-tool-web.onrender.com/
Web testing address: https://product-matching-tool-web.onrender.com/


- **图片搜索**：本地上传 / 图片URL / 图片ID 三种方式，先 `upload_img` 取图片ID再 `item_search_img`，快且稳
- **关键词搜索**、热门榜单、商品详情（含 SKU、最小起批量、详情图）
- **账号体系**：注册 / 登录（密码 scrypt 哈希存储）
- **按账号隔离 Key**：未登录用公共 key 浏览；登录后可配置自己的 key/秘钥，该账号的搜索/详情/图搜/下单全部走自己的 key
- **购物车下单**：按卖家自动拆分订单（同一卖家合并、不同卖家分单）；下单须登录且已配置自己的 key
- **识图提问**：商品卡片悬停出现按钮，弹框内针对该商品提问



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



Image Selection Tool (Web Version) -1688 Product Matching

React+Express Single Service Application

##Function

Web testing address: https://product-matching-tool-web.onrender.com/
Web testing address:  https://product-matching-tool-web.onrender.com/


-* * Image Search * *: There are three methods: local upload, image URL, and image ID. First, 'upload_img' takes the image ID, and then 'item_dearch_img', which is fast and stable
-* * Keyword search * *, popular rankings, product details (including SKU, minimum batch size, and detailed images)
-* * Account System * *: Registration/Login (password stored in scrypt hash)
-* * Isolate Key by Account * *: Browsing with a public key without logging in; After logging in, you can configure your own key/secret key, and all searches/details/image searches/orders for this account will be done using your own key
-* * Shopping cart ordering * *: Automatically split orders by seller (merge orders from the same seller, split orders from different sellers); Ordering requires logging in and configuring your own key
-* * Image recognition question * *: A button appears when hovering over the product card, and a question is asked about the product in the pop-up box



##Main interfaces

|Interface | Description|
|---|---|
| `GET /api/search? Q=` | Keyword search|
|GET/app/match/detail/: num_iid | Product details|
|POST/app/upload/image | Retrieve the image ID, body: {imgcode} (base64 or image URL)|
|POST/app/upload/image/file | Take the image ID, with the body being a binary image|
|POST/app/match | Image search, body: {imgid} or {imageURL}|
|POST/app/chat/product | Product image recognition question|
|POST/pai/order/create | Create an order (automatically split by seller)|
| `GET /api/image? Url=` | Image Proxy|


