// ============================================================
// 易闻查词 · 词库批量导入管线
// 运行：node scripts/import-lexicon.mjs   (或 npm run import:lexicon)
//
// 输入：scripts/wordlists/<分类>.txt（分类由文件名决定）
//   每行格式： 词 | 别名1,别名2 | 等级
//   - 别名、等级可省略；等级缺省按分类默认
//   - # 开头为注释，空行忽略
// 处理：归一化(复用 core.js) → 全局去重(对已有词库的所有词形) →
//   分配稳定 ID → 套分类默认等级 → 合并进 public/data/lexicon.json →
//   升版本 → 打印统计
//
// 设计为幂等：重复运行不会产生重复词条（按词形去重）。
// 运营把更大的公开词表丢进 wordlists/ 再跑一次即可扩到数千条。
// ============================================================
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Core from '../app/core.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const LEX_PATH = path.join(ROOT, 'public/data/lexicon.json');
const WL_DIR = path.join(__dirname, 'wordlists');

const CATS = ['extreme', 'medical', 'special', 'divert', 'false', 'data'];
const CAT_PREFIX = { extreme: 'ext', medical: 'med', special: 'spc', divert: 'div', false: 'fls', data: 'dat' };
const CAT_DEFAULT_LEVEL = { extreme: 'ban', medical: 'high', special: 'qual', divert: 'high', false: 'high', data: 'warn' };
const VALID_LEVELS = new Set(['ban', 'high', 'warn', 'qual']);

// —— 读现有词库 ——
const lex = JSON.parse(fs.readFileSync(LEX_PATH, 'utf8'));
const entries = lex.entries;

// 全局已存在词形（主词 + 别名，归一后），用于去重
const existingForms = new Set();
for (const e of entries) {
  for (const raw of [e.word, ...(e.aliases || [])]) {
    const f = Core.normForm(raw);
    if (f) existingForms.add(f);
  }
}

// 每个分类当前最大序号，用于续编 ID
const maxSeq = {};
for (const c of CATS) maxSeq[c] = 0;
for (const e of entries) {
  const m = /^([a-z]+)_(\d+)$/.exec(e.id || '');
  if (!m) continue;
  const cat = Object.keys(CAT_PREFIX).find((k) => CAT_PREFIX[k] === m[1]);
  if (cat) maxSeq[cat] = Math.max(maxSeq[cat], parseInt(m[2], 10));
}

function parseLine(line) {
  const noComment = line.replace(/\s+#.*$/, '').trim();
  if (!noComment || noComment.startsWith('#')) return null;
  const parts = noComment.split('|').map((s) => s.trim());
  const word = parts[0];
  if (!word) return null;
  const aliases = (parts[1] ? parts[1].split(/[,，]/).map((s) => s.trim()).filter(Boolean) : []);
  const level = parts[2] && VALID_LEVELS.has(parts[2]) ? parts[2] : null;
  return { word, aliases, level };
}

const stats = { added: 0, skippedDup: 0, byCat: {} };
let touchedFiles = 0;

for (const cat of CATS) {
  const file = path.join(WL_DIR, cat + '.txt');
  if (!fs.existsSync(file)) continue;
  touchedFiles++;
  stats.byCat[cat] = stats.byCat[cat] || { added: 0, dup: 0 };
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const parsed = parseLine(line);
    if (!parsed) continue;
    const wordForm = Core.normForm(parsed.word);
    if (!wordForm || wordForm.length < 2) { stats.skippedDup++; stats.byCat[cat].dup++; continue; }
    if (existingForms.has(wordForm)) { stats.skippedDup++; stats.byCat[cat].dup++; continue; }
    // 别名去重：剔除与已有/本词主词冲突的别名
    const aliases = [];
    const localSeen = new Set([wordForm]);
    for (const a of parsed.aliases) {
      const af = Core.normForm(a);
      if (!af || af.length < 2 || existingForms.has(af) || localSeen.has(af)) continue;
      localSeen.add(af);
      aliases.push(a);
    }
    const seq = ++maxSeq[cat];
    const id = `${CAT_PREFIX[cat]}_${String(seq).padStart(3, '0')}`;
    const entry = { id, word: parsed.word, aliases, level: parsed.level || CAT_DEFAULT_LEVEL[cat], cat, status: 'active' };
    entries.push(entry);
    // 新词形登记，避免同批次内重复
    for (const f of [wordForm, ...aliases.map((a) => Core.normForm(a))]) existingForms.add(f);
    stats.added++; stats.byCat[cat].added++;
  }
}

if (touchedFiles === 0) {
  console.error('未找到任何 wordlists/*.txt，已退出。');
  process.exit(1);
}

// 升版本（按日期）
const today = new Date().toISOString().slice(0, 10);
lex.version = today.replace(/-/g, '.');
lex.updated = today;

const forms = entries.reduce((a, x) => a + 1 + (x.aliases || []).length, 0);
fs.writeFileSync(LEX_PATH, JSON.stringify(lex, null, 2) + '\n', 'utf8');

console.log('— 词库导入完成 —');
console.log(`新增 ${stats.added} 条 · 跳过重复/无效 ${stats.skippedDup} 条`);
for (const c of CATS) if (stats.byCat[c]) console.log(`  ${c}: +${stats.byCat[c].added}  (跳过 ${stats.byCat[c].dup})`);
console.log(`词库总计：${entries.length} 主词 / ${forms} 匹配形 · 版本 v${lex.version}`);
console.log('提示：随后请运行  npm run test:engine  跑质量闸门回归。');
