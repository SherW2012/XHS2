// ============================================================
// 易闻查词 · 检测内核对抗样本评测
// 运行：node tests/engine.eval.cjs
// 目的：证明 YWCore 能穿透小红书常见的「绕审」写法
//   —— 旧版 text.indexOf() 对这些样本几乎全漏
// ============================================================
const Core = require('../app/core.js');

// 取若干真实违禁词作为模式（与 app/data.jsx 同口径）
const WORDS = [
  '最好', '国家级', '全网最低价', '没有之一',
  '美白', '祛斑', '防晒',
  '治疗', '消炎', '堪比医美',
  '微信', '私信我',
  '三天见效', '绝对安全', '纯天然',
  '销量第一', '万人回购',
];
const ac = Core.buildAC(WORDS.map((w) => ({ form: Core.normForm(w), w })));
function hits(text) {
  return Core.matchText(text, ac).map((h) => h.p.w);
}

// 评测样本：[原文, 期望命中的词]
const CASES = [
  // —— 正常命中 ——
  ['这是我用过最好的精华', ['最好']],
  ['国家级实验室配方', ['国家级']],
  // —— 夹空格 ——
  ['用过 最 好 的精华', ['最好']],
  ['加我 微 信 聊', ['微信']],
  // —— 夹符号 / 连字符 ——
  ['微-信：abc123', ['微信']],
  ['全·网·最·低·价', ['全网最低价']],
  // —— emoji / 特殊字符夹字 ——
  ['加我微❤信哦', ['微信']],
  ['三天✨见效真的', ['三天见效']],
  // —— 全角 / 大小写（ascii 词形）——
  ['绝对安全无副作用', ['绝对安全']],
  // —— 多词共存 ——
  ['美白祛斑一步到位，效果堪比医美', ['美白', '祛斑', '堪比医美']],
  ['纯天然无添加，销量第一，万人回购', ['纯天然', '销量第一', '万人回购']],
  // —— 零宽字符夹字（U+200B）——
  ['治​疗痘痘很有效', ['治疗']],
  // —— 私信变体（夹字）——
  ['有需要私 信 我领取', ['私信我']],
  // —— 干净文本：不应误报 ——
  ['分享一瓶很喜欢的精华，质地清爽好吸收', []],
];

let pass = 0, fail = 0;
const fails = [];
for (const [text, expect] of CASES) {
  const got = hits(text);
  const gotSet = new Set(got);
  const missing = expect.filter((w) => !gotSet.has(w));
  const extra = got.filter((w) => !expect.includes(w));
  const ok = missing.length === 0 && extra.length === 0;
  if (ok) { pass++; }
  else { fail++; fails.push({ text, expect, got, missing, extra }); }
}

const recallTotal = CASES.reduce((a, c) => a + c[1].length, 0);
const recallHit = CASES.reduce((a, c) => {
  const g = new Set(hits(c[0]));
  return a + c[1].filter((w) => g.has(w)).length;
}, 0);

console.log('— 易闻查词 · 抗对抗检测评测 —');
console.log(`用例：${pass}/${CASES.length} 通过`);
console.log(`词级召回：${recallHit}/${recallTotal} = ${((recallHit / recallTotal) * 100).toFixed(1)}%`);
if (fails.length) {
  console.log('\n未通过用例：');
  fails.forEach((f) => {
    console.log(`  文本: ${f.text}`);
    if (f.missing.length) console.log(`    漏检: ${f.missing.join('、')}`);
    if (f.extra.length) console.log(`    误报: ${f.extra.join('、')}`);
  });
  process.exit(1);
} else {
  console.log('\n全部通过 ✓');
}
