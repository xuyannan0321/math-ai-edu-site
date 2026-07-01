# 原题真解 Pro 回归测试清单

本文件用于记录项目稳定测试题。以后每次 Codex 修改代码后，都必须先跑本清单，确认旧功能没有被改坏。

---

## 后端修改后的强制重启流程

只要修改以下文件，必须重启后端：

- server/.env
- server/src/config/env.js
- server/src/services/modelRouter.js
- server/src/services/graphTemplates.js
- server/src/services/solveSchema.js
- server/src/services/solvePrompt.js
- server/src/services/mathTextNormalize.js
- server/src/services/visionRouter.js
- server/src/server.js

重启步骤：

1. 关闭 Math Website Backend 黑色窗口；
2. 关闭 Math Website Frontend 黑色窗口；
3. 关闭 Math Website Dev Launcher 黑色窗口；
4. 如果端口 3001 被占用，执行：

```powershell
taskkill /F /IM node.exe
```

5. 重新双击 start-dev.bat；
6. 浏览器按 Ctrl + F5；
7. 再重新测试。

常见错误：

```text
Error: listen EADDRINUSE: address already in use :::3001
```

解释：

3001 端口已经被旧 Node 后端占用，需要关闭旧进程后再启动。

验收标准：

- 修改 server/.env 后，必须重启后端才会生效；
- 修改 graphTemplates.js 后，必须重启后端才会加载新模板；
- 浏览器刷新不能代替后端重启；
- Network 里必须点 solve-text 的 Response，不要点 visualization.js、app.js、style.css。

## 一、测试前准备

### 1. 启动后端

```powershell
cd C:\Users\admins\Desktop\math-website\server
npm.cmd start
```

看到后端启动日志后，浏览器访问：

```text
http://localhost:3001/api/health
```

应返回 `success: true` 或健康检查正常信息。

### 2. 启动前端

推荐直接双击项目根目录的：

```text
start-dev.bat
```

脚本会尝试启动后端、启动本地前端静态服务，并打开：

```text
http://localhost:5500
```

如果浏览器缓存导致旧效果残留，请按 `Ctrl + F5` 强制刷新。

### 3. 登录状态

涉及真实 AI 解题、保存记录、云端题库读取时，需要先在“我的中心”登录。

---

## 二、核心 AI 解题回归

### 1. 简单二次函数作图

题目：

```text
画出函数 y=\frac{\sqrt{3}}{3}x^2-\frac{2\sqrt{3}}{3}x-\sqrt{3} 的图像
```

期望：

- 能显示抛物线；
- 能显示顶点、对称轴、关键点；
- 不显示“后端图形采样数据缺失”；
- 不显示“复杂多问题图示数据不足”；
- 正式解析区不裸露 `\frac`、`\sqrt`、`\left`、`\right`。

### 2. 函数交点模板

题目：

```text
求函数 y=8/x 与 y=2x 的交点。
```

期望：

- 显示 `y=8/x` 正支；
- 显示 `y=8/x` 负支；
- 显示 `y=2x` 直线；
- 显示 A(2,4)、B(-2,-4)；
- 解析结果与图示一致。

### 3. 坐标面积关系模板

题目：

```text
已知点 P(m,2m)、Q(-1,-2)、M(5,-2)，三角形 PQM 的面积为 10，求 m。
```

期望：

- 显示 Q、M、P1、P2；
- 显示 QM；
- 显示 P1Q、P1M、P2Q、P2M；
- 显示 y=-2 和两条高线；
- 不强行画抛物线；
- 答案为 `m=\frac{2}{3}` 或 `m=-\frac{8}{3}`。

---

## 三、坐标几何模板 V1 回归

### 1. 两点距离

题目：

```text
已知 A(1,2)，B(4,6)，求 AB 的长。
```

期望：

- 标题为“两点距离示意图”或类似标题；
- 图中有 x 轴、y 轴、网格；
- 显示 A(1,2)、B(4,6)、H（H 可不显示坐标）；
- AB 为实线；
- AH、BH 为虚线；
- 不在图中显示 `Δx=3`、`Δy=4` 这类派生计算标签；
- 结论为 AB=5。

### 2. 线段中点

题目：

```text
已知 A(-2,3)，B(4,-1)，求线段 AB 的中点 M 的坐标。
```

期望：

- 显示 A、B、M；
- 显示线段 AB；
- M 位于 AB 中点；
- 解析写清横坐标平均值、纵坐标平均值。

### 3. 点到水平线距离

题目：

```text
已知 P(3,5)，求点 P 到直线 y=1 的距离。
```

期望：

- 显示 P(3,5)；
- 显示 H（可不显示坐标）；
- 显示 PH；
- `y=1` 横线清晰可见，颜色比普通辅助线更明显；
- `y=1` 标签不和 H 标签重叠；
- 结论距离为 4。

### 4. 坐标三角形面积

题目：

```text
已知 A(0,0)，B(6,0)，C(2,4)，求三角形 ABC 的面积。
```

期望：

- 显示 A、B、C；
- 显示三角形三边；
- 如果底边水平，显示对应高；
- 解析说明底和高；
- 面积结果正确。

### 5. 平行 / 垂直判断

题目：

```text
已知 A(0,0)，B(2,2)，C(0,2)，D(2,0)，判断 AB 与 CD 是否垂直。
```

期望：

- 显示 A、B、C、D；
- 显示 AB 和 CD；
- 解析正文不要出现多余箭头、英文技术残留或 JSON 痕迹；
- 结论与斜率 / 方向关系一致。

---

## 四、纯几何题回归

题目：

```text
已知三角形 ABC 中，AB=AC，点 D 是 BC 的中点，求证 AD 垂直 BC。
```

期望：

- 不误套函数模板；
- 不误套坐标几何模板；
- 文字解析正常；
- 如果图示数据不足，可以显示友好提示或原图兜底；
- 解析符合初中几何方法。

## 平面几何模板测试

### 测试 10：等腰三角形三线合一

输入：

```text
已知三角形 ABC 中，AB=AC，点 D 是 BC 的中点，求证 AD 垂直 BC。
```

验收标准：

- 显示等腰三角形 ABC；
- 显示 A、B、C、D；
- 显示 AD；
- 显示 BD=CD；
- 显示 AD ⟂ BC 或直角标记；
- 解析使用全等三角形或等腰三角形三线合一；
- 不使用坐标法、向量法、高中三角；
- 不误套坐标几何模板。

### 测试 11：三角形中位线

输入：

```text
已知三角形 ABC 中，M 是 AB 的中点，N 是 AC 的中点，求证 MN 平行 BC。
```

验收标准：

- 显示三角形 ABC；
- 显示 M 在 AB 上；
- 显示 N 在 AC 上；
- 显示 MN；
- 显示 BC；
- 显示 AM=MB 或 M 为 AB 中点；
- 显示 AN=NC 或 N 为 AC 中点；
- 显示 MN ∥ BC；
- 解析使用三角形中位线定理；
- 不使用坐标法、向量法、高中三角；
- 不误套坐标几何模板。

### 测试 12：平行线内错角

主测试输入：

```text
已知 AB ∥ CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。
```

兼容测试输入：

```text
已知 AB || CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。
```

验收标准：

- 显示两条平行线 AB、CD；
- 显示截线 EF；
- 显示 E、F；
- 显示 ∠AEF 和 ∠EFD；
- 显示 AB ∥ CD；
- 不显示 ∠1、∠2；
- 不在图中写“内错角相等”或结论等式；
- 角弧不遮挡线段；
- 解析使用“两直线平行，内错角相等”；
- 不使用坐标法、斜率、向量、高中三角；
- 不误套坐标几何模板。

## 几何图示美观验收规则

- 图中不显示过长条件；
- 长比例式放在解析文字中，不强制画在图内；
- 图中只保留短标签、关键条件关系和必要标记；
- 标签不得遮挡图形；
- 标签不得溢出画布；
- 两个三角形类模板应左右排列清晰；
- 相似模板允许两个三角形大小不同；
- 全等、相似模板不在图中直接显示判定类型和结论；
- 图示用于辅助理解，不代替完整证明文字。

## 模板图示统一质量规范 V2 回归检查

- 图中不显示定理名称；
- 图中不显示长公式串；
- 图中不显示完整证明句；
- 求值题图中不提前显示最终答案；
- 图中只保留关键点、线、角、关系和未知量；
- 图示标签不得遮挡线段和顶点；
- 相似 SSS 图中不显示 `AB/DE=AC/DF=BC/EF`；
- 勾股图中不显示 `AB=5`，只显示 `AB=?`；
- 平行线内错角图中使用 `∠AEF`、`∠EFD`，不使用 `∠1`、`∠2`；
- 解析区必须仍然保留完整条件和推理过程。

## 三角形全等模板测试

### 测试 17：三边对应相等判定全等（SSS）

输入：

```text
已知 AB=DE，AC=DF，BC=EF，求证 △ABC≌△DEF。
```

兼容输入 1：

```text
已知 AB=DE，AC=DF，BC=EF，求证 △ABC≅△DEF。
```

兼容输入 2：

```text
已知 AB=DE，AC=DF，BC=EF，求证 ▵ABC≅▵DEF。
```

兼容输入 3：

```text
已知 AB=DE，AC=DF，BC=EF，求证 三角形 ABC 全等于 三角形 DEF。
```

验收标准：

- 显示 △ABC 和 △DEF；
- 显示 A、B、C、D、E、F；
- 图中不强制显示全部条件；
- 解析文字中写清 AB=DE、AC=DF、BC=EF；
- 图中不显示 SSS 全等或 △ABC≌△DEF；
- 图中不堆满三组等式；
- 图中不显示长证明文字；
- 图中只保留两个三角形、顶点和必要短标记；
- 主输入和 3 个兼容输入都应触发 congruent_triangle_sss_v1；
- 图示整洁，不遮挡、不溢出；
- 解析使用“三边对应相等，两个三角形全等”；
- 不使用坐标法、向量法、高中三角；
- 不误套相似或坐标几何模板。

### 测试 18：两边及夹角判定全等（SAS）

输入：

```text
已知 AB=DE，AC=DF，∠BAC=∠EDF，求证 △ABC≌△DEF。
```

验收标准：

- 显示 △ABC 和 △DEF；
- 图中不强制显示全部条件；
- 解析文字中写清 AB=DE、AC=DF、∠BAC=∠EDF；
- 图中显示必要角标记；
- 图中不显示 SAS 全等或 △ABC≌△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用“两边及夹角对应相等，两个三角形全等”；
- 不使用坐标法、向量法、高中三角；
- 不误套相似或坐标几何模板。

### 测试 19：两角及夹边判定全等（ASA）

输入：

```text
已知 ∠A=∠D，AB=DE，∠B=∠E，求证 △ABC≌△DEF。
```

验收标准：

- 显示 △ABC 和 △DEF；
- 图中不强制显示全部条件；
- 解析文字中写清 ∠A=∠D、AB=DE、∠B=∠E；
- 图中显示必要角标记；
- 图中不显示 ASA 全等或 △ABC≌△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用“两角及夹边对应相等，两个三角形全等”；
- ASA 题不误触发 AAS；
- 不使用坐标法、向量法、高中三角；
- 不误套相似或坐标几何模板。

### 测试 20：两角及一边判定全等（AAS）

输入：

```text
已知 ∠A=∠D，∠B=∠E，AC=DF，求证 △ABC≌△DEF。
```

验收标准：

- 显示 △ABC 和 △DEF；
- 图中不强制显示全部条件；
- 解析文字中写清 ∠A=∠D、∠B=∠E、AC=DF；
- 图中显示必要角标记；
- 图中不显示 AAS 全等或 △ABC≌△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用“两角及其中一角的对边对应相等，两个三角形全等”；
- 不把夹边条件题误判为 AAS；
- 不使用坐标法、向量法、高中三角；
- 不误套相似或坐标几何模板。

### 测试 21：直角三角形斜边和直角边判定全等（HL）

输入：

```text
在 Rt△ABC 和 Rt△DEF 中，∠C=∠F=90°，AB=DE，AC=DF，求证 △ABC≌△DEF。
```

验收标准：

- 显示 Rt△ABC 和 Rt△DEF；
- 显示 ∠C=90°、∠F=90° 或直角标记；
- 图中不强制显示全部条件；
- 解析文字中写清 AB=DE、AC=DF；
- 图中保留直角标记；
- 图中不显示 HL 全等或 △ABC≌△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用“斜边和一条直角边对应相等，两个直角三角形全等”；
- 不使用坐标法、向量法、高中三角；
- 不误套相似或坐标几何模板。

## 三角形相似模板测试

### 测试 22：AA 相似

输入：

```text
已知 ∠A=∠D，∠B=∠E，求证 △ABC∽△DEF。
```

验收标准：

- 显示两个三角形；
- 图中不强制显示全部条件；
- 解析文字中写清 ∠A=∠D、∠B=∠E；
- 图中显示必要角标记；
- 图中不显示 AA 相似或 △ABC∽△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用 AA 相似。

### 测试 23：SAS 相似

输入：

```text
已知 AB/DE=AC/DF，∠A=∠D，求证 △ABC∽△DEF。
```

验收标准：

- 显示两个三角形；
- 图中不显示长比例式；
- 解析文字中写清 AB/DE=AC/DF 和 ∠A=∠D；
- 图中显示必要角标记；
- 图中不显示 SAS 相似或 △ABC∽△DEF；
- 图示整洁，不遮挡、不溢出；
- 解析使用 SAS 相似。

### 测试 24：SSS 相似

输入：

```text
已知 AB/DE=AC/DF=BC/EF，求证 △ABC∽△DEF。
```

验收标准：

- 显示两个三角形；
- 图中不显示长比例式；
- 解析文字中写清 AB/DE=AC/DF=BC/EF；
- 图中不显示 SSS 相似或 △ABC∽△DEF；
- 图中不显示 `AB/DE=AC/DF=BC/EF`；
- 不误触发全等模板；
- 图示整洁，不遮挡、不溢出；
- 解析使用 SSS 相似。

## 几何性质模板测试

### 测试 25：角平分线性质

输入：

```text
已知三角形 ABC 中，AD 是 ∠BAC 的角平分线，点 D 在 BC 上，求证 ∠BAD=∠DAC。
```

验收标准：

- 显示三角形 ABC；
- 显示 AD；
- 显示 ∠BAD 和 ∠DAC 的角标记；
- 图中不显示“角平分线”定理名称或结论等式；
- 解析使用角平分线定义；
- 不使用坐标、向量、高中方法。

### 测试 26：垂直平分线性质

输入：

```text
已知 l 是线段 AB 的垂直平分线，点 P 在 l 上，求证 PA=PB。
```

验收标准：

- 显示线段 AB；
- 显示中点 M；
- 显示垂直平分线 l；
- 显示点 P；
- 显示 PA、PB；
- 最多保留 PA=PB 这一短关系标签；
- 图中不显示“垂直平分线”定理名称；
- 图中没有长证明文字；
- 解析使用垂直平分线性质；
- 不使用坐标、向量、高中方法。

### 测试 27：勾股定理

输入：

```text
已知 Rt△ABC 中，∠C=90°，AC=3，BC=4，求 AB。
```

验收标准：

- 显示直角三角形 ABC；
- 显示 ∠C=90°；
- 显示 AC=3、BC=4；
- 可显示 AB=?，不显示“斜边 AB”；
- 图中不显示“勾股定理”、`AB=5` 或 `AB²=AC²+BC²`；
- 解析使用勾股定理；
- 结论 AB=5。

## 圆基础模板测试

### 测试 28：同圆半径相等

输入：

```text
已知 OA、OB 是 ⊙O 的半径，求证 OA=OB。
```

验收标准：

- 应触发 `radius_equal_v1`；
- 显示圆 ⊙O；
- 圆完整显示，不被视口裁切；
- 显示圆心 O；
- 显示 A、B 在圆上；
- 显示 OA、OB；
- 解析使用同圆半径相等；
- 图中不显示“同圆半径相等”定理名称；
- 图中不显示长证明文字。

### 测试 29：直径所对圆周角是直角

输入：

```text
已知 AB 是 ⊙O 的直径，点 C 在 ⊙O 上，求证 ∠ACB=90°。
```

验收标准：

- 应触发 `diameter_right_angle_v1`；
- 显示圆 ⊙O；
- 圆完整显示，不被视口裁切；
- 显示圆心 O；
- 显示 AB 为直径；
- 显示 C 在圆上，视觉上不得偏离圆周；
- 显示 AC、BC；
- 在 C 处显示直角标记；
- 解析使用直径所对圆周角是直角；
- 图中不显示“直径所对圆周角是直角”长文字；
- 图中不显示长证明文字。

### 测试 30：切线垂直半径

输入：

```text
已知 PA 是 ⊙O 的切线，A 为切点，OA 是半径，求证 OA⊥PA。
```

验收标准：

- 应触发 `tangent_radius_perpendicular_v1`；
- 显示圆 ⊙O；
- 圆完整显示，不被视口裁切；
- 显示 O、A、P；
- 显示 OA；
- 显示 PA 为切线；
- 在 A 处显示直角标记；
- `PA 是 ⊙O 的切线`、`PA为⊙O的切线`、`PA切⊙O于A`、`直线 PA 与 ⊙O 相切于 A` 均应稳定出图；
- 如果页面显示“visualizationSpec 缺失或不可渲染”，必须检查 `buildGraphTemplateSpec` 是否命中 `tangent_radius_perpendicular_v1`，以及 `solveSchema` 是否稳定覆盖 AI 的 `none` 图示；
- 解析使用切线垂直于过切点半径；
- 图中不显示“切线垂直于过切点半径”长文字；
- 图中不显示长证明文字。

## 题干符号归一化测试

### 测试 13：平行符号兼容

输入 1：

```text
已知 AB ∥ CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。
```

输入 2：

```text
已知 AB || CD，直线 EF 分别交 AB、CD 于点 E、F，求证 ∠AEF = ∠EFD。
```

输入 3：

```text
已知 AB 平行 CD，直线 EF 分别交 AB、CD 于点 E、F，求证 角AEF 等于 角EFD。
```

验收：

三种输入都应触发 parallel_angle_v1。

### 测试 14：中点表达兼容

输入 1：

```text
已知三角形 ABC 中，AB=AC，点 D 为 BC 的中点，求证 AD 垂直 BC。
```

输入 2：

```text
已知三角形 ABC 中，AB=AC，D为BC中点，求证 AD⊥BC。
```

验收：

两种输入都应触发 isosceles_triangle_v1。

### 测试 15：中位线表达兼容

输入：

```text
已知三角形 ABC 中，点M是线段AB的中点，点N是线段AC的中点，求证 MN 平行 BC。
```

验收：

应触发 midpoint_midline_v1。

### 测试 16：扩展几何符号归一化

只做归一化检查，不要求生成模板图。

输入：

```text
已知 PA 是 ⊙O 的切线，OA 是半径，AB 是直径，△ABC ≌ △DEF，△ADE ∽ △ABC，⌒AB 是劣弧。
```

验收：

归一化层应能保留或识别：

- ⊙O
- 切线
- 半径
- 直径
- ≌
- ∽
- ⌒AB

---

## 五、图片识题回归

### 1. 单题图片

期望：

- 上传图片后能显示本地预览；
- OCR 识别后，如果是完整单题，应自动进入正式解析；
- 正式解析区 MathJax 正常；
- 图示不足时要明确说明原因。

### 2. 整页多题图片

期望：

- 不自动乱解；
- 提示用户裁剪单题或只保留一个小题后重新解析；
- OCR 草稿 textarea 可以保留原始 LaTeX。

---

## 六、题库与保存回归

### 1. 保存到原创题库 / 策略库

期望：

- AI 解题成功后出现“保存到原创题库 / 保存到策略库”按钮；
- 保存请求只操作当前登录用户自己的记录；
- 成功后 Toast 提示正确。

### 2. 云端题库读取

期望：

- 原创题库能读取当前用户记录；
- 策略库能读取当前用户记录；
- 错误 `libraryType` 返回友好 400；
- 错误 `pageSize` 不导致数据库报错。

---

## 七、导出回归

### 1. Word 可打开文档基础版

期望：

- 登录用户只能导出自己的记录；
- 下载 `.doc` 文件；
- 内容包含题目、考点、步骤、答案、易错提醒、验算检查；
- 不宣称是完整 `.docx`。

### 2. GeoGebra 图形数据导出基础版

期望：

- 登录用户只能导出自己的记录；
- 有可靠 visualizationSpec 时导出基础图形数据；
- 没有可靠图形数据时返回友好提示；
- 不编造点、线、圆、函数。

---

## 模板批量 smoke 测试

模板新增或模板匹配规则调整后，优先运行：

```powershell
node server/scripts/templateSmokeTest.js
```

验收：

- 正例应命中指定 `templateId`；
- `canRender` 必须为 `true`；
- `type` 不能为 `none`；
- 几何模板必须有 `objects` 且长度大于 0；
- `function_graph` 模板必须有可渲染的 curves、functions 或 points；
- 负例不得命中特定模板。

首批覆盖：

- `function_intersection_v1`
- `isosceles_triangle_v1`
- `midpoint_midline_v1`
- `parallel_angle_v1`
- `congruent_triangle_sss_v1`
- `similar_triangle_aa_v1`
- `similar_triangle_sss_v1`
- `angle_bisector_v1`
- `perpendicular_bisector_v1`
- `pythagorean_right_triangle_v1`
- `radius_equal_v1`
- `diameter_right_angle_v1`
- `tangent_radius_perpendicular_v1`

---

## 八、完成后必须检查

每次修改代码后至少运行：

```powershell
node --check js/app.js
node --check js/visualization.js
node --check server/src/services/graphTemplates.js
node --check server/src/services/solvePrompt.js
node --check server/src/services/solveSchema.js
git diff --check
git check-ignore -v server/.env
```

要求：

- `server/.env` 必须被 gitignore 忽略；
- 不得把 API Key、数据库密码、JWT_SECRET 写进前端或 README；
- 不得修改 `design/网站样式.html`；
- 不得新增 npm 依赖，除非用户明确确认；
- 不得破坏本文件中的旧测试题。
