(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const input = $('json-input');
  const state = { value: null, output: '', mode: 'format', view: 'code', valid: false, recovered: false };
  let parseTimer;
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
    $('input-meta').innerHTML = `${count.toLocaleString('vi-VN')} ký tự <span>·</span> ${lines.toLocaleString('vi-VN')} dòng`;
  }

  function showOnly(id) {
    for (const name of ['empty-state', 'code-view', 'tree-view', 'error-view']) $(name).hidden = name !== id;
  }

  function clearResult() {
    state.value = null;
    state.output = '';
    state.valid = false;
    state.recovered = false;
    $('output-meta').textContent = 'Sẵn sàng';
    $('output-subtitle').textContent = 'Mã đã định dạng';
    $('parse-notice').hidden = true;
    $('copy-btn').disabled = true;
    $('download-btn').disabled = true;
    showOnly('empty-state');
    setStatus('Sẵn sàng');
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
    if (explicit) return `Dòng ${explicit[1]}, cột ${explicit[2]}: ${message}`;
    if (!pos) return message;
    const before = source.slice(0, Number(pos[1]));
    const line = before.split('\n').length;
    const column = before.length - before.lastIndexOf('\n');
    return `Dòng ${line}, cột ${column}: ${message}`;
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
      toggle.setAttribute('aria-label', `Thu gọn hoặc mở ${key === null ? 'gốc' : key}`);
      toggle.textContent = '▼';
      row.append(toggle);
      if (key !== null) addText(row, `${JSON.stringify(key)}: `, 'tree-key');
      addText(row, Array.isArray(value) ? '[' : '{');
      addText(row, `  ${entries.length} ${Array.isArray(value) ? 'phần tử' : 'khóa'}`, 'tree-muted');
      children = document.createElement('div');
      children.className = 'tree-node';
      parent.append(children);
      if (depth < 80) {
        entries.forEach(([childKey, childValue]) => renderTreeNode(childValue, childKey, children, depth + 1));
      } else {
        const limit = document.createElement('div');
        limit.className = 'tree-muted';
        limit.textContent = 'Độ sâu vượt giới hạn hiển thị';
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
    $('tree-results').textContent = query ? `${matches} kết quả phù hợp` : 'Nhấp mũi tên để mở hoặc thu gọn nhánh';
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
      setStatus('Hãy nhập JSON trước khi xử lý', true);
      return;
    }
    const parsed = window.JsonStudioParser.parseInput(source);
    if (parsed.error) {
      state.valid = false;
      $('parse-notice').hidden = true;
      $('error-message').textContent = errorLocation(parsed.error.message, input.value);
      $('output-meta').textContent = 'Không đọc được';
      $('output-subtitle').textContent = 'Cần sửa dữ liệu';
      $('copy-btn').disabled = true;
      $('download-btn').disabled = true;
      showOnly('error-view');
      setStatus('Không đọc được dữ liệu', true);
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
      $('parse-notice').textContent = `Dữ liệu chưa phải JSON chuẩn. Đã đọc để xem dạng cây${emptyValues ? '; giá trị trống được giữ là chuỗi rỗng' : ''}${parsed.issues.length ? ` (${parsed.issues.length} chỗ cần lưu ý)` : ''}.`;
    }
    $('output-subtitle').textContent = parsed.recovered ? 'Đã đọc dữ liệu chưa chuẩn' : mode === 'minify' ? 'JSON đã thu gọn' : 'JSON hợp lệ';
    $('output-meta').textContent = `${state.output.length.toLocaleString('vi-VN')} ký tự · ${state.output.split('\n').length.toLocaleString('vi-VN')} dòng`;
    $('copy-btn').disabled = false;
    $('download-btn').disabled = false;
    renderCode();
    if (parsed.recovered && mode !== 'minify') setView('tree');
    else if (mode === 'minify') setView('code');
    else {
      if (state.view === 'tree') renderTree();
      showOnly(state.view === 'tree' ? 'tree-view' : 'code-view');
    }
    setStatus(parsed.recovered ? 'Đã đọc dữ liệu chưa chuẩn' : mode === 'minify' ? 'Đã thu gọn JSON' : 'JSON hợp lệ');
  }

  function scheduleParse(delay = 400) {
    clearTimeout(parseTimer);
    updateInputMeta();
    if (state.valid || !$('error-view').hidden) clearResult();
    if (!input.value.trim()) { clearResult(); return; }
    setStatus('Đang đọc JSON...');
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
    try { await navigator.clipboard.writeText(state.output); setStatus('Đã sao chép vào bộ nhớ tạm'); }
    catch { setStatus('Không thể sao chép tự động', true); }
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
    const label = which === 'input' ? 'Đầu vào' : 'Kết quả';
    btn.textContent = vertical ? (which === 'input' ? '⌄' : '⌃') : (which === 'input' ? '›' : '‹');
    btn.setAttribute('aria-label', `Mở rộng lại khung ${label}`);
    btn.title = `Mở rộng lại khung ${label}`;
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
