# 原题真解 Pro

原题真解 Pro 是一个面向学生和教师的数学教育网站项目，目标不是只给最终答案，而是帮助使用者理解题意、掌握知识点、查看分步解析、发现易错点，并完成验算检查。

当前项目正在从静态前端升级为真实 AI 大模型解题网站。目前已完成前端基础、后端 API 骨架、阿里云 RDS MySQL、注册登录和 JWT 鉴权。真实 AI 文字解题接口 `/api/solve-text` 正在下一阶段开发中，暂未完成。

## 在线访问

GitHub Pages 前端部署地址：

```text
https://xuyannan0321.github.io/math-ai-edu-site/
```

如果仓库名称、GitHub 用户名或自定义域名发生变化，请以 GitHub Pages 页面显示的实际地址为准。

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
12. 阿里云 RDS MySQL 建表。

当前正在推进：

- 真实 AI 文字解题 `/api/solve-text`；
- 多模型 `modelRouter`；
- AI 解题结果保存到数据库；
- 前端从模拟解析切换为真实后端接口调用。

## 项目结构

```text
math-ai-edu-site/
├─ index.html                  # 前端入口
├─ css/
│  └─ style.css                # 前端样式
├─ js/
│  └─ app.js                   # 前端交互、本地数据、登录状态
├─ design/
│  └─ 网站样式.html            # UI 参考文件，不参与网站运行
├─ server/
│  ├─ package.json             # 后端依赖与启动脚本
│  ├─ package-lock.json
│  ├─ .env.example             # 后端环境变量示例
│  ├─ .gitignore               # 忽略 .env 和 node_modules
│  ├─ sql/
│  │  └─ schema.sql            # MySQL 建表文件
│  └─ src/                     # Express 后端源码
├─ AGENTS.md                   # 项目规则和开发约束
└─ README.md
```

重要说明：

- `server/.env` 不提交。
- `server/node_modules/` 不提交。
- 真实 API Key、数据库密码、JWT_SECRET 只能放在 `server/.env` 中。
- 前端 `index.html`、`css/style.css`、`js/app.js` 中不得出现 API Key、数据库密码或 JWT_SECRET。

## 本地运行

### 前端运行

不要直接双击 HTML 作为主要测试方式，建议通过本地静态服务器打开项目。

使用 VS Code Live Server：

1. 使用 VS Code 打开项目目录。
2. 安装并启用 Live Server 扩展。
3. 右键 `index.html`，选择 **Open with Live Server**。
4. 在浏览器中测试页面导航、上传预览、源码预览、题库、备份和帮助中心功能。

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

如果你使用 PowerShell，也可以用：

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
OPENAI_API_KEY=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
```

注意：

- README 中不要写任何真实密码、真实 API Key 或真实 JWT_SECRET。
- 第 1 天已完成登录鉴权；真实 AI Key 将在后续 `/api/solve-text` 和 `modelRouter` 阶段使用。
- API Key 只能由后端读取，不能写入前端代码。

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

1. `users`：用户账号、密码哈希、角色、登录时间；
2. `solve_records`：后续保存 AI 解题结果、题库记录和源码内容；
3. `attachments`：后续保存图片/PDF 附件与 OSS 信息；
4. `model_calls`：后续记录模型调用日志、耗时、失败原因和 token 信息。

## 当前功能

### 前端功能

- 工作台；
- 图片 / PDF 本地预览；
- 模拟解析生成；
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

- Node.js + Express 后端骨架；
- 统一 JSON 返回格式；
- 阿里云 RDS MySQL 连接池；
- `GET /api/health`；
- `POST /api/auth/register`；
- `POST /api/auth/login`；
- `GET /api/auth/me`；
- JWT 鉴权中间件；
- 用户注册和登录；
- 密码哈希保存，不保存明文密码。

### 前端与登录状态

- 我的中心可显示“未登录 / 已登录用户名”；
- 登录 token 暂时保存在浏览器 `localStorage`；
- 支持退出登录；
- 原创题库和策略库前台已去掉“下载 HTML”和“复制源码”按钮；
- `sourceCode` 字段仍保留，不影响源码建站和 iframe 预览。

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

1. 将项目提交并推送到 GitHub 仓库的 `main` 分支。
2. 打开 GitHub 仓库页面。
3. 进入 **Settings → Pages**。
4. 在 **Build and deployment** 中，将 **Source** 选择为 **Deploy from a branch**。
5. 分支选择 `main`，目录选择 `/(root)`，然后点击 **Save**。
6. 等待 GitHub Pages 完成部署。

注意：GitHub Pages 只托管前端静态页面；后端 API 需要单独部署到服务器，例如阿里云 ECS 或其他 Node.js 运行环境。

## 当前限制

1. 真实 AI 文字解题正在开发中；
2. 图片识题暂未完成；
3. Word `.docx` 暂未完成；
4. GGB 导出暂未完成；
5. 支付、积分、公开发布、分享仍为后续功能；
6. API Key 不得写入前端；
7. `server/.env` 不得提交；
8. 当前题库页面仍保留本地数据管理能力，数据库题库读取会在后续阶段接入；
9. 源码预览 iframe 允许脚本在隔离环境中运行，只应预览自己编写或确认可信的源码；
10. 当前 `visualizationData` 只负责保存和校验，不负责真正绘图，也不生成 GGB 文件。

## 后续计划

后续建议按以下顺序推进：

1. `/api/solve-text`；
2. `modelRouter`；
3. 阿里通义 / DashScope；
4. GPT；
5. DeepSeek；
6. Gemini；
7. 图片识题；
8. 数据库题库读取；
9. 高质量数学图形 SVG / Canvas；
10. 正式部署到阿里云服务器。

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

浏览器手动测试：

- 六个导航入口是否正常切换；
- 工作台上传图片是否显示缩略图；
- PDF 是否显示文件信息；
- 清除文件是否正常；
- 源码建站预览是否正常；
- 原创题库和策略库页面是否正常打开；
- 我的中心登录状态是否正常显示；
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
- 前端部署地址和后端 API 地址不同时，需要配置后端 CORS。
