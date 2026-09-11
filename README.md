# 图片选品工具 (Web版) — 1688商品匹配

React + Express 单服务应用（前端产物 + 后端 API 一起部署），适配 Render 免费方案。

## 功能

- **图片搜索**：本地上传 / 图片URL / 图片ID 三种方式，先 `upload_img` 取图片ID再 `item_search_img`，快且稳
- **关键词搜索**、热门榜单、商品详情（含 SKU、最小起批量、详情图）
- **账号体系**：注册 / 登录（密码 scrypt 哈希存储）
- **按账号隔离 Key**：未登录用公共 key 浏览；登录后可配置自己的 key/秘钥，该账号的搜索/详情/图搜/下单全部走自己的 key
- **购物车下单**：按卖家自动拆分订单（同一卖家合并、不同卖家分单）；下单须登录且已配置自己的 key
- **识图提问**：商品卡片悬停出现按钮，弹框内针对该商品提问
- **管理员后台**：`/admin` 查看所有账号、各自 key 与收货地址（姓名/电话/地址已脱敏打码）
- **图片代理**：`/api/image?url=` 带 1688 Referer 取图，绕过 CDN 防盗链
- 多语言（中文 / English）

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
| `GET /admin` | 管理员后台 |
| `GET /api/user/list?key=` | 后端查看账号数据（需 ADMIN_KEY） |

## 环境变量

| 变量 | 说明 |
|---|---|
| `PORT` | 监听端口（Render 会注入） |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员后台账号，默认 `admin` / `onebound` |
| `ADMIN_KEY` | `/api/user/list` 查看密钥，不设置则自动生成到 `data/admin.key` |
| `PUBLIC_API_KEY` / `PUBLIC_API_SECRET` | 未登录访客使用的公共 key |
| `DATA_DIR` | 用户数据目录，默认 `dist/server/data`（挂 Render Disk 时指向挂载路径） |

## 部署 Render

1. 把本目录所有文件推送到 GitHub 仓库
2. Render → New → Web Service（或 Blueprint 读取 `render.yaml`）→ 选择该仓库
3. 配置：
   - Runtime：`Node`
   - Build Command：`npm install --omit=dev`
   - Start Command：`node dist/server/server.js`
   - Health Check Path：`/`
   - 环境变量：`NODE_VERSION=20.11.0`、`NODE_ENV=production`
4. 部署完成后访问 `https://<服务名>.onrender.com`

## 注意

- Render 免费方案磁盘为临时存储，`dist/server/data/` 下的账号、key 配置、地址快照在重启/重新部署后会丢失；如需持久化请升级付费方案并挂载 Disk，把 `DATA_DIR` 指向挂载路径
- 免费方案 15 分钟无访问会休眠，冷启动约 30–60 秒
- 商品图片务必通过 `/api/image` 代理访问，直连 alicdn 会因 Referer 防盗链返回 403
