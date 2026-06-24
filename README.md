# 原题真解 Pro

一个面向学生和教师的数学教育静态网站原型。项目强调题意分析、知识点梳理、分步解题、易错提醒和验算检查，而不是只展示最终答案。

项目采用原生 HTML、CSS 和 JavaScript 开发，不需要安装依赖或执行构建命令。

## 当前功能

- 顶部导航和单页页面切换。
- 工作台图片、PDF 本地选择与预览信息展示。
- 模拟生成结构化数学解析报告，并支持代码/预览切换。
- 源码建站表单、HTML/JSON 编辑和大尺寸 iframe 本地预览。
- 预览 iframe 支持脚本运行，可展示依赖 Tailwind CDN、MathJax、Canvas 和滑块交互的完整 HTML。
- 原创题库和策略库使用浏览器 `localStorage` 保存数据。
- 原创题库支持本地记录管理、三个内容 Tab 和静态积分/分享演示。
- 策略库支持科目、地区、类型、年份、日期、学校和关键字筛选。
- 两类题库均支持查看、编辑、删除、JSON 导入/导出、下载 HTML 和复制源码。
- 桌面端和移动端响应式布局。

## 项目结构

```text
math-ai-edu-site/
├── index.html              # 网站入口
├── css/
│   └── style.css           # 页面样式
├── js/
│   └── app.js              # 页面交互和本地数据逻辑
├── design/
│   └── 网站样式.html       # UI 参考文件，不参与网站运行
└── README.md
```

## 本地运行

不要直接双击 HTML 作为主要测试方式，建议通过本地静态服务器打开项目。

### 使用 VS Code Live Server

1. 使用 VS Code 打开项目目录。
2. 安装并启用 Live Server 扩展。
3. 右键 `index.html`，选择 **Open with Live Server**。
4. 在浏览器中测试页面导航、上传预览、源码预览和题库功能。

### 使用 Python 静态服务器

在项目根目录运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

## 部署到 GitHub Pages

当前入口和资源均使用相对路径，可以直接部署到 GitHub Pages 的项目子路径，不需要修改代码或执行构建。

1. 将项目提交并推送到 GitHub 仓库的 `main` 分支。
2. 打开 GitHub 仓库页面。
3. 进入 **Settings → Pages**。
4. 在 **Build and deployment** 中，将 **Source** 选择为 **Deploy from a branch**。
5. 分支选择 `main`，目录选择 `/(root)`，然后点击 **Save**。
6. 等待 GitHub Pages 完成部署。

当前仓库启用 Pages 后，预计访问地址为：

```text
https://xuyannan0321.github.io/math-ai-edu-site/
```

如果仓库名称、GitHub 用户名或自定义域名发生变化，请以 GitHub Pages 页面显示的实际地址为准。

## 本地数据迁移

题库数据不会写入项目文件，也不会随 Git 提交上传。数据保存在当前浏览器来源的 `localStorage` 中，使用以下 key：

- `mathAiEduOriginalItems`
- `mathAiEduStrategyItems`

Live Server、其他本地端口和 GitHub Pages 属于不同浏览器来源，它们之间不会自动共享 `localStorage` 数据。

迁移方式：

1. 在原地址进入原创题库或策略库，导出 JSON 备份。
2. 打开新的部署地址。
3. 在对应题库中导入 JSON 备份。
4. 确认记录能够查看后，再保留或整理原地址的数据。

## 当前限制

- 当前是纯静态前端项目。
- 未连接真实 AI，工作台生成内容为模拟教学示例。
- 未接入后端、数据库、登录、积分或支付系统。
- 题库数据仅保存在浏览器 `localStorage`，不会自动同步到其他设备或浏览器。
- 清理浏览器站点数据可能会删除本地题库，请定期导出 JSON 备份。
- 本地 Live Server 和 GitHub Pages 是不同来源，题库数据需要通过 JSON 导出/导入迁移。
- 源码预览允许脚本在隔离 iframe 中运行；只应预览自己编写或确认可信的源码。
- 用户源码依赖的 CDN 或其他网络资源需要联网才能正常加载。

## 部署注意事项

- `index.html` 必须保留在部署分支根目录。
- 文件和目录名称区分大小写，请保持 `css/style.css`、`js/app.js` 与 HTML 引用一致。
- 从仓库根目录部署时，`design/` 等普通静态目录也可能拥有公开访问地址，但不会被网站入口主动加载。
- 项目没有 `package.json`，不需要运行 `npm install`、`npm run build` 或 `npm run lint`。
