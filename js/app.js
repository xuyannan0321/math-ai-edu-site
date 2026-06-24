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

const state = {
  activePage: "workspace",
  activeView: "preview",
  toastTimer: null,
  generationTimer: null,
  filePreviewUrl: null,
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
  window.addEventListener("beforeunload", revokeFilePreviewUrl);
}

function initializeApp() {
  cacheElements();
  bindEvents();
  switchPage(state.activePage);
  switchResultView(state.activeView);
}

document.addEventListener("DOMContentLoaded", initializeApp);
