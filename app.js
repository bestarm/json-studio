(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const input = $('json-input');
  const state = { value: null, output: '', mode: 'format', view: 'code', valid: false, recovered: false };
  let parseTimer;

  // ===== Đa ngôn ngữ (i18n): tiếng Anh là mặc định =====
  const STRINGS = {
    en: {
      headerHint: 'JSON · key=value · tree view',
      privacy: 'Runs in your browser',
      workspace: 'Workspace',
      workspaceHint: 'Paste data on the left. The result appears instantly on the right.',
      indent: 'Indent',
      indent2: '2 spaces',
      indent4: '4 spaces',
      input: 'Input',
      inputHint: 'JSON or key=value data',
      sample: 'Sample',
      clear: 'Clear',
      inputPlaceholder: 'Paste your data here...',
      openFile: 'Open file',
      dividerTitle: 'Drag to resize · Double-click to split evenly',
      output: 'Output',
      code: 'Code',
      tree: 'Tree',
      ready: 'Ready',
      readyHint: 'Paste JSON or key=value data to see the result.',
      treeSearchLabel: 'Search in tree',
      treeSearchPlaceholder: 'Find a key or value...',
      errorTitle: 'Could not read data',
      download: 'Download',
      copy: 'Copy',
      minify: 'Minify',
      validate: 'Validate',
      chars: 'chars',
      lines: 'lines',
      formattedCode: 'Formatted code',
      enterJsonFirst: 'Enter some JSON first',
      unreadable: 'Unreadable',
      fixData: 'Fix the data',
      unreadableData: 'Could not read the data',
      recoveredSubtitle: 'Recovered non-standard data',
      minifiedSubtitle: 'Minified JSON',
      validSubtitle: 'Valid JSON',
      noticePrefix: 'Data is not standard JSON. It was recovered for viewing',
      noticeEmpty: '; empty values were kept as empty strings',
      noticeIssues: (n) => ` (${n} spot${n > 1 ? 's' : ''} to review)`,
      recoveredStatus: 'Recovered non-standard data',
      minifiedStatus: 'JSON minified',
      validStatus: 'Valid JSON',
      reading: 'Reading JSON...',
      copied: 'Copied to clipboard',
      copyFailed: 'Could not copy automatically',
      treeHint: 'Click the arrows to expand or collapse branches',
      treeResults: (n) => `${n} match${n > 1 ? 'es' : ''}`,
      depthLimit: 'Depth exceeds display limit',
      toggleBranch: 'Collapse or expand this branch',
      elements: 'items',
      keys: 'keys',
      lineCol: (line, col, msg) => `Line ${line}, column ${col}: ${msg}`,
      statusChars: (chars, lines) => `${chars} chars · ${lines} lines`,
      inputAria: 'Input data',
      outputViewAria: 'Output view',
      dividerAria: 'Resize panes',
      expandPane: (label) => `Expand the ${label} pane`,
      langAria: 'Switch language',
      themeAria: 'Toggle dark mode',
      htmlLang: 'en',
      locale: 'en-US',
    },
    vi: {
      headerHint: 'JSON · key=value · dạng cây',
      privacy: 'Chạy trên trình duyệt',
      workspace: 'Không gian làm việc',
      workspaceHint: 'Dán dữ liệu vào bên trái. Kết quả hiện ngay bên phải.',
      indent: 'Thụt lề',
      indent2: '2 dấu cách',
      indent4: '4 dấu cách',
      input: 'Đầu vào',
      inputHint: 'JSON hoặc dữ liệu key=value',
      sample: 'Mẫu',
      clear: 'Xóa',
      inputPlaceholder: 'Dán dữ liệu vào đây...',
      openFile: 'Mở tệp',
      dividerTitle: 'Kéo để thu gọn hoặc mở rộng · Nhấp đúp để chia đều',
      output: 'Kết quả',
      code: 'Mã',
      tree: 'Cây',
      ready: 'Sẵn sàng',
      readyHint: 'Dán JSON hoặc dữ liệu dạng key=value để xem kết quả.',
      treeSearchLabel: 'Tìm trong cây',
      treeSearchPlaceholder: 'Tìm khóa hoặc giá trị...',
      errorTitle: 'Chưa thể đọc dữ liệu',
      download: 'Tải xuống',
      copy: 'Sao chép',
      minify: 'Thu gọn',
      validate: 'Kiểm tra',
      chars: 'ký tự',
      lines: 'dòng',
      formattedCode: 'Mã đã định dạng',
      enterJsonFirst: 'Hãy nhập JSON trước khi xử lý',
      unreadable: 'Không đọc được',
      fixData: 'Cần sửa dữ liệu',
      unreadableData: 'Không đọc được dữ liệu',
      recoveredSubtitle: 'Đã đọc dữ liệu chưa chuẩn',
      minifiedSubtitle: 'JSON đã thu gọn',
      validSubtitle: 'JSON hợp lệ',
      noticePrefix: 'Dữ liệu chưa phải JSON chuẩn. Đã đọc để xem dạng cây',
      noticeEmpty: '; giá trị trống được giữ là chuỗi rỗng',
      noticeIssues: (n) => ` (${n} chỗ cần lưu ý)`,
      recoveredStatus: 'Đã đọc dữ liệu chưa chuẩn',
      minifiedStatus: 'Đã thu gọn JSON',
      validStatus: 'JSON hợp lệ',
      reading: 'Đang đọc JSON...',
      copied: 'Đã sao chép vào bộ nhớ tạm',
      copyFailed: 'Không thể sao chép tự động',
      treeHint: 'Nhấp mũi tên để mở hoặc thu gọn nhánh',
      treeResults: (n) => `${n} kết quả phù hợp`,
      depthLimit: 'Độ sâu vượt giới hạn hiển thị',
      toggleBranch: 'Thu gọn hoặc mở nhánh',
      elements: 'phần tử',
      keys: 'khóa',
      lineCol: (line, col, msg) => `Dòng ${line}, cột ${col}: ${msg}`,
      statusChars: (chars, lines) => `${chars} ký tự · ${lines} dòng`,
      inputAria: 'Dữ liệu đầu vào',
      outputViewAria: 'Kiểu hiển thị kết quả',
      dividerAria: 'Thanh kéo đổi kích thước hai khung',
      expandPane: (label) => `Mở rộng lại khung ${label}`,
      langAria: 'Đổi ngôn ngữ',
      themeAria: 'Đổi giao diện sáng tối',
      htmlLang: 'vi',
      locale: 'vi-VN',
    },
  };
  let lang = ['vi', 'en'].includes(localStorage.getItem('json-studio-lang')) ? localStorage.getItem('json-studio-lang') : 'en';
  const t = (key, ...args) => {
    const value = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
    return typeof value === 'function' ? value(...args) : value;
  };
  const fmtNum = (n) => n.toLocaleString(t('locale'));

  function applyLanguage() {
    document.documentElement.lang = t('htmlLang');
    document.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => { el.placeholder = t(el.dataset.i18nPlaceholder); });
    document.querySelectorAll('[data-i18n-title]').forEach((el) => { el.title = t(el.dataset.i18nTitle); });
    $('lang-toggle').textContent = lang === 'en' ? 'VI' : 'EN';
    $('lang-toggle').setAttribute('aria-label', t('langAria'));
    $('theme-toggle').setAttribute('aria-label', t('themeAria'));
    $('theme-toggle').title = t('themeAria');
    $('json-input').setAttribute('aria-label', t('inputAria'));
    $('pane-divider').setAttribute('aria-label', t('dividerAria'));
    document.querySelector('.view-switch').setAttribute('aria-label', t('outputViewAria'));
    $('indent-size').setAttribute('aria-label', t('indent'));
    updateInputMeta();
    $('output-meta').textContent = t('ready');
    $('output-subtitle').textContent = t('formattedCode');
    $('tree-results').textContent = $('tree-search').value.trim() ? $('tree-results').textContent : t('treeHint');
    setStatus(t('ready'));
    localStorage.setItem('json-studio-lang', lang);
  }

  $('lang-toggle').addEventListener('click', () => {
    lang = lang === 'en' ? 'vi' : 'en';
    applyLanguage();
    if (state.valid) process(state.mode);
  });
  const sample = {
    project: 'JSON Studio',
    version: '1.0.0',
    active: true,
    features: ['format', 'validate', 'tree view'],
    settings: { indent: 2, theme: 'light', privacy: true },
    users: [{ id: 1, name: 'An Nguyễn' }, { id: 2, name: 'Bình Trần' }],
    updatedAt: null
  };

  function setStatus(message, error = false) {
    $('status').lastChild.textContent = ` ${message}`;
    $('status').classList.toggle('error', error);
  }

  function updateInputMeta() {
    const count = input.value.length;
    const lines = input.value ? input.value.split('\n').length : 0;
    $('input-meta').textContent = t('statusChars', fmtNum(count), fmtNum(lines));
  }

  function showOnly(id) {
    for (const name of ['empty-state', 'code-view', 'tree-view', 'error-view']) $(name).hidden = name !== id;
  }

  function clearResult() {
    state.value = null;
    state.output = '';
    state.valid = false;
    state.recovered = false;
    $('output-meta').textContent = t('ready');
    $('output-subtitle').textContent = t('formattedCode');
    $('parse-notice').hidden = true;
    $('copy-btn').disabled = true;
    $('download-btn').disabled = true;
    for (const id of ['minify-btn', 'validate-btn']) {
      $(id).classList.remove('active');
      $(id).setAttribute('aria-pressed', 'false');
    }
    showOnly('empty-state');
    setStatus(t('ready'));
  }

  function escapeHTML(value) {
    return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }

  // Highlight only normalized JSON and escape every token before inserting markup.
  function highlight(json) {
    const token = /("(?:\\.|[^"\\])*"\s*:?)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
    let result = '';
    let last = 0;
    for (const match of json.matchAll(token)) {
      result += escapeHTML(json.slice(last, match.index));
      const value = match[0];
      const kind = match[1] ? (value.trimEnd().endsWith(':') ? 'key' : 'string') : match[2] ? 'number' : value === 'null' ? 'null' : 'boolean';
      result += `<span class="token-${kind}">${escapeHTML(value)}</span>`;
      last = match.index + value.length;
    }
    return result + escapeHTML(json.slice(last));
  }

  function lineNumbers(text) {
    return Array.from({ length: text.split('\n').length }, (_, i) => i + 1).join('\n');
  }

  function errorLocation(message, source) {
    const pos = message.match(/position\s+(\d+)/i);
    const explicit = message.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (explicit) return t('lineCol', explicit[1], explicit[2], message);
    if (!pos) return message;
    const before = source.slice(0, Number(pos[1]));
    const line = before.split('\n').length;
    const column = before.length - before.lastIndexOf('\n');
    return t('lineCol', line, column, message);
  }

  function renderCode() {
    $('code-output').innerHTML = highlight(state.output);
    $('output-lines').textContent = lineNumbers(state.output);
  }

  function addText(parent, content, className) {
    const span = document.createElement('span');
    span.textContent = content;
    if (className) span.className = className;
    parent.append(span);
    return span;
  }

  function renderTreeNode(value, key, parent, depth = 0) {
    const row = document.createElement('div');
    row.className = 'tree-row';
    parent.append(row);
    const isContainer = value !== null && typeof value === 'object';
    let children;
    if (isContainer) {
      const entries = Object.entries(value);
      const toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.className = 'tree-toggle';
      toggle.setAttribute('aria-label', t('toggleBranch'));
      toggle.textContent = '▼';
      row.append(toggle);
      if (key !== null) addText(row, `${JSON.stringify(key)}: `, 'tree-key');
      addText(row, Array.isArray(value) ? '[' : '{');
      addText(row, `  ${entries.length} ${Array.isArray(value) ? t('elements') : t('keys')}`, 'tree-muted');
      children = document.createElement('div');
      children.className = 'tree-node';
      parent.append(children);
      if (depth < 80) {
        entries.forEach(([childKey, childValue]) => renderTreeNode(childValue, childKey, children, depth + 1));
      } else {
        const limit = document.createElement('div');
        limit.className = 'tree-muted';
        limit.textContent = t('depthLimit');
        children.append(limit);
      }
      const end = document.createElement('div');
      end.className = 'tree-row';
      end.textContent = Array.isArray(value) ? ']' : '}';
      parent.append(end);
      toggle.addEventListener('click', () => {
        children.classList.toggle('collapsed');
        end.hidden = children.classList.contains('collapsed');
        toggle.textContent = children.classList.contains('collapsed') ? '▶' : '▼';
      });
    } else {
      addText(row, '  ', 'tree-muted');
      if (key !== null) addText(row, `${JSON.stringify(key)}: `, 'tree-key');
      const kind = value === null ? 'null' : typeof value;
      addText(row, JSON.stringify(value), `tree-${kind}`);
    }
  }

  function renderTree() {
    $('tree-root').replaceChildren();
    renderTreeNode(state.value, null, $('tree-root'));
    filterTree();
  }

  function filterTree() {
    const query = $('tree-search').value.trim().toLocaleLowerCase();
    const rows = [...$('tree-root').querySelectorAll('.tree-row')];
    let matches = 0;
    rows.forEach((row) => {
      const matched = !query || row.textContent.toLocaleLowerCase().includes(query);
      row.classList.toggle('search-dim', Boolean(query) && !matched);
      row.classList.toggle('tree-match', Boolean(query) && matched);
      if (query && matched) {
        matches++;
        let branch = row.parentElement;
        while (branch && branch.id !== 'tree-root') {
          if (branch.classList.contains('collapsed')) branch.previousElementSibling?.querySelector('.tree-toggle')?.click();
          branch = branch.parentElement;
        }
      }
    });
    $('tree-results').textContent = query ? t('treeResults', matches) : t('treeHint');
  }

  function setView(view) {
    state.view = view;
    $('code-tab').classList.toggle('active', view === 'code');
    $('tree-tab').classList.toggle('active', view === 'tree');
    $('code-tab').setAttribute('aria-pressed', String(view === 'code'));
    $('tree-tab').setAttribute('aria-pressed', String(view === 'tree'));
    if (state.valid) {
      if (view === 'tree') renderTree();
      showOnly(view === 'code' ? 'code-view' : 'tree-view');
    }
  }

  function process(mode) {
    clearTimeout(parseTimer);
    const source = input.value.trim();
    if (!source) {
      clearResult();
      input.focus();
      setStatus(t('enterJsonFirst'), true);
      return;
    }
    const parsed = window.JsonStudioParser.parseInput(source);
    if (parsed.error) {
      state.valid = false;
      for (const id of ['minify-btn', 'validate-btn']) {
        $(id).classList.remove('active');
        $(id).setAttribute('aria-pressed', 'false');
      }
      $('parse-notice').hidden = true;
      $('error-message').textContent = errorLocation(parsed.error.message, input.value);
      $('output-meta').textContent = t('unreadable');
      $('output-subtitle').textContent = t('fixData');
      $('copy-btn').disabled = true;
      $('download-btn').disabled = true;
      showOnly('error-view');
      setStatus(t('unreadableData'), true);
      return;
    }
    state.value = parsed.value;
    state.valid = true;
    state.recovered = parsed.recovered;
    state.mode = mode;
    const indent = $('indent-size').value === 'tab' ? '\t' : Number($('indent-size').value);
    state.output = JSON.stringify(parsed.value, null, mode === 'minify' ? 0 : indent);
    $('parse-notice').hidden = !parsed.recovered;
    if (parsed.recovered) {
      const emptyValues = parsed.issues.some((issue) => issue.includes('Giá trị trống'));
      $('parse-notice').textContent = `${t('noticePrefix')}${emptyValues ? t('noticeEmpty') : ''}${parsed.issues.length ? t('noticeIssues', parsed.issues.length) : ''}.`;
    }
    $('output-subtitle').textContent = parsed.recovered ? t('recoveredSubtitle') : mode === 'minify' ? t('minifiedSubtitle') : t('validSubtitle');
    // Đánh dấu nút đang được chọn giống tab Mã/Cây
    $('minify-btn').classList.toggle('active', mode === 'minify');
    $('minify-btn').setAttribute('aria-pressed', String(mode === 'minify'));
    $('validate-btn').classList.toggle('active', mode === 'validate');
    $('validate-btn').setAttribute('aria-pressed', String(mode === 'validate'));
    $('output-meta').textContent = t('statusChars', fmtNum(state.output.length), fmtNum(state.output.split('\n').length));
    $('copy-btn').disabled = false;
    $('download-btn').disabled = false;
    renderCode();
    if (parsed.recovered && mode !== 'minify') setView('tree');
    else if (mode === 'minify') setView('code');
    else {
      if (state.view === 'tree') renderTree();
      showOnly(state.view === 'tree' ? 'tree-view' : 'code-view');
    }
    setStatus(parsed.recovered ? t('recoveredStatus') : mode === 'minify' ? t('minifiedStatus') : t('validStatus'));
  }

  function scheduleParse(delay = 400) {
    clearTimeout(parseTimer);
    updateInputMeta();
    if (state.valid || !$('error-view').hidden) clearResult();
    if (!input.value.trim()) { clearResult(); return; }
    setStatus(t('reading'));
    parseTimer = setTimeout(() => process('format'), delay);
  }

  $('minify-btn').addEventListener('click', () => process('minify'));
  $('validate-btn').addEventListener('click', () => process('validate'));
  $('sample-btn').addEventListener('click', () => { input.value = JSON.stringify(sample); updateInputMeta(); process('format'); });
  $('clear-btn').addEventListener('click', () => { input.value = ''; updateInputMeta(); clearResult(); input.focus(); });
  $('code-tab').addEventListener('click', () => setView('code'));
  $('tree-tab').addEventListener('click', () => setView('tree'));
  $('tree-search').addEventListener('input', filterTree);
  $('indent-size').addEventListener('change', () => { if (state.valid && state.mode !== 'minify') process(state.mode); });
  input.addEventListener('input', (event) => scheduleParse(event.inputType === 'insertFromPaste' ? 0 : 400));
  input.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); process('format'); }
    if (event.key === 'Tab') { event.preventDefault(); const start = input.selectionStart; input.setRangeText('\t', start, input.selectionEnd, 'end'); scheduleParse(); }
  });
  $('file-input').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    input.value = await file.text();
    updateInputMeta();
    process('format');
    event.target.value = '';
  });
  $('copy-btn').addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(state.output); setStatus(t('copied')); }
    catch { setStatus(t('copyFailed'), true); }
  });
  $('download-btn').addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([state.output], { type: 'application/json;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = state.mode === 'minify' ? 'json-minified.json' : 'json-formatted.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  $('theme-toggle').addEventListener('click', () => {
    const dark = document.body.classList.toggle('dark');
    localStorage.setItem('json-studio-theme', dark ? 'dark' : 'light');
  });
  if (localStorage.getItem('json-studio-theme') === 'dark') document.body.classList.add('dark');
  applyLanguage();

  // ===== Thanh kéo thu gọn/mở rộng hai khung =====
  const panes = $('panes');
  const divider = $('pane-divider');
  const inputPane = document.querySelector('.input-pane');
  const outputPane = document.querySelector('.output-pane');
  const MIN_PANE = 120; // px tối thiểu trước khi thu gọn hẳn
  const SNAP = 40; // kéo dưới ngưỡng này thì thu gọn
  let ratio = 0.5; // tỉ lệ kích thước input / tổng
  let drag = null;

  const isVertical = () => getComputedStyle(panes).flexDirection === 'column';
  const extent = (el) => (isVertical() ? el.clientHeight : el.clientWidth);

  function applyRatio() {
    if (inputPane.classList.contains('collapsed') || outputPane.classList.contains('collapsed')) return;
    const primary = Math.min(Math.max(ratio, 0), 1);
    inputPane.style.flex = `0 0 ${primary * 100}%`;
    outputPane.style.flex = `0 0 ${(1 - primary) * 100}%`;
    inputPane.classList.add('dragging');
    outputPane.classList.add('dragging');
  }

  function setCollapsed(pane, collapsed) {
    pane.classList.toggle('collapsed', collapsed);
    panes.classList.toggle('has-collapsed', collapsed);
    if (collapsed) {
      inputPane.style.flex = '';
      outputPane.style.flex = '';
      inputPane.classList.remove('dragging');
      outputPane.classList.remove('dragging');
    }
    updateRestoreButtons();
  }

  function updateRestoreButtons() {
    panes.querySelectorAll('.pane-restore').forEach((b) => b.remove());
    if (inputPane.classList.contains('collapsed')) panes.append(makeRestoreButton('input'));
    else if (outputPane.classList.contains('collapsed')) panes.append(makeRestoreButton('output'));
  }

  function makeRestoreButton(which) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `pane-restore restore-${which}`;
    const vertical = isVertical();
    const label = which === 'input' ? t('input').toLowerCase() : t('output').toLowerCase();
    btn.textContent = vertical ? (which === 'input' ? '⌄' : '⌃') : (which === 'input' ? '›' : '‹');
    btn.setAttribute('aria-label', t('expandPane', label));
    btn.title = t('expandPane', label);
    btn.addEventListener('click', () => {
      setCollapsed(which === 'input' ? inputPane : outputPane, false);
      ratio = 0.5;
      applyRatio();
    });
    return btn;
  }

  function endDrag() {
    if (!drag) return;
    drag = null;
    divider.classList.remove('dragging');
    document.body.classList.remove('pane-resizing');
    if (inputPane.classList.contains('collapsed') || outputPane.classList.contains('collapsed')) return;
    const total = extent(inputPane) + extent(outputPane);
    if (total > 0) ratio = extent(inputPane) / total;
  }

  divider.addEventListener('pointerdown', (event) => {
    event.preventDefault();
    divider.setPointerCapture(event.pointerId);
    drag = { pointerId: event.pointerId };
    divider.classList.add('dragging');
    document.body.classList.add('pane-resizing');
  });

  divider.addEventListener('pointermove', (event) => {
    if (!drag) return;
    const rect = panes.getBoundingClientRect();
    const total = isVertical() ? rect.height : rect.width;
    if (total <= 0) return;
    let pos = isVertical() ? event.clientY - rect.top : event.clientX - rect.left;
    // Kéo sát mép -> thu gọn hẳn khung tương ứng
    if (pos < MIN_PANE - SNAP) { endDrag(); setCollapsed(inputPane, true); return; }
    if (pos > total - MIN_PANE + SNAP) { endDrag(); setCollapsed(outputPane, true); return; }
    pos = Math.min(Math.max(pos, MIN_PANE), total - MIN_PANE);
    ratio = pos / total;
    applyRatio();
  });

  divider.addEventListener('pointerup', endDrag);
  divider.addEventListener('pointercancel', endDrag);

  // Nhấp đúp: chia đều lại / mở lại nếu đang thu gọn
  divider.addEventListener('dblclick', () => {
    setCollapsed(inputPane, false);
    setCollapsed(outputPane, false);
    ratio = 0.5;
    applyRatio();
  });

  // Hỗ trợ bàn phím: mũi tên để kéo, Home/End để thu gọn
  divider.addEventListener('keydown', (event) => {
    const step = 0.05;
    const forward = isVertical() ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];
    if (event.key === forward[0]) { ratio = Math.min(1, ratio + step); applyRatio(); event.preventDefault(); }
    else if (event.key === forward[1]) { ratio = Math.max(0, ratio - step); applyRatio(); event.preventDefault(); }
    else if (event.key === 'Home') { setCollapsed(inputPane, true); event.preventDefault(); }
    else if (event.key === 'End') { setCollapsed(outputPane, true); event.preventDefault(); }
  });

  window.addEventListener('resize', () => {
    if (!drag) applyRatio();
    if (panes.classList.contains('has-collapsed')) updateRestoreButtons();
  });
  applyRatio();

  updateInputMeta();
})();
