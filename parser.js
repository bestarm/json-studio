/* Parse strict JSON first, then recover common JSON-like and Java Map strings. */
(function (root) {
  'use strict';

  function parseInput(source) {
    try {
      return { value: JSON.parse(source), recovered: false, issues: [] };
    } catch (strictError) {
      try {
        const result = parseLoose(source);
        return { ...result, recovered: true, strictError: strictError.message };
      } catch (recoveryError) {
        return { value: null, recovered: false, issues: [], error: strictError, recoveryError };
      }
    }
  }

  function parseLoose(source) {
    let index = 0;
    const issues = [];
    const addIssue = (message) => { if (issues.length < 20) issues.push(message); };
    const peek = () => source[index];
    const skipSpace = () => { while (/\s/.test(peek() || '')) index++; };

    function quoted() {
      const quote = source[index++];
      let raw = '';
      let escaped = false;
      while (index < source.length) {
        const char = source[index++];
        if (escaped) { raw += '\\' + char; escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === quote) {
          if (quote === '"') {
            try { return JSON.parse('"' + raw + '"'); }
            catch { addIssue('Chuỗi có ký tự thoát chưa chuẩn.'); }
          }
          return raw.replace(/\\(['"\\nrt])/g, (_, part) => ({ n: '\n', r: '\r', t: '\t' })[part] ?? part);
        }
        raw += char;
      }
      addIssue('Chuỗi thiếu dấu nháy đóng.');
      return raw;
    }

    function value(depth) {
      if (depth > 100) throw new Error('Dữ liệu lồng quá sâu.');
      skipSpace();
      if (peek() === '{') return object(depth + 1);
      if (peek() === '[') return array(depth + 1);
      if (peek() === '"' || peek() === "'") return quoted();
      const start = index;
      while (index < source.length && !',;}]'.includes(peek())) index++;
      const word = source.slice(start, index).trim();
      if (!word) { addIssue('Giá trị trống được giữ thành chuỗi rỗng.'); return ''; }
      if (word === 'true') return true;
      if (word === 'false') return false;
      if (word === 'null') return null;
      if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(word)) {
        const number = Number(word);
        if (Number.isFinite(number)) return number;
      }
      return word;
    }

    function key() {
      skipSpace();
      if (peek() === '"' || peek() === "'") return quoted();
      const start = index;
      while (index < source.length && !'=:,;{}[]'.includes(peek())) index++;
      return source.slice(start, index).trim();
    }

    function object(depth) {
      index++;
      const result = Object.create(null);
      while (index < source.length) {
        skipSpace();
        if (peek() === '}') { index++; return result; }
        if (peek() === ',' || peek() === ';') { index++; continue; }
        const before = index;
        const name = key();
        if (!name) {
          addIssue('Đã bỏ qua một khóa trống.');
          if (index === before) index++;
          continue;
        }
        skipSpace();
        if (peek() === '=' || peek() === ':') index++;
        else addIssue(`Khóa "${name}" thiếu dấu = hoặc :.`);
        result[name] = value(depth);
        skipSpace();
        if (peek() === ',' || peek() === ';') index++;
        else if (peek() && peek() !== '}') addIssue(`Thiếu dấu phẩy sau khóa "${name}".`);
      }
      addIssue('Đối tượng thiếu dấu } đóng.');
      return result;
    }

    function array(depth) {
      index++;
      const result = [];
      while (index < source.length) {
        skipSpace();
        if (peek() === ']') { index++; return result; }
        if (peek() === ',' || peek() === ';') { index++; continue; }
        const before = index;
        result.push(value(depth));
        if (index === before) throw new Error('Không thể đọc phần tử mảng.');
        skipSpace();
        if (peek() === ',' || peek() === ';') index++;
        else if (peek() && peek() !== ']') addIssue('Thiếu dấu phẩy trong mảng.');
      }
      addIssue('Mảng thiếu dấu ] đóng.');
      return result;
    }

    skipSpace();
    if (peek() !== '{' && peek() !== '[') throw new Error('Chỉ hỗ trợ đối tượng hoặc mảng chưa chuẩn.');
    const result = value(0);
    skipSpace();
    if (index < source.length) addIssue('Đã bỏ qua dữ liệu thừa sau cấu trúc chính.');
    return { value: result, issues };
  }

  const api = { parseInput };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.JsonStudioParser = api;
})(typeof window !== 'undefined' ? window : null);
