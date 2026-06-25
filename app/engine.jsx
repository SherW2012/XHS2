// ============================================================
// 易闻查词 · 检测引擎
// scan(text, track) -> { tokens, matches, score, grade, byLevel }
// v1：底层换成 YWCore（归一化压缩 + AC 自动机），抗对抗匹配
//     —— 解决「夹字 / 夹符号 / emoji 夹字 / 全角 / 大小写」漏检
// 对外契约（tokens / matches.start/end / score / grade …）保持不变
// ============================================================

const Core = (typeof window !== 'undefined' && window.YWCore) || require('./core.js');

// 等级扣分权重
const LEVEL_WEIGHT = { ban: 16, high: 9, warn: 4, qual: 5 };

// —— 内置词库 → AC 自动机（缓存，自定义词变更时 resetIndex 重建）——
// 每个 pattern 携带 meta：item / refId / isAlias / cat
let _AC = null;
function buildBuiltinAC() {
  return Core.buildAC(Core.buildPatterns(window.LEXICON || []));
}
function getAC() {
  if (!_AC) _AC = buildBuiltinAC();
  return _AC;
}
function resetIndex() { _AC = null; }

// —— 主扫描 ——
function scan(text, trackKey, customWords, enabledCats) {
  text = text || '';
  const n = text.length;
  const catOn = (cat) => !enabledCats || enabledCats.includes(cat);

  // 1) 内置词库命中（赛道/分类开关在收集阶段过滤）
  const builtinHits = Core.matchText(text, getAC(), (p) => catOn(p.cat));
  const rawMatches = builtinHits.map((h) => ({
    start: h.start, end: h.end, hit: text.slice(h.start, h.end),
    item: h.p.item, refId: h.p.refId, isAlias: h.p.isAlias, custom: false,
  }));

  // 2) 自定义词库（量小，按需建 AC，同样抗对抗）
  const cw = (customWords || []).filter((c) => c.word && Core.normForm(c.word).length >= 2);
  if (cw.length) {
    const cwPatterns = cw.map((c, ci) => ({ form: Core.normForm(c.word), cw: c, ci }));
    const cwAC = Core.buildAC(cwPatterns);
    const cwHits = Core.matchText(text, cwAC);
    cwHits.forEach((h) => {
      const c = h.p.cw;
      rawMatches.push({
        start: h.start, end: h.end, hit: text.slice(h.start, h.end), custom: true,
        item: {
          word: c.word, level: c.level || 'warn', cat: 'custom',
          platform: '自定义词库', law: '我的词库',
          clause: c.note || '由你或团队自定义的关注词。',
          why: c.note || '该词被你加入了自定义词库，命中后提醒你复核。',
          trackNote: '自定义规则，不参与平台机审，仅供自查。',
          example: '—', fix: c.fix ? [c.fix] : ['（自定义改写）'],
        },
        refId: 'custom-' + h.p.ci,
      });
    });
  }

  // 3) 内置 + 自定义混合后再去重（最长优先 / 左优先），避免区间重叠
  rawMatches.sort((a, b) => (a.start - b.start) || ((b.end - b.start) - (a.end - a.start)));
  const deduped = [];
  let lastEnd = -1;
  for (const m of rawMatches) {
    if (m.start >= lastEnd) { deduped.push(m); lastEnd = m.end; }
  }

  // 4) 构造 token 流
  const tokens = [];
  let cursor = 0;
  deduped.forEach((m, i) => {
    if (m.start > cursor) tokens.push({ type: 'text', text: text.slice(cursor, m.start) });
    tokens.push({ type: 'hit', text: text.slice(m.start, m.end), match: m, mIndex: i });
    cursor = m.end;
  });
  if (cursor < n) tokens.push({ type: 'text', text: text.slice(cursor) });

  // 5) 评分
  let penalty = 0;
  const byLevel = { ban: 0, high: 0, warn: 0, qual: 0 };
  deduped.forEach((m) => {
    const lv = m.item.level || 'warn';
    byLevel[lv] = (byLevel[lv] || 0) + 1;
    penalty += LEVEL_WEIGHT[lv] || 4;
  });
  const score = Math.max(0, 100 - penalty);

  let grade, gradeColor, verdict;
  if (byLevel.ban > 0 || score < 60) {
    grade = '高风险'; gradeColor = '#FB2C44';
    verdict = '存在禁用词，直接发布大概率被限流或处罚，强烈建议改写后再发。';
  } else if (score < 85) {
    grade = '待优化'; gradeColor = '#FB7A1E';
    verdict = '有若干高危/提醒项，建议逐条修改，降低限流风险。';
  } else if (penalty > 0) {
    grade = '基本合规'; gradeColor = '#E0A100';
    verdict = '仅有少量提醒项，确认无误后可发布。';
  } else {
    grade = '安全'; gradeColor = '#16B364';
    verdict = '未检出违禁词，可放心发布～';
  }

  return { tokens, matches: deduped, score, grade, gradeColor, verdict, byLevel, penalty, trackKey };
}

// 一键改写：把每个命中替换为其首个改写建议（从后往前替换，避免下标错位）
function rewrite(text, trackKey, customWords, enabledCats) {
  const result = scan(text, trackKey, customWords, enabledCats);
  let out = text;
  for (let i = result.matches.length - 1; i >= 0; i--) {
    const m = result.matches[i];
    const fixes = m.item.fix || [];
    const f = fixes[0];
    if (f) out = out.slice(0, m.start) + f + out.slice(m.end);
  }
  return out;
}

if (typeof window !== 'undefined') {
  Object.assign(window, { scan, rewrite, resetIndex, LEVEL_WEIGHT });
}
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scan, rewrite, resetIndex, LEVEL_WEIGHT };
}
