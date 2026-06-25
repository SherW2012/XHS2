// ============================================================
// 易闻查词 · 检测内核（纯逻辑，无 React / DOM 依赖）
// 解决致命问题：原 text.indexOf() 精确匹配会漏掉一切对抗写法
//   夹字「微 信」、夹符号「微-信」、emoji 夹字「微❤信」、
//   全角「ＶＸ」、零宽字符、大小写「VX/vx」等。
//
// 思路：
//   1) normalize — 逐字归一（全角→半角、大写→小写）
//   2) compact   — 只保留「有意义字符」(CJK / a-z / 0-9)，丢弃空格/标点/
//                  emoji/零宽，并记录每个保留字到原文下标的映射 idx[]
//   3) AC 自动机 — 在压缩串上做万级词库多模匹配，O(n) 复杂度
//   4) 命中下标经 idx[] 映射回原文，做最长优先去重
//
// 同时支持浏览器(window.YWCore)与 Node(module.exports)，便于评测。
// ============================================================
(function (root, factory) {
  const api = factory();
  if (typeof window !== 'undefined') window.YWCore = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(this, function () {
  'use strict';

  // —— 单字归一：全角ASCII→半角，统一小写 ——
  function normChar(ch) {
    let code = ch.charCodeAt(0);
    // 全角 ！(FF01) ~ ～(FF5E) → 半角
    if (code >= 0xff01 && code <= 0xff5e) ch = String.fromCharCode(code - 0xfee0);
    // 全角空格按噪声处理（compact 阶段丢弃）
    return ch.toLowerCase();
  }

  // —— 是否「有意义字符」：CJK 汉字 / 小写字母 / 数字 ——
  // 其余(空格/标点/emoji/零宽/连字符…)一律视为噪声丢弃，从而穿透夹字对抗
  function isMeaningful(ch) {
    const c = ch.charCodeAt(0);
    if (c >= 0x4e00 && c <= 0x9fff) return true; // CJK 基本区
    if (c >= 0x3400 && c <= 0x4dbf) return true; // CJK 扩展 A
    if (c >= 48 && c <= 57) return true;         // 0-9
    if (c >= 97 && c <= 122) return true;        // a-z（已小写）
    return false;
  }

  // —— 压缩：原文 → { s: 压缩串, idx: 压缩串第k字对应的原文下标 } ——
  function compact(text) {
    const chars = [];
    const idx = [];
    for (let i = 0; i < text.length; i++) {
      const nc = normChar(text[i]);
      if (isMeaningful(nc)) { chars.push(nc); idx.push(i); }
    }
    return { s: chars.join(''), idx };
  }

  // —— 词形归一（与 compact 同口径），用于把词库形态对齐到压缩串 ——
  function normForm(form) { return compact(form || '').s; }

  // ============================================================
  // Aho-Corasick 多模自动机
  // patterns: [{ form, ...meta }]，form 须已 normForm
  // ============================================================
  function buildAC(patterns) {
    const root = { next: Object.create(null), fail: null, out: [] };
    patterns.forEach((p) => {
      const f = p.form;
      if (!f || f.length < 1) return;
      let node = root;
      for (let i = 0; i < f.length; i++) {
        const ch = f[i];
        if (!node.next[ch]) node.next[ch] = { next: Object.create(null), fail: null, out: [] };
        node = node.next[ch];
      }
      node.out.push(p);
    });
    // BFS 构造 fail 指针
    const queue = [];
    for (const k in root.next) { root.next[k].fail = root; queue.push(root.next[k]); }
    while (queue.length) {
      const cur = queue.shift();
      for (const k in cur.next) {
        const child = cur.next[k];
        let f = cur.fail;
        while (f && !f.next[k]) f = f.fail;
        child.fail = (f && f.next[k]) ? f.next[k] : root;
        // 合并 fail 链上的输出，确保子串模式也被命中
        if (child.fail.out.length) child.out = child.out.concat(child.fail.out);
        queue.push(child);
      }
    }
    return root;
  }

  // —— 在压缩串上跑 AC，返回压缩坐标系下的原始命中 ——
  // accept(meta) 可选过滤（如赛道/分类开关）
  function runAC(ac, compactStr, accept) {
    const hits = [];
    let node = ac;
    for (let i = 0; i < compactStr.length; i++) {
      const ch = compactStr[i];
      while (node !== ac && !node.next[ch]) node = node.fail;
      node = node.next[ch] || ac;
      if (node.out.length) {
        for (let j = 0; j < node.out.length; j++) {
          const p = node.out[j];
          if (accept && !accept(p)) continue;
          const len = p.form.length;
          hits.push({ cs: i - len + 1, ce: i + 1, p });
        }
      }
    }
    return hits;
  }

  // —— 压缩坐标 → 原文坐标，并做最长优先 / 左优先去重 ——
  // 返回 [{ start, end, p }]，start/end 为原文下标
  function resolve(hits, idx) {
    // 映射回原文区间
    const mapped = hits.map((h) => ({
      start: idx[h.cs],
      end: idx[h.ce - 1] + 1,
      len: h.ce - h.cs,
      p: h.p,
    }));
    // 起点升序、长度降序：优先保留更长的命中
    mapped.sort((a, b) => (a.start - b.start) || (b.len - a.len));
    const chosen = [];
    let lastEnd = -1;
    for (const m of mapped) {
      if (m.start >= lastEnd) { chosen.push(m); lastEnd = m.end; }
    }
    return chosen;
  }

  // —— 一站式：在 text 中用 ac 找出非重叠命中（原文坐标）——
  function matchText(text, ac, accept) {
    const { s, idx } = compact(text);
    if (!s) return [];
    const hits = runAC(ac, s, accept);
    return resolve(hits, idx);
  }

  return {
    normChar, isMeaningful, compact, normForm,
    buildAC, runAC, resolve, matchText,
  };
});
