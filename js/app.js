"use strict";
/* 安全调试：仅在 localStorage.mathAiEduDebug === "1" 时输出，不泄露敏感信息 */
function debugLog(...args) {
  try {
    if (window.localStorage && window.localStorage.getItem("mathAiEduDebug") === "1") {
      console.log("[MathAI Debug]", ...args);
    }
  } catch (e) {
    // localStorage may be disabled
  }
}


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

const LAST_FULL_BACKUP_KEY = "mathAiEduLastFullBackupAt";
const WELCOME_GUIDE_KEY = "mathAiEduHasSeenWelcomeGuide";
const AUTH_TOKEN_KEY = "mathAiEduAuthToken";
const API_BASE_URL = String(window.MATH_AI_API_BASE_URL || "http://localhost:3001").replace(
  /\/+$/,
  "",
);
const MAX_IMAGE_UPLOAD_SIZE_BYTES = 3 * 1024 * 1024;
const ALLOWED_SOLVE_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const FULL_BACKUP_VERSION = 1;
const VISUALIZATION_DATA_VERSION = 1;
const MODEL_PROVIDER_CONFIG = Object.freeze({
  auto: { solveProvider: "auto", visionProvider: "auto" },
  dashscope: { solveProvider: "dashscope", visionProvider: "qwen-vl" },
  deepseek: { solveProvider: "deepseek", visionProvider: "auto" },
  openai: { solveProvider: "openai", visionProvider: "openai-vision" },
  gemini: { solveProvider: "gemini", visionProvider: "gemini-vision" },
});

const MODEL_PROVIDER_LABELS = Object.freeze({
  auto: "自动推荐",
  dashscope: "阿里通义 Qwen",
  deepseek: "DeepSeek",
  openai: "GPT",
  gemini: "Gemini",
});

const VISUALIZATION_KIND_LABELS = Object.freeze({
  point: "点",
  segment: "线段",
  line: "直线",
  circle: "圆",
  function: "函数",
  slider: "滑块",
});

const VISUALIZATION_EXAMPLE = Object.freeze({
  version: VISUALIZATION_DATA_VERSION,
  type: "geometry",
  objects: [
    { kind: "point", id: "A", label: "A", x: -2, y: 1 },
    { kind: "point", id: "B", label: "B", x: 2, y: 1 },
    { kind: "segment", id: "AB", from: "A", to: "B" },
    { kind: "function", id: "f", expression: "y = x^2", range: [-5, 5] },
    { kind: "slider", id: "t", min: 0, max: 10, step: 0.5, value: 2 },
  ],
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
  uploadedImageUrl: null,
  ocrDraftActive: false,
  ocrDraftReason: "",
  activeSolveMode: "text",
  activeOriginalTab: "my",
  toastTimer: null,
  generationTimer: null,
  generationStatusTimers: [],
  selectedProblemFile: null,
  selectedModelProvider: "auto",
  currentSolveRecordId: null,
  currentSolveResult: null,
  currentHtmlResult: "",
  currentLibraryType: null,
  modelStatuses: {},
  cloudLibraries: {
    original: {
      items: [],
      total: 0,
      loading: false,
      loaded: false,
      error: "",
    },
    strategy: {
      items: [],
      total: 0,
      loading: false,
      loaded: false,
      error: "",
    },
  },
  filePreviewUrl: null,
  previewReturnFocus: null,
  pendingFullBackup: null,
  authToken: null,
  currentUser: null,
  authLoading: false,
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
  elements.solveModeButtons = Array.from(document.querySelectorAll("[data-solve-mode]"));
  elements.textSolvePanel = document.querySelector("#text-solve-panel");
  elements.imageSolvePanel = document.querySelector("#image-solve-panel");
  elements.textGenerateArea = document.querySelector("#text-generate-area");
  elements.modelButtons = Array.from(document.querySelectorAll("[data-model-provider]"));
  elements.generateButton = document.querySelector("#generate-report");
  elements.generateButtonText = document.querySelector("#generate-button-text");
  elements.modelSelect = document.querySelector("#model-select");
  elements.visionProviderSelect = document.querySelector("#vision-provider-select");
  elements.modelPickerCurrent = document.querySelector("#model-picker-current");
  elements.solveLibraryType = document.querySelector("#solve-library-type");
  elements.aiStatusBadge = document.querySelector("#ai-status-badge");
  elements.instructionInput = document.querySelector("#instruction-input");
  elements.fileInput = document.querySelector("#problem-file");
  elements.uploadEmptyState = document.querySelector("#upload-empty-state");
  elements.filePreview = document.querySelector("#file-preview");
  elements.imagePreview = document.querySelector("#image-preview");
  elements.pdfPreview = document.querySelector("#pdf-preview");
  elements.previewFileName = document.querySelector("#preview-file-name");
  elements.previewFileSize = document.querySelector("#preview-file-size");
  elements.previewFileType = document.querySelector("#preview-file-type");
  elements.clearFileButton = document.querySelector("#clear-file-button");
  elements.solveImageButton = document.querySelector("#solve-image-button");
  elements.solveImageButtonText = document.querySelector("#solve-image-button-text");
  elements.recognizedTextPanel = document.querySelector("#recognized-text-panel");
  elements.recognizedTextNote = document.querySelector("#recognized-text-note");
  elements.recognizedTextInput = document.querySelector("#recognized-text-input");
  elements.reanalyzeRecognizedTextButton = document.querySelector("#reanalyze-recognized-text");
  elements.resultActions = document.querySelector("#result-actions");
  elements.saveResultOriginalButton = document.querySelector("#save-result-original");
  elements.saveResultStrategyButton = document.querySelector("#save-result-strategy");
  elements.exportResultWordButton = document.querySelector("#export-result-word");
  elements.exportResultGgbButton = document.querySelector("#export-result-ggb");
  elements.structuredResult = document.querySelector("#structured-result");
  elements.solutionReadingFlow = document.querySelector("#solution-reading-flow");
  // Old static card DOM refs removed — now uses #solution-reading-flow
  elements.welcomeGuide = document.querySelector("#welcome-guide");
  elements.dismissWelcomeGuideButton = document.querySelector("#dismiss-welcome-guide");
  elements.reopenWelcomeGuideButton = document.querySelector("#reopen-welcome-guide");
  elements.originalLibraryList = document.querySelector("#original-library-list");
  elements.originalLibraryEmpty = document.querySelector("#original-library-empty");
  elements.originalLocalCount = document.querySelector("#original-local-count");
  elements.originalTabButtons = Array.from(document.querySelectorAll("[data-original-tab]"));
  elements.originalTabPanels = Array.from(document.querySelectorAll("[data-original-panel]"));
  elements.originalGradeButtons = Array.from(document.querySelectorAll("[data-grade-filter]"));
  elements.originalTypeButtons = Array.from(document.querySelectorAll("[data-original-type]"));
  elements.originalYearButtons = Array.from(document.querySelectorAll("[data-original-year]"));
  elements.originalKeyword = document.querySelector("#original-keyword");
  elements.originalSort = document.querySelector("#original-sort");
  elements.resetOriginalFiltersButton = document.querySelector("#reset-original-filters");
  elements.originalResultCount = document.querySelector("#original-result-count");
  elements.originalEmptyTitle = document.querySelector("#original-empty-title");
  elements.originalEmptyDescription = document.querySelector("#original-empty-description");
  elements.originalEmptyBuildButton = document.querySelector("#original-empty-build");
  elements.originalEmptyImportButton = document.querySelector("#original-empty-import");
  elements.originalEmptyResetButton = document.querySelector("#original-empty-reset");
  elements.exportOriginalLibraryButton = document.querySelector("#export-original-library");
  elements.importOriginalLibraryButton = document.querySelector("#import-original-library");
  elements.importOriginalFile = document.querySelector("#import-original-file");
  elements.strategyLibraryList = document.querySelector("#strategy-library-list");
  elements.strategyLibraryEmpty = document.querySelector("#strategy-library-empty");
  elements.strategyEmptyTitle = document.querySelector("#strategy-empty-title");
  elements.strategyEmptyDescription = document.querySelector("#strategy-empty-description");
  elements.strategyEmptyBuildButton = document.querySelector("#strategy-empty-build");
  elements.strategyEmptyImportButton = document.querySelector("#strategy-empty-import");
  elements.strategyEmptyResetButton = document.querySelector("#strategy-empty-reset");
  elements.strategyResultCount = document.querySelector("#strategy-result-count");
  elements.strategySubject = document.querySelector("#strategy-subject");
  elements.strategyProvince = document.querySelector("#strategy-province");
  elements.strategyCity = document.querySelector("#strategy-city");
  elements.strategyTypeButtons = Array.from(document.querySelectorAll("[data-strategy-type]"));
  elements.strategyYearButtons = Array.from(document.querySelectorAll("[data-strategy-year]"));
  elements.strategyStartDate = document.querySelector("#strategy-start-date");
  elements.strategyEndDate = document.querySelector("#strategy-end-date");
  elements.strategySchool = document.querySelector("#strategy-school");
  elements.strategyKeyword = document.querySelector("#strategy-keyword");
  elements.strategySort = document.querySelector("#strategy-sort");
  elements.resetStrategyFiltersButton = document.querySelector("#reset-strategy-filters");
  elements.exportStrategyLibraryButton = document.querySelector("#export-strategy-library");
  elements.importStrategyLibraryButton = document.querySelector("#import-strategy-library");
  elements.importStrategyFile = document.querySelector("#import-strategy-file");
  elements.profileRecentGrid = document.querySelector("#profile-recent-grid");
  elements.profileAvatar = document.querySelector("#profile-avatar");
  elements.profileRoleBadge = document.querySelector("#profile-role-badge");
  elements.profileUserName = document.querySelector("#profile-user-name");
  elements.profileUserStatusTag = document.querySelector("#profile-user-status-tag");
  elements.profileLoginStatus = document.querySelector("#profile-login-status");
  elements.profileAccountType = document.querySelector("#profile-account-type");
  elements.profileDataScope = document.querySelector("#profile-data-scope");
  elements.profileLogoutButton = document.querySelector("#profile-logout-button");
  elements.profileAuthCard = document.querySelector("#profile-auth-card");
  elements.authUsername = document.querySelector("#auth-username");
  elements.authPassword = document.querySelector("#auth-password");
  elements.authLoginButton = document.querySelector("#auth-login-button");
  elements.authRegisterButton = document.querySelector("#auth-register-button");
  elements.profileOriginalList = document.querySelector("#profile-original-list");
  elements.profileOriginalEmpty = document.querySelector("#profile-original-empty");
  elements.profileStrategyList = document.querySelector("#profile-strategy-list");
  elements.profileStrategyEmpty = document.querySelector("#profile-strategy-empty");
  elements.fullBackupOriginalCount = document.querySelector("#full-backup-original-count");
  elements.fullBackupStrategyCount = document.querySelector("#full-backup-strategy-count");
  elements.fullBackupLastTime = document.querySelector("#full-backup-last-time");
  elements.fullBackupHealth = document.querySelector("#full-backup-health");
  elements.fullBackupHealthIcon = document.querySelector("#full-backup-health-icon");
  elements.fullBackupHealthTitle = document.querySelector("#full-backup-health-title");
  elements.fullBackupHealthDescription = document.querySelector(
    "#full-backup-health-description",
  );
  elements.exportFullBackupButton = document.querySelector("#export-full-backup");
  elements.importFullBackupButton = document.querySelector("#import-full-backup");
  elements.importFullBackupFile = document.querySelector("#import-full-backup-file");
  elements.fullBackupPreview = document.querySelector("#full-backup-preview");
  elements.fullBackupPreviewTime = document.querySelector("#full-backup-preview-time");
  elements.fullBackupPreviewVersion = document.querySelector("#full-backup-preview-version");
  elements.fullBackupPreviewOriginalCount = document.querySelector(
    "#full-backup-preview-original-count",
  );
  elements.fullBackupPreviewStrategyCount = document.querySelector(
    "#full-backup-preview-strategy-count",
  );
  elements.mergeFullBackupButton = document.querySelector("#merge-full-backup");
  elements.overwriteFullBackupButton = document.querySelector("#overwrite-full-backup");
  elements.cancelFullBackupImportButton = document.querySelector(
    "#cancel-full-backup-import",
  );
  elements.buildPageScroll = document.querySelector("#page-build .build-page-scroll");
  elements.buildSubject = document.querySelector("#build-subject");
  elements.buildProvince = document.querySelector("#build-province");
  elements.buildCity = document.querySelector("#build-city");
  elements.buildQuestionType = document.querySelector("#build-question-type");
  elements.buildYear = document.querySelector("#build-year");
  elements.buildSchool = document.querySelector("#build-school");
  elements.buildPageTitle = document.querySelector("#build-page-title");
  elements.buildVisualizationData = document.querySelector("#build-visualization-data");
  elements.insertVisualizationExampleButton = document.querySelector(
    "#insert-visualization-example",
  );
  elements.checkVisualizationDataButton = document.querySelector(
    "#check-visualization-data",
  );
  elements.visualizationCheckResult = document.querySelector("#visualization-check-result");
  elements.buildSourceCode = document.querySelector("#build-source-code");
  elements.buildPreviewModal = document.querySelector("#build-preview-modal");
  elements.buildPreviewFrame = document.querySelector("#build-preview-frame");
  elements.buildPreviewPlaceholder = document.querySelector("#build-preview-placeholder");
  elements.buildPreviewStatus = document.querySelector("#build-preview-status");
  elements.closeBuildPreviewButton = document.querySelector("#close-build-preview");
  elements.renderBuildPreviewButton = document.querySelector("#render-build-preview");
  elements.publishOriginalButton = document.querySelector("#publish-original-button");
  elements.saveStrategyButton = document.querySelector("#save-strategy-button");
  elements.toastButtons = Array.from(document.querySelectorAll("[data-toast-message]"));
  elements.helpFaqButtons = Array.from(document.querySelectorAll("[data-help-faq]"));
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
    refreshCloudLibrary("original", { force: true });
  } else if (pageId === "strategy") {
    renderLibraryList("strategy");
    refreshCloudLibrary("strategy", { force: true });
  } else if (pageId === "profile") {
    renderProfileRecentItems();
  }
}

function initializeWelcomeGuide() {
  let hasSeenGuide = false;

  try {
    hasSeenGuide = window.localStorage.getItem(WELCOME_GUIDE_KEY) === "true";
  } catch {
    // 本地存储不可用时仍显示引导，不影响工作台其他功能。
  }

  elements.welcomeGuide.hidden = hasSeenGuide;
}

function dismissWelcomeGuide() {
  elements.welcomeGuide.hidden = true;

  try {
    window.localStorage.setItem(WELCOME_GUIDE_KEY, "true");
    showToast("新手引导已收起，可在帮助中心重新查看。");
  } catch {
    showToast("新手引导已暂时收起；当前浏览器无法保存引导状态。");
  }
}

function reopenWelcomeGuide() {
  try {
    window.localStorage.removeItem(WELCOME_GUIDE_KEY);
  } catch {
    // 即使无法更新本地状态，本次仍可以重新显示引导。
  }

  elements.welcomeGuide.hidden = false;
  switchPage("workspace");
  showToast("新手引导已重新打开。");
}

function switchOriginalTab(tabName) {
  const targetPanel = elements.originalTabPanels.find(
    (panel) => panel.dataset.originalPanel === tabName,
  );

  if (!targetPanel) {
    return;
  }

  state.activeOriginalTab = tabName;

  elements.originalTabPanels.forEach((panel) => {
    panel.hidden = panel !== targetPanel;
  });

  elements.originalTabButtons.forEach((button) => {
    const isActive = button.dataset.originalTab === tabName;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
    button.tabIndex = isActive ? 0 : -1;
  });

  if (tabName === "my") {
    renderLibraryList("original");
  }
}

function selectPillButton(buttons, selectedButton) {
  buttons.forEach((button) => {
    const isActive = button === selectedButton;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
}

function resetOriginalFilters(shouldRender = true) {
  elements.originalKeyword.value = "";
  elements.originalSort.value = "latest";
  selectPillButton(elements.originalTypeButtons, elements.originalTypeButtons[0]);
  selectPillButton(elements.originalYearButtons, elements.originalYearButtons[0]);
  selectPillButton(elements.originalGradeButtons, elements.originalGradeButtons[0]);

  if (shouldRender) {
    renderLibraryList("original");
  }
}

function resetStrategyFilters(shouldRender = true) {
  elements.strategySubject.value = "";
  elements.strategyProvince.value = "";
  updateStrategyCities();
  elements.strategyCity.value = "";
  elements.strategyStartDate.value = "";
  elements.strategyEndDate.value = "";
  elements.strategySchool.value = "";
  elements.strategyKeyword.value = "";
  elements.strategySort.value = "latest";
  selectPillButton(elements.strategyTypeButtons, elements.strategyTypeButtons[0]);
  selectPillButton(elements.strategyYearButtons, elements.strategyYearButtons[0]);

  if (shouldRender) {
    renderLibraryList("strategy");
  }
}

function resetLibraryFilters(targetLibrary, shouldRender = true) {
  if (targetLibrary === "original") {
    resetOriginalFilters(shouldRender);
  } else if (targetLibrary === "strategy") {
    resetStrategyFilters(shouldRender);
  }
}

function toggleHelpFaq(button) {
  const answerId = button.getAttribute("aria-controls");
  const answer = answerId ? document.getElementById(answerId) : null;

  if (!answer) {
    return;
  }

  const willExpand = button.getAttribute("aria-expanded") !== "true";
  button.setAttribute("aria-expanded", String(willExpand));
  answer.hidden = !willExpand;

  const marker = button.lastElementChild;
  if (marker) {
    marker.textContent = willExpand ? "−" : "＋";
  }
}

function switchResultView(viewName) {
  const isPreview = viewName === "preview";

  state.activeView = isPreview ? "preview" : "code";

  if (!elements.previewView || !elements.codeView) {
    return;
  }

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

function getStoredAuthToken() {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

function storeAuthToken(token) {
  state.authToken = token;

  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    showToast("登录成功，但当前浏览器无法持久保存登录状态。");
  }
}

function clearAuthToken() {
  state.authToken = "";

  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // 清理失败不影响当前页面退出状态。
  }
}

async function requestApi(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (state.authToken) {
    headers.set("Authorization", `Bearer ${state.authToken}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error("无法连接后端服务，请确认服务已启动。");
  }

  let payload = null;

  try {
    payload = await response.json();
  } catch {
    throw new Error("后端返回格式异常，请稍后再试。");
  }

  if (!response.ok || !payload.success) {
    if (response.status === 401) {
      clearAuthToken();
      state.currentUser = null;
      renderAuthState();
    }

    const error = new Error(payload.message || "请求失败，请稍后再试。");
    error.status = response.status;
    error.data = payload.data || null;
    throw error;
  }

  return payload.data || {};
}

function getAuthInitial(username) {
  const trimmed = String(username || "").trim();
  return trimmed ? trimmed.slice(0, 1).toUpperCase() : "—";
}

function renderAuthState() {
  const user = state.currentUser;
  const isLoggedIn = Boolean(user);

  elements.profileAvatar.textContent = isLoggedIn ? getAuthInitial(user.username) : "—";
  elements.profileRoleBadge.textContent = isLoggedIn ? "身份：教师" : "未登录";
  elements.profileUserName.textContent = isLoggedIn ? user.username : "未登录";
  elements.profileUserStatusTag.textContent = isLoggedIn ? "已连接后端账号" : "请先登录";
  elements.profileLoginStatus.textContent = isLoggedIn
    ? `当前登录状态：已登录（${user.username}）`
    : "当前登录状态：未登录";
  elements.profileAccountType.textContent = isLoggedIn ? user.role || "teacher" : "未登录";
  elements.profileDataScope.textContent = isLoggedIn
    ? "已登录；第 1 天仍保留本地题库，云端题库将在后续阶段接入"
    : "本地数据仍保存在当前浏览器";
  elements.profileLogoutButton.hidden = !isLoggedIn;
  elements.profileAuthCard.hidden = isLoggedIn;

  if (elements.aiStatusBadge) {
    elements.aiStatusBadge.textContent = isLoggedIn ? "真实 AI · 已登录" : "真实 AI · 需登录";
    elements.aiStatusBadge.classList.toggle("is-online", isLoggedIn);
  }
}

function setAuthButtonsDisabled(disabled) {
  elements.authLoginButton.disabled = disabled;
  elements.authRegisterButton.disabled = disabled;
}

async function submitAuth(mode) {
  if (state.authLoading) {
    return;
  }

  const username = elements.authUsername.value.trim();
  const password = elements.authPassword.value;

  if (!username || !password) {
    showToast("请输入用户名和密码。");
    return;
  }

  state.authLoading = true;
  setAuthButtonsDisabled(true);

  try {
    const data = await requestApi(`/api/auth/${mode}`, {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });

    storeAuthToken(data.token);
    state.currentUser = data.user;
    renderAuthState();
    invalidateCloudLibrary("original");
    invalidateCloudLibrary("strategy");
    if (state.activePage === "original-library") {
      refreshCloudLibrary("original", { force: true });
    } else if (state.activePage === "strategy") {
      refreshCloudLibrary("strategy", { force: true });
    }
    elements.authPassword.value = "";
    showToast(mode === "register" ? "注册成功，已自动登录。" : "登录成功。");
  } catch (error) {
    showToast(error.message || "登录服务暂时不可用。");
  } finally {
    state.authLoading = false;
    setAuthButtonsDisabled(false);
  }
}

async function loadCurrentUser(silent = false) {
  state.authToken = getStoredAuthToken();

  if (!state.authToken) {
    state.currentUser = null;
    renderAuthState();
    return;
  }

  try {
    const data = await requestApi("/api/auth/me");
    state.currentUser = data.user;
    renderAuthState();
  } catch (error) {
    state.currentUser = null;
    renderAuthState();

    if (!silent) {
      showToast(error.message || "无法获取登录状态，请重新登录。");
    }
  }
}

function logoutCurrentUser() {
  clearAuthToken();
  state.currentUser = null;
  state.cloudLibraries.original = { items: [], total: 0, loading: false, loaded: false, error: "" };
  state.cloudLibraries.strategy = { items: [], total: 0, loading: false, loaded: false, error: "" };
  renderAuthState();
  if (state.activePage === "original-library") {
    renderLibraryList("original");
  } else if (state.activePage === "strategy") {
    renderLibraryList("strategy");
  }
  showToast("已退出登录。");
}

function renderMockReport() {
  state.currentHtmlResult = MOCK_REPORT_HTML;
  return;
  // Mock init no longer sets iframe srcdoc (advanced preview hidden)
  state.currentHtmlResult = MOCK_REPORT_HTML;
}

function renderAiHtmlResult(htmlResult) {
  // Workspace now uses solution-reading-flow, advanced preview is hidden.
  // This function is kept for call compatibility but no longer sets iframe srcdoc.
  state.currentHtmlResult = htmlResult || "";
}

function appendTextList(container, items) {
  container.replaceChildren();
  const values = Array.isArray(items) ? items : [];

  if (!values.length) {
    const item = document.createElement("li");
    item.textContent = "暂无明确条目。";
    container.append(item);
    return;
  }

  values.forEach((value) => {
    const item = document.createElement("li");
    item.textContent = String(value || "");
    container.append(item);
  });
}

function renderStructuredSteps(steps) {
  elements.structuredSteps.replaceChildren();
  const values = Array.isArray(steps) ? steps : [];

  if (!values.length) {
    const item = document.createElement("li");
    item.textContent = "暂无完整步骤。";
    elements.structuredSteps.append(item);
    return;
  }

  values.forEach((step) => {
    const item = document.createElement("li");
    const title = document.createElement("strong");
    const content = document.createElement("p");
    title.textContent = step.title || "步骤";
    content.textContent = step.content || "";
    item.append(title, content);
    elements.structuredSteps.append(item);
  });
}

function hasRenderableVisualizationSpec(spec) {
  if (!spec || typeof spec !== "object" || !spec.type || spec.type === "none") {
    return false;
  }

  // For function_graph, check that it actually has renderable data
  if (spec.type === "function_graph") {
    // Priority 1: curves with samples from backend graphEngine
    if (Array.isArray(spec.curves) && spec.curves.some(function(c) {
      return Array.isArray(c.samples) && c.samples.length > 1;
    })) {
      return true;
    }
    // Priority 2: functions with SIMPLE expressions only
    // Complex LaTeX expressions (\\frac, \\sqrt, √, sqrt(, /) are NOT renderable without backend samples
    if (Array.isArray(spec.functions) && spec.functions.some(function(f) {
      if (!f || !f.expression || !(/[xX]/.test(f.expression))) return false;
      var expr = f.expression;
      // Reject complex LaTeX that frontend cannot reliably parse
      if (/\\+frac|\\+sqrt/.test(expr) || expr.indexOf("\u221A") !== -1 || expr.indexOf("sqrt(") !== -1 || (expr.indexOf("(") !== -1 && expr.indexOf("/") !== -1)) {
        if (typeof localStorage !== "undefined" && localStorage.getItem("mathAiEduDebug") === "1") {
          console.warn("[App] function_graph rejected: complex expression without backend samples -", expr.slice(0, 60));
        }
        return false;
      }
      // Allow simple expressions: y=x^2-2x-3, y=2x+3, y=11
      return true;
    })) {
      return true;
    }
    return false;
  }

  // For geometry, check it has points and objects
  if (spec.type === "geometry") {
    var hasPoints = spec.points && typeof spec.points === "object" && Object.keys(spec.points).length > 0;
    var hasObjects = Array.isArray(spec.objects) && spec.objects.length > 0;
    return hasPoints || hasObjects;
  }

  // All other types pass if type is set
  return true;
}

function getVisualizationCurves(spec) {
  if (!spec || typeof spec !== "object") {
    return [];
  }

  var curves = [];

  if (Array.isArray(spec.curves)) {
    curves = curves.concat(spec.curves);
  }

  if (Array.isArray(spec.functions)) {
    curves = curves.concat(spec.functions);
  }

  return curves;
}

function getVisualizationPointCount(spec) {
  if (!spec || typeof spec !== "object") {
    return 0;
  }

  var pointMapCount = spec.points && typeof spec.points === "object" && !Array.isArray(spec.points)
    ? Object.keys(spec.points).length
    : 0;
  var objectPointCount = Array.isArray(spec.objects)
    ? spec.objects.filter(function(object) { return object && object.kind === "point"; }).length
    : 0;
  var keyPointCount = Array.isArray(spec.keyPoints) ? spec.keyPoints.length : 0;

  return Math.max(pointMapCount, objectPointCount, keyPointCount);
}

function isComplexMultiQuestionText(text) {
  var value = String(text || "");
  var compact = value.replace(/\s+/g, "");
  var hasExplicitQuestionPair = /第[一1]问/.test(compact) && /第[二2]问/.test(compact);
  var hasParenthesizedQuestionPair = /(?:（1）|\(1\)).{0,600}(?:（2）|\(2\))/.test(compact);

  return hasExplicitQuestionPair || hasParenthesizedQuestionPair;
}

function isComplexFunctionQuestionText(text) {
  var value = String(text || "");
  return isComplexMultiQuestionText(value)
    || /L\s*1|L\s*2|y\s*1|y\s*2|y\s*3|中心对称|双倍比例点|面积|平行于\s*x\s*轴/i.test(value)
    || getFunctionDefinitionCount(value) > 1;
}

function isComplexFunctionComprehensiveText(text) {
  var value = String(text || "");
  var signals = [
    /双倍比例点/.test(value),
    /抛物线/.test(value),
    /y\s*1|y\s*2|y\s*3/i.test(value),
    /L\s*1|L\s*2/i.test(value),
    /中心对称/.test(value),
    /面积/.test(value),
    /点\s*P|P\s*[（(]/.test(value),
    /点\s*Q|Q\s*[（(]/.test(value),
    /点\s*M|M\s*[（(]/.test(value),
    isComplexMultiQuestionText(value),
  ].filter(Boolean).length;

  return signals >= 3 && !isSingleFunctionGraphText(value);
}

function getFunctionDefinitionCount(text) {
  var compact = String(text || "").replace(/\s+/g, "");
  var matches = compact.match(/(?:y|f\([xX]\))=/g);
  return matches ? matches.length : 0;
}

function isSingleFunctionGraphText(text) {
  var value = String(text || "");

  return /(?:画出|作出|绘制).{0,30}函数.{0,80}图[像象]/.test(value)
    && getFunctionDefinitionCount(value) <= 1
    && !isComplexMultiQuestionText(value)
    && !/L\s*1|L\s*2|y\s*1|y\s*2|y\s*3|中心对称|双倍比例点|面积|平行于\s*x\s*轴/i.test(value);
}

function hasDenseSampleCurve(spec) {
  return Boolean(spec && Array.isArray(spec.curves) && spec.curves.some(function(curve) {
    return curve && Array.isArray(curve.samples) && curve.samples.length > 50;
  }));
}

function isQuadraticCurveLike(curve) {
  if (!curve || typeof curve !== "object") {
    return false;
  }

  var kind = String(curve.kind || curve.type || "").toLowerCase();
  var expression = String(curve.expression || curve.formula || curve.equation || "");
  var coefficients = curve.coefficients || {};

  return kind === "quadratic"
    || kind === "parabola"
    || expression.indexOf("^2") !== -1
    || expression.indexOf("²") !== -1
    || /x\s*\*\s*x/.test(expression)
    || Number.isFinite(Number(coefficients.a)) && Math.abs(Number(coefficients.a)) > 1e-9;
}

function getResultQuestionText(questionText, result) {
  return [
    questionText,
    result?.problemText,
  ].filter(Boolean).join("\n");
}

function getVisualizationReliabilityReason(spec, questionText, result) {
  var text = getResultQuestionText(questionText, result);

  if (state.ocrDraftActive) {
    return "当前仍是 OCR 识别草稿阶段，尚未生成正式解析和 visualizationSpec。";
  }

  if (isComplexFunctionComprehensiveText(text)) {
    return "本题为复杂函数综合题，当前暂不自动重绘完整图，避免误导。请以原题图和文字解析为准。";
  }

  if (isComplexFunctionQuestionText(text)) {
    return "本题为复杂多问题，当前图示数据不足，暂不自动重绘完整图。请查看文字解析，或后续按小问生成图示。";
  }

  if (!hasRenderableVisualizationSpec(spec)) {
    return "正式解析已完成，但 visualizationSpec 缺失或不可渲染，暂不自动生成数学图示。";
  }

  return "正式解析已完成，但图示数据不足，暂不自动重绘完整图。";
}

function isVisualizationSpecReliable(spec, questionText, result) {
  if (!hasRenderableVisualizationSpec(spec)) {
    return false;
  }

  if (spec.type !== "function_graph") {
    return true;
  }

  var text = getResultQuestionText(questionText, result);
  var curves = getVisualizationCurves(spec);
  var pointCount = getVisualizationPointCount(spec);
  var hasParabola = /抛物线/.test(text);
  var mentionsMultipleCurves = /L\s*1|L\s*2|y\s*1|y\s*2|y\s*3/i.test(text);
  var mentionsPointRelations = /面积|双倍比例点|中心对称/.test(text);
  var complex = isComplexFunctionQuestionText(text);

  if (isComplexFunctionComprehensiveText(text)) {
    return false;
  }

  if (isSingleFunctionGraphText(text) && hasDenseSampleCurve(spec)) {
    return true;
  }

  if (!complex) {
    return true;
  }

  if (curves.length <= 1) {
    return false;
  }

  if (curves.length === 1 && !isQuadraticCurveLike(curves[0])) {
    return false;
  }

  if (hasParabola && !curves.some(isQuadraticCurveLike)) {
    return false;
  }

  if (mentionsMultipleCurves && curves.length < 2) {
    return false;
  }

  if (mentionsPointRelations && pointCount < 3) {
    return false;
  }

  if (isComplexMultiQuestionText(text) && curves.length < 2 && pointCount < 4) {
    return false;
  }

  return true;
}

function normalizeMathText(text) {
  return String(text || "")
    .replaceAll("−", "-")
    .replaceAll("，", ",")
    .replaceAll("：", ":")
    .replace(/\s+/g, "");
}


function createEquationBalanceFallback(text) {
  var normalized = normalizeMathText(text);
  // Support: 2x+3=11, 3x-5=10, x/2+1=3, -x+5=0, 2x=10
  var eqMatch = normalized.match(/([\-]?\d*\.?\d*)x\s*([+\-]\s*\d+(?:\.\d+)?)\s*=\s*(\d+(?:\.\d+)?)/i)   // ax + b = c
    || normalized.match(/([\-]?\d*\.?\d*)x\s*=\s*(\d+(?:\.\d+)?)/i);                    // ax = c

  if (!eqMatch) {
    return null;
  }

  var hasConstant = eqMatch[3] !== undefined;
  var coeffRaw = eqMatch[1] || "";
  var coeff, constant, rightVal;

  if (hasConstant) {
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
    else if (coeffRaw === "-") coeff = -1;
    else coeff = Number(coeffRaw);
    constant = Number(eqMatch[2].replace(/\s+/g, ""));
    rightVal = Number(eqMatch[3]);
    if (!isFinite(coeff) || !isFinite(constant) || !isFinite(rightVal)) return null;
  } else {
    if (coeffRaw === "" || coeffRaw === "+") coeff = 1;
    else if (coeffRaw === "-") coeff = -1;
    else coeff = Number(coeffRaw);
    constant = 0;
    rightVal = Number(eqMatch[2]);
    if (!isFinite(coeff) || !isFinite(rightVal)) return null;
  }

  var absCoeff = Math.abs(coeff);
  var coeffLabel = coeff === 1 ? "x" : coeff === -1 ? "-x" : (coeff + "x");
  var constLabel = constant === 0 ? "" : (constant > 0 ? ("+" + constant) : String(constant));

  var leftTerms = [coeffLabel];
  if (constLabel) leftTerms.push(constLabel);
  var rightTerms = [String(rightVal)];

  // Build steps: subtract constant, then divide by coefficient
  var steps = [];
  if (constant !== 0) {
    var newRight = rightVal - constant;
    steps.push({
      label: "等式两边同时" + (constant > 0 ? "减去" + constant : "加上" + (-constant)),
      leftTerms: [coeffLabel],
      rightTerms: [String(newRight)],
    });
  }

  if (absCoeff !== 1) {
    var finalRight = (rightVal - constant) / absCoeff;
    steps.push({
      label: "等式两边同时除以" + absCoeff,
      leftTerms: [coeff < 0 ? "-x" : "x"],
      rightTerms: [String(finalRight)],
    });
  }

  return {
    type: "equation_balance",
    title: "方程平衡示意",
    description: "根据题目中的一元一次方程生成的基础图示，仅用于辅助理解等式两边保持平衡。",
    equation: normalized,
    leftTerms: leftTerms,
    rightTerms: rightTerms,
    steps: steps,
    confidence: "high",
    points: {},
    objects: [],
    views: [],
  };
}

function createFunctionGraphFallback(text) {
  var raw = String(text || '').replace(/\s+/g, ' ');
  if (!isSimpleSingleFunctionText(raw)) {
    return null;
  }

  var match = raw.match(/(?:y|f\s*\(\s*x\s*\))\s*=\s*(.+)/i);
  if (!match || match[1].length < 2 || match[1].length > 400) return null;
  return {
    type: 'function_graph',
    title: '函数图像',
    functions: [{ id: 'f', expression: 'y=' + match[1].replace(/\s+/g, ''), range: [-8, 8], role: 'original' }],
    points: {},
    auxiliaryLines: [],
    objects: [],
    views: [],
    confidence: 'low',
  };
}

function isSimpleSingleFunctionText(text) {
  var raw = String(text || "");
  var compact = raw.replace(/\s+/g, "");
  var functionMatches = compact.match(/(?:y|f\([xX]\))=/g) || [];

  if (!functionMatches.length || functionMatches.length > 1) {
    return false;
  }

  if (isComplexFunctionQuestionText(raw)) {
    return false;
  }

  if (/L\s*1|L\s*2|y\s*1|y\s*2|y\s*3|中心对称|面积|双倍比例点|平行于\s*x\s*轴/i.test(raw)) {
    return false;
  }

  return true;
}

function createVisualizationFallback(result) {
  var text = result.problemText || "";

  if (isComplexFunctionQuestionText(text)) {
    return null;
  }

  if (result.visualizationSpec && result.visualizationSpec.type === 'function_graph'
    && Array.isArray(result.visualizationSpec.functions) && result.visualizationSpec.functions.length) {
    return result.visualizationSpec;
  }

  if (/y\s*=|f\s*\(\s*x\s*\)\s*=/.test(text)) {
    return createFunctionGraphFallback(text);
  }

  if (/三角形|几何|圆|相似|全等|角平分线|垂直|平行|中点/.test(text)) {
    return null;
  }

  return createEquationBalanceFallback(text) || null;
}
function createReadingCard(className, titleText, bodyText, options) {
  options = options || {};
  var isHtml = options.isHtml;
  var card = document.createElement("article");
  card.className = ("solution-reading-card " + (className || "")).trim();

  var title = document.createElement("h2");
  if (isHtml) { setSafeMathContent(title, titleText, ""); } else { title.textContent = titleText; }
  card.append(title);

  if (bodyText) {
    var body = document.createElement("p");
    setSafeMathContent(body, bodyText, "");
    card.append(body);
  }

  return card;
}

function createReadingList(items, emptyText) {
  var list = document.createElement("ul");
  var values = Array.isArray(items) ? items : [];

  if (!values.length) {
    var emptyItem = document.createElement("li");
    emptyItem.textContent = emptyText;
    list.append(emptyItem);
    return list;
  }

  values.forEach(function(value) {
    var li = document.createElement("li");
    setSafeMathContent(li, String(value || ""));
    list.append(li);
  });

  return list;
}

function createOriginalImageFallbackCard(description) {
  if (!state.uploadedImageUrl) {
    return null;
  }

  var card = createReadingCard("is-original-image", "原题图", description || "复杂题暂以原图为准，后续可按小问生成专用示意图。");
  var imgWrap = document.createElement("div");
  imgWrap.className = "uploaded-image-fallback is-solution-original";
  var img = document.createElement("img");
  img.src = state.uploadedImageUrl;
  img.alt = "上传的题目原图";
  img.className = "problem-original-image";
  imgWrap.append(img);
  card.append(imgWrap);
  return card;
}

function getVisualizationViews(spec) {
  return Array.isArray(spec?.views) ? spec.views.filter((view) => view && view.id) : [];
}

function findVisualizationView(spec, viewId) {
  if (!viewId) {
    return null;
  }

  return getVisualizationViews(spec).find((view) => view.id === viewId) || null;
}

function isDynamicVisualizationSpec(spec) {
  return spec?.type === "dynamic_point" || spec?.type === "trajectory" || spec?.type === "max_value";
}

function appendVisualizationForView(container, spec, viewId, fallbackTitle = "图示") {
  const panel = document.createElement("div");
  panel.className = "solution-card-diagram";
  const view = findVisualizationView(spec, viewId);
  const title = document.createElement("h3");
  setSafeMathContent(title, view?.title || fallbackTitle);
  panel.append(title);

  const board = document.createElement("div");
  board.className = "solution-card-diagram-board";
  panel.append(board);
  container.append(panel);

  var questionText = state.currentSolveResult?.problemText || "";
  if (!hasRenderableVisualizationSpec(spec) || !isVisualizationSpecReliable(spec, questionText, state.currentSolveResult)) {
    const reason = document.createElement("p");
    reason.className = "visualization-stage-note";
    reason.textContent = state.ocrDraftActive
      ? "当前仍是 OCR 识别草稿阶段，尚未生成正式解析和 visualizationSpec。"
      : getVisualizationReliabilityReason(spec, questionText, state.currentSolveResult);
    board.append(reason);
    return;
  }

  const vizOptions = {
    uploadedImageUrl: state.uploadedImageUrl || null,
  };

  if (window.MathVisualization?.renderView && viewId) {
    window.MathVisualization.renderView(board, spec, viewId, vizOptions);
  } else if (window.MathVisualization?.render) {
    window.MathVisualization.render(board, spec, vizOptions);
  } else {
    board.textContent = "暂无可靠图示，可查看文字解析。";
  }
}

function appendStepContent(card, step) {
  var thought = step?.thought || step?.idea || step?.method;

  if (thought) {
    var thoughtBox = document.createElement("p");
    thoughtBox.className = "solution-step-thought";
    setSafeMathContent(thoughtBox, "思路：" + thought);
    card.append(thoughtBox);
  }

  var contentP = document.createElement("p");
  setSafeMathContent(contentP, step?.content || step?.explanation || "暂无完整步骤。");
  card.append(contentP);
}

function getStepDiagramViewId(step, views, index) {
  const explicitId = step?.diagramViewId || step?.viewId || step?.view;

  if (explicitId && findVisualizationView({ views }, explicitId)) {
    return explicitId;
  }

  const nonOriginalViews = views.filter((view) => view.id !== "original");
  return nonOriginalViews[index]?.id || null;
}

function renderReasoningLines(container, lines) {
  if (!Array.isArray(lines) || !lines.length) return;
  var list = document.createElement("ul");
  list.className = "solution-reasoning-list";
  lines.forEach(function(line) {
    var item = document.createElement("li");
    item.className = "solution-reasoning-line solution-reasoning-" + (line.type || "normal");
    var prefix = "";
    if (line.type === "because") prefix = "\u2235 ";
    else if (line.type === "therefore") prefix = "\u2234 ";
    setSafeMathContent(item, prefix + line.text);
    list.append(item);
  });
  container.append(list);
}

function renderEquationBlocks(container, blocks) {
  if (!Array.isArray(blocks) || !blocks.length) return;
  blocks.forEach(function(block) {
    var wrapper = document.createElement("div");
    wrapper.className = "solution-equation-block";
    if (block.title) {
      var blockTitle = document.createElement("p");
      blockTitle.className = "solution-equation-block-title";
      setSafeMathContent(blockTitle, block.title);
      wrapper.append(blockTitle);
    }
    (block.lines || []).forEach(function(line) {
      var eqLine = document.createElement("p");
      eqLine.className = "solution-equation-line";
      setSafeMathContent(eqLine, formatEquationBlockLine(line));
      wrapper.append(eqLine);
    });
    container.append(wrapper);
  });
}

function formatEquationBlockLine(line) {
  var text = String(line || "").trim();

  if (!text) {
    return "";
  }

  if (/^\\\[([\s\S]*)\\\]$/.test(text) || /^\$\$([\s\S]*)\$\$$/.test(text)) {
    return text;
  }

  if (/^\\\(([\s\S]*)\\\)$/.test(text)) {
    return "\\[" + text.replace(/^\\\(|\\\)$/g, "") + "\\]";
  }

  if (/[=^]|\\(?:frac|sqrt)|\d+\/\d+/.test(text) && !/[。？！]/.test(text)) {
    return "\\[" + text + "\\]";
  }

  return text;
}

function renderKnownList(container, items, prefix) {
  if (!Array.isArray(items) || !items.length) return;
  var label = document.createElement("p");
  label.className = "solution-section-label";
  label.textContent = prefix || "已知：";
  container.append(label);
  var list = document.createElement("ul");
  list.className = "solution-known-list";
  items.forEach(function(item) {
    var li = document.createElement("li");
    setSafeMathContent(li, String(item));
    list.append(li);
  });
  container.append(list);
}

function appendQualityCheck(flow, qualityCheck) {
  var card = createReadingCard("is-quality", "质量检查");
  var confidence = qualityCheck?.confidence || "medium";
  var status = document.createElement("p");
  if (qualityCheck && qualityCheck.sourceVerificationPassed === true && confidence !== "low") {
    status.textContent = "双源校验已通过。";
  } else if (confidence === "high") {
    status.textContent = "已通过结构化校验。";
  } else if (confidence === "low") {
    status.textContent = "当前结果置信度较低，请核对题干后使用。";
  } else {
    status.textContent = "已完成结构化校验，复杂压轴题建议教师复核。";
  }
  card.append(status, createReadingList(qualityCheck?.issues, "暂无明显问题。"));
  flow.append(card);
}

function renderStructuredResult(result) {
  state.currentSolveResult = result || null;
  state.ocrDraftActive = false;
  state.ocrDraftReason = "";

  if (!result) {
    elements.structuredResult.hidden = true;
    return;
  }

  var flow = elements.solutionReadingFlow || document.querySelector("#solution-reading-flow");
  if (!flow) {
    elements.structuredResult.hidden = true;
    return;
  }
  flow.replaceChildren();


  try {
  var originalVisualizationSpec = result.visualizationSpec || null;
  var originalSpecRenderable = hasRenderableVisualizationSpec(originalVisualizationSpec);
  var originalSpecReliable = originalSpecRenderable
    && isVisualizationSpecReliable(originalVisualizationSpec, result.problemText, result);
  var fallbackVisualizationSpec = originalSpecReliable ? null : createVisualizationFallback(result);
  var fallbackSpecReliable = hasRenderableVisualizationSpec(fallbackVisualizationSpec)
    && isVisualizationSpecReliable(fallbackVisualizationSpec, result.problemText, result);
  var visualizationSpec = originalSpecReliable
    ? originalVisualizationSpec
    : (fallbackSpecReliable ? fallbackVisualizationSpec : null);
  var views = getVisualizationViews(visualizationSpec);
  var isGeometric = isGeometryProblemByResult(result);
  var hasFormalVisualization = hasRenderableVisualizationSpec(visualizationSpec)
    && isVisualizationSpecReliable(visualizationSpec, result.problemText, result);
  var visualizationShown = false;
  var visualizationIssueReason = hasFormalVisualization
    ? ""
    : getVisualizationReliabilityReason(originalVisualizationSpec || fallbackVisualizationSpec, result.problemText, result);

  debugLog("visualizationSpec.type:", visualizationSpec ? visualizationSpec.type : "none");
  debugLog("hasReliableVisualization:", hasFormalVisualization);
  debugLog("views count:", getVisualizationViews(visualizationSpec).length);
  debugLog("objects count:", visualizationSpec && Array.isArray(visualizationSpec.objects) ? visualizationSpec.objects.length : 0);

  /* 1. 原题复现 */
  var originalCard = createReadingCard("is-original", "原题复现");
  var problemP = document.createElement("p");
  setSafeMathContent(problemP, result.problemText || "暂无题目文本。");
  originalCard.append(problemP);

  /* 上传原图兜底（仅当前工作台会话） */
  if (isGeometric && state.uploadedImageUrl) {
    var imgWrap = document.createElement("div");
    imgWrap.className = "uploaded-image-fallback";
    var img = document.createElement("img");
    img.src = state.uploadedImageUrl;
    img.alt = "上传的题目图片";
    img.className = "problem-original-image";
    imgWrap.append(img);
    originalCard.append(imgWrap);
  }

  /* 标签行 */
  var tags = document.createElement("div");
  tags.className = "solution-tags";
  if (result.gradeLevel) {
    var g = document.createElement("span");
    g.className = "solution-tag";
    g.textContent = result.gradeLevel;
    tags.append(g);
  }
  if (result.subject) {
    var s = document.createElement("span");
    s.className = "solution-tag";
    s.textContent = result.subject;
    tags.append(s);
  }
  if (result.topic) {
    var t = document.createElement("span");
    t.className = "solution-tag";
    t.textContent = result.topic;
    tags.append(t);
  }
  originalCard.append(tags);
  flow.append(originalCard);

  /* 2. 本题考点 */
  var knowledgeCard = createReadingCard("is-knowledge", "本题考点");
  knowledgeCard.append(createReadingList(result.knowledgePoints, "暂无明确考点。"));
  flow.append(knowledgeCard);

  /* 3. 题意分析 */
  if (result.analysis) {
    flow.append(createReadingCard("is-analysis", "题意分析", result.analysis));
  }

  /* 4. 分问解析 */
  function normalizeSectionHeading(section, index, fallbackTitle) {
    var title = section.title || "";
    var problem = section.problem || "";
    var idx = index + 1;
    if (title && problem && title === problem) { problem = ""; }
    var hasQW = /第\s*\d+\s*问/.test(title);
    var hasQWp = /第\s*\d+\s*问/.test(problem);
    if (hasQW && hasQWp && title.length <= 12 && problem.length <= 12) { problem = ""; }
    if (!title && !problem) { return { heading: fallbackTitle || ("第 " + idx + " 问"), problem: "" }; }
    if (!title && problem) { return { heading: fallbackTitle || ("第 " + idx + " 问"), problem: problem }; }
    return { heading: title, problem: title === problem ? "" : problem };
  }

  var sections = Array.isArray(result.questionSections) ? result.questionSections : [];
  var steps = Array.isArray(result.steps) ? result.steps : [];

  if (sections.length) {
    sections.forEach(function(section, idx) {
      var heading = normalizeSectionHeading(section, idx, "第 " + (idx + 1) + " 问");
      var card = createReadingCard("is-question-step", heading.heading);

      // Show sub-problem text (if different from heading)
      if (heading.problem) {
        var problemP = document.createElement("p");
        problemP.className = "solution-section-problem";
        setSafeMathContent(problemP, heading.problem);
        card.append(problemP);
      }

      /* 已知条件 */
      renderKnownList(card, section.known, "已知：");

      /* 辅助线 / 作法 */
      renderKnownList(card, section.construction, "辅助线作法：");

      /* 解题思路 */
      if (section.idea) {
        var ideaP = document.createElement("p");
        ideaP.className = "solution-step-thought";
        setSafeMathContent(ideaP, "解题思路：" + section.idea);
        card.append(ideaP);
      }

      /* 关键依据 */
      renderKnownList(card, section.keyBasis, "关键依据：");

      /* 推理链 */
      renderReasoningLines(card, section.reasoningLines);

      /* 计算过程 */
      renderEquationBlocks(card, section.equationBlocks);

      /* 分步推导 */
      var subSteps = Array.isArray(section.steps) ? section.steps : [];
      if (subSteps.length) {
        var stepList = document.createElement("ol");
        stepList.className = "solution-sub-steps";
        subSteps.forEach(function(sub) {
          var li = document.createElement("li");
          var stTitle = document.createElement("strong");
          setSafeMathContent(stTitle, sub.title || "步骤");
          li.append(stTitle);
          if (sub.content) {
            var stP = document.createElement("p");
            setSafeMathContent(stP, sub.content);
            li.append(stP);
          }
          stepList.append(li);
        });
        card.append(stepList);
      }

      /* 本问结论 */
      if (section.conclusion) {
        var conclP = document.createElement("p");
        conclP.className = "solution-conclusion";
        if (isGeometric) {
          setSafeMathContent(conclP, "本问结论：" + section.conclusion);
        } else {
          setSafeMathContent(conclP, "结论：" + section.conclusion);
        }
        card.append(conclP);
      }

      /* 对应图示 */
      var viewId = section.diagramViewId || (views.length > 0 ? (views[idx] ? views[idx].id : null) : null);
      if (!viewId && views.length > 0) {
        var nonOrigViews = views.filter(function(v) { return v.id !== "original"; });
        viewId = nonOrigViews[idx] ? nonOrigViews[idx].id : null;
      }
      if (viewId) {
        appendVisualizationForView(card, visualizationSpec, viewId, "本问图示");
        visualizationShown = true;
      } else if (window.MathVisualization && visualizationSpec && visualizationSpec.type !== "none") {
        appendVisualizationForView(card, visualizationSpec, null, "本问图示");
        visualizationShown = true;
      }

      flow.append(card);
    });
  } else if (steps.length) {
    steps.forEach(function(step, index) {
      var card = createReadingCard("is-question-step", "分步解析");
      var stTitle = document.createElement("h3");
      setSafeMathContent(stTitle, step.title || ("步骤 " + (index + 1)));
      card.append(stTitle);
      appendStepContent(card, step);

      var viewId = getStepDiagramViewId(step, views, index);
      if (viewId) {
        appendVisualizationForView(card, visualizationSpec, viewId, "本步图示");
        visualizationShown = true;
      }

      flow.append(card);
    });
  } else {
    flow.append(createReadingCard("is-question-step", "分步解析", "暂无完整步骤。"));
  }

  if (!visualizationShown && !hasFormalVisualization) {
    var missingVizCard = createReadingCard("is-diagram", "图示状态");
    var missingVizP = document.createElement("p");
    missingVizP.className = "visualization-stage-note";
    missingVizP.textContent = visualizationIssueReason || "正式解析已完成，但图示数据不足，暂不自动重绘完整图。";
    missingVizCard.append(missingVizP);
    if (state.uploadedImageUrl) {
      var originalHint = document.createElement("p");
      originalHint.className = "visualization-stage-note is-soft";
      originalHint.textContent = "你仍可以参考上传原图和文字解析；如果需要图示，可裁剪单题或补充条件后重新解析。";
      missingVizCard.append(originalHint);
    }
    flow.append(missingVizCard);
  }

  /* 5. 方法总结（替代单独的"最终答案"+"验算检查"） */
  var summaryCard = createReadingCard("is-depth", "方法总结");
  var summaryParts = [];

  if (result.topic) {
    summaryParts.push("本题核心模型：" + result.topic);
  }

  /* 对几何/图片题：结果融入方法总结，不单独显示 */
  if (isGeometric) {
    if (result.finalAnswer) {
      summaryParts.push("结果：" + result.finalAnswer);
    }
    if (result.verification && !result.verification.startsWith("请将答案代回")) {
      summaryParts.push("结果检查：" + result.verification);
    }
  }

  summaryCard.append(createReadingList(summaryParts, "暂无总结。"));
  flow.append(summaryCard);

  /* 6. 最终答案（仅非几何/图片题显示独立卡片） */
  if (!isGeometric) {
    flow.append(createReadingCard("is-answer", "最终答案", result.finalAnswer || "暂无最终答案。"));
  }

  /* 7. 易错提醒 */
  var mistakeCard = createReadingCard("is-warning", "易错提醒");
  mistakeCard.append(createReadingList(result.commonMistakes, "暂无易错提醒。"));
  flow.append(mistakeCard);

  /* 8. 验算检查（仅非几何/图片题显示独立卡片） */
  if (!isGeometric) {
    flow.append(createReadingCard("is-verification", "验算检查", result.verification || "暂无验算检查。"));
  }

  appendQualityCheck(flow, result.qualityCheck);

  elements.structuredResult.hidden = false;

  if (window.MathJax && window.MathJax.typesetPromise) {
    window.MathJax.typesetPromise([flow]).catch(function() {});
  }

} catch (renderError) {
    debugLog("renderStructuredResult error:", renderError);
    if (flow) {
      var errorCard = createReadingCard("is-original", "解析显示异常");
      var errorText = document.createElement("p");
      setSafeMathContent(errorText, result && result.problemText ? result.problemText : "图示暂不可用，已保留文字解析。");
      errorCard.append(errorText);
      if (state.uploadedImageUrl) {
        var errorImg = document.createElement("img");
        errorImg.src = state.uploadedImageUrl;
        errorImg.alt = "上传的题目原图";
        errorImg.className = "problem-original-image";
        errorCard.append(errorImg);
      }
      flow.replaceChildren();
      flow.append(errorCard);
      elements.structuredResult.hidden = false;
      if (window.MathJax && window.MathJax.typesetPromise) {
        window.MathJax.typesetPromise([flow]).catch(function() {});
      }
    }
    showToast("图示暂不可用，已保留文字解析。");
  }
}

function isGeometryProblemByResult(result) {
  if (!result) { return false; }
  var combined = (result.topic || "") + "\n" + (result.problemText || "") + "\n" + (result.subject || "");
  return /几何/.test(combined)
    || /三角形|圆|四点共圆|相似|全等|角平分线|垂直|平行|中点|动点|最值|轨迹|辅助线|切线|弦|垂足/.test(combined);
}
function showResultActions(recordId) {
  state.currentSolveRecordId = recordId || null;
  const hasRecord = Boolean(state.currentSolveRecordId);
  [
    elements.saveResultOriginalButton,
    elements.saveResultStrategyButton,
    elements.exportResultWordButton,
    elements.exportResultGgbButton,
  ].forEach((button) => {
    button.disabled = !hasRecord;
  });
  elements.saveResultOriginalButton.classList.toggle(
    "is-saved",
    hasRecord && state.currentLibraryType === "original",
  );
  elements.saveResultStrategyButton.classList.toggle(
    "is-saved",
    hasRecord && state.currentLibraryType === "strategy",
  );
}

function clearGenerationStatusTimers() {
  state.generationStatusTimers.forEach(function(timerId) { window.clearTimeout(timerId); });
  state.generationStatusTimers = [];
  state._progressStartTime = 0;
  state._progressTimedOut30 = false;
  state._progressTimedOut60 = false;
}

function startGenerationStatusUpdates({
  target = elements.generateButtonText,
  statuses = [
    "正在识别题目...",
    "正在整理题干...",
    "正在生成解析...",
    "正在生成图示...",
    "正在保存记录...",
  ],
} = {}) {
  clearGenerationStatusTimers();

  target.textContent = statuses[0] || "正在处理...";
  state._progressStartTime = Date.now();
  state._progressTimedOut30 = false;
  state._progressTimedOut60 = false;

  statuses.slice(1).forEach(function(status, index) {
    var timerId = window.setTimeout(function() {
      target.textContent = status;
    }, (index + 1) * 2500);
    state.generationStatusTimers.push(timerId);
  });

  /* 30 秒提示：题目较复杂 */
  var timer30 = window.setTimeout(function() {
    if (state.generationTimer) {
      state._progressTimedOut30 = true;
      target.textContent = "题目较复杂，正在继续解析，请稍候。";
    }
  }, 30000);
  state.generationStatusTimers.push(timer30);

  /* 60 秒提示：当前模型响应较慢 */
  var timer60 = window.setTimeout(function() {
    if (state.generationTimer) {
      state._progressTimedOut60 = true;
      target.textContent = "当前模型响应较慢，可稍后重试或切换模型。";
    }
  }, 60000);
  state.generationStatusTimers.push(timer60);
}



function getQuestionTypeFromText(text) {
  if (/函数|一次函数|二次函数|抛物线|坐标系/.test(text)) {
    return "函数";
  }

  if (/三角形|圆|几何|角|平行|垂直|相似|全等/.test(text)) {
    return "几何";
  }

  if (/方程|不等式|因式分解|代数式|整式/.test(text)) {
    return "代数";
  }

  return "综合";
}

function getSelectedLibraryDisplayName() {
  return state.currentLibraryType === "strategy" ? "策略库" : "原创题库";
}

function getModelStatus(provider) {
  return state.modelStatuses[provider] || null;
}

function getProviderCapability(provider) {
  if (provider === "auto") {
    return {
      label: "可用",
      available: true,
      badgeClass: "is-available",
      message: "系统会优先选择当前可用模型",
    };
  }

  const status = getModelStatus(provider);

  if (!status) {
    return {
      label: "检测中",
      available: true,
      badgeClass: "is-checking",
      message: "正在检测模型配置状态",
    };
  }

  const textConfigured = Boolean(status.textConfigured);
  const visionConfigured = Boolean(status.visionConfigured);

  if (textConfigured && visionConfigured) {
    return {
      label: "支持图文",
      available: true,
      badgeClass: "is-available",
      message: "当前模型支持文字解析和图片识题",
    };
  }

  if (textConfigured) {
    return {
      label: "仅文字",
      available: state.activeSolveMode !== "image",
      badgeClass: "is-text-only",
      message: state.activeSolveMode === "image"
        ? "当前模型暂不支持图片识别，请使用自动推荐或切换其他模型。"
        : status.message || "当前模型可用于文字解题",
    };
  }

  if (visionConfigured) {
    return {
      label: "未配置",
      available: false,
      badgeClass: "is-unavailable",
      message: state.activeSolveMode === "image"
        ? "当前模型文字解析未配置，请使用自动推荐或切换其他模型。"
        : status.message || "当前模型文字解析未配置",
    };
  }

  return {
    label: "未配置",
    available: false,
    badgeClass: "is-unavailable",
    message: state.activeSolveMode === "image"
      ? status.visionMessage || "当前模型暂不支持图片识别，请使用自动推荐或切换其他模型。"
      : status.message || "当前模型未配置",
  };
}

function isProviderAvailableForCurrentMode(provider) {
  return getProviderCapability(provider).available;
}

function ensureModelStatusBadge(button) {
  let statusBadge = button.querySelector(".model-card-status");

  if (!statusBadge) {
    statusBadge = document.createElement("em");
    statusBadge.className = "model-card-status";
    statusBadge.textContent = "检测中";
    button.append(statusBadge);
  }

  return statusBadge;
}

function updateModelPickerSummary() {
  if (!elements.modelPickerCurrent) {
    return;
  }

  const provider = state.selectedModelProvider || "auto";
  const label = MODEL_PROVIDER_LABELS[provider] || MODEL_PROVIDER_LABELS.auto;
  const capability = getProviderCapability(provider);

  elements.modelPickerCurrent.textContent = `当前：${label} · ${capability.label}`;
}

function renderModelStatuses() {
  elements.modelButtons.forEach((button) => {
    const provider = button.dataset.modelProvider;
    const statusBadge = ensureModelStatusBadge(button);
    const capability = getProviderCapability(provider);
    const available = capability.available;

    button.classList.toggle("is-available", available);
    button.classList.toggle("is-unavailable", !available);
    button.classList.toggle("is-text-only", capability.badgeClass === "is-text-only");
    button.classList.toggle("is-checking", capability.badgeClass === "is-checking");
    statusBadge.className = `model-card-status ${capability.badgeClass}`;
    statusBadge.textContent = capability.label;
    button.title = capability.message;
  });
  updateModelPickerSummary();
}

async function refreshModelStatuses() {
  try {
    const data = await requestApi("/api/models/status", { auth: false });
    const providers = Array.isArray(data.providers) ? data.providers : [];
    state.modelStatuses = providers.reduce((map, provider) => {
      map[provider.id] = provider;
      return map;
    }, {});
  } catch {
    state.modelStatuses = {};
  }

  renderModelStatuses();
}

function selectModelProvider(provider) {
  const nextProvider = MODEL_PROVIDER_CONFIG[provider] ? provider : "auto";
  const capability = getProviderCapability(nextProvider);

  if (!capability.available) {
    showToast(capability.message || "当前模型暂不可用，请使用自动推荐或切换其他模型。");
    renderModelStatuses();
    return;
  }

  const config = MODEL_PROVIDER_CONFIG[nextProvider];
  state.selectedModelProvider = nextProvider;
  elements.modelSelect.value = config.solveProvider;
  elements.visionProviderSelect.value = config.visionProvider;

  elements.modelButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.modelProvider === nextProvider);
  });
  renderModelStatuses();

  const picker = document.querySelector("#model-picker-details");

  if (picker) {
    picker.open = false;
  }
}

function getFriendlyAiError(error) {
  if (error.status === 503) {
    return "当前模型暂不可用，请切换其他模型或使用自动推荐。";
  }
  var message = error.message || "";
  if (/Cannot read properties of undefined|TypeError|ReferenceError/.test(message)) {
    return "图示暂不可用，已保留文字解析。";
  }
  return message || "AI 解题失败，请稍后再试。";
}

async function saveCurrentRecordToLibrary(libraryType) {
  if (!state.currentSolveRecordId) {
    showToast("请先生成解析结果。");
    return;
  }

  try {
    await requestApi(`/api/solve-records/${state.currentSolveRecordId}/library`, {
      method: "PATCH",
      body: JSON.stringify({ libraryType }),
    });
    state.currentLibraryType = libraryType;
    invalidateCloudLibrary(libraryType);
    showResultActions(state.currentSolveRecordId);
    showToast(libraryType === "strategy" ? "已保存到策略库。" : "已保存到原创题库。");
  } catch (error) {
    showToast(error.message || "保存位置更新失败，请稍后再试。");
  }
}

async function downloadProtectedFile(path, fallbackFilename) {
  if (!state.currentSolveRecordId) {
    showToast("请先生成解析结果。");
    return;
  }

  const headers = new Headers();

  if (state.authToken) {
    headers.set("Authorization", `Bearer ${state.authToken}`);
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, { headers });
  } catch {
    showToast("无法连接后端服务，请确认服务已启动。");
    return;
  }

  if (!response.ok) {
    let message = "导出失败，请稍后再试。";

    try {
      const payload = await response.json();
      message = payload.message || message;
    } catch {
      // 非 JSON 错误响应使用默认提示。
    }

    showToast(message);
    return;
  }

  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match?.[1] || fallbackFilename;
  downloadBlob(blob, filename);
}

function exportCurrentRecordWord() {
  downloadProtectedFile(
    `/api/solve-records/${state.currentSolveRecordId}/export/word`,
    `math-solution-record-${state.currentSolveRecordId}.doc`,
  );
}

function exportCurrentRecordGgb() {
  downloadProtectedFile(
    `/api/solve-records/${state.currentSolveRecordId}/export/ggb`,
    `math-solution-record-${state.currentSolveRecordId}-geogebra.xml`,
  );
}

function invalidateCloudLibrary(targetLibrary) {
  if (!state.cloudLibraries[targetLibrary]) {
    return;
  }

  state.cloudLibraries[targetLibrary].loaded = false;
}

async function refreshCloudLibrary(targetLibrary, { force = false } = {}) {
  const cloudState = state.cloudLibraries[targetLibrary];

  if (!cloudState || !state.currentUser || !state.authToken) {
    return;
  }

  if (cloudState.loading || (cloudState.loaded && !force)) {
    return;
  }

  cloudState.loading = true;
  cloudState.error = "";
  renderLibraryList(targetLibrary);

  try {
    const query = new URLSearchParams({
      libraryType: targetLibrary,
      page: "1",
      pageSize: "50",
    });
    const data = await requestApi(`/api/solve-records?${query.toString()}`);
    cloudState.items = Array.isArray(data.items) ? data.items : [];
    cloudState.total = Number(data.total || cloudState.items.length);
    cloudState.loaded = true;
  } catch (error) {
    cloudState.items = [];
    cloudState.total = 0;
    cloudState.error = error.message || "云端题库读取失败，请稍后重试。";
    cloudState.loaded = true;
    showToast(cloudState.error);
  } finally {
    cloudState.loading = false;
    renderLibraryList(targetLibrary);
  }
}

async function openCloudRecordDetail(recordId, triggerButton) {
  if (!recordId) {
    showToast("云端记录 ID 不正确，请刷新后重试。");
    return;
  }

  if (triggerButton) {
    triggerButton.disabled = true;
  }

  try {
    const data = await requestApi(`/api/solve-records/${recordId}`);
    state.currentSolveRecordId = data.recordId || data.id || recordId;
    state.currentLibraryType = data.libraryType || null;
    state.currentHtmlResult = data.htmlResult || data.sourceCode || "";
    renderStructuredResult(data.result);
    showResultActions(state.currentSolveRecordId);
    switchPage("workspace");
    showToast("已打开云端解析详情。");
  } catch (error) {
    showToast(error.message || "云端记录详情读取失败，请稍后重试。");
  } finally {
    if (triggerButton) {
      triggerButton.disabled = false;
    }
  }
}

function downloadCloudRecordExport(recordId, exportType) {
  state.currentSolveRecordId = recordId;
  showResultActions(recordId);

  if (exportType === "word") {
    exportCurrentRecordWord();
  } else {
    exportCurrentRecordGgb();
  }
}

async function submitTextSolution(questionText, {
  button,
  buttonText,
  idleText,
  loadingStatuses,
}) {
  if (state.generationTimer) {
    return;
  }

  if (!state.currentUser || !state.authToken) {
    showToast("请先登录后再使用 AI 解题。");
    switchPage("profile");
    return;
  }

  if (!questionText) {
    showToast("请先输入需要解析的文字题目。");
    return;
  }

  if (questionText.length > 5000) {
    showToast("题目文字不能超过 5000 字。");
    return;
  }

  button.disabled = true;
  state.generationTimer = true;
  startGenerationStatusUpdates({
    target: buttonText,
    statuses: loadingStatuses,
  });

  try {
    const data = await requestApi("/api/solve-text", {
      method: "POST",
      body: JSON.stringify({
        questionText,
        subject: "数学",
        gradeLevel: "初中",
        questionType: getQuestionTypeFromText(questionText),
        libraryType: "original",
        preferredProvider: elements.modelSelect.value,
      }),
    });

    renderAiHtmlResult(data.htmlResult);
    clearOcrDraftState({ hidePanel: true });
    renderStructuredResult(data.result);
    state.currentSolveRecordId = data.recordId || null;
    state.currentSolveResult = data.result || null;
    state.currentHtmlResult = data.htmlResult || "";
    state.currentLibraryType = "original";
    showResultActions(data.recordId);
    showToast("AI 解析已生成，可保存到原创题库或策略库。");
  } catch (error) {
    showToast(getFriendlyAiError(error));
  } finally {
    clearGenerationStatusTimers();
    button.disabled = false;
    buttonText.textContent = idleText;
    state.generationTimer = null;
  }
}

async function generateAiTextSolution() {
  const questionText = elements.instructionInput.value.trim();

  return submitTextSolution(questionText, {
    button: elements.generateButton,
    buttonText: elements.generateButtonText,
    idleText: "生成标准解析报告",
    loadingStatuses: ["正在整理题目...", "正在生成解析...", "正在保存记录..."],
  });
}

function switchSolveMode(mode) {
  const nextMode = mode === "image" ? "image" : "text";
  state.activeSolveMode = nextMode;

  elements.solveModeButtons.forEach((button) => {
    const isActive = button.dataset.solveMode === nextMode;
    button.classList.toggle("is-active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  elements.textSolvePanel.hidden = nextMode !== "text";
  elements.imageSolvePanel.hidden = nextMode !== "image";
  elements.textGenerateArea.hidden = nextMode !== "text";
  renderModelStatuses();

  if (!isProviderAvailableForCurrentMode(state.selectedModelProvider)) {
    selectModelProvider("auto");
  }
}

function isAllowedSolveImage(file) {
  return ALLOWED_SOLVE_IMAGE_TYPES.has(file.type);
}

function validateSelectedImageForSolve() {
  const file = state.selectedProblemFile;

  if (!file) {
    showToast("请先上传题目图片。");
    return null;
  }

  if (!isAllowedSolveImage(file)) {
    showToast("图片解题仅支持 jpg、png 或 webp；PDF 本阶段只做本地预览。");
    return null;
  }

  if (file.size > MAX_IMAGE_UPLOAD_SIZE_BYTES) {
    showToast("图片大小不能超过 3MB，请压缩后再上传。");
    return null;
  }

  return file;
}

function getOcrReviewMessage(data = {}) {
  if (data.reviewReason === "multiple_questions") {
    return "检测到整页多题：请裁剪单题，或在下方草稿中只保留一个小题后点击“用修改后的文本重新解析”。";
  }

  if (data.reviewReason === "too_short") {
    return "OCR 识别内容较少：请核对图片清晰度，必要时手动补全题干后重新解析。";
  }

  if (data.reviewReason === "solve_failed") {
    return "OCR 已识别出草稿，但自动解析失败。请校对题干后重新解析。";
  }

  if (data.partial || data.needsUserReview) {
    return "当前是 OCR 草稿阶段：可以保留 LaTeX 原文，校对后再生成正式解析。";
  }

  return "OCR 识别成功，已进入正式解析。";
}

function showRecognizedText(text, noteText) {
  elements.recognizedTextInput.value = text || "";
  if (elements.recognizedTextNote) {
    elements.recognizedTextNote.textContent = noteText || "OCR 草稿会保留 LaTeX 原文，请核对后再重新解析。";
  }
  elements.recognizedTextPanel.hidden = false;
}

function clearOcrDraftState({ hidePanel = true } = {}) {
  state.ocrDraftActive = false;
  state.ocrDraftReason = "";

  if (elements.recognizedTextNote) {
    elements.recognizedTextNote.textContent = "OCR 草稿会保留 LaTeX 原文，请核对后再重新解析。";
  }

  if (hidePanel) {
    elements.recognizedTextPanel.hidden = true;
  }
}

async function solveImageFromUpload() {
  if (state.generationTimer) {
    return;
  }

  if (!state.currentUser || !state.authToken) {
    showToast("请先登录后再使用 AI 解题。");
    switchPage("profile");
    return;
  }

  const file = validateSelectedImageForSolve();

  if (!file) {
    return;
  }

  const formData = new FormData();
  formData.append("image", file);
  formData.append("subject", "数学");
  formData.append("gradeLevel", "初中");
  formData.append("questionType", getQuestionTypeFromText(elements.instructionInput.value || ""));
  formData.append("libraryType", "original");
  formData.append("preferredVisionProvider", elements.visionProviderSelect.value);
  formData.append("preferredSolveProvider", elements.modelSelect.value);

  elements.solveImageButton.disabled = true;
  state.generationTimer = true;
  startGenerationStatusUpdates({
    target: elements.solveImageButtonText,
    statuses: ["正在识别题目...", "正在生成解析...", "正在保存记录..."],
  });

  try {
    const data = await requestApi("/api/solve-image", {
      method: "POST",
      body: formData,
    });

    state.uploadedImageUrl = state.filePreviewUrl || null;

    if (data.partial) {
      showRecognizedText(data.recognizedText, getOcrReviewMessage(data));
      // Partial recognition: show draft + original image, let user edit and retry
      showPartialRecognitionResult(data);
      showToast("已提取到部分题目信息，请核对后继续解析。");
    } else {
      showRecognizedText(data.recognizedText, getOcrReviewMessage(data));
      clearOcrDraftState({ hidePanel: true });
      renderAiHtmlResult(data.htmlResult);
      renderStructuredResult(data.result);
      state.currentSolveRecordId = data.recordId || null;
      state.currentSolveResult = data.result || null;
      state.currentHtmlResult = data.htmlResult || "";
      state.currentLibraryType = "original";
      showResultActions(data.recordId);
      showToast("图片题已解析，可保存到原创题库或策略库。");
    }
  } catch (error) {
    if (error.data?.recognizedText) {
      showRecognizedText(error.data.recognizedText, "OCR 已返回草稿，但解析失败。请校对后重新解析。");
    }

    showToast(getFriendlyAiError(error));
  } finally {
    clearGenerationStatusTimers();
    elements.solveImageButton.disabled = false;
    elements.solveImageButtonText.textContent = "识别并解析";
    state.generationTimer = null;
  }
}


function showPartialRecognitionResult(data) {
  var flow = document.querySelector("#solution-reading-flow") || document.querySelector(".solution-reading-flow");
  if (!flow) {
    return;
  }

  state.ocrDraftActive = true;
  state.ocrDraftReason = data.reviewReason || "needs_user_review";
  state.currentSolveRecordId = null;
  state.currentSolveResult = null;
  state.currentHtmlResult = "";
  flow.replaceChildren();
  elements.structuredResult.hidden = false;

  // Show uploaded image
  if (state.uploadedImageUrl) {
    var imgCard = createReadingCard("is-original", "识别原图");
    var imgWrap = document.createElement("div");
    imgWrap.className = "uploaded-image-fallback";
    var img = document.createElement("img");
    img.src = state.uploadedImageUrl;
    img.alt = "上传的题目图片";
    img.className = "problem-original-image";
    imgWrap.append(img);
    imgCard.append(imgWrap);
    flow.append(imgCard);
  }

  // Show recognized text draft
  var draftCard = createReadingCard("is-analysis", "识别草稿");
  var draftP = document.createElement("p");
  draftP.textContent = data.recognizedText || "未能识别到文字，请检查图片是否清晰。";
  draftP.className = "ocr-draft-raw-text";
  draftCard.append(draftP);

  if (Array.isArray(data.warnings) && data.warnings.length) {
    var warnP = document.createElement("p");
    warnP.className = "solution-warning";
    warnP.textContent = data.warnings.join(" ");
    draftCard.append(warnP);
  }

  if (data.solveError) {
    var solveErrorP = document.createElement("p");
    solveErrorP.className = "solution-warning";
    solveErrorP.textContent = data.solveError;
    draftCard.append(solveErrorP);
  }

  flow.append(draftCard);

  // Hint to edit and retry
  var hintCard = createReadingCard("is-warning", "请核对后重新解析");
  var hintP = document.createElement("p");
  hintP.textContent = getOcrReviewMessage(data);
  hintCard.append(hintP);

  var vizP = document.createElement("p");
  vizP.className = "visualization-stage-note";
  vizP.textContent = "图示状态：当前仍是 OCR 草稿阶段，尚未调用正式解析得到 visualizationSpec，所以不会生成主图。";
  hintCard.append(vizP);
  flow.append(hintCard);

  // Disable save/export since no record yet
  showResultActions(null);
}

async function reanalyzeRecognizedText() {
  const questionText = elements.recognizedTextInput.value.trim();

  return submitTextSolution(questionText, {
    button: elements.reanalyzeRecognizedTextButton,
    buttonText: elements.reanalyzeRecognizedTextButton,
    idleText: "用修改后的文本重新解析",
    loadingStatuses: ["正在整理修改后的题目...", "正在生成解析...", "正在保存记录..."],
  });
}


function revokeUploadImageUrl() {
  if (state.uploadedImageUrl) {
    URL.revokeObjectURL(state.uploadedImageUrl);
    state.uploadedImageUrl = null;
  }
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
  revokeUploadImageUrl();
  resetPreviewMedia();
  state.selectedProblemFile = null;
  elements.fileInput.value = "";
  elements.filePreview.hidden = true;
  elements.uploadEmptyState.hidden = false;
  elements.previewFileName.textContent = "";
  elements.previewFileSize.textContent = "";
  elements.previewFileType.textContent = "";
  elements.recognizedTextPanel.hidden = true;
  elements.recognizedTextInput.value = "";

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
  state.selectedProblemFile = file;
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
    showToast("图片已生成缩略图，可以点击“识别并解析”。");
    return;
  }

  elements.pdfPreview.hidden = false;
  elements.previewFileType.textContent = "PDF 文档";
  showToast("PDF 已在浏览器本地读取文件信息，本阶段不做识题。");
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

function createVisualizationValidationResult(valid, message, data = null, details = {}) {
  return {
    valid,
    message,
    data,
    empty: false,
    objectCount: 0,
    kindLabels: [],
    ...details,
  };
}

function validateVisualizationDataValue(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return createVisualizationValidationResult(false, "图形数据必须是一个 JSON 对象。");
  }

  if (!Object.hasOwn(value, "version")) {
    return createVisualizationValidationResult(false, "图形 JSON 缺少 version 字段。");
  }

  if (value.version !== VISUALIZATION_DATA_VERSION) {
    return createVisualizationValidationResult(false, "当前仅支持 version 为 1 的图形 JSON。");
  }

  if (typeof value.type !== "string" || !value.type.trim()) {
    return createVisualizationValidationResult(false, "图形 JSON 缺少有效的 type 字段。");
  }

  if (!Object.hasOwn(value, "objects")) {
    return createVisualizationValidationResult(false, "图形 JSON 缺少 objects 字段。");
  }

  if (!Array.isArray(value.objects)) {
    return createVisualizationValidationResult(false, "图形 JSON 的 objects 必须是数组。");
  }

  const usedIds = new Set();
  const pointIds = new Set();
  const kinds = new Set();
  const isFiniteNumber = (number) => typeof number === "number" && Number.isFinite(number);

  for (const [index, object] of value.objects.entries()) {
    const position = index + 1;

    if (!object || typeof object !== "object" || Array.isArray(object)) {
      return createVisualizationValidationResult(false, `objects 第 ${position} 项必须是对象。`);
    }

    if (
      typeof object.kind !== "string" ||
      !object.kind.trim() ||
      typeof object.id !== "string" ||
      !object.id.trim()
    ) {
      return createVisualizationValidationResult(
        false,
        `objects 第 ${position} 项缺少有效的 kind 或 id。`,
      );
    }

    const kind = object.kind.trim();
    const id = object.id.trim();

    if (!Object.hasOwn(VISUALIZATION_KIND_LABELS, kind)) {
      return createVisualizationValidationResult(false, `对象“${id}”使用了暂不支持的 kind：${kind}。`);
    }

    if (usedIds.has(id)) {
      return createVisualizationValidationResult(false, `图形对象 id“${id}”重复，请保持 id 唯一。`);
    }

    usedIds.add(id);
    kinds.add(kind);

    if (kind === "point") {
      if (
        typeof object.label !== "string" ||
        !object.label.trim() ||
        !isFiniteNumber(object.x) ||
        !isFiniteNumber(object.y)
      ) {
        return createVisualizationValidationResult(
          false,
          `点“${id}”需要有效的 label、x 和 y。`,
        );
      }
      pointIds.add(id);
    } else if (kind === "segment") {
      if (
        typeof object.from !== "string" ||
        !object.from.trim() ||
        typeof object.to !== "string" ||
        !object.to.trim()
      ) {
        return createVisualizationValidationResult(false, `线段“${id}”需要有效的 from 和 to。`);
      }
    } else if (kind === "line") {
      if (
        !Array.isArray(object.through) ||
        object.through.length !== 2 ||
        object.through.some((pointId) => typeof pointId !== "string" || !pointId.trim())
      ) {
        return createVisualizationValidationResult(
          false,
          `直线“${id}”的 through 必须包含两个点 id。`,
        );
      }
    } else if (kind === "circle") {
      if (
        typeof object.center !== "string" ||
        !object.center.trim() ||
        !isFiniteNumber(object.radius) ||
        object.radius <= 0
      ) {
        return createVisualizationValidationResult(
          false,
          `圆“${id}”需要有效的 center 和大于 0 的 radius。`,
        );
      }
    } else if (kind === "function") {
      if (
        typeof object.expression !== "string" ||
        !object.expression.trim() ||
        !Array.isArray(object.range) ||
        object.range.length !== 2 ||
        object.range.some((boundary) => !isFiniteNumber(boundary)) ||
        object.range[0] > object.range[1]
      ) {
        return createVisualizationValidationResult(
          false,
          `函数“${id}”需要字符串 expression 和有效的两端点 range。`,
        );
      }
    } else if (kind === "slider") {
      if (
        !isFiniteNumber(object.min) ||
        !isFiniteNumber(object.max) ||
        !isFiniteNumber(object.step) ||
        !isFiniteNumber(object.value) ||
        object.min >= object.max ||
        object.step <= 0 ||
        object.value < object.min ||
        object.value > object.max
      ) {
        return createVisualizationValidationResult(
          false,
          `滑块“${id}”需要有效的 min、max、step 和 value。`,
        );
      }
    }
  }

  for (const object of value.objects) {
    const references =
      object.kind === "segment"
        ? [object.from, object.to]
        : object.kind === "line"
          ? object.through
          : object.kind === "circle"
            ? [object.center]
            : [];
    const missingReference = references.find((reference) => !pointIds.has(reference));

    if (missingReference) {
      return createVisualizationValidationResult(
        false,
        `对象“${object.id}”引用了不存在的点 id“${missingReference}”。`,
      );
    }
  }

  const kindLabels = Array.from(kinds, (kind) => VISUALIZATION_KIND_LABELS[kind]);
  const typeSummary = kindLabels.length > 0 ? kindLabels.join("、") : "暂无对象";

  return createVisualizationValidationResult(
    true,
    `图形 JSON 格式通过；对象数量：${value.objects.length}；包含类型：${typeSummary}。`,
    value,
    {
      objectCount: value.objects.length,
      kindLabels,
    },
  );
}

function parseVisualizationDataText(text) {
  const trimmedText = String(text || "").trim();

  if (!trimmedText) {
    return createVisualizationValidationResult(
      true,
      "图形数据为空，不影响保存。",
      null,
      { empty: true },
    );
  }

  try {
    return validateVisualizationDataValue(JSON.parse(trimmedText));
  } catch {
    return createVisualizationValidationResult(
      false,
      "图形 JSON 不是合法 JSON，请检查括号、逗号和引号。",
    );
  }
}

function renderVisualizationCheckResult(result) {
  elements.visualizationCheckResult.classList.toggle("is-neutral", result.empty);
  elements.visualizationCheckResult.classList.toggle("is-success", result.valid && !result.empty);
  elements.visualizationCheckResult.classList.toggle("is-error", !result.valid);
  elements.visualizationCheckResult.textContent = result.message;
}

function checkVisualizationData() {
  const result = parseVisualizationDataText(elements.buildVisualizationData.value);
  renderVisualizationCheckResult(result);
  return result;
}

function markVisualizationDataForReview() {
  elements.visualizationCheckResult.classList.add("is-neutral");
  elements.visualizationCheckResult.classList.remove("is-success", "is-error");
  elements.visualizationCheckResult.textContent = elements.buildVisualizationData.value.trim()
    ? "图形数据已修改，请点击“检查图形 JSON”。"
    : "图形数据为空，不影响保存。";
}

function insertVisualizationExample() {
  if (
    elements.buildVisualizationData.value.trim() &&
    !window.confirm("当前图形数据已有内容，确定用示例模板覆盖吗？")
  ) {
    return;
  }

  elements.buildVisualizationData.value = JSON.stringify(VISUALIZATION_EXAMPLE, null, 2);
  checkVisualizationData();
  showToast("已插入数学图形数据示例模板。");
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
  const visualizationResult =
    item.visualizationData === undefined || item.visualizationData === null
      ? createVisualizationValidationResult(true, "", null, { empty: true })
      : validateVisualizationDataValue(item.visualizationData);

  if (!visualizationResult.valid) {
    return null;
  }

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
    visualizationData: visualizationResult.data,
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

function readLastFullBackupAt() {
  try {
    const storedValue = window.localStorage.getItem(LAST_FULL_BACKUP_KEY);

    if (!storedValue || Number.isNaN(new Date(storedValue).getTime())) {
      return "";
    }

    return storedValue;
  } catch {
    return "";
  }
}

function renderFullBackupHealth(lastBackupAt) {
  const hasBackup = Boolean(lastBackupAt);
  const backupAge = hasBackup ? Date.now() - new Date(lastBackupAt).getTime() : Infinity;
  const isRecent = hasBackup && backupAge <= 7 * 24 * 60 * 60 * 1000;

  elements.fullBackupHealth.classList.toggle("is-good", isRecent);
  elements.fullBackupHealth.classList.toggle("is-warning", !isRecent);
  elements.fullBackupHealthIcon.textContent = isRecent ? "✓" : "!";

  if (!hasBackup) {
    elements.fullBackupHealthTitle.textContent = "建议立即导出完整备份";
    elements.fullBackupHealthDescription.textContent = "当前浏览器还没有完整备份记录。";
  } else if (!isRecent) {
    elements.fullBackupHealthTitle.textContent = "建议更新备份";
    elements.fullBackupHealthDescription.textContent = "距离上次完整备份已超过 7 天，请及时保存最新数据。";
  } else {
    elements.fullBackupHealthTitle.textContent = "备份状态良好";
    elements.fullBackupHealthDescription.textContent = "最近 7 天内已完成完整备份，请继续保持。";
  }
}

function renderFullBackupStats() {
  const originalItems = readLibraryItems("original") || [];
  const strategyItems = readLibraryItems("strategy") || [];
  const lastBackupAt = readLastFullBackupAt();

  elements.fullBackupOriginalCount.textContent = `${originalItems.length} 条`;
  elements.fullBackupStrategyCount.textContent = `${strategyItems.length} 条`;
  elements.fullBackupLastTime.textContent = lastBackupAt
    ? formatCreatedAt(lastBackupAt)
    : "尚未导出";
  renderFullBackupHealth(lastBackupAt);
}

function exportFullBackup() {
  const originalItems = readLibraryItems("original", true);
  const strategyItems = readLibraryItems("strategy", true);

  if (!originalItems || !strategyItems) {
    return;
  }

  const exportedAt = new Date().toISOString();
  const backup = {
    appName: "原题真解 Pro",
    backupVersion: FULL_BACKUP_VERSION,
    exportedAt,
    source: "localStorage",
    data: {
      originalItems,
      strategyItems,
    },
  };

  try {
    const json = JSON.stringify(backup, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    downloadBlob(blob, `原题真解Pro-完整备份-${formatDateForFilename()}.json`);

    let backupTimeSaved = true;
    try {
      window.localStorage.setItem(LAST_FULL_BACKUP_KEY, exportedAt);
    } catch {
      backupTimeSaved = false;
    }

    renderFullBackupStats();
    showToast(
      backupTimeSaved
        ? `完整备份已导出，包含 ${originalItems.length} 条原创题和 ${strategyItems.length} 条策略页。`
        : "完整备份已下载，但浏览器未能记录本次备份时间。",
    );
  } catch {
    showToast("完整备份导出失败，请检查浏览器下载和存储设置后重试。");
  }
}

function validateFullBackupPayload(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { valid: false, message: "导入失败：所选文件不是完整备份 JSON。" };
  }

  if (!value.data || typeof value.data !== "object" || Array.isArray(value.data)) {
    return { valid: false, message: "导入失败：备份文件缺少完整的数据区域。" };
  }

  if (!Array.isArray(value.data.originalItems) || !Array.isArray(value.data.strategyItems)) {
    return { valid: false, message: "导入失败：原创题或策略页数据不是数组。" };
  }

  if (value.backupVersion !== FULL_BACKUP_VERSION) {
    return { valid: false, message: "导入失败：当前仅支持版本 1 的完整备份。" };
  }

  if (
    typeof value.exportedAt !== "string" ||
    Number.isNaN(new Date(value.exportedAt).getTime())
  ) {
    return { valid: false, message: "导入失败：备份文件缺少有效的导出时间。" };
  }

  return {
    valid: true,
    backup: {
      backupVersion: value.backupVersion,
      exportedAt: value.exportedAt,
      originalItems: value.data.originalItems,
      strategyItems: value.data.strategyItems,
    },
  };
}

function showFullBackupPreview(backup) {
  state.pendingFullBackup = backup;
  elements.fullBackupPreviewTime.textContent = formatCreatedAt(backup.exportedAt);
  elements.fullBackupPreviewVersion.textContent = `版本 ${backup.backupVersion}`;
  elements.fullBackupPreviewOriginalCount.textContent = `${backup.originalItems.length} 条`;
  elements.fullBackupPreviewStrategyCount.textContent = `${backup.strategyItems.length} 条`;
  elements.fullBackupPreview.hidden = false;
}

function closeFullBackupPreview() {
  state.pendingFullBackup = null;
  elements.fullBackupPreview.hidden = true;
  elements.importFullBackupFile.value = "";
}

async function handleFullBackupFileSelection() {
  const [file] = elements.importFullBackupFile.files;

  if (!file) {
    return;
  }

  try {
    const importedValue = JSON.parse(await file.text());
    const validation = validateFullBackupPayload(importedValue);

    if (!validation.valid) {
      showToast(validation.message);
      closeFullBackupPreview();
      return;
    }

    showFullBackupPreview(validation.backup);
    showToast("完整备份已读取，请确认预览信息后选择恢复方式。");
  } catch {
    closeFullBackupPreview();
    showToast("导入失败：JSON 格式错误，请选择正确的完整备份文件。");
  } finally {
    elements.importFullBackupFile.value = "";
  }
}

function normalizeFullBackupItems(items, targetLibrary, currentItems) {
  const usedIds = new Set(currentItems.map((item) => item.id));
  const normalizedItems = items.map((item) =>
    normalizeImportedItem(item, targetLibrary, usedIds),
  );

  return normalizedItems.some((item) => item === null) ? null : normalizedItems;
}

function restoreStorageValue(storageKey, previousValue) {
  if (previousValue === null) {
    window.localStorage.removeItem(storageKey);
  } else {
    window.localStorage.setItem(storageKey, previousValue);
  }
}

function writeFullBackupItems(originalItems, strategyItems) {
  let previousOriginalValue;
  let previousStrategyValue;

  try {
    previousOriginalValue = window.localStorage.getItem(STORAGE_KEYS.original);
    previousStrategyValue = window.localStorage.getItem(STORAGE_KEYS.strategy);
  } catch {
    showToast("恢复失败：当前浏览器无法读取本地存储。");
    return false;
  }

  try {
    const originalJson = JSON.stringify(originalItems);
    const strategyJson = JSON.stringify(strategyItems);
    window.localStorage.setItem(STORAGE_KEYS.original, originalJson);
    window.localStorage.setItem(STORAGE_KEYS.strategy, strategyJson);
    return true;
  } catch {
    try {
      restoreStorageValue(STORAGE_KEYS.original, previousOriginalValue);
      restoreStorageValue(STORAGE_KEYS.strategy, previousStrategyValue);
    } catch {
      // 浏览器存储不可用时无法继续回滚，由下方 Toast 提示用户。
    }

    showToast("恢复失败：本地存储空间不足或已被禁用，原有数据已尽量保留。");
    return false;
  }
}

function refreshAllLibraryViews() {
  renderLibraryList("original");
  renderLibraryList("strategy");
  renderProfileRecentItems();
}

function applyFullBackup(mode) {
  const backup = state.pendingFullBackup;

  if (!backup) {
    showToast("请先选择并预览完整备份文件。");
    return;
  }

  if (
    mode === "overwrite" &&
    !window.confirm(
      "覆盖恢复会替换当前浏览器中的原创题库和策略库数据。建议先导出现有数据。确定继续吗？",
    )
  ) {
    return;
  }

  const currentOriginalItems =
    mode === "merge" ? readLibraryItems("original", true) : [];
  const currentStrategyItems =
    mode === "merge" ? readLibraryItems("strategy", true) : [];

  if (!currentOriginalItems || !currentStrategyItems) {
    return;
  }

  const importedOriginalItems = normalizeFullBackupItems(
    backup.originalItems,
    "original",
    currentOriginalItems,
  );
  const importedStrategyItems = normalizeFullBackupItems(
    backup.strategyItems,
    "strategy",
    currentStrategyItems,
  );

  if (!importedOriginalItems || !importedStrategyItems) {
    showToast("恢复失败：备份中存在标题、源码或图形数据不完整的记录，尚未写入本地数据。");
    return;
  }

  const nextOriginalItems =
    mode === "merge"
      ? [...currentOriginalItems, ...importedOriginalItems]
      : importedOriginalItems;
  const nextStrategyItems =
    mode === "merge"
      ? [...currentStrategyItems, ...importedStrategyItems]
      : importedStrategyItems;

  if (!writeFullBackupItems(nextOriginalItems, nextStrategyItems)) {
    return;
  }

  closeFullBackupPreview();
  refreshAllLibraryViews();
  showToast(
    mode === "merge"
      ? `追加合并完成：导入 ${importedOriginalItems.length} 条原创题和 ${importedStrategyItems.length} 条策略页。`
      : `覆盖恢复完成：恢复 ${importedOriginalItems.length} 条原创题和 ${importedStrategyItems.length} 条策略页。`,
  );
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

  const visualizationResult = checkVisualizationData();

  if (!visualizationResult.valid) {
    showToast("图形 JSON 检查未通过，请修正后再保存。");
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
    visualizationData: visualizationResult.data,
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


function truncateTextToLines(text, maxLines) {
  if (!text) return "";
  var lines = text.split(/\n/);
  if (lines.length <= maxLines) return text;
  return lines.slice(0, maxLines).join("\n") + "…";
}

function extractShortTitle(text, fallback) {
  if (!text || text.length < 3) return fallback || "数学题";
  var clean = text.replace(/^[\s\d.)、（）①②③④⑤……]+/, "").trim();
  if (clean.length > 18) clean = clean.substring(0, 18) + "…";
  return clean || fallback || "数学题";
}

function formatAnswerSnippet(answer) {
  if (!answer || answer.length < 2) return "";
  var clean = answer.replace(/[\n\r]+/g, " ").trim();
  if (clean.length > 30) clean = clean.substring(0, 30) + "…";
  return "答案：" + clean;
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

function createRecordMeta(item) {
  const meta = document.createElement("div");
  meta.className = "library-card-meta";
  meta.append(
    createTextElement("span", "library-meta-pill is-blue", item.subject || "科目未填写"),
    createTextElement("span", "library-meta-pill", formatRegion(item)),
    createTextElement("span", "library-meta-pill", item.questionType || "类型未填写"),
    createTextElement("span", "library-meta-pill", item.year || "年份未填写"),
  );

  if (
    item.visualizationData &&
    validateVisualizationDataValue(item.visualizationData).valid
  ) {
    meta.append(
      createTextElement(
        "span",
        "library-meta-pill has-visualization",
        "包含图形数据",
      ),
    );
  }

  return meta;
}

function createCloudActionButton(action, label, record, extraClass = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `library-action-button ${extraClass}`.trim();
  button.dataset.cloudAction = action;
  button.dataset.recordId = record.id;
  button.textContent = label;
  button.setAttribute("aria-label", `${label}：${record.title || "云端解析记录"}`);
  return button;
}

function createCloudRecordMeta(record) {
  const meta = document.createElement("div");
  meta.className = "library-card-meta";
  meta.append(
    createTextElement("span", "library-meta-pill is-blue", record.subject || "数学"),
    createTextElement("span", "library-meta-pill", record.gradeLevel || "年级未填写"),
    createTextElement("span", "library-meta-pill", record.questionType || "题型未填写"),
    createTextElement("span", "library-meta-pill", record.topic || "考点待识别"),
  );

  if (record.hasVisualization) {
    meta.append(createTextElement("span", "library-meta-pill has-visualization", "含图示"));
  }

  return meta;
}

function createCloudLibraryCard(record, targetLibrary) {
  const card = document.createElement("article");
  card.className = "library-card cloud-record-card";

  const main = document.createElement("div");
  main.className = "cloud-record-main";
  main.append(
    createTextElement("span", "cloud-record-kicker", targetLibrary === "strategy" ? "云端策略" : "云端原创"),
    /* 题目摘要 */
    (function() {
      const pEl = document.createElement("p");
      pEl.className = "library-card-problem-snippet";
      pEl.textContent = truncateTextToLines(record.problemText || "暂无原题文本。", 3);
      return pEl;
    })(),
    createTextElement("h2", "library-card-title", extractShortTitle(record.title || record.problemText, "未命名 AI 解析")),
    createCloudRecordMeta(record),
    // Problem text shown above via library-card-problem-snippet
    createTextElement("p", "cloud-record-answer", formatAnswerSnippet(record.finalAnswer) || "答案待查看详情"),
    createTextElement("time", "library-card-time", `创建于 ${formatCreatedAt(record.createdAt)}`),
  );

  const actions = document.createElement("div");
  actions.className = "library-card-actions cloud-record-actions";
  actions.append(
    createCloudActionButton("view", "查看", record, "is-primary"),
    createCloudActionButton("word", "导出 Word", record),
    createCloudActionButton("ggb", "导出 GGB", record),
  );

  card.append(main, actions);
  return card;
}

function createOriginalLibraryCard(item) {
  const card = document.createElement("article");
  card.className = "library-card original-record-card";

  const identity = document.createElement("div");
  identity.className = "original-record-identity";
  identity.append(createTextElement("span", "original-record-icon", "▤"));

  const main = document.createElement("div");
  main.className = "original-record-main";

  const top = document.createElement("div");
  top.className = "original-record-title-row";
  top.append(
    createTextElement(
      "h2",
      "library-card-title",
      extractShortTitle(item.title || item.problem_text, LIBRARY_CONFIG.original.defaultTitle),
    ),
    createTextElement("span", "original-record-status", "未发布"),
  );

  main.append(top, createRecordMeta(item));
  /* 题目摘要 */
  if (item.problem_text || item.sourceCode) {
    let snippetText = item.problem_text || "";
    if (!snippetText && item.sourceCode) {
      snippetText = item.sourceCode.replace(/<[^>]+>/g, "").trim().substring(0, 200);
    }
    const snipP = document.createElement("p");
    snipP.className = "library-card-problem-snippet";
    snipP.textContent = truncateTextToLines(snippetText, 3);
    main.append(snipP);
  }

  /* 答案摘要 */
  if (item.finalAnswer) {
    const ansPEl = document.createElement("p");
    ansPEl.className = "library-card-answer-snippet";
    ansPEl.textContent = formatAnswerSnippet(item.finalAnswer);
    main.append(ansPEl);
  }


  if (item.school) {
    main.append(createTextElement("p", "library-card-school", `学校：${item.school}`));
  }

  main.append(createTextElement("time", "library-card-time", `创建于 ${formatCreatedAt(item.createdAt)}`));
  identity.append(main);

  const actions = document.createElement("div");
  actions.className = "original-record-actions";
  actions.append(
    createLibraryActionButton("set-points", "★ 设置积分", item, "original", "is-points"),
    createLibraryActionButton("edit", "编辑", item, "original", "is-edit"),
    createLibraryActionButton("publish", "发布", item, "original", "is-primary"),
  );

  const moreActions = document.createElement("details");
  moreActions.className = "original-record-more";
  const summary = document.createElement("summary");
  summary.textContent = "更多操作";
  const moreMenu = document.createElement("div");
  moreMenu.className = "original-more-menu";
  moreMenu.append(
    createLibraryActionButton("view", "查看", item, "original"),
    createLibraryActionButton("delete", "删除", item, "original", "is-danger"),
  );
  moreActions.append(summary, moreMenu);
  actions.append(moreActions);

  card.append(identity, actions);
  return card;
}

function createStrategyLibraryCard(item) {
  const card = document.createElement("article");
  card.className = "library-card strategy-record-card";

  const main = document.createElement("div");
  main.className = "strategy-record-main";

  const titleRow = document.createElement("div");
  titleRow.className = "strategy-record-title-row";
  titleRow.append(
    createTextElement("span", "strategy-type-tag", item.questionType || "教学策略"),
    createTextElement("h2", "library-card-title", item.title || LIBRARY_CONFIG.strategy.defaultTitle),
  );

  main.append(
    titleRow,
    createTextElement("time", "strategy-record-time", `入库时间：${formatCreatedAt(item.createdAt)}`),
    createRecordMeta(item),
  );

  /* 题目摘要 */
  if (item.problem_text) {
    const snippetEl = document.createElement("p");
    snippetEl.className = "library-card-problem-snippet";
    snippetEl.textContent = truncateTextToLines(item.problem_text, 3);
    main.append(snippetEl);
  }

  /* 答案摘要 */
  if (item.finalAnswer) {
    var ansP = document.createElement("p");
    ansP.className = "library-card-answer-snippet";
    ansP.textContent = formatAnswerSnippet(item.finalAnswer);
    main.append(ansP);
  }

  if (item.school) {
    main.append(createTextElement("p", "library-card-school", `学校：${item.school}`));
  }

  const actions = document.createElement("div");
  actions.className = "library-card-actions strategy-record-actions";
  actions.append(
    createLibraryActionButton("view", "查看", item, "strategy", "is-primary"),
    createLibraryActionButton("edit", "编辑", item, "strategy", "is-edit"),
    createLibraryActionButton("share", "分享", item, "strategy", "is-share"),
    createLibraryActionButton("delete", "删除", item, "strategy", "is-danger"),
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

function getActiveFilterValue(buttons, datasetKey) {
  const activeButton = buttons.find((button) => button.classList.contains("is-active"));
  return activeButton?.dataset[datasetKey] || "";
}

function normalizeSearchValue(value) {
  return String(value || "").trim().toLocaleLowerCase("zh-CN");
}

function createLibrarySearchText(item) {
  return [
    item.title,
    item.subject,
    item.province,
    item.city,
    item.questionType,
    item.school,
    item.problemText,
    item.topic,
    item.gradeLevel,
    item.finalAnswer,
  ]
    .filter((value) => typeof value === "string")
    .join(" ")
    .toLocaleLowerCase("zh-CN");
}

function matchesYearFilter(itemYear, filterYear) {
  if (!filterYear) {
    return true;
  }

  if (filterYear === "earlier") {
    const numericYear = Number.parseInt(itemYear, 10);
    return Number.isFinite(numericYear) && numericYear < 2020;
  }

  return itemYear === filterYear;
}

function sortLibraryItems(items, sortMode) {
  const titleCollator = new Intl.Collator("zh-CN", {
    numeric: true,
    sensitivity: "base",
  });

  return [...items].sort((firstItem, secondItem) => {
    if (sortMode === "title-asc" || sortMode === "title-desc") {
      const titleComparison = titleCollator.compare(
        String(firstItem.title || ""),
        String(secondItem.title || ""),
      );
      return sortMode === "title-desc" ? -titleComparison : titleComparison;
    }

    const firstTime = new Date(firstItem.createdAt).getTime();
    const secondTime = new Date(secondItem.createdAt).getTime();
    const firstInvalid = Number.isNaN(firstTime);
    const secondInvalid = Number.isNaN(secondTime);

    if (firstInvalid || secondInvalid) {
      if (firstInvalid && secondInvalid) {
        return 0;
      }

      return firstInvalid ? 1 : -1;
    }

    return sortMode === "earliest" ? firstTime - secondTime : secondTime - firstTime;
  });
}

function getOriginalFilterState() {
  return {
    keyword: normalizeSearchValue(elements.originalKeyword.value),
    questionType: getActiveFilterValue(elements.originalTypeButtons, "originalType"),
    year: getActiveFilterValue(elements.originalYearButtons, "originalYear"),
    sortMode: elements.originalSort.value,
  };
}

function filterOriginalItems(items) {
  const filters = getOriginalFilterState();
  const filteredItems = items.filter((item) => {
    if (filters.keyword && !createLibrarySearchText(item).includes(filters.keyword)) {
      return false;
    }

    if (filters.questionType && item.questionType !== filters.questionType) {
      return false;
    }

    return matchesYearFilter(item.year, filters.year);
  });

  return sortLibraryItems(filteredItems, filters.sortMode);
}

function getStrategyFilterState() {

  return {
    subject: elements.strategySubject.value,
    province: elements.strategyProvince.value,
    city: elements.strategyCity.value,
    questionType: getActiveFilterValue(elements.strategyTypeButtons, "strategyType"),
    year: getActiveFilterValue(elements.strategyYearButtons, "strategyYear"),
    startDate: elements.strategyStartDate.value,
    endDate: elements.strategyEndDate.value,
    school: normalizeSearchValue(elements.strategySchool.value),
    keyword: normalizeSearchValue(elements.strategyKeyword.value),
    sortMode: elements.strategySort.value,
  };
}

function filterStrategyItems(items) {
  const filters = getStrategyFilterState();

  const filteredItems = items.filter((item) => {
    if (filters.subject && item.subject !== filters.subject) {
      return false;
    }

    if (filters.province && item.province !== filters.province) {
      return false;
    }

    if (filters.city && item.city !== filters.city) {
      return false;
    }

    if (filters.questionType && !String(item.questionType || "").includes(filters.questionType)) {
      return false;
    }

    if (!matchesYearFilter(item.year, filters.year)) {
      return false;
    }

    const createdTime = new Date(item.createdAt).getTime();

    if (filters.startDate) {
      const startTime = new Date(`${filters.startDate}T00:00:00`).getTime();

      if (Number.isNaN(createdTime) || createdTime < startTime) {
        return false;
      }
    }

    if (filters.endDate) {
      const endTime = new Date(`${filters.endDate}T23:59:59.999`).getTime();

      if (Number.isNaN(createdTime) || createdTime > endTime) {
        return false;
      }
    }

    if (filters.school && !normalizeSearchValue(item.school).includes(filters.school)) {
      return false;
    }

    if (filters.keyword && !createLibrarySearchText(item).includes(filters.keyword)) {
      return false;
    }

    return true;
  });

  return sortLibraryItems(filteredItems, filters.sortMode);
}

function updateLibraryEmptyActions(targetLibrary, isFiltered) {
  const buildButton =
    targetLibrary === "original"
      ? elements.originalEmptyBuildButton
      : elements.strategyEmptyBuildButton;
  const importButton =
    targetLibrary === "original"
      ? elements.originalEmptyImportButton
      : elements.strategyEmptyImportButton;
  const resetButton =
    targetLibrary === "original"
      ? elements.originalEmptyResetButton
      : elements.strategyEmptyResetButton;

  buildButton.hidden = isFiltered;
  importButton.hidden = isFiltered;
  resetButton.hidden = !isFiltered;
}

function filterCloudItems(targetLibrary, items) {
  return targetLibrary === "strategy" ? filterStrategyItems(items) : filterOriginalItems(items);
}

function createLibrarySectionTitle(title, description = "") {
  const section = document.createElement("div");
  section.className = "library-section-title";
  section.append(createTextElement("h3", "", title));

  if (description) {
    section.append(createTextElement("p", "", description));
  }

  return section;
}

function appendCloudLibrarySection(list, targetLibrary) {
  const cloudState = state.cloudLibraries[targetLibrary];

  if (!state.currentUser || !state.authToken) {
    list.append(
      createLibrarySectionTitle(
        "云端题库",
        targetLibrary === "strategy"
          ? "未登录时显示本地策略库；登录后可查看数据库中的云端策略记录。"
          : "未登录时显示本地原创题；登录后可查看数据库中的云端原创记录。",
      ),
    );
    return 0;
  }

  list.append(createLibrarySectionTitle("云端题库", "来自云端账号题库，仅显示当前登录用户自己的记录。"));

  if (cloudState.loading) {
    list.append(createTextElement("p", "library-cloud-message", "正在读取云端题库..."));
    return 0;
  }

  if (cloudState.error) {
    list.append(createTextElement("p", "library-cloud-message is-error", cloudState.error));
    return 0;
  }

  const cloudItems = filterCloudItems(targetLibrary, cloudState.items);

  if (!cloudItems.length) {
    list.append(
      createTextElement(
        "p",
        "library-cloud-message",
        targetLibrary === "strategy"
          ? "还没有云端策略。去工作台生成解析后点击“保存到策略库”。"
          : "还没有云端原创题。去工作台生成解析后点击“保存到原创题库”。",
      ),
    );
    return 0;
  }

  cloudItems.forEach((record) => {
    list.append(createCloudLibraryCard(record, targetLibrary));
  });

  return cloudItems.length;
}

function renderLibraryList(targetLibrary) {
  const storedItems = readLibraryItems(targetLibrary, true) || [];
  const items =
    targetLibrary === "strategy"
      ? filterStrategyItems(storedItems)
      : filterOriginalItems(storedItems);
  const { list, empty } = getLibraryElements(targetLibrary);

  list.replaceChildren();
  const cloudDisplayedCount = appendCloudLibrarySection(list, targetLibrary);
  list.append(
    createLibrarySectionTitle(
      "本地 / 离线数据",
      "这些记录仍保存在当前浏览器 localStorage，可继续导入、导出和备份。",
    ),
  );
  list.hidden = false;
  empty.hidden = true;

  if (targetLibrary === "original") {
    elements.originalLocalCount.textContent = `${storedItems.length} 道`;
    elements.originalResultCount.textContent = `共 ${items.length} 条`;
    const isFiltered = items.length === 0 && storedItems.length > 0;
    elements.originalEmptyTitle.textContent = isFiltered ? "没有找到匹配内容" : "还没有本地原创题";
    elements.originalEmptyDescription.textContent = isFiltered
      ? "当前筛选条件没有匹配记录，可以重置筛选后查看全部原创题。"
      : "前往源码建站创建第一道原创题，或导入已有 JSON 备份。";
    updateLibraryEmptyActions("original", isFiltered);
  } else {
    elements.strategyResultCount.textContent = `${items.length}套`;
    const isFiltered = items.length === 0 && storedItems.length > 0;
    elements.strategyEmptyTitle.textContent = isFiltered ? "没有符合条件的策略页" : "还没有本地策略页";
    elements.strategyEmptyDescription.textContent = isFiltered
      ? "当前筛选条件没有匹配记录，可以重置筛选后查看全部策略页。"
      : "前往源码建站创建第一份策略页，或导入已有 JSON 备份。";
    updateLibraryEmptyActions("strategy", isFiltered);
  }

  if (targetLibrary === "original") {
    elements.originalResultCount.textContent = `共 ${cloudDisplayedCount + items.length} 条`;
  } else {
    elements.strategyResultCount.textContent = `${cloudDisplayedCount + items.length}套`;
  }

  items.forEach((item) => {
    list.append(
      targetLibrary === "original"
        ? createOriginalLibraryCard(item)
        : createStrategyLibraryCard(item),
    );
  });
}

function getRecentLibraryItems(targetLibrary, limit = 3) {
  const items = readLibraryItems(targetLibrary, true) || [];

  return [...items]
    .sort((firstItem, secondItem) => {
      const firstTime = new Date(firstItem.createdAt).getTime();
      const secondTime = new Date(secondItem.createdAt).getTime();
      return (Number.isNaN(secondTime) ? 0 : secondTime) - (Number.isNaN(firstTime) ? 0 : firstTime);
    })
    .slice(0, limit);
}

function createProfileRecentItem(item, targetLibrary) {
  const card = document.createElement("article");
  card.className = "profile-recent-item";

  const content = document.createElement("div");
  content.className = "profile-recent-item-content";
  content.append(
    createTextElement(
      "h3",
      "profile-recent-item-title",
      item.title || LIBRARY_CONFIG[targetLibrary].defaultTitle,
    ),
    createTextElement("time", "profile-recent-item-time", formatCreatedAt(item.createdAt)),
  );

  const meta = document.createElement("div");
  meta.className = "profile-recent-item-meta";
  meta.append(
    createTextElement("span", "", item.subject || "科目未填写"),
    createTextElement("span", "", item.questionType || "类型未填写"),
  );
  content.append(meta);

  card.append(
    content,
    createLibraryActionButton("view", "查看", item, targetLibrary, "profile-recent-view"),
  );
  return card;
}

function renderProfileRecentList(targetLibrary, list, empty) {
  const items = getRecentLibraryItems(targetLibrary);

  list.replaceChildren();
  list.hidden = items.length === 0;
  empty.hidden = items.length > 0;

  items.forEach((item) => {
    list.append(createProfileRecentItem(item, targetLibrary));
  });
}

function renderProfileRecentItems() {
  renderProfileRecentList(
    "original",
    elements.profileOriginalList,
    elements.profileOriginalEmpty,
  );
  renderProfileRecentList(
    "strategy",
    elements.profileStrategyList,
    elements.profileStrategyEmpty,
  );
  renderFullBackupStats();
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
  elements.buildVisualizationData.value = item.visualizationData
    ? JSON.stringify(item.visualizationData, null, 2)
    : "";
  renderVisualizationCheckResult(
    parseVisualizationDataText(elements.buildVisualizationData.value),
  );
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
  const cloudButton = event.target.closest("[data-cloud-action]");

  if (cloudButton) {
    const recordId = Number.parseInt(cloudButton.dataset.recordId, 10);
    const action = cloudButton.dataset.cloudAction;

    if (!Number.isFinite(recordId) || recordId <= 0) {
      showToast("云端记录 ID 不正确，请刷新后重试。");
      return;
    }

    if (action === "view") {
      openCloudRecordDetail(recordId, cloudButton);
    } else if (action === "word") {
      downloadCloudRecordExport(recordId, "word");
    } else if (action === "ggb") {
      downloadCloudRecordExport(recordId, "ggb");
    }

    return;
  }

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
  } else if (button.dataset.libraryAction === "set-points") {
    showToast("积分设置为静态演示，本阶段不会产生真实积分交易。");
  } else if (button.dataset.libraryAction === "publish") {
    showToast("发布到原创题大厅为静态演示，本阶段不会上传数据。");
  } else if (button.dataset.libraryAction === "share") {
    showToast("分享功能将在接入真实分享系统后开放。");
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

function updateStrategyCities() {
  const selectedProvince = elements.strategyProvince.value;
  const previousCity = elements.strategyCity.value;
  const cities = PROVINCE_CITY_MAP[selectedProvince] || [];

  elements.strategyCity.replaceChildren();

  const allCitiesOption = document.createElement("option");
  allCitiesOption.value = "";
  allCitiesOption.textContent = "全部城市";
  elements.strategyCity.append(allCitiesOption);

  cities.forEach((city) => {
    const option = document.createElement("option");
    option.value = city;
    option.textContent = city;
    elements.strategyCity.append(option);
  });

  elements.strategyCity.disabled = !selectedProvince;

  if (cities.includes(previousCity)) {
    elements.strategyCity.value = previousCity;
  }
}

function initializeStrategyFilters() {
  elements.strategyProvince.replaceChildren();

  const allProvincesOption = document.createElement("option");
  allProvincesOption.value = "";
  allProvincesOption.textContent = "全部省份";
  elements.strategyProvince.append(allProvincesOption);

  Object.keys(PROVINCE_CITY_MAP).forEach((province) => {
    const option = document.createElement("option");
    option.value = province;
    option.textContent = province;
    elements.strategyProvince.append(option);
  });

  updateStrategyCities();
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// Helper: read balanced { ... } text, returns { content, endPos } or null
// --- Unified Math Text Rendering Pipeline ---

// Normalize display LaTeX: fix double-escaped commands, remove \\left/\\right
function normalizeDisplayLatex(text) {
  if (!text || typeof text !== "string") return "";
  var s = text;
  // Fix double-escaped LaTeX delimiters (common AI output error)
  // Replace \\\\( with \\( and \\\\) with \\)
  while (s.indexOf("\\\\\\(") !== -1) { s = s.split("\\\\\\(").join("\\("); }
  while (s.indexOf("\\\\\\)") !== -1) { s = s.split("\\\\\\)").join("\\)"); }
  while (s.indexOf("\\\\\\[") !== -1) { s = s.split("\\\\\\[").join("\\["); }
  while (s.indexOf("\\\\\\]") !== -1) { s = s.split("\\\\\\]").join("\\]"); }
  // Fix double-escaped LaTeX commands
  while (s.indexOf("\\\\frac") !== -1) { s = s.split("\\\\frac").join("\\frac"); }
  while (s.indexOf("\\\\sqrt") !== -1) { s = s.split("\\\\sqrt").join("\\sqrt"); }
  while (s.indexOf("\\\\cdot") !== -1) { s = s.split("\\\\cdot").join("\\cdot"); }
  while (s.indexOf("\\\\times") !== -1) { s = s.split("\\\\times").join("\\times"); }
  while (s.indexOf("\\\\triangle") !== -1) { s = s.split("\\\\triangle").join("\\triangle"); }
  while (s.indexOf("\\\\angle") !== -1) { s = s.split("\\\\angle").join("\\angle"); }
  // Remove or replace \\left / \\right
  s = s.split("\\left(").join("(");
  s = s.split("\\left[").join("[");
  s = s.split("\\left{").join("{");
  s = s.split("\\right)").join(")");
  s = s.split("\\right]").join("]");
  s = s.split("\\right}").join("}");
  while (s.indexOf("\\left") !== -1) { s = s.split("\\left").join(""); }
  while (s.indexOf("\\right") !== -1) { s = s.split("\\right").join(""); }
  return s;
}

// Remove unsupported LaTeX controls that cause MathJax errors
function removeUnsupportedLatexControls(text) {
  if (!text || typeof text !== "string") return "";
  var s = text;
  while (s.indexOf("\\left.") !== -1) { s = s.split("\\left.").join(""); }
  while (s.indexOf("\\right.") !== -1) { s = s.split("\\right.").join(""); }
  while (s.indexOf("\\left") !== -1) { s = s.split("\\left").join(""); }
  while (s.indexOf("\\right") !== -1) { s = s.split("\\right").join(""); }
  s = s.split("\\bigl").join("").split("\\bigr").join("");
  s = s.split("\\Bigl").join("").split("\\Bigr").join("");
  s = s.split("\\biggl").join("").split("\\biggr").join("");
  return s;
}

// Normalize LaTeX backslashes in already-delimited formulas
function normalizeLatexBackslashes(text) {
  if (!text || typeof text !== "string") return "";
  var s = text;
  while (s.indexOf("\\\\frac") !== -1) { s = s.split("\\\\frac").join("\\frac"); }
  while (s.indexOf("\\\\sqrt") !== -1) { s = s.split("\\\\sqrt").join("\\sqrt"); }
  while (s.indexOf("\\\\cdot") !== -1) { s = s.split("\\\\cdot").join("\\cdot"); }
  while (s.indexOf("\\\\times") !== -1) { s = s.split("\\\\times").join("\\times"); }
  return s;
}

// Strip broken LaTeX delimiters (unmatched open/close)
function stripBrokenLatexDelimiters(text) {
  if (!text || typeof text !== "string") return text;
  var s = text;
  // Count using split
  var leftInline = (s.split("\\(").length - 1);
  var rightInline = (s.split("\\)").length - 1);
  var leftDisplay = (s.split("\\[").length - 1);
  var rightDisplay = (s.split("\\]").length - 1);
  if (leftInline !== rightInline) {
    s = s.split("\\(").join("").split("\\)").join("");
  }
  if (leftDisplay !== rightDisplay) {
    s = s.split("\\[").join("").split("\\]").join("");
  }
  return s;
}

function normalizeCoordinateText(text) {
  if (!text || typeof text !== "string") return text;
  var s = text.replaceAll("−", "-");
  var value = "[+\\-]?(?:\\d+(?:\\.\\d+)?|[a-zA-Z]\\d*|\\d*[a-zA-Z])";
  var spacedPattern = new RegExp("(点\\s*)?\\b([PQVABCDOMN](?:\\d+)?)\\s+(" + value + ")\\s*,\\s*(" + value + ")", "g");
  var compactPattern = new RegExp("(点\\s*)?\\b([PQVABCDOMN](?:\\d+)?)([+\\-]?(?:\\d+(?:\\.\\d+)?|[a-zA-Z]\\d*|\\d*[a-zA-Z]))\\s*,\\s*(" + value + ")", "g");
  var replacer = function(match, prefix, label, x, y) {
    return (prefix || "") + label + "(" + x + ", " + y + ")";
  };

  return s.replace(spacedPattern, replacer).replace(compactPattern, replacer);
}

function normalizeSignedMathDelimiters(text) {
  if (!text || typeof text !== "string") return text;

  return text.replace(/(^|[\s=（(，,：:；;、])([+\-])\s*\\\(([\s\S]*?)\\\)/g, function(match, prefix, sign, body) {
    return prefix + "\\(" + sign + body + "\\)";
  });
}

function transformTextOutsideMathDelimiters(text, transform) {
  var source = String(text || "");
  var result = "";
  var i = 0;

  while (i < source.length) {
    var open = "";
    var close = "";

    if (source.slice(i, i + 2) === "\\(") {
      open = "\\(";
      close = "\\)";
    } else if (source.slice(i, i + 2) === "\\[") {
      open = "\\[";
      close = "\\]";
    } else if (source.slice(i, i + 2) === "$$") {
      open = "$$";
      close = "$$";
    }

    if (open) {
      var closeIndex = source.indexOf(close, i + open.length);
      if (closeIndex >= 0) {
        result += source.slice(i, closeIndex + close.length);
        i = closeIndex + close.length;
        continue;
      }
    }

    var nextIndexes = ["\\(", "\\[", "$$"]
      .map(function(mark) {
        var index = source.indexOf(mark, i + 1);
        return index >= 0 ? index : source.length;
      });
    var next = Math.min.apply(null, nextIndexes);
    result += transform(source.slice(i, next));
    i = next;
  }

  return result;
}

function normalizePlainMathSegmentToLatex(segment) {
  var protectedMath = [];
  var text = String(segment || "");
  var protect = function(body, display) {
    var key = "\uE000MATH" + protectedMath.length + "\uE001";
    protectedMath.push((display ? "\\[" : "\\(") + body.trim() + (display ? "\\]" : "\\)"));
    return key;
  };

  text = text.replace(/(^|[：:，,；;\s])([A-Za-z][A-Za-z0-9_{}]*\s*=\s*[A-Za-z0-9_{}\\+\-*/^().,\s]+?)(?=。|，|；|;|,|$)/g, function(match, prefix, expr) {
    if (!/[=^]|\\(?:frac|sqrt)|\d+\/\d+/.test(expr)) {
      return match;
    }

    return prefix + protect(expr, false);
  });

  text = text.replace(/(^|[：:，,；;\s])([A-Za-z]\s+[A-Za-z]\^2(?:\s*[+\-]\s*\d*[A-Za-z]?\s*[A-Za-z]?|\s*[+\-]\s*[A-Za-z]){1,4})/g, function(match, prefix, expr) {
    return prefix + protect(expr.replace(/\s+/g, " "), false);
  });

  text = text.replace(/(^|[^\w\\])(\d{1,4})\/(\d{1,4})(?![\w/])/g, function(match, prefix, numerator, denominator) {
    return prefix + protect("\\frac{" + numerator + "}{" + denominator + "}", false);
  });

  text = text.replace(/(^|[^\w\\])([A-Za-z])\^([23])(?![\w])/g, function(match, prefix, base, power) {
    return prefix + protect(base + "^" + power, false);
  });

  protectedMath.forEach(function(value, index) {
    text = text.split("\uE000MATH" + index + "\uE001").join(value);
  });

  return text;
}

function normalizePlainMathToLatex(text) {
  return transformTextOutsideMathDelimiters(text, normalizePlainMathSegmentToLatex);
}

function prepareMathTextForDisplay(rawText) {
  var cleaned = normalizeDisplayLatex(String(rawText ?? ""));
  cleaned = removeUnsupportedLatexControls(cleaned);
  cleaned = normalizeCoordinateText(cleaned);
  cleaned = normalizeSignedMathDelimiters(cleaned);
  cleaned = normalizePlainMathToLatex(cleaned);
  cleaned = stripBrokenLatexDelimiters(cleaned);
  cleaned = sanitizeLatexText(cleaned);
  return cleaned;
}

// --- End Unified Math Text Rendering Pipeline ---

function readBalancedBrace(text, openIndex) {
  if (openIndex >= text.length || text[openIndex] !== "{") return null;
  var depth = 0;
  var start = openIndex + 1;
  for (var i = openIndex; i < text.length; i++) {
    if (text[i] === "{" && (i === openIndex || text[i - 1] !== "\\")) { depth++; }
    else if (text[i] === "}" && (i === 0 || text[i - 1] !== "\\")) {
      depth--;
      if (depth === 0) return { content: text.slice(start, i), end: i };
    }
  }
  return null;
}

// Check if position is inside \(..\) or \[..\] or $$..$$
function isInsideMathDelimiter(text, index) {
  // Look backwards for unclosed \( or \[ or $$
  var i = index - 1;
  while (i >= 0) {
    if (i >= 1 && text.slice(i - 1, i + 1) === "\\(") return true;
    if (i >= 1 && text.slice(i - 1, i + 1) === "\\[") return true;
    if (i >= 1 && text.slice(i - 1, i + 1) === "$$") return true;
    if (i >= 1 && text.slice(i - 1, i + 1) === "\\)") return false;
    if (i >= 1 && text.slice(i - 1, i + 1) === "\\]") return false;
    if (i >= 1 && text.slice(i - 1, i + 1) === "$$" && i > 1 && text.slice(i - 2, i) !== "$$") return false;
    i--;
  }
  return false;
}

// Find the end of a LaTeX command fragment (\\frac{..}{..} or \\sqrt{..})
// Returns the position after the fragment, or -1 if not valid
function findLatexFragmentEnd(text, startIndex) {
  if (text.slice(startIndex, startIndex + 5) === "\\frac" && text[startIndex + 5] === "{") {
    var numBr = readBalancedBrace(text, startIndex + 5);
    if (!numBr) return -1;
    var denIdx = numBr.end + 1;
    if (denIdx >= text.length || text[denIdx] !== "{") return -1;
    var denBr = readBalancedBrace(text, denIdx);
    if (!denBr) return -1;
    return denBr.end + 1;
  }
  if (text.slice(startIndex, startIndex + 5) === "\\sqrt" && text[startIndex + 5] === "{") {
    var sqBr = readBalancedBrace(text, startIndex + 5);
    if (!sqBr) return -1;
    return sqBr.end + 1;
  }
  // Simple commands: \\triangle, \\angle, \\cdot, \\times, \\div, etc.
  var simpleMatch = text.slice(startIndex).match(/^\\[a-zA-Z]+/);
  if (simpleMatch) return startIndex + simpleMatch[0].length;
  return -1;
}

function isMathRunChar(char) {
  return /[A-Za-z0-9\\{}()[\]+\-*/^_=.,|√\s]/.test(char);
}

function shouldWrapMathRun(run) {
  return /\\(?:frac|sqrt)|√/.test(run)
    && /[A-Za-z0-9}\])]/.test(run)
    && !/^\\[([]/.test(run.trim());
}

function wrapMathRun(run) {
  var leading = run.match(/^\s*/)[0];
  var trailing = run.match(/\s*$/)[0];
  var body = run.slice(leading.length, run.length - trailing.length);

  if (!body) {
    return run;
  }

  return leading + "\\(" + body + "\\)" + trailing;
}

// Main function: wrap LaTeX fragments in \(...\) using balanced-brace scanning
function wrapLatexFragments(text) {
  if (!text || typeof text !== "string") return "";
  var result = "";
  var i = 0;
  while (i < text.length) {
    // Check for already-wrapped delimiters
    if (text.slice(i, i + 2) === "\\(" || text.slice(i, i + 2) === "\\[") {
      // Pass through existing delimiters
      var closeDelim = text.slice(i, i + 2) === "\\(" ? "\\)" : "\\]";
      var closePos = text.indexOf(closeDelim, i + 2);
      if (closePos >= 0) {
        result += text.slice(i, closePos + 2);
        i = closePos + 2;
        continue;
      }
    }
    if (text.slice(i, i + 2) === "$$") {
      var closePos2 = text.indexOf("$$", i + 2);
      if (closePos2 >= 0) {
        result += text.slice(i, closePos2 + 2);
        i = closePos2 + 2;
        continue;
      }
    }

    if (isMathRunChar(text[i])) {
      var runStart = i;
      var runEnd = i;
      while (runEnd < text.length && isMathRunChar(text[runEnd])) {
        runEnd++;
      }
      var run = text.slice(runStart, runEnd);
      if (shouldWrapMathRun(run)) {
        result += wrapMathRun(run);
        i = runEnd;
        continue;
      }
    }

    // Check for LaTeX command start
    if (text[i] === "\\" && !isInsideMathDelimiter(result, result.length)) {
      var fragEnd = findLatexFragmentEnd(text, i);
      if (fragEnd > i) {
        // Wrap the fragment
        result += "\\(" + text.slice(i, fragEnd) + "\\)";
        i = fragEnd;
        continue;
      }
      // Fall through: treat as regular text
    }

    result += text[i];
    i++;
  }
  return result;
}

// Queue MathJax typesetting for an element
var _mathJaxPending = null;
function queueMathTypeset(element) {
  if (!element) return;
  if (typeof MathJax !== "undefined" && MathJax.typesetPromise) {
    if (_mathJaxPending) clearTimeout(_mathJaxPending);
    _mathJaxPending = setTimeout(function() {
      MathJax.typesetPromise([element]).catch(function(err) {
        if (typeof localStorage !== "undefined" && localStorage.getItem("mathAiEduDebug") === "1") {
          console.warn("[MathJax] typesetPromise error:", err && err.message ? err.message : err);
        }
      });
    }, 50);
  }
}

function warnIfRawLatexRemains(element) {
  if (typeof localStorage === "undefined" || localStorage.getItem("mathAiEduDebug") !== "1") {
    return;
  }

  setTimeout(function() {
    var tc = element && element.textContent ? element.textContent : "";
    if (/\\(?:frac|sqrt|left|right|\(|\)|\[|\])/.test(tc)) {
      console.warn("[MathJaxDisplay] raw latex remains in:", tc.slice(0, 160));
    }
  }, 180);
}

// Unified math text rendering for any element
function renderMathText(element, rawText) {
  if (!element || rawText === undefined || rawText === null) return;
  var cleaned = prepareMathTextForDisplay(rawText);
  var html = safeMathHtml(cleaned);
  element.innerHTML = html;
  queueMathTypeset(element);
  warnIfRawLatexRemains(element);
}

function autoWrapLatex(text) {
  if (!text || typeof text !== "string") return "";
  // Preserve existing delimiters and wrap bare LaTeX fragments outside them.
  return wrapLatexFragments(text);
}

function safeMathHtml(rawText) {
  if (!rawText) return "";
  // 1) Escape HTML from AI output to prevent XSS
  var escaped = String(rawText)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
  // 2) Wrap LaTeX fragments in \(...\)
  return autoWrapLatex(escaped);
}



// Fix broken LaTeX braced commands like \\frac{..}{..} or \\sqrt{..}
// cmd = command name, braceCount = number of brace groups
// Uses balanced-brace scanning; removes only broken commands
function fixLatexBracedCommands(text, cmd, braceCount) {
  if (!text || typeof text !== "string") return text;
  var s = text;
  var pos = 0;
  var prefixLen = cmd.length;
  while ((pos = s.indexOf(cmd, pos)) !== -1) {
    var nextIdx = pos + prefixLen;
    if (nextIdx >= s.length || s[nextIdx] !== "{") { pos++; continue; }
    var valid = true;
    var readIdx = nextIdx;
    for (var g = 0; g < braceCount; g++) {
      if (readIdx >= s.length || s[readIdx] !== "{") { valid = false; break; }
      var br = readBalancedBrace(s, readIdx);
      if (!br) { valid = false; break; }
      readIdx = br.end + 1;
    }
    if (!valid) {
      s = s.slice(0, pos) + s.slice(nextIdx);
      continue;
    }
    pos = readIdx;
  }
  return s;
}

function sanitizeLatexText(text) {
  if (!text || typeof text !== "string") return text;
  var s = text;
  // Remove orphan \\left / \\right (paired ones already handled by normalizeDisplayLatex)
  while (s.indexOf("\\left") !== -1) { s = s.split("\\left").join(""); }
  while (s.indexOf("\\right") !== -1) { s = s.split("\\right").join(""); }
  // Fix each \\frac{...}{...} and \\sqrt{...} individually — only strip broken ones
  s = fixLatexBracedCommands(s, "\\frac", 2);
  s = fixLatexBracedCommands(s, "\\sqrt", 1);
  return s;
}

function setSafeMathContent(element, rawText, tagName) {
  if (!element) return;
  // Full pipeline: normalize -> remove unsupported -> sanitize -> wrap -> HTML escape
  var cleaned = prepareMathTextForDisplay(rawText);
  var html = safeMathHtml(cleaned);
  if (tagName) {
    element.innerHTML = "<" + tagName + ">" + html + "</" + tagName + ">";
  } else {
    element.innerHTML = html;
  }
  queueMathTypeset(element);
  warnIfRawLatexRemains(element);
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
  try {
  elements.pageButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.resetLibraryFilters) {
        resetLibraryFilters(button.dataset.resetLibraryFilters, false);
      }

      switchPage(button.dataset.pageTarget);
    });
  });

  elements.originalTabButtons.forEach((button) => {
    button.addEventListener("click", () => switchOriginalTab(button.dataset.originalTab));
  });

  elements.originalGradeButtons.forEach((button) => {
    button.addEventListener("click", () => selectPillButton(elements.originalGradeButtons, button));
  });

  elements.originalKeyword.addEventListener("input", () => renderLibraryList("original"));
  elements.originalTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPillButton(elements.originalTypeButtons, button);
      renderLibraryList("original");
    });
  });
  elements.originalYearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPillButton(elements.originalYearButtons, button);
      renderLibraryList("original");
    });
  });
  elements.originalSort.addEventListener("change", () => renderLibraryList("original"));
  elements.resetOriginalFiltersButton.addEventListener("click", () => resetOriginalFilters());
  elements.originalEmptyImportButton.addEventListener("click", () =>
    elements.importOriginalFile.click(),
  );
  elements.originalEmptyResetButton.addEventListener("click", () => resetOriginalFilters());

  elements.toastButtons.forEach((button) => {
    button.addEventListener("click", () => showToast(button.dataset.toastMessage));
  });

  elements.dismissWelcomeGuideButton.addEventListener("click", dismissWelcomeGuide);
  elements.reopenWelcomeGuideButton.addEventListener("click", reopenWelcomeGuide);
  elements.authLoginButton.addEventListener("click", () => submitAuth("login"));
  elements.authRegisterButton.addEventListener("click", () => submitAuth("register"));
  elements.profileLogoutButton.addEventListener("click", logoutCurrentUser);
  elements.authPassword.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitAuth("login");
    }
  });

  elements.helpFaqButtons.forEach((button) => {
    button.addEventListener("click", () => toggleHelpFaq(button));
  });

  elements.viewButtons.forEach((button) => {
    button.addEventListener("click", () => switchResultView(button.dataset.resultView));
  });

  elements.solveModeButtons.forEach((button) => {
    button.addEventListener("click", () => switchSolveMode(button.dataset.solveMode));
  });
  elements.modelButtons.forEach((button) => {
    button.addEventListener("click", () => selectModelProvider(button.dataset.modelProvider));
  });
  elements.generateButton.addEventListener("click", generateAiTextSolution);
  elements.solveImageButton.addEventListener("click", solveImageFromUpload);
  elements.reanalyzeRecognizedTextButton.addEventListener("click", reanalyzeRecognizedText);
  elements.saveResultOriginalButton.addEventListener("click", () =>
    saveCurrentRecordToLibrary("original"),
  );
  elements.saveResultStrategyButton.addEventListener("click", () =>
    saveCurrentRecordToLibrary("strategy"),
  );
  elements.exportResultWordButton.addEventListener("click", exportCurrentRecordWord);
  elements.exportResultGgbButton.addEventListener("click", exportCurrentRecordGgb);
  elements.fileInput.addEventListener("change", handleFileSelection);
  elements.clearFileButton.addEventListener("click", () => clearFileSelection());
  elements.imagePreview.addEventListener("error", () => {
    clearFileSelection(false);
    showToast("无法生成这张图片的缩略图，请尝试其他图片。");
  });
  elements.buildProvince.addEventListener("change", updateBuildCities);
  elements.insertVisualizationExampleButton.addEventListener(
    "click",
    insertVisualizationExample,
  );
  elements.checkVisualizationDataButton.addEventListener("click", checkVisualizationData);
  elements.buildVisualizationData.addEventListener("input", markVisualizationDataForReview);
  elements.strategySubject.addEventListener("change", () => renderLibraryList("strategy"));
  elements.strategyProvince.addEventListener("change", () => {
    updateStrategyCities();
    renderLibraryList("strategy");
  });
  elements.strategyCity.addEventListener("change", () => renderLibraryList("strategy"));
  elements.strategyTypeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPillButton(elements.strategyTypeButtons, button);
      renderLibraryList("strategy");
    });
  });
  elements.strategyYearButtons.forEach((button) => {
    button.addEventListener("click", () => {
      selectPillButton(elements.strategyYearButtons, button);
      renderLibraryList("strategy");
    });
  });
  elements.strategyStartDate.addEventListener("change", () => renderLibraryList("strategy"));
  elements.strategyEndDate.addEventListener("change", () => renderLibraryList("strategy"));
  elements.strategySchool.addEventListener("input", () => renderLibraryList("strategy"));
  elements.strategyKeyword.addEventListener("input", () => renderLibraryList("strategy"));
  elements.strategySort.addEventListener("change", () => renderLibraryList("strategy"));
  elements.resetStrategyFiltersButton.addEventListener("click", () => resetStrategyFilters());
  elements.strategyEmptyImportButton.addEventListener("click", () =>
    elements.importStrategyFile.click(),
  );
  elements.strategyEmptyResetButton.addEventListener("click", () => resetStrategyFilters());
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
  elements.exportFullBackupButton.addEventListener("click", exportFullBackup);
  elements.importFullBackupButton.addEventListener("click", () =>
    elements.importFullBackupFile.click(),
  );
  elements.importFullBackupFile.addEventListener("change", handleFullBackupFileSelection);
  elements.mergeFullBackupButton.addEventListener("click", () => applyFullBackup("merge"));
  elements.overwriteFullBackupButton.addEventListener("click", () =>
    applyFullBackup("overwrite"),
  );
  elements.cancelFullBackupImportButton.addEventListener("click", closeFullBackupPreview);
  elements.originalLibraryList.addEventListener("click", handleLibraryAction);
  elements.strategyLibraryList.addEventListener("click", handleLibraryAction);
  elements.profileRecentGrid.addEventListener("click", handleLibraryAction);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !elements.buildPreviewModal.hidden) {
      closeBuildPreview();
    }
  });
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEYS.original) {
      renderLibraryList("original");
      if (state.activePage === "profile") {
        renderProfileRecentItems();
      }
    } else if (event.key === STORAGE_KEYS.strategy) {
      renderLibraryList("strategy");
      if (state.activePage === "profile") {
        renderProfileRecentItems();
      }
    } else if (event.key === LAST_FULL_BACKUP_KEY && state.activePage === "profile") {
      renderFullBackupStats();
    } else if (event.key === WELCOME_GUIDE_KEY) {
      initializeWelcomeGuide();
    } else if (event.key === AUTH_TOKEN_KEY) {
      loadCurrentUser(true);
    }
  });
  window.addEventListener("beforeunload", revokeFilePreviewUrl);
  } catch (bindError) {
    debugLog("bindEvents error:", bindError);
  }
}

function initializeApp() {
  var initSteps = [
    cacheElements,
    renderAuthState,
    function() { loadCurrentUser(true); },
    initializeWelcomeGuide,
    initializeBuildSelectors,
    initializeStrategyFilters,
    bindEvents,
    function() { selectModelProvider(state.selectedModelProvider); },
    function() { showResultActions(null); },
    refreshModelStatuses,
    function() { switchSolveMode(state.activeSolveMode); },
    function() { switchOriginalTab(state.activeOriginalTab); },
    function() { renderLibraryList("strategy"); },
    function() { switchPage(state.activePage); },
    function() { switchResultView(state.activeView); },
  ];
  for (var i = 0; i < initSteps.length; i++) {
    try {
      initSteps[i]();
    } catch (stepError) {
      debugLog("init: step " + i + " failed:", stepError);
    }
  }
}

document.addEventListener("DOMContentLoaded", initializeApp);
