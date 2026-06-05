// ============================================================
// 易闻查词 · 检测引擎
// scan(text, track) -> { tokens, matches, score, grade, byLevel }
// 把文本切成 token 流（命中片段 + 普通片段），并计算合规评分
// ============================================================

// 等级扣分权重
const LEVEL_WEIGHT = { ban: 16, high: 9, warn: 4, qual: 5 };

// 赛道豁免：某些"需资质"词在特定赛道若用户已声明持证，可标记为可用
// 这里仅用赛道来决定提示语气，不直接放行（机审角度）

// 为每个词条建立「词 + 别名」到词条的索引，长词优先匹配
function buildIndex() {
  const entries = [];
  (window.LEXICON || []).forEach((item, idx) => {
    const forms = [item.word, ...(item.aliases || [])];
    forms.forEach((form) => {
      entries.push({ form, item, refId: idx, isAlias: form !== item.word });
    });
  });
  // 长词优先，避免短词抢占
  entries.sort((a, b) => b.form.length - a.form.length);
  return entries;
}

let _INDEX = null;
function getIndex() {
  if (!_INDEX) _INDEX = buildIndex();
  return _INDEX;
}
// 自定义词库变更后可重建
function resetIndex() { _INDEX = null; }

// 主扫描函数
function scan(text, trackKey, customWords, enabledCats) {
  const index = getIndex();
  const n = text.length;
  const covered = new Array(n).fill(false);
  const rawMatches = [];
  const catOn = (cat) => !enabledCats || enabledCats.includes(cat);

  // 内置词库匹配
  index.forEach((entry) => {
    const f = entry.form;
    if (!f) return;
    if (!catOn(entry.item.cat)) return;
    let from = 0;
    while (true) {
      const pos = text.indexOf(f, from);
      if (pos === -1) break;
      // 不与已覆盖区间重叠
      let overlap = false;
      for (let i = pos; i < pos + f.length; i++) if (covered[i]) { overlap = true; break; }
      if (!overlap) {
        for (let i = pos; i < pos + f.length; i++) covered[i] = true;
        rawMatches.push({
          start: pos, end: pos + f.length, hit: f,
          item: entry.item, refId: entry.refId, isAlias: entry.isAlias,
          custom: false,
        });
      }
      from = pos + f.length;
    }
  });

  // 自定义词库匹配（用户自建，统一作为 high/自定义来源）
  (customWords || []).forEach((cw, ci) => {
    if (!cw.word) return;
    let from = 0;
    while (true) {
      const pos = text.indexOf(cw.word, from);
      if (pos === -1) break;
      let overlap = false;
      for (let i = pos; i < pos + cw.word.length; i++) if (covered[i]) { overlap = true; break; }
      if (!overlap) {
        for (let i = pos; i < pos + cw.word.length; i++) covered[i] = true;
        rawMatches.push({
          start: pos, end: pos + cw.word.length, hit: cw.word,
          custom: true,
          item: {
            word: cw.word, level: cw.level || 'warn', cat: 'custom',
            platform: '自定义词库', law: '我的词库',
            clause: cw.note || '由你或团队自定义的关注词。',
            why: cw.note || '该词被你加入了自定义词库，命中后提醒你复核。',
            trackNote: '自定义规则，不参与平台机审，仅供自查。',
            example: '—', fix: cw.fix ? [cw.fix] : ['（自定义改写）'],
          },
          refId: 'custom-' + ci,
        });
      }
      from = pos + cw.word.length;
    }
  });

  rawMatches.sort((a, b) => a.start - b.start);

  // 构造 token 流
  const tokens = [];
  let cursor = 0;
  rawMatches.forEach((m, i) => {
    if (m.start > cursor) tokens.push({ type: 'text', text: text.slice(cursor, m.start) });
    tokens.push({ type: 'hit', text: text.slice(m.start, m.end), match: m, mIndex: i });
    cursor = m.end;
  });
  if (cursor < n) tokens.push({ type: 'text', text: text.slice(cursor) });

  // 评分
  let penalty = 0;
  const byLevel = { ban: 0, high: 0, warn: 0, qual: 0 };
  rawMatches.forEach((m) => {
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

  return { tokens, matches: rawMatches, score, grade, gradeColor, verdict, byLevel, penalty, trackKey };
}

// 一键改写：把每个命中替换为其首个改写建议
function rewrite(text, trackKey, customWords, enabledCats) {
  const result = scan(text, trackKey, customWords, enabledCats);
  let out = '';
  result.tokens.forEach((t) => {
    if (t.type === 'text') { out += t.text; return; }
    const fixes = t.match.item.fix || [];
    out += fixes[0] || t.text;
  });
  return out;
}

Object.assign(window, { scan, rewrite, resetIndex, LEVEL_WEIGHT });
