"use strict";

const MOCK_REPORT_HTML = `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>模拟数学解析报告</title>
  <style>
    :root { color-scheme: light; font-family: "PingFang SC", "Microsoft YaHei", sans-serif; }
    * { box-sizing: border-box; }
    body { max-width: 880px; margin: 0 auto; padding: 36px 28px 56px; color: #334155; background: #fff; line-height: 1.75; }
    header { padding-bottom: 22px; margin-bottom: 24px; border-bottom: 1px solid #e2e8f0; }
    h1 { margin: 0 0 8px; color: #1e293b; font-size: 26px; }
    header p { margin: 0; color: #64748b; font-size: 14px; }
    .notice { padding: 12px 15px; margin-bottom: 22px; color: #1d4ed8; font-size: 13px; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 10px; }
    section { padding: 20px; margin-top: 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 13px; }
    h2 { display: flex; align-items: center; gap: 9px; margin: 0 0 10px; color: #1e40af; font-size: 17px; }
    h2 span { display: grid; width: 25px; height: 25px; place-items: center; color: #fff; font-size: 12px; background: #2563eb; border-radius: 7px; }
    p { margin: 7px 0; }
    ol, ul { padding-left: 22px; margin: 8px 0 0; }
    li + li { margin-top: 8px; }
    .formula { padding: 10px 14px; margin: 10px 0; color: #0f172a; font-family: Georgia, serif; font-size: 18px; text-align: center; background: #fff; border: 1px dashed #94a3b8; border-radius: 8px; }
    .answer { color: #166534; background: #f0fdf4; border-color: #bbf7d0; }
    .warning { color: #9a3412; background: #fff7ed; border-color: #fed7aa; }
    .muted { color: #64748b; font-size: 13px; }
    @media (max-width: 600px) { body { padding: 22px 14px 36px; } section { padding: 16px; } h1 { font-size: 22px; } }
  </style>
</head>
<body>
  <header>
    <h1>一元二次方程的因式分解法</h1>
    <p>模拟题：解方程 x² − 5x + 6 = 0。</p>
  </header>

  <div class="notice">这是第一阶段的固定教学示例，仅用于验证工作台界面和预览功能，没有调用真实 AI。</div>

  <section>
    <h2><span>1</span>题意分析</h2>
    <p>题目要求求出所有使等式成立的 x。观察常数项 6 和一次项系数 −5，可以尝试把左边分解成两个一次因式的乘积。</p>
  </section>

  <section>
    <h2><span>2</span>本题考点</h2>
    <ul>
      <li>用十字相乘法分解二次三项式。</li>
      <li>利用“两个因式的乘积为 0，则至少有一个因式为 0”。</li>
    </ul>
  </section>

  <section>
    <h2><span>3</span>解题步骤</h2>
    <ol>
      <li>寻找两个数，它们的乘积是 6，和是 −5。这两个数是 −2 和 −3。</li>
      <li>因此可以因式分解：</li>
    </ol>
    <div class="formula">x² − 5x + 6 = (x − 2)(x − 3)</div>
    <ol start="3">
      <li>原方程变为 (x − 2)(x − 3) = 0。</li>
      <li>所以 x − 2 = 0 或 x − 3 = 0，解得 x = 2 或 x = 3。</li>
    </ol>
  </section>

  <section class="answer">
    <h2><span>4</span>最终答案</h2>
    <p><strong>x = 2 或 x = 3。</strong></p>
  </section>

  <section class="warning">
    <h2><span>5</span>易错提醒</h2>
    <p>不要因为两个因式相乘等于 0，就只写其中一个解；必须分别令两个因式等于 0。</p>
  </section>

  <section>
    <h2><span>6</span>验算或检查</h2>
    <p>把 x = 2 代入：2² − 5×2 + 6 = 4 − 10 + 6 = 0。</p>
    <p>把 x = 3 代入：3² − 5×3 + 6 = 9 − 15 + 6 = 0。</p>
    <p class="muted">两个结果都使原方程成立，因此答案正确。</p>
  </section>
</body>
</html>`;

const PROVINCE_CITY_MAP = {
  北京市: ["北京市"],
  天津市: ["天津市"],
  河北省: ["石家庄市", "唐山市", "秦皇岛市", "邯郸市", "邢台市", "保定市", "张家口市", "承德市", "沧州市", "廊坊市", "衡水市"],
  山西省: ["太原市", "大同市", "阳泉市", "长治市", "晋城市", "朔州市", "晋中市", "运城市", "忻州市", "临汾市", "吕梁市"],
  内蒙古自治区: ["呼和浩特市", "包头市", "乌海市", "赤峰市", "通辽市", "鄂尔多斯市", "呼伦贝尔市", "巴彦淖尔市", "乌兰察布市", "兴安盟", "锡林郭勒盟", "阿拉善盟"],
  辽宁省: ["沈阳市", "大连市", "鞍山市", "抚顺市", "本溪市", "丹东市", "锦州市", "营口市", "阜新市", "辽阳市", "盘锦市", "铁岭市", "朝阳市", "葫芦岛市"],
  吉林省: ["长春市", "吉林市", "四平市", "辽源市", "通化市", "白山市", "松原市", "白城市", "延边朝鲜族自治州"],
  黑龙江省: ["哈尔滨市", "齐齐哈尔市", "鸡西市", "鹤岗市", "双鸭山市", "大庆市", "伊春市", "佳木斯市", "七台河市", "牡丹江市", "黑河市", "绥化市", "大兴安岭地区"],
  上海市: ["上海市"],
  江苏省: ["南京市", "无锡市", "徐州市", "常州市", "苏州市", "南通市", "连云港市", "淮安市", "盐城市", "扬州市", "镇江市", "泰州市", "宿迁市"],
  浙江省: ["杭州市", "宁波市", "温州市", "嘉兴市", "湖州市", "绍兴市", "金华市", "衢州市", "舟山市", "台州市", "丽水市"],
  安徽省: ["合肥市", "芜湖市", "蚌埠市", "淮南市", "马鞍山市", "淮北市", "铜陵市", "安庆市", "黄山市", "滁州市", "阜阳市", "宿州市", "六安市", "亳州市", "池州市", "宣城市"],
  福建省: ["福州市", "厦门市", "莆田市", "三明市", "泉州市", "漳州市", "南平市", "龙岩市", "宁德市"],
  江西省: ["南昌市", "景德镇市", "萍乡市", "九江市", "新余市", "鹰潭市", "赣州市", "吉安市", "宜春市", "抚州市", "上饶市"],
  山东省: ["济南市", "青岛市", "淄博市", "枣庄市", "东营市", "烟台市", "潍坊市", "济宁市", "泰安市", "威海市", "日照市", "临沂市", "德州市", "聊城市", "滨州市", "菏泽市"],
  河南省: ["郑州市", "开封市", "洛阳市", "平顶山市", "安阳市", "鹤壁市", "新乡市", "焦作市", "濮阳市", "许昌市", "漯河市", "三门峡市", "南阳市", "商丘市", "信阳市", "周口市", "驻马店市", "济源市"],
  湖北省: ["武汉市", "黄石市", "十堰市", "宜昌市", "襄阳市", "鄂州市", "荆门市", "孝感市", "荆州市", "黄冈市", "咸宁市", "随州市", "恩施土家族苗族自治州"],
  湖南省: ["长沙市", "株洲市", "湘潭市", "衡阳市", "邵阳市", "岳阳市", "常德市", "张家界市", "益阳市", "郴州市", "永州市", "怀化市", "娄底市", "湘西土家族苗族自治州"],
  广东省: ["广州市", "韶关市", "深圳市", "珠海市", "汕头市", "佛山市", "江门市", "湛江市", "茂名市", "肇庆市", "惠州市", "梅州市", "汕尾市", "河源市", "阳江市", "清远市", "东莞市", "中山市", "潮州市", "揭阳市", "云浮市"],
  广西壮族自治区: ["南宁市", "柳州市", "桂林市", "梧州市", "北海市", "防城港市", "钦州市", "贵港市", "玉林市", "百色市", "贺州市", "河池市", "来宾市", "崇左市"],
  海南省: ["海口市", "三亚市", "三沙市", "儋州市"],
  重庆市: ["重庆市"],
  四川省: ["成都市", "自贡市", "攀枝花市", "泸州市", "德阳市", "绵阳市", "广元市", "遂宁市", "内江市", "乐山市", "南充市", "眉山市", "宜宾市", "广安市", "达州市", "雅安市", "巴中市", "资阳市", "阿坝藏族羌族自治州", "甘孜藏族自治州", "凉山彝族自治州"],
  贵州省: ["贵阳市", "六盘水市", "遵义市", "安顺市", "毕节市", "铜仁市", "黔西南布依族苗族自治州", "黔东南苗族侗族自治州", "黔南布依族苗族自治州"],
  云南省: ["昆明市", "曲靖市", "玉溪市", "保山市", "昭通市", "丽江市", "普洱市", "临沧市", "楚雄彝族自治州", "红河哈尼族彝族自治州", "文山壮族苗族自治州", "西双版纳傣族自治州", "大理白族自治州", "德宏傣族景颇族自治州", "怒江傈僳族自治州", "迪庆藏族自治州"],
  西藏自治区: ["拉萨市", "日喀则市", "昌都市", "林芝市", "山南市", "那曲市", "阿里地区"],
  陕西省: ["西安市", "铜川市", "宝鸡市", "咸阳市", "渭南市", "延安市", "汉中市", "榆林市", "安康市", "商洛市"],
  甘肃省: ["兰州市", "嘉峪关市", "金昌市", "白银市", "天水市", "武威市", "张掖市", "平凉市", "酒泉市", "庆阳市", "定西市", "陇南市", "临夏回族自治州", "甘南藏族自治州"],
  青海省: ["西宁市", "海东市", "海北藏族自治州", "黄南藏族自治州", "海南藏族自治州", "果洛藏族自治州", "玉树藏族自治州", "海西蒙古族藏族自治州"],
  宁夏回族自治区: ["银川市", "石嘴山市", "吴忠市", "固原市", "中卫市"],
  新疆维吾尔自治区: ["乌鲁木齐市", "克拉玛依市", "吐鲁番市", "哈密市", "昌吉回族自治州", "博尔塔拉蒙古自治州", "巴音郭楞蒙古自治州", "阿克苏地区", "克孜勒苏柯尔克孜自治州", "喀什地区", "和田地区", "伊犁哈萨克自治州", "塔城地区", "阿勒泰地区"],
  台湾省: ["台北市", "高雄市", "新北市", "台中市", "台南市", "桃园市"],
  香港特别行政区: ["香港岛", "九龙", "新界"],
  澳门特别行政区: ["澳门半岛", "氹仔岛", "路环岛"],
};

const STORAGE_KEYS = Object.freeze({
  original: "mathAiEduOriginalItems",
  strategy: "mathAiEduStrategyItems",
});

const LIBRARY_CONFIG = Object.freeze({
  original: {
    listId: "original-library-list",
    emptyId: "original-library-empty",
    defaultTitle: "未命名原创题",
    displayName: "原创题库",
    exportPrefix: "original-library",
    savedMessage: "已发布至本地原创题库。",
    deletedMessage: "已从本地原创题库删除。",
  },
  strategy: {
    listId: "strategy-library-list",
    emptyId: "strategy-library-empty",
    defaultTitle: "未命名策略页",
    displayName: "策略库",
    exportPrefix: "strategy-library",
    savedMessage: "已存入本地策略库。",
    deletedMessage: "已从本地策略库删除。",
  },
});

const state = {
  activePage: "workspace",
  activeView: "preview",
  toastTimer: null,
  generationTimer: null,
  filePreviewUrl: null,
  previewReturnFocus: null,
};

const elements = {};

function cacheElements() {
  elements.pages = Array.from(document.querySelectorAll("[data-page]"));
  elements.pageButtons = Array.from(document.querySelectorAll("[data-page-target]"));
  elements.viewButtons = Array.from(document.querySelectorAll("[data-result-view]"));
  elements.previewView = document.querySelector("#preview-view");
  elements.codeView = document.querySelector("#code-view");
  elements.previewPlaceholder = document.querySelector("#preview-placeholder");
  elements.resultIframe = document.querySelector("#result-iframe");
  elements.resultCode = document.querySelector("#result-code");
  elements.generateButton = document.querySelector("#generate-report");
  elements.generateButtonText = document.querySelector("#generate-button-text");
  elements.fileInput = document.querySelector("#problem-file");
  elements.uploadEmptyState = document.querySelector("#upload-empty-state");
  elements.filePreview = document.querySelector("#file-preview");
  elements.imagePreview = document.querySelector("#image-preview");
  elements.pdfPreview = document.querySelector("#pdf-preview");
  elements.previewFileName = document.querySelector("#preview-file-name");
  elements.previewFileSize = document.querySelector("#preview-file-size");
  elements.previewFileType = document.querySelector("#preview-file-type");
  elements.clearFileButton = document.querySelector("#clear-file-button");
  elements.originalLibraryList = document.querySelector("#original-library-list");
  elements.originalLibraryEmpty = document.querySelector("#original-library-empty");
  elements.exportOriginalLibraryButton = document.querySelector("#export-original-library");
  elements.importOriginalLibraryButton = document.querySelector("#import-original-library");
  elements.importOriginalFile = document.querySelector("#import-original-file");
  elements.strategyLibraryList = document.querySelector("#strategy-library-list");
  elements.strategyLibraryEmpty = document.querySelector("#strategy-library-empty");
  elements.exportStrategyLibraryButton = document.querySelector("#export-strategy-library");
  elements.importStrategyLibraryButton = document.querySelector("#import-strategy-library");
  elements.importStrategyFile = document.querySelector("#import-strategy-file");
  elements.buildPageScroll = document.querySelector("#page-build .build-page-scroll");
  elements.buildSubject = document.querySelector("#build-subject");
  elements.buildProvince = document.querySelector("#build-province");
  elements.buildCity = document.querySelector("#build-city");
  elements.buildQuestionType = document.querySelector("#build-question-type");
  elements.buildYear = document.querySelector("#build-year");
  elements.buildSchool = document.querySelector("#build-school");
  elements.buildPageTitle = document.querySelector("#build-page-title");
  elements.buildSourceCode = document.querySelector("#build-source-code");
  elements.buildPreviewModal = document.querySelector("#build-preview-modal");
  elements.buildPreviewFrame = document.querySelector("#build-preview-frame");
  elements.buildPreviewPlaceholder = document.querySelector("#build-preview-placeholder");
  elements.buildPreviewStatus = document.querySelector("#build-preview-status");
  elements.closeBuildPreviewButton = document.querySelector("#close-build-preview");
  elements.renderBuildPreviewButton = document.querySelector("#render-build-preview");
  elements.publishOriginalButton = document.querySelector("#publish-original-button");
  elements.saveStrategyButton = document.querySelector("#save-strategy-button");
  elements.toast = document.querySelector("#toast");
  elements.toastMessage = document.querySelector("#toast-message");
}

function switchPage(pageId) {
  const targetPage = elements.pages.find((page) => page.dataset.page === pageId);

  if (!targetPage) {
    showToast("暂时无法打开这个页面，请稍后再试。");
    return;
  }

  state.activePage = pageId;

  elements.pages.forEach((page) => {
    page.hidden = page !== targetPage;
  });

  elements.pageButtons.forEach((button) => {
    const isActive = button.dataset.pageTarget === pageId;
    button.classList.toggle("is-active", isActive);

    if (button.classList.contains("nav-button")) {
      if (isActive) {
        button.setAttribute("aria-current", "page");
      } else {
        button.removeAttribute("aria-current");
      }
    }
  });

  if (pageId === "original-library") {
    renderLibraryList("original");
  } else if (pageId === "strategy") {
    renderLibraryList("strategy");
  }
}

function switchResultView(viewName) {
  const isPreview = viewName === "preview";

  state.activeView = isPreview ? "preview" : "code";
  elements.previewView.hidden = !isPreview;
  elements.codeView.hidden = isPreview;

  elements.viewButtons.forEach((button) => {
    const isActive = button.dataset.resultView === state.activeView;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function showToast(message) {
  if (!elements.toast || !elements.toastMessage) {
    return;
  }

  window.clearTimeout(state.toastTimer);
  elements.toastMessage.textContent = message;
  elements.toast.classList.add("is-visible");

  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3000);
}

function renderMockReport() {
  elements.resultCode.value = MOCK_REPORT_HTML;
  elements.resultIframe.srcdoc = MOCK_REPORT_HTML;
  elements.previewPlaceholder.hidden = true;
  elements.resultIframe.hidden = false;
  switchResultView("preview");
}

function generateMockReport() {
  if (state.generationTimer) {
    return;
  }

  elements.generateButton.disabled = true;
  elements.generateButtonText.textContent = "正在整理教学解析...";

  state.generationTimer = window.setTimeout(() => {
    renderMockReport();
    elements.generateButton.disabled = false;
    elements.generateButtonText.textContent = "生成标准解析报告";
    state.generationTimer = null;
    showToast("模拟解析已生成，并切换到预览视图。");
  }, 900);
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) {
    return "未知大小";
  }

  if (bytes === 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;
  const precision = unitIndex === 0 ? 0 : value >= 10 ? 1 : 2;

  return `${value.toFixed(precision)} ${units[unitIndex]}`;
}

function isPdfFile(file) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

function isImageFile(file) {
  return file.type.startsWith("image/");
}

function revokeFilePreviewUrl() {
  if (!state.filePreviewUrl) {
    return;
  }

  URL.revokeObjectURL(state.filePreviewUrl);
  state.filePreviewUrl = null;
}

function resetPreviewMedia() {
  revokeFilePreviewUrl();
  elements.imagePreview.hidden = true;
  elements.imagePreview.removeAttribute("src");
  elements.imagePreview.alt = "";
  elements.pdfPreview.hidden = true;
}

function clearFileSelection(showConfirmation = true) {
  resetPreviewMedia();
  elements.fileInput.value = "";
  elements.filePreview.hidden = true;
  elements.uploadEmptyState.hidden = false;
  elements.previewFileName.textContent = "";
  elements.previewFileSize.textContent = "";
  elements.previewFileType.textContent = "";

  if (showConfirmation) {
    showToast("已清除当前文件，本地预览也已释放。");
  }
}

function showFilePreview(file) {
  const imageFile = isImageFile(file);
  const pdfFile = isPdfFile(file);

  if (!imageFile && !pdfFile) {
    clearFileSelection(false);
    showToast("暂不支持这种文件格式，请选择图片或 PDF。");
    return;
  }

  resetPreviewMedia();
  elements.previewFileName.textContent = file.name;
  elements.previewFileSize.textContent = formatFileSize(file.size);
  elements.uploadEmptyState.hidden = true;
  elements.filePreview.hidden = false;

  if (imageFile) {
    state.filePreviewUrl = URL.createObjectURL(file);
    elements.imagePreview.src = state.filePreviewUrl;
    elements.imagePreview.alt = `${file.name} 的本地缩略图`;
    elements.imagePreview.hidden = false;
    elements.previewFileType.textContent = "图片";
    showToast("图片已在浏览器本地生成缩略图，不会上传服务器。");
    return;
  }

  elements.pdfPreview.hidden = false;
  elements.previewFileType.textContent = "PDF 文档";
  showToast("PDF 已在浏览器本地读取文件信息，不会预览或上传内容。");
}

function handleFileSelection() {
  const [file] = elements.fileInput.files;

  if (!file) {
    clearFileSelection(false);
    return;
  }

  showFilePreview(file);
}

function readLibraryItems(targetLibrary, notifyOnError = false) {
  const storageKey = STORAGE_KEYS[targetLibrary];

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);

    if (!Array.isArray(parsedValue)) {
      throw new TypeError("Stored library value is not an array.");
    }

    return parsedValue.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        typeof item.id === "string" &&
        typeof item.sourceCode === "string",
    );
  } catch {
    if (notifyOnError) {
      showToast("本地数据暂时无法读取，请检查浏览器存储设置。");
    }

    return null;
  }
}

function writeLibraryItems(targetLibrary, items) {
  const storageKey = STORAGE_KEYS[targetLibrary];

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(items));
    return true;
  } catch {
    showToast("本地保存失败，可能是浏览器存储空间不足或已被禁用。");
    return false;
  }
}

function createLocalItemId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDateForFilename(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function downloadBlob(blob, filename) {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}

function exportLibrary(targetLibrary) {
  const items = readLibraryItems(targetLibrary, true);

  if (!items) {
    return;
  }

  if (items.length === 0) {
    showToast(`${LIBRARY_CONFIG[targetLibrary].displayName}暂无可导出的本地数据。`);
    return;
  }

  const json = JSON.stringify(items, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const filename = `${LIBRARY_CONFIG[targetLibrary].exportPrefix}-${formatDateForFilename()}.json`;
  downloadBlob(blob, filename);
  showToast(`已导出 ${items.length} 条${LIBRARY_CONFIG[targetLibrary].displayName}数据。`);
}

function normalizeImportedItem(item, targetLibrary, usedIds) {
  if (
    !item ||
    typeof item !== "object" ||
    Array.isArray(item) ||
    typeof item.title !== "string" ||
    !item.title.trim() ||
    typeof item.sourceCode !== "string" ||
    !item.sourceCode.trim()
  ) {
    return null;
  }

  let id = typeof item.id === "string" ? item.id.trim() : "";

  if (!id || usedIds.has(id)) {
    do {
      id = createLocalItemId();
    } while (usedIds.has(id));
  }

  usedIds.add(id);

  const importedCreatedAt = typeof item.createdAt === "string" ? item.createdAt : "";
  const createdAt = Number.isNaN(new Date(importedCreatedAt).getTime())
    ? new Date().toISOString()
    : importedCreatedAt;

  return {
    id,
    title: item.title.trim(),
    subject: typeof item.subject === "string" ? item.subject : "",
    province: typeof item.province === "string" ? item.province : "",
    city: typeof item.city === "string" ? item.city : "",
    questionType: typeof item.questionType === "string" ? item.questionType : "",
    year: typeof item.year === "string" ? item.year : "",
    school: typeof item.school === "string" ? item.school : "",
    sourceCode: item.sourceCode,
    targetLibrary,
    createdAt,
  };
}

async function importLibraryFile(targetLibrary, fileInput) {
  const [file] = fileInput.files;

  if (!file) {
    return;
  }

  try {
    const importedValue = JSON.parse(await file.text());

    if (!Array.isArray(importedValue)) {
      throw new TypeError("Imported library value is not an array.");
    }

    const currentItems = readLibraryItems(targetLibrary, true);

    if (!currentItems) {
      return;
    }

    const usedIds = new Set(currentItems.map((item) => item.id));
    const importedItems = importedValue.map((item) =>
      normalizeImportedItem(item, targetLibrary, usedIds),
    );

    if (importedItems.some((item) => item === null)) {
      throw new TypeError("Imported library contains invalid items.");
    }

    if (importedItems.length === 0) {
      showToast("备份文件中没有可导入的记录。");
      return;
    }

    if (!writeLibraryItems(targetLibrary, [...currentItems, ...importedItems])) {
      return;
    }

    renderLibraryList(targetLibrary);
    showToast(`已追加导入 ${importedItems.length} 条${LIBRARY_CONFIG[targetLibrary].displayName}数据。`);
  } catch {
    showToast("导入失败：请选择结构正确、记录完整的 JSON 备份文件。");
  } finally {
    fileInput.value = "";
  }
}

function createSafeHtmlFilename(title) {
  const sanitizedTitle = title
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "-")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "")
    .trim()
    .slice(0, 80);

  return `${sanitizedTitle || "untitled-math-page"}.html`;
}

function downloadLibraryItemHtml(item) {
  if (!item.sourceCode.trim()) {
    showToast("这条记录没有可下载的源码。");
    return;
  }

  const blob = new Blob([item.sourceCode], { type: "text/html;charset=utf-8" });
  downloadBlob(blob, createSafeHtmlFilename(item.title || "untitled-math-page"));
  showToast("HTML 文件已开始下载。");
}

function copyTextWithFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.className = "clipboard-copy-target";
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  document.body.append(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  const copied = document.execCommand("copy");
  textarea.remove();
  return copied;
}

async function copyLibraryItemSource(item) {
  if (!item.sourceCode.trim()) {
    showToast("这条记录没有可复制的源码。");
    return;
  }

  try {
    if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      try {
        await navigator.clipboard.writeText(item.sourceCode);
        showToast("源码已复制到剪贴板。");
        return;
      } catch {
        // 剪贴板权限不可用时，继续使用兼容旧浏览器的复制方案。
      }
    }

    if (!copyTextWithFallback(item.sourceCode)) {
      throw new Error("Fallback copy command failed.");
    }

    showToast("源码已复制到剪贴板。");
  } catch {
    showToast("复制失败，请打开编辑页面后手动复制源码。");
  }
}

function collectBuildRecord(targetLibrary) {
  const sourceCode = elements.buildSourceCode.value;

  if (!sourceCode.trim()) {
    showToast("请先粘贴 HTML 或 JSON 源码，再保存到本地库。");
    return null;
  }

  const config = LIBRARY_CONFIG[targetLibrary];
  const title = elements.buildPageTitle.value.trim() || config.defaultTitle;

  return {
    id: createLocalItemId(),
    title,
    subject: elements.buildSubject.value,
    province: elements.buildProvince.value,
    city: elements.buildCity.value,
    questionType: elements.buildQuestionType.value,
    year: elements.buildYear.value,
    school: elements.buildSchool.value.trim(),
    sourceCode,
    targetLibrary,
    createdAt: new Date().toISOString(),
  };
}

function saveBuildRecord(targetLibrary) {
  const record = collectBuildRecord(targetLibrary);

  if (!record) {
    return;
  }

  const items = readLibraryItems(targetLibrary, true);

  if (!items) {
    return;
  }

  if (!writeLibraryItems(targetLibrary, [record, ...items])) {
    return;
  }

  renderLibraryList(targetLibrary);
  showToast(LIBRARY_CONFIG[targetLibrary].savedMessage);
}

function createTextElement(tagName, className, text) {
  const element = document.createElement(tagName);
  element.className = className;
  element.textContent = text;
  return element;
}

function formatCreatedAt(createdAt) {
  const date = new Date(createdAt);

  if (Number.isNaN(date.getTime())) {
    return "创建时间未知";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatRegion(item) {
  if (!item.province && !item.city) {
    return "地区未填写";
  }

  if (!item.city || item.province === item.city) {
    return item.province || item.city;
  }

  return `${item.province} / ${item.city}`;
}

function createLibraryActionButton(action, label, item, targetLibrary, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `library-action-button ${extraClass}`.trim();
  button.dataset.libraryAction = action;
  button.dataset.itemId = item.id;
  button.dataset.targetLibrary = targetLibrary;
  button.textContent = label;
  button.setAttribute("aria-label", `${label}：${item.title || LIBRARY_CONFIG[targetLibrary].defaultTitle}`);
  return button;
}

function createLibraryCard(item, targetLibrary) {
  const card = document.createElement("article");
  card.className = "library-card";

  const main = document.createElement("div");
  main.className = "library-card-main";

  const top = document.createElement("div");
  top.className = "library-card-top";
  top.append(
    createTextElement(
      "h2",
      "library-card-title",
      item.title || LIBRARY_CONFIG[targetLibrary].defaultTitle,
    ),
    createTextElement("time", "library-card-time", formatCreatedAt(item.createdAt)),
  );

  const meta = document.createElement("div");
  meta.className = "library-card-meta";
  meta.append(
    createTextElement("span", "library-meta-pill is-blue", item.subject || "科目未填写"),
    createTextElement("span", "library-meta-pill", formatRegion(item)),
    createTextElement("span", "library-meta-pill", item.questionType || "类型未填写"),
    createTextElement("span", "library-meta-pill", item.year || "年份未填写"),
  );

  main.append(top, meta);

  if (item.school) {
    main.append(createTextElement("p", "library-card-school", `学校：${item.school}`));
  }

  const actions = document.createElement("div");
  actions.className = "library-card-actions";
  actions.append(
    createLibraryActionButton("view", "查看", item, targetLibrary, "is-primary"),
    createLibraryActionButton("edit", "编辑", item, targetLibrary),
    createLibraryActionButton("download", "下载 HTML", item, targetLibrary),
    createLibraryActionButton("copy", "复制源码", item, targetLibrary),
    createLibraryActionButton("delete", "删除", item, targetLibrary, "is-danger"),
  );

  card.append(main, actions);
  return card;
}

function getLibraryElements(targetLibrary) {
  if (targetLibrary === "original") {
    return {
      list: elements.originalLibraryList,
      empty: elements.originalLibraryEmpty,
    };
  }

  return {
    list: elements.strategyLibraryList,
    empty: elements.strategyLibraryEmpty,
  };
}

function renderLibraryList(targetLibrary) {
  const items = readLibraryItems(targetLibrary, true) || [];
  const { list, empty } = getLibraryElements(targetLibrary);

  list.replaceChildren();
  list.hidden = items.length === 0;
  empty.hidden = items.length > 0;

  items.forEach((item) => {
    list.append(createLibraryCard(item, targetLibrary));
  });
}

function findLibraryItem(targetLibrary, itemId) {
  const items = readLibraryItems(targetLibrary, true);

  if (!items) {
    return null;
  }

  return items.find((item) => item.id === itemId) || null;
}

function fillBuildFormFromItem(item) {
  elements.buildSubject.value = item.subject || elements.buildSubject.options[0].value;

  if (Object.hasOwn(PROVINCE_CITY_MAP, item.province)) {
    elements.buildProvince.value = item.province;
  }

  updateBuildCities();

  if (Array.from(elements.buildCity.options).some((option) => option.value === item.city)) {
    elements.buildCity.value = item.city;
  }

  elements.buildQuestionType.value = item.questionType || elements.buildQuestionType.options[0].value;
  elements.buildYear.value = item.year || elements.buildYear.options[0].value;
  elements.buildSchool.value = item.school || "";
  elements.buildPageTitle.value = item.title || "";
  elements.buildSourceCode.value = item.sourceCode;
  elements.buildPageScroll.scrollTop = 0;
}

function deleteLibraryItem(targetLibrary, item) {
  const confirmed = window.confirm(`确定删除“${item.title || LIBRARY_CONFIG[targetLibrary].defaultTitle}”吗？`);

  if (!confirmed) {
    return;
  }

  const items = readLibraryItems(targetLibrary, true);

  if (!items) {
    return;
  }

  const remainingItems = items.filter((storedItem) => storedItem.id !== item.id);

  if (!writeLibraryItems(targetLibrary, remainingItems)) {
    return;
  }

  renderLibraryList(targetLibrary);
  showToast(LIBRARY_CONFIG[targetLibrary].deletedMessage);
}

function handleLibraryAction(event) {
  const button = event.target.closest("[data-library-action]");

  if (!button) {
    return;
  }

  const targetLibrary = button.dataset.targetLibrary;
  const item = findLibraryItem(targetLibrary, button.dataset.itemId);

  if (!item) {
    showToast("这条本地记录已不存在，请刷新列表后重试。");
    renderLibraryList(targetLibrary);
    return;
  }

  if (button.dataset.libraryAction === "view") {
    showSourceInBuildPreview(item.sourceCode, "本地记录预览", button);
    showToast("已打开本地记录预览；页面脚本在隔离沙箱内运行。");
  } else if (button.dataset.libraryAction === "edit") {
    switchPage("build");
    fillBuildFormFromItem(item);
    showToast("记录已回填到源码建站，再次保存会创建一条新记录。");
  } else if (button.dataset.libraryAction === "download") {
    downloadLibraryItemHtml(item);
  } else if (button.dataset.libraryAction === "copy") {
    copyLibraryItemSource(item);
  } else if (button.dataset.libraryAction === "delete") {
    deleteLibraryItem(targetLibrary, item);
  }
}

function updateBuildCities() {
  const selectedProvince = elements.buildProvince.value;
  const cities = PROVINCE_CITY_MAP[selectedProvince] || [];

  elements.buildCity.replaceChildren();

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    elements.buildCity.append(option);
  });

  if (selectedProvince === "辽宁省" && cities.includes("沈阳市")) {
    elements.buildCity.value = "沈阳市";
  }
}

function initializeBuildSelectors() {
  Object.keys(PROVINCE_CITY_MAP).forEach((province) => {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    elements.buildProvince.append(option);
  });

  elements.buildProvince.value = "辽宁省";
  updateBuildCities();
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function createJsonPreviewDocument(source) {
  let displaySource = source;

  try {
    displaySource = JSON.stringify(JSON.parse(source), null, 2);
  } catch {
    // 保留原始内容，并以纯文本方式显示格式不完整的 JSON。
  }

  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JSON 本地预览</title>
  <style>body{margin:0;padding:24px;color:#334155;background:#f8fafc;font:14px/1.65 Consolas,"Courier New",monospace}pre{margin:0;padding:18px;overflow:auto;white-space:pre-wrap;word-break:break-word;background:#fff;border:1px solid #e2e8f0;border-radius:12px}</style>
</head>
<body><pre>${escapeHtml(displaySource)}</pre></body>
</html>`;
}

function openBuildPreview(returnFocus = document.activeElement) {
  state.previewReturnFocus = returnFocus;
  elements.buildPreviewModal.hidden = false;
  document.body.classList.add("is-preview-open");
  elements.closeBuildPreviewButton.focus();
}

function closeBuildPreview() {
  elements.buildPreviewModal.hidden = true;
  document.body.classList.remove("is-preview-open");

  const returnFocus = state.previewReturnFocus;
  state.previewReturnFocus = null;

  if (returnFocus && returnFocus.isConnected && !returnFocus.closest("[hidden]")) {
    returnFocus.focus();
  } else if (!elements.renderBuildPreviewButton.closest("[hidden]")) {
    elements.renderBuildPreviewButton.focus();
  }
}

function showSourceInBuildPreview(source, statusText, returnFocus) {
  const trimmedSource = source.trim();
  const looksLikeJson = trimmedSource.startsWith("{") || trimmedSource.startsWith("[");
  const previewDocument = looksLikeJson ? createJsonPreviewDocument(trimmedSource) : source;

  elements.buildPreviewFrame.removeAttribute("srcdoc");
  elements.buildPreviewFrame.srcdoc = previewDocument;
  elements.buildPreviewFrame.hidden = false;
  elements.buildPreviewPlaceholder.hidden = true;
  elements.buildPreviewStatus.textContent = statusText;
  elements.buildPreviewStatus.classList.add("is-ready");
  openBuildPreview(returnFocus);
}

function renderBuildPreview() {
  const source = elements.buildSourceCode.value;
  const trimmedSource = source.trim();

  if (!trimmedSource) {
    showToast("请先粘贴 HTML 或 JSON 源码，再渲染本地预览。");
    return;
  }

  showSourceInBuildPreview(source, "脚本预览已更新", elements.renderBuildPreviewButton);
  showToast("本地预览已更新；页面脚本正在隔离沙箱内运行。");
}

function bindEvents() {
  elements.pageButtons.forEach((button) => {
    button.addEventListener("click", () => switchPage(button.dataset.pageTarget));
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => switchResultView(button.dataset.resultView));
  });

  elements.generateButton.addEventListener("click", generateMockReport);
  elements.fileInput.addEventListener("change", handleFileSelection);
  elements.clearFileButton.addEventListener("click", () => clearFileSelection());
  elements.imagePreview.addEventListener("error", () => {
    clearFileSelection(false);
    showToast("无法生成这张图片的缩略图，请尝试其他图片。");
  });
  elements.buildProvince.addEventListener("change", updateBuildCities);
  elements.renderBuildPreviewButton.addEventListener("click", renderBuildPreview);
  elements.closeBuildPreviewButton.addEventListener("click", closeBuildPreview);
  elements.publishOriginalButton.addEventListener("click", () => saveBuildRecord("original"));
  elements.saveStrategyButton.addEventListener("click", () => saveBuildRecord("strategy"));
  elements.exportOriginalLibraryButton.addEventListener("click", () => exportLibrary("original"));
  elements.importOriginalLibraryButton.addEventListener("click", () =>
    elements.importOriginalFile.click(),
  );
  elements.importOriginalFile.addEventListener("change", () =>
    importLibraryFile("original", elements.importOriginalFile),
  );
  elements.exportStrategyLibraryButton.addEventListener("click", () => exportLibrary("strategy"));
  elements.importStrategyLibraryButton.addEventListener("click", () =>
    elements.importStrategyFile.click(),
  );
  elements.importStrategyFile.addEventListener("change", () =>
    importLibraryFile("strategy", elements.importStrategyFile),
  );
  elements.originalLibraryList.addEventListener("click", handleLibraryAction);
  elements.strategyLibraryList.addEventListener("click", handleLibraryAction);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.buildPreviewModal.hidden) {
      closeBuildPreview();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.original) {
      renderLibraryList("original");
    } else if (event.key === STORAGE_KEYS.strategy) {
      renderLibraryList("strategy");
    }
  });
  window.addEventListener("beforeunload", revokeFilePreviewUrl);
}

function initializeApp() {
  cacheElements();
  initializeBuildSelectors();
  bindEvents();
  renderLibraryList("original");
  renderLibraryList("strategy");
  switchPage(state.activePage);
  switchResultView(state.activeView);
}

document.addEventListener("DOMContentLoaded", initializeApp);
