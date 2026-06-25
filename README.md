# 原题真解 Pro

原题真解 Pro 是一个面向学生和教师的数学教育网站项目。项目目标不是只给最终答案，而是帮助使用者理解题意、掌握知识点、查看分步解析、发现易错点，并完成验算检查。

当前项目正在从静态前端升级为真实 AI 大模型解题网站。目前已完成前端基础、后端 API 骨架、阿里云 RDS MySQL、注册登录、JWT 鉴权，以及真实 AI 文字解题接口基础版。真实 AI 调用需要在 `server/.env` 中配置模型 API Key，API Key 不得写入前端。

## 在线访问

GitHub Pages 前端部署地址：

```text
https://xuyannan0321.github.io/math-ai-edu-site/
```

如果仓库名称、GitHub 用户名或自定义域名发生变化，请以 GitHub Pages 页面显示的实际地址为准。

注意：GitHub Pages 只托管静态前端页面。后端 API 需要单独部署到服务器，例如阿里云 ECS 或其他 Node.js 运行环境。

## 当前阶段状态

当前已完成：

1. 工作台；
2. 图片 / PDF 本地预览；
3. 源码建站；
4. 原创题库；
5. 策略库；
6. 我的中心；
7. 帮助中心；
8. 完整备份与恢复；
9. 后端 API 骨架；
10. 注册登录；
11. JWT 鉴权；
12. 阿里云 RDS MySQL 建表；
13. `/api/solve-text` 真实 AI 文字解题接口基础版；
14. `modelRouter` 多模型路由基础版；
15. DashScope / 阿里通义 provider 基础接入；
16. AI 解题结果保存到 `solve_records`；
17. 模型调用日志写入 `model_calls`；
18. 前端工作台已从模拟生成切换为调用后端解题接口。

仍在后续阶段推进：

- 图片识题；
- PDF 识题；
- 数据库题库读取与云端题库管理；
- Word `.docx` 导出；
- GGB 导出；
- 真实积分、支付、公开发布和分享系统。

## 项目结构

```text
math-ai-edu-site/
├─ index.html                  # 前端入口
├─ css/
│  └─ style.css                # 前端样式
├─ js/
│  └─ app.js                   # 前端交互、本地数据、登录状态、AI 请求
├─ design/
│  └─ 网站样式.html            # UI 参考文件，不参与网站运行
├─ server/
│  ├─ package.json             # 后端依赖与启动脚本
│  ├─ package-lock.json
│  ├─ .env.example             # 后端环境变量示例
│  ├─ .gitignore               # 忽略 .env 和 node_modules
│  ├─ sql/
│  │  └─ schema.sql            # MySQL 建表文件
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
├─ AGENTS.md                   # 项目规则和开发约束
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

不要直接双击 HTML 作为主要测试方式，建议通过本地静态服务器打开项目。

使用 VS Code Live Server：

1. 使用 VS Code 打开项目目录；
2. 安装并启用 Live Server 扩展；
3. 右键 `index.html`，选择 **Open with Live Server**；
4. 在浏览器中测试页面导航、上传预览、源码预览、题库、备份、帮助中心和登录状态。

或使用 Python 静态服务器：

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

如果使用 PowerShell，也可以执行：

```powershell
cd server
npm install
Copy-Item .env.example .env
npm.cmd start
```

启动后访问健康检查：

[http://localhost:3001/api/health](http://localhost:3001/api/health)

正常返回示例：

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "service": "math-ai-edu-server"
  }
}
```

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

DASHSCOPE_API_KEY=
DASHSCOPE_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
DASHSCOPE_MODEL=qwen-plus

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL=deepseek-chat

OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4.1-mini

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

注意：

- README 中不要写任何真实密码、真实 API Key 或真实 JWT_SECRET。
- API Key 只能由后端读取，不能写入前端代码。
- 当前优先接入 DashScope / 阿里通义；DeepSeek、OpenAI、Gemini provider 文件已预留，后续继续完善。

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
3. `attachments`：后续保存图片 / PDF 附件与 OSS 信息；
4. `model_calls`：模型调用日志、耗时、失败原因和 token 信息。

## 后端 API

当前已实现：

### 健康检查

```http
GET /api/health
```

### 注册

```http
POST /api/auth/register
```

请求示例：

```json
{
  "username": "teacher001",
  "password": "your-password"
}
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

返回结构包含：

- `recordId`：保存到 `solve_records` 后的记录 ID；
- `provider`：实际使用的模型 provider；
- `modelName`：模型名称；
- `result`：结构化教学解析 JSON；
- `htmlResult`：可预览的解析 HTML。

`/api/solve-text` 需要登录后调用。未登录会返回 401。每个用户每日 AI 调用次数当前限制为 20 次。

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

教学结构强调：

1. 题目识别与整理；
2. 题意分析；
3. 本题考点；
4. 分步解析；
5. 最终答案；
6. 易错提醒；
7. 验算检查；
8. 是否使用初中方法；
9. 质量检查。

要求模型优先使用初中数学方法，不默认使用高中向量、导数或复杂解析几何。题目条件不足时应明确说明，不编造题目中没有的条件。

## modelRouter 说明

当前 `modelRouter` 支持：

1. `preferredProvider` 优先尝试；
2. provider fallback 顺序；
3. 跳过未配置 API Key 的 provider；
4. 记录模型调用成功 / 失败日志；
5. 返回结构化 JSON；
6. 对用户每日调用次数做基础限制。

默认优先级：

1. `dashscope`
2. `deepseek`
3. `openai`
4. `gemini`

当前已完成 DashScope / 阿里通义 provider 基础接入。若 `server/.env` 中未配置 `DASHSCOPE_API_KEY`，接口会返回友好提示，不会把内部错误或密钥信息返回给前端。

## 当前功能

### 前端功能

- 工作台；
- 图片 / PDF 本地预览；
- AI 文字解题请求；
- 代码 / 预览切换；
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
- `GET /api/health`；
- `POST /api/auth/register`；
- `POST /api/auth/login`；
- `GET /api/auth/me`；
- `POST /api/solve-text`；
- JWT 鉴权中间件；
- 密码哈希保存，不保存明文密码；
- AI 解题结果保存到 `solve_records`；
- 模型调用日志写入 `model_calls`。

### 前端与登录状态

- 我的中心可以显示“未登录 / 已登录用户名”；
- 登录 token 暂时保存在浏览器 `localStorage`；
- 支持退出登录；
- 未登录时工作台会阻止真实 AI 解题，并提示先登录；
- 原创题库和策略库前台已去掉“下载 HTML”和“复制源码”按钮；
- `sourceCode` 字段仍然保留，不影响源码建站和 iframe 预览。

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

说明：

- Live Server、其他本地端口、GitHub Pages 属于不同浏览器来源；
- 不同浏览器之间不会自动共享 localStorage；
- 电脑和手机之间不会自动同步 localStorage；
- 清理浏览器站点数据可能会删除本地题库和登录 token；
- 后续数据库题库读取完成后，会逐步把核心题库数据迁移到后端数据库。

## GitHub Pages 部署

当前前端入口和资源均使用相对路径，可以继续部署到 GitHub Pages。

1. 将项目提交并推送到 GitHub 仓库的 `main` 分支；
2. 打开 GitHub 仓库页面；
3. 进入 **Settings → Pages**；
4. 在 **Build and deployment** 中，将 **Source** 选择为 **Deploy from a branch**；
5. 分支选择 `main`，目录选择 `/(root)`，然后点击 **Save**；
6. 等待 GitHub Pages 完成部署。

注意：GitHub Pages 不会运行 `server/` 后端。前端部署到 GitHub Pages 后，如果要使用登录和 AI 解题，需要把后端 API 单独部署，并在前端配置正确的 API 地址。

## 当前限制

1. 真实 AI 文字解题已完成基础接口，但需要配置 `server/.env` 中的 DashScope API Key 才能真实调用模型；
2. DeepSeek、OpenAI、Gemini 当前为 provider 结构预留，后续继续完善；
3. 图片识题暂未完成；
4. PDF 识题暂未完成；
5. 数据库题库读取页面暂未完成，当前题库页面仍保留本地数据管理能力；
6. Word `.docx` 暂未完成；
7. GGB 导出暂未完成；
8. 支付、积分、公开发布、分享仍为后续功能；
9. API Key 不得写入前端；
10. `server/.env` 不得提交；
11. 源码预览 iframe 允许脚本在隔离环境中运行，只应预览自己编写或确认可信的源码；
12. 当前 `visualizationData` 只负责保存和校验，不负责真正绘图，也不生成 GGB 文件。

## 后续计划

后续建议按以下顺序推进：

1. 完善 DashScope 真实环境联调；
2. 接入 DeepSeek；
3. 接入 OpenAI / GPT；
4. 接入 Gemini；
5. 图片识题；
6. PDF 识题；
7. 数据库题库读取与云端题库管理；
8. 收藏、发布状态和用户隔离题库；
9. 高质量数学图形 SVG / Canvas；
10. Word `.docx` 导出；
11. GGB 导出；
12. 正式部署后端到阿里云服务器；
13. 配置生产环境 HTTPS、CORS、日志和限流。

## 开发原则

- 不要重写整个项目；
- 优先在现有 HTML、CSS、JavaScript 和 `server/` 后端基础上小步修改；
- 不要把 API Key、数据库密码、JWT_SECRET 写进前端；
- 真实 AI 接入必须通过服务端完成；
- 用户输入、导入 JSON 和源码展示要注意安全；
- 不要把用户输入直接当 HTML 插入普通页面；
- 预览 HTML 时使用隔离 iframe；
- 每次修改后都要回归测试已有功能。

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
git diff --check
```

后端推荐检查：

```bash
cd server
npm.cmd start
```

后端语法检查可以对 `server/src/**/*.js` 执行 `node --check`。

接口测试建议：

1. `GET /api/health` 应返回 `success: true`；
2. `POST /api/auth/register` 可以创建测试用户；
3. `POST /api/auth/login` 可以返回 token；
4. `GET /api/auth/me` 携带 token 后可以返回当前用户；
5. 未携带 token 调用 `POST /api/solve-text` 应返回 401；
6. 配置 `DASHSCOPE_API_KEY` 后，登录用户调用 `POST /api/solve-text` 应返回结构化解析并保存到数据库；
7. 未配置模型 key 时，`POST /api/solve-text` 应返回友好提示。

浏览器手动测试：

- 导航入口是否正常切换；
- 工作台上传图片是否显示缩略图；
- PDF 是否显示文件信息；
- 清除文件是否正常；
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
