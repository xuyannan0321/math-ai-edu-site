# 原题真解 Pro

原题真解 Pro 是一个面向学生和教师的数学教育网站项目。项目目标不是只给最终答案，而是帮助使用者理解题意、掌握知识点、查看分步解析、发现易错点，并完成验算检查。

当前项目正在从静态前端升级为真实 AI 大模型解题网站。目前已完成前端基础、后端 API 骨架、阿里云 RDS MySQL、注册登录、JWT 鉴权、真实 AI 文字解题基础版、图片识题 + 解题基础版、明确模型选择、题库保存按钮、Word 可打开文档导出基础版、GeoGebra 图形数据导出基础版，以及 `visualizationSpec` 图示渲染基础能力。真实 AI 调用需要在 `server/.env` 中配置模型 API Key，API Key 不得写入前端。

## 在线访问

GitHub Pages 前端部署地址：

```text
https://xuyannan0321.github.io/math-ai-edu-site/
```

注意：GitHub Pages 只托管静态前端页面。后端 API 需要单独部署到服务器，例如阿里云 ECS 或其他 Node.js 运行环境。

## 当前阶段状态

当前已完成：

1. 工作台；
2. 图片 / PDF 本地预览；
3. 文字题真实 AI 解题；
4. 图片识题 + AI 解题基础版；
5. 源码建站；
6. 原创题库；
7. 策略库；
8. 我的中心；
9. 帮助中心；
10. 完整备份与恢复；
11. 后端 API 骨架；
12. 注册登录；
13. JWT 鉴权；
14. 阿里云 RDS MySQL 建表；
15. `/api/solve-text`；
16. `/api/solve-image`；
17. `modelRouter` 多模型路由基础版；
18. `visionRouter` 图片识题路由基础版；
19. DashScope / 阿里通义文字模型和 Qwen-VL 视觉模型接入基础；
20. DeepSeek 官方文字接口基础接入；
21. GPT / Gemini 通过后端可配置 Base URL 的基础接入；
22. AI 解题结果保存到 `solve_records`；
23. 图片附件元数据保存到 `attachments`；
24. 模型调用日志写入 `model_calls`；
25. 明确模型选择：自动推荐、阿里通义 Qwen、DeepSeek、GPT、Gemini；
26. AI 结果生成后可明确保存到原创题库或策略库；
27. Word 可打开文档导出基础版；
28. GeoGebra 图形数据导出基础版；
29. `visualizationSpec` 前端图示渲染基础能力。

仍在后续阶段推进：

- PDF 识题；
- 数据库题库读取与云端题库管理；
- 真正完整 `.docx` 导出；
- 复杂 `.ggb` zip 包导出；
- 真实积分、支付、公开发布和分享系统；
- OSS 长期文件存储。

## 项目结构

```text
math-ai-edu-site/
├─ index.html
├─ css/
│  └─ style.css
├─ js/
│  └─ app.js
├─ design/
│  └─ 网站样式.html            # UI 参考文件，不参与网站运行
├─ server/
│  ├─ package.json
│  ├─ package-lock.json
│  ├─ .env.example
│  ├─ .gitignore
│  ├─ sql/
│  │  └─ schema.sql
│  └─ src/
│     ├─ app.js
│     ├─ server.js
│     ├─ config/
│     ├─ db/
│     ├─ middleware/
│     ├─ routes/
│     ├─ services/
│     │  └─ providers/
│     └─ utils/
├─ AGENTS.md
└─ README.md
```

重要说明：

- `server/.env` 不提交。
- `server/node_modules/` 不提交。
- 真实 API Key、数据库密码、JWT_SECRET 只能放在 `server/.env` 中。
- 前端 `index.html`、`css/style.css`、`js/app.js` 中不得出现 API Key、数据库密码或 JWT_SECRET。
- 不要在项目根目录运行 `npm install`，后端依赖只在 `server/` 目录内安装。

## 本地运行

### 前端运行

推荐使用 VS Code Live Server 打开 `index.html`，或在项目根目录运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

### 后端运行

进入后端目录：

```bash
cd server
npm install
copy .env.example .env
npm.cmd start
```

PowerShell 也可以执行：

```powershell
cd server
npm install
Copy-Item .env.example .env
npm.cmd start
```

健康检查：

[http://localhost:3001/api/health](http://localhost:3001/api/health)

## 环境变量

后端环境变量写在 `server/.env`。请以 `server/.env.example` 为模板创建，不要提交真实 `.env`。

需要配置：

```env
PORT=3001
JWT_SECRET=replace-with-a-long-random-secret

DB_HOST=your-rds-mysql-host
DB_PORT=3306
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_NAME=math_ai_edu

DAILY_AI_LIMIT=20
MAX_IMAGE_SIZE_MB=3

DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus
DASHSCOPE_VISION_MODEL=

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=
OPENAI_VISION_MODEL=

GEMINI_API_KEY=
GEMINI_BASE_URL=
GEMINI_MODEL=
GEMINI_VISION_MODEL=
```

注意：

- README 中不要写任何真实密码、真实 API Key 或真实 JWT_SECRET。
- API Key 只能由后端读取，不能写入前端代码。
- DashScope / Qwen-VL 使用后端配置接入。
- GPT 和 Gemini 可以通过后端配置的 Base URL 接入。
- DeepSeek 使用官方接口，当前主要用于文字解题。

## 数据库说明

数据库使用阿里云 RDS MySQL。

当前数据库名：

```text
math_ai_edu
```

建表文件：

```text
server/sql/schema.sql
```

当前包含四张表：

1. `users`：用户账号、密码哈希、角色、创建时间、最后登录时间；
2. `solve_records`：AI 解题结果、题库记录、结构化解析、源码内容；
3. `attachments`：图片 / PDF 附件元数据与后续 OSS 信息；
4. `model_calls`：模型调用日志、耗时、失败原因和 token 信息。

本阶段图片识题使用 memory upload，不假装已经上传 OSS；只在识题成功后保存附件基础元数据。

## 后端 API

### 健康检查

```http
GET /api/health
```

### 注册

```http
POST /api/auth/register
```

### 登录

```http
POST /api/auth/login
```

登录成功后返回 JWT token，前端暂时保存到浏览器 `localStorage`。

### 当前用户

```http
GET /api/auth/me
Authorization: Bearer <token>
```

### 真实 AI 文字解题

```http
POST /api/solve-text
Authorization: Bearer <token>
Content-Type: application/json
```

请求示例：

```json
{
  "questionText": "已知一次函数 y=2x+1，求当 x=3 时 y 的值。",
  "subject": "数学",
  "gradeLevel": "初中",
  "questionType": "函数",
  "libraryType": "original",
  "preferredProvider": "dashscope"
}
```

### 图片识题 + 解题

```http
POST /api/solve-image
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

表单字段：

- `image`：jpg / png / webp 图片；
- `subject`：默认数学；
- `gradeLevel`：默认初中；
- `questionType`：代数 / 几何 / 函数 / 综合；
- `libraryType`：`original` 或 `strategy`；
- `preferredVisionProvider`：`auto` / `qwen-vl` / `gemini-vision` / `openai-vision`；
- `preferredSolveProvider`：`auto` / `dashscope` / `deepseek` / `openai` / `gemini`。

限制：

- 默认图片大小限制 3MB；
- 只支持 jpg / png / webp；
- PDF 本阶段只保留前端本地预览，不做识题。

返回结构包含：

- `recordId`；
- `recognizedText`；
- `visionProvider`；
- `solveProvider`；
- `result`；
- `htmlResult`。

### 模型配置状态检测

```http
GET /api/models/status
```

返回各模型是否已配置文字能力和视觉能力，例如 `textConfigured`、`visionConfigured`。接口不会返回 API Key、Base URL、数据库信息或其他敏感配置。前端只据此显示“可用 / 未配置”，并在用户点击未配置模型时提示切换其他模型或使用自动推荐。

### 保存记录到题库

```http
PATCH /api/solve-records/:id/library
Authorization: Bearer <token>
Content-Type: application/json
```

请求示例：

```json
{
  "libraryType": "strategy"
}
```

只能修改当前登录用户自己的记录，`libraryType` 只能是 `original` 或 `strategy`。

### Word 可打开文档导出基础版

```http
GET /api/solve-records/:id/export/word
Authorization: Bearer <token>
```

当前返回 Word 可打开的 `.doc` 文档，内容来自结构化解题字段，包括标题、原题、识别文本、考点、题意分析、步骤、答案、易错提醒、验算检查和质量检查。动画不会保留。真正完整 `.docx` 为后续增强。

### GeoGebra 图形数据导出基础版

```http
GET /api/solve-records/:id/export/ggb
Authorization: Bearer <token>
```

当前导出基础 GeoGebra XML 图形数据，只在 `visualizationSpec` 足够可靠时输出。支持的对象包括 `point`、`segment`、`line`、`circle`、`angle`、`function`、`auxiliaryLine`。

如果当前记录没有可靠图示数据，接口会返回友好提示：当前题目暂无可导出的 GGB 图形，请先生成图示数据。复杂 `.ggb` zip 包后续再做。

## AI 解题输出结构

后端会要求模型返回结构化 JSON，并在服务端做基础归一化。核心字段包括：

- `title`
- `problemText`
- `gradeLevel`
- `subject`
- `topic`
- `knowledgePoints`
- `analysis`
- `steps`
- `finalAnswer`
- `commonMistakes`
- `verification`
- `visualizationSpec`
- `qualityCheck`

`visualizationSpec` 基础结构：

```json
{
  "type": "equation_balance | function_graph | geometry | dynamic_point | number_line | none",
  "title": "",
  "description": "",
  "objects": [],
  "steps": []
}
```

教学结构强调题意分析、本题考点、分步解析、最终答案、易错提醒、验算检查和质量检查。默认优先使用初中数学方法，不默认使用高中向量、导数或复杂解析几何。题目条件不足时应明确说明，不编造题目中没有的条件。

前端会根据 `visualizationSpec` 用 SVG / 安全动画基础能力渲染图示。缺少图示数据时，会尝试对简单一元方程生成 `equation_balance` 基础示意，或对安全的基础函数表达式生成 `function_graph`；几何题没有可靠点线圆数据时显示“暂无可靠图示，可查看文字解析”，不会为了好看而编造图形。

## modelRouter 与 visionRouter

`modelRouter` 当前支持：

1. 明确模型选择：自动推荐、阿里通义 Qwen、DeepSeek、GPT、Gemini；
2. `preferredProvider` 优先尝试；
3. `auto` 自动 fallback；
4. provider fallback；
5. 跳过未配置 API Key 的 provider；
6. 记录模型调用成功 / 失败日志；
7. 返回结构化 JSON；
8. 每用户每日调用次数限制。

文字模型默认优先级：

1. `dashscope`
2. `deepseek`
3. `openai`
4. `gemini`

`visionRouter` 当前支持：

1. Qwen-VL / DashScope；
2. Gemini Vision；
3. GPT Vision；
4. 未配置自动跳过；
5. 识图阶段写入 `model_calls.stage = recognition`。

## 当前功能

### 前端功能

- 工作台；
- 文字解题入口；
- 拍照 / 图片解题入口；
- 明确模型选择：自动推荐、阿里通义 Qwen、DeepSeek、GPT、Gemini；
- 模型配置状态检测：可用 / 未配置；
- 图片 / PDF 本地预览；
- 识别文本可编辑；
- 用修改后的识别文本重新解析；
- AI 结果区顶部固定操作条；
- AI 结果生成后可点击保存到原创题库 / 保存到策略库；
- Word 可打开文档导出按钮；
- GeoGebra 图形数据导出按钮；
- 图示讲解基础渲染；
- 高级预览 / 源码折叠区；
- 源码建站；
- 大尺寸 iframe 本地预览；
- 原创题库；
- 策略库；
- 搜索、筛选、排序、重置；
- 我的中心；
- 帮助中心；
- 新手引导；
- 本地完整备份与恢复；
- 数学图形数据 `visualizationData` 保存与校验基础版。

### 后端功能

- Node.js + Express 后端；
- 统一 JSON 返回格式；
- 统一错误响应；
- 阿里云 RDS MySQL 连接池；
- JWT 鉴权中间件；
- 密码哈希保存；
- `GET /api/health`；
- `POST /api/auth/register`；
- `POST /api/auth/login`；
- `GET /api/auth/me`；
- `GET /api/models/status`；
- `POST /api/solve-text`；
- `POST /api/solve-image`；
- `PATCH /api/solve-records/:id/library`；
- `GET /api/solve-records/:id/export/word`；
- `GET /api/solve-records/:id/export/ggb`；
- AI 解题结果保存到 `solve_records`；
- 图片附件元数据保存到 `attachments`；
- 模型调用日志写入 `model_calls`。

## 本地数据说明

前端仍保留本地数据功能，数据保存在当前浏览器来源的 `localStorage` 中。

当前使用的主要 key：

```text
mathAiEduOriginalItems
mathAiEduStrategyItems
mathAiEduLastFullBackupAt
mathAiEduHasSeenWelcomeGuide
mathAiEduAuthToken
```

后续数据库题库读取完成后，会逐步把核心题库数据迁移到后端数据库。目前原创题库和策略库页面仍保留本地数据管理能力。

## GitHub Pages 部署

当前前端入口和资源均使用相对路径，可以继续部署到 GitHub Pages。

注意：GitHub Pages 不会运行 `server/` 后端。前端部署到 GitHub Pages 后，如果要使用登录和 AI 解题，需要把后端 API 单独部署，并在前端配置正确的 API 地址。

## 当前限制

1. 真实 AI 调用需要在 `server/.env` 中配置对应模型 Key；
2. Qwen-VL / GPT Vision / Gemini Vision 的实际可用性取决于后端配置；
3. PDF 识题暂未完成；
4. 数据库题库读取页面暂未完成；
5. 当前 Word 导出是 Word 可打开文档基础版，不是完整复杂 `.docx`；
6. 当前 GeoGebra 导出是图形数据基础版，复杂 `.ggb` zip 包暂未完成；
7. 支付、积分、公开发布、分享仍为后续功能；
8. API Key 不得写入前端；
9. `server/.env` 不得提交；
10. 本阶段不做 OSS 长期保存，只保存附件元数据；
11. 源码预览 iframe 允许脚本在隔离环境中运行，只应预览自己编写或确认可信的源码；
12. Word 导出不保留网页动图；
13. 复杂几何动图和高级 GGB 导出仍需后续增强。

## 后续计划

1. 完善真实环境下 DashScope / Qwen-VL 联调；
2. 完善 DeepSeek、OpenAI、Gemini 生产配置；
3. PDF 识题；
4. 数据库题库读取与云端题库管理；
5. 收藏、发布状态和用户隔离题库；
6. 高质量数学图形 SVG / Canvas；
7. 真正完整 `.docx` 导出；
8. 复杂 `.ggb` zip 包导出；
9. OSS 文件存储；
10. 正式部署后端到阿里云服务器；
11. 配置生产环境 HTTPS、CORS、日志和限流。

## 测试方式

根目录没有 `package.json`，因此不要在项目根目录运行：

```bash
npm install
npm run build
npm run lint
```

前端推荐检查：

```bash
node --check js/app.js
node --check js/visualization.js
git diff --check
```

后端语法检查可以对 `server/src/**/*.js` 执行 `node --check`。

接口测试建议：

1. `GET /api/health` 应返回 `success: true`；
2. `POST /api/auth/register` 可以创建测试用户；
3. `POST /api/auth/login` 可以返回 token；
4. `GET /api/auth/me` 携带 token 后可以返回当前用户；
5. `GET /api/models/status` 应返回各模型 `textConfigured` / `visionConfigured`，且不包含任何密钥或模型地址；
6. 未携带 token 调用 `POST /api/solve-text` 应返回 401；
7. 未携带 token 调用 `POST /api/solve-image` 应返回 401；
8. 非 jpg/png/webp 上传到 `POST /api/solve-image` 应被拒绝；
9. 超过 3MB 的图片应被拒绝；
10. 配置视觉模型 Key 后，登录用户调用 `POST /api/solve-image` 应返回 `recognizedText`；
11. 配置文字模型 Key 后，登录用户调用 `POST /api/solve-text` 应返回结构化解析并保存到数据库；
12. `PATCH /api/solve-records/:id/library` 应只能更新当前用户自己的记录；
13. `GET /api/solve-records/:id/export/word` 应能下载 Word 可打开文档；
14. `GET /api/solve-records/:id/export/ggb` 在无可靠图示数据时应返回友好提示。

浏览器手动测试：

- 导航入口是否正常切换；
- 工作台“文字解题 / 拍照图片解题”是否可切换；
- 模型卡片是否显示“可用 / 未配置”，未配置模型是否阻止并提示；
- 上传图片是否显示缩略图；
- PDF 是否只显示文件信息；
- 图片识题后是否显示可编辑识别文本；
- 修改识别文本后是否可重新解析；
- 左侧不再显示保存位置选择；
- AI 结果区顶部是否始终显示保存到原创题库 / 策略库、导出 Word、导出 GGB 按钮；
- Word 和 GeoGebra 导出按钮是否可用；
- 无可靠图示数据时是否显示“暂无可靠图示，可查看文字解析”；
- 未登录时 AI 解题是否提示先登录；
- 登录后我的中心是否显示用户名；
- 源码建站预览是否正常；
- 原创题库和策略库页面是否正常打开；
- 完整备份导出和导入预览是否正常；
- 帮助中心 FAQ 是否可以展开关闭；
- 390px 手机视口是否无横向滚动；
- 浏览器控制台红色错误是否为 0。

## 部署注意事项

- `index.html` 必须保留在前端部署分支根目录；
- 文件和目录名称区分大小写；
- 请保持 `css/style.css`、`js/app.js` 与 HTML 引用一致；
- `design/网站样式.html` 是 UI 参考文件，不参与网站运行；
- `server/.env`、`server/node_modules/` 不提交；
- 后端部署时必须在服务器环境变量或 `server/.env` 中配置数据库和模型 Key；
- 前端部署地址和后端 API 地址不同时，需要配置后端 CORS；
- 生产环境应使用 HTTPS；
- 生产环境应使用足够长且随机的 `JWT_SECRET`。
