// ============================================================
// 易闻查词 · 历史复盘 / 我的词库 / 会员定价 / 词库后台
// ============================================================
const TS = window.T;
const { Btn: BB, Card: CC, ScoreRing: SRR } = window;

// —— 种子数据 ——
const SEED_HISTORY = [
  { title: '挖到宝了！这瓶精华让我素颜也能打🌟', body: window.SAMPLE_NOTE, track: 'beauty',
    score: 36, grade: '高风险', gradeColor: '#FB2C44', count: 13, ts: Date.now() - 3600e3 * 5,
    byLevel: { ban: 6, high: 4, warn: 3, qual: 0 } },
  { title: '敏感肌精华空瓶分享', body: window.CLEAN_NOTE, track: 'beauty',
    score: 100, grade: '安全', gradeColor: '#16B364', count: 0, ts: Date.now() - 3600e3 * 28,
    byLevel: { ban: 0, high: 0, warn: 0, qual: 0 } },
  { title: '换季囤货清单｜平价好用', body: '换季必囤的几件单品，亲测好用，主打一个性价比。第一次用就爱上了，姐妹们冲！', track: 'auto',
    score: 72, grade: '待优化', gradeColor: '#FB7A1E', count: 2, ts: Date.now() - 3600e3 * 52,
    byLevel: { ban: 1, high: 0, warn: 1, qual: 0 } },
];

const SEED_CUSTOM = [
  { word: '家人们', level: 'warn', note: '品牌调性不希望使用的口头禅', fix: '姐妹们' },
  { word: '绝绝子', level: 'warn', note: '过度网络用语，影响专业感', fix: '真的很不错' },
];

// ============================================================
// 历史复盘
// ============================================================
function HistoryView({ history, onOpen, onClear, onDelete }) {
  const total = history.length;
  const avg = total ? Math.round(history.reduce((a, r) => a + r.score, 0) / total) : 0;
  const banned = history.reduce((a, r) => a + (r.byLevel && r.byLevel.ban || 0), 0);
  const Stat = ({ n, label, color }) => (
    <CC pad={16} style={{ flex: 1, textAlign: 'center' }}>
      <div style={{ fontSize: 30, fontWeight: 800, color: color || TS.ink, fontVariantNumeric: 'tabular-nums' }}>{n}</div>
      <div style={{ fontSize: 12.5, color: TS.sub, marginTop: 3 }}>{label}</div>
    </CC>
  );
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800 }}>历史复盘</h1>
          <p style={{ fontSize: 13, color: TS.sub, marginTop: 3 }}>每次检测自动留痕，回看你最常踩的雷，沉淀自己的合规习惯</p>
        </div>
        {total > 0 && <div style={{ marginLeft: 'auto' }}><BB kind="ghost" size="sm" onClick={onClear}>清空记录</BB></div>}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <Stat n={total} label="累计检测笔记" />
        <Stat n={avg} label="平均合规分" color={avg >= 85 ? '#16B364' : avg >= 60 ? '#FB7A1E' : '#FB2C44'} />
        <Stat n={banned} label="累计拦截禁用词" color="#FB2C44" />
      </div>

      {total === 0 ? (
        <CC pad={50} style={{ textAlign: 'center', color: TS.sub }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>🗂️</div>暂无记录，去检测工作台跑一篇试试
        </CC>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
          {history.map((r) => {
            const tr = (window.TRACKS.find((t) => t.key === r.track) || {});
            return (
              <CC key={r.ts} pad={16} style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div style={{ width: 58, height: 58, borderRadius: '50%', border: `4px solid ${r.gradeColor}`,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 19, fontWeight: 800, color: TS.ink, lineHeight: 1 }}>{r.score}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700, color: TS.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                  <div style={{ fontSize: 12.5, color: TS.sub, marginTop: 4, display: 'flex', gap: 12 }}>
                    <span>{tr.icon} {tr.name}</span>
                    <span style={{ color: r.gradeColor, fontWeight: 700 }}>{r.grade}</span>
                    <span>命中 {r.count} 处</span>
                    <span>{timeAgo(r.ts)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {['ban', 'high', 'warn', 'qual'].map((k) => ((r.byLevel && r.byLevel[k]) ? (
                    <span key={k} style={{ fontSize: 11.5, fontWeight: 700, color: TS.LV[k].text, background: TS.LV[k].bg,
                      borderRadius: 7, padding: '3px 7px' }}>{TS.LV[k].short}{r.byLevel[k]}</span>
                  ) : null))}
                </div>
                <BB kind="soft" size="sm" onClick={() => onOpen(r)}>复盘改写</BB>
                <span onClick={() => onDelete(r.ts)} style={{ color: TS.sub, cursor: 'pointer', fontSize: 18, padding: '0 4px' }}>✕</span>
              </CC>
            );
          })}
        </div>
      )}
    </div>
  );
}

function timeAgo(ts) {
  const d = (Date.now() - ts) / 1000;
  if (d < 3600) return Math.max(1, Math.floor(d / 60)) + ' 分钟前';
  if (d < 86400) return Math.floor(d / 3600) + ' 小时前';
  return Math.floor(d / 86400) + ' 天前';
}

// ============================================================
// 我的词库（自定义）
// ============================================================
function LibraryView({ customWords, setCustomWords, isVip, goPricing }) {
  const FREE_LIMIT = 3;
  const [form, setForm] = React.useState({ word: '', level: 'warn', note: '', fix: '' });
  const locked = !isVip && customWords.length >= FREE_LIMIT;

  function add() {
    if (!form.word.trim() || locked) return;
    setCustomWords([...customWords, { ...form, word: form.word.trim() }]);
    setForm({ word: '', level: 'warn', note: '', fix: '' });
  }
  function del(i) { setCustomWords(customWords.filter((_, x) => x !== i)); }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>我的词库</h1>
        <p style={{ fontSize: 13, color: TS.sub, marginTop: 3 }}>把品牌禁用语、个人口头禅、特定违规词加进来，检测时和官方词库一起生效</p>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* 添加表单 */}
        <CC pad={18} style={{ width: 320, flexShrink: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 800, marginBottom: 14 }}>+ 添加自定义词</div>
          <Field label="违禁词 / 关注词">
            <input value={form.word} onChange={(e) => setForm({ ...form, word: e.target.value })} placeholder="如：家人们"
              style={inp} />
          </Field>
          <Field label="风险等级">
            <div style={{ display: 'flex', gap: 6 }}>
              {['ban', 'high', 'warn', 'qual'].map((k) => (
                <div key={k} onClick={() => setForm({ ...form, level: k })}
                  style={{ flex: 1, textAlign: 'center', fontSize: 12, fontWeight: 700, padding: '7px 0', borderRadius: 9, cursor: 'pointer',
                    border: `1px solid ${form.level === k ? TS.LV[k].color : TS.line}`,
                    background: form.level === k ? TS.LV[k].bg : '#fff', color: form.level === k ? TS.LV[k].text : TS.sub }}>{TS.LV[k].label}</div>
              ))}
            </div>
          </Field>
          <Field label="理由 / 备注">
            <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="为什么要管这个词"
              style={inp} />
          </Field>
          <Field label="建议改写">
            <input value={form.fix} onChange={(e) => setForm({ ...form, fix: e.target.value })} placeholder="替换成…"
              style={inp} />
          </Field>
          {locked
            ? <div style={{ background: '#FFF6E8', border: '1px solid #FCE1B0', borderRadius: 12, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 12.5, color: '#9A6A00', marginBottom: 8 }}>免费版最多 {FREE_LIMIT} 个自定义词，开通会员不限量</div>
                <BB kind="dark" size="sm" onClick={goPricing}>👑 升级解锁</BB>
              </div>
            : <BB kind="primary" onClick={add} style={{ width: '100%' }}>添加到我的词库</BB>}
        </CC>

        {/* 列表 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <CC pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '11px 18px', borderBottom: `1px solid ${TS.line}`, background: '#FCFAFA',
              fontSize: 12, fontWeight: 800, color: TS.sub }}>
              <span style={{ width: 120 }}>词</span><span style={{ width: 70 }}>等级</span>
              <span style={{ flex: 1 }}>理由</span><span style={{ width: 110 }}>改写</span><span style={{ width: 30 }}></span>
            </div>
            {customWords.length === 0
              ? <div style={{ padding: 40, textAlign: 'center', color: TS.sub, fontSize: 13 }}>还没有自定义词</div>
              : customWords.map((w, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '13px 18px', borderBottom: i < customWords.length - 1 ? `1px solid ${TS.line}` : 'none', fontSize: 13.5 }}>
                  <span style={{ width: 120, fontWeight: 700, color: TS.ink }}>{w.word}</span>
                  <span style={{ width: 70 }}><window.LevelDot level={w.level} withLabel /></span>
                  <span style={{ flex: 1, color: '#5A5253' }}>{w.note || '—'}</span>
                  <span style={{ width: 110, color: '#16785A', fontWeight: 600 }}>{w.fix || '—'}</span>
                  <span onClick={() => del(i)} style={{ width: 30, textAlign: 'right', color: TS.sub, cursor: 'pointer' }}>✕</span>
                </div>
              ))}
          </CC>
        </div>
      </div>
    </div>
  );
}

const inp = { width: '100%', border: `1px solid ${TS.line}`, borderRadius: 10, padding: '9px 11px',
  fontSize: 13.5, outline: 'none', color: TS.ink, background: '#fff' };
function Field({ label, children }) {
  return (<div style={{ marginBottom: 12 }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: TS.sub, marginBottom: 6 }}>{label}</div>{children}</div>);
}

// ============================================================
// 会员定价
// ============================================================
function PricingView({ isVip, onSubscribe, onCancel }) {
  const [plan, setPlan] = React.useState('year');
  const feats = [
    ['违禁词实时检测 · 四级标红', true, true],
    ['每个标红的出处 + 法规条款 + 案例', '基础', '完整'],
    ['赛道垂类词库（美妆/医疗/母婴…）', '仅通用', '全部'],
    ['AI 一键改写对比', '每日 3 次', '不限'],
    ['自定义词库', '3 个', '不限'],
    ['小红书发布预览 + 合规评分', false, true],
    ['历史复盘 + 数据导出', false, true],
    ['批量检测 / 团队协作', false, true],
  ];
  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 26 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800 }}>把限流风险，挡在发布之前</h1>
        <p style={{ fontSize: 14, color: TS.sub, marginTop: 6 }}>市面工具只告诉你「这个词不能用」，易闻还告诉你「为什么、出自哪、怎么改」</p>
      </div>

      <div style={{ display: 'flex', gap: 18, justifyContent: 'center', alignItems: 'stretch', maxWidth: 880, margin: '0 auto 24px' }}>
        {/* 免费 */}
        <CC pad={24} style={{ flex: 1, maxWidth: 340 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: TS.sub }}>免费版</div>
          <div style={{ fontSize: 34, fontWeight: 800, margin: '8px 0 2px' }}>¥0</div>
          <div style={{ fontSize: 12.5, color: TS.sub, marginBottom: 18 }}>个人博主日常自查够用</div>
          {isVip
            ? <BB kind="ghost" onClick={onCancel} style={{ width: '100%' }}>切回免费版</BB>
            : <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#16B364', padding: '10px 0',
                background: '#E8F8F0', borderRadius: 999 }}>✓ 当前使用中</div>}
        </CC>

        {/* 会员 */}
        <CC pad={24} style={{ flex: 1, maxWidth: 340, border: `2px solid ${TS.red}`, position: 'relative',
          boxShadow: '0 14px 40px rgba(255,36,66,.14)' }}>
          <span style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: TS.red, color: '#fff',
            fontSize: 12, fontWeight: 700, padding: '4px 14px', borderRadius: 999 }}>最受博主欢迎</span>
          <div style={{ fontSize: 15, fontWeight: 800, color: TS.redDark }}>👑 易闻会员</div>
          <div style={{ display: 'flex', gap: 8, margin: '12px 0' }}>
            {[['month', '月卡', '¥19', '/月'], ['year', '年卡', '¥128', '/年']].map(([k, n, p, u]) => (
              <div key={k} onClick={() => setPlan(k)} style={{ flex: 1, padding: '10px', borderRadius: 12, cursor: 'pointer', textAlign: 'center',
                border: `1.5px solid ${plan === k ? TS.red : TS.line}`, background: plan === k ? TS.redSoft : '#fff' }}>
                <div style={{ fontSize: 12, color: TS.sub, fontWeight: 700 }}>{n}{k === 'year' && <span style={{ color: TS.red }}> 省44%</span>}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: TS.ink, marginTop: 2 }}>{p}<span style={{ fontSize: 11, color: TS.sub, fontWeight: 600 }}>{u}</span></div>
              </div>
            ))}
          </div>
          {isVip
            ? <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#9A6A00', padding: '11px 0',
                background: 'linear-gradient(90deg,#FFE9A8,#FFD36B)', borderRadius: 999 }}>👑 已是会员</div>
            : <BB kind="primary" onClick={onSubscribe} style={{ width: '100%' }}>立即开通{plan === 'year' ? '年卡' : '月卡'}</BB>}
          <div style={{ fontSize: 11.5, color: TS.sub, textAlign: 'center', marginTop: 10 }}>7 天无理由退款 · 随时取消</div>
        </CC>
      </div>

      {/* 权益对比 */}
      <CC pad={0} style={{ maxWidth: 880, margin: '0 auto', overflow: 'hidden' }}>
        <div style={{ display: 'flex', padding: '13px 22px', background: '#FCFAFA', borderBottom: `1px solid ${TS.line}`, fontSize: 13, fontWeight: 800, color: TS.sub }}>
          <span style={{ flex: 1 }}>权益</span><span style={{ width: 110, textAlign: 'center' }}>免费版</span><span style={{ width: 110, textAlign: 'center', color: TS.redDark }}>会员</span>
        </div>
        {feats.map((f, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '12px 22px', borderBottom: i < feats.length - 1 ? `1px solid ${TS.line}` : 'none', fontSize: 13.5 }}>
            <span style={{ flex: 1, color: TS.ink }}>{f[0]}</span>
            <span style={{ width: 110, textAlign: 'center' }}>{cell(f[1])}</span>
            <span style={{ width: 110, textAlign: 'center', fontWeight: 700, color: TS.redDark }}>{cell(f[2])}</span>
          </div>
        ))}
      </CC>
    </div>
  );
}
function cell(v) {
  if (v === true) return <span style={{ color: '#16B364', fontWeight: 800 }}>✓</span>;
  if (v === false) return <span style={{ color: '#D6CACC' }}>—</span>;
  return <span style={{ color: TS.sub, fontSize: 12.5 }}>{v}</span>;
}

// ============================================================
// 词库后台（运营端 · 演示前后台实现原理）
// ============================================================
function AdminView() {
  const [q, setQ] = React.useState('');
  const lex = window.LEXICON;
  const filtered = lex.filter((it) => !q || it.word.includes(q) || (it.aliases || []).some((a) => a.includes(q)) || it.platform.includes(q));
  const catCount = {};
  lex.forEach((it) => { catCount[it.cat] = (catCount[it.cat] || 0) + 1; });
  const totalForms = lex.reduce((a, it) => a + 1 + (it.aliases || []).length, 0);

  const Box = ({ children, accent, label }) => (
    <div style={{ flex: 1, background: '#fff', border: `1px solid ${TS.line}`, borderRadius: 13, padding: '12px 14px', textAlign: 'center' }}>
      <div style={{ fontSize: 11.5, color: TS.sub, fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 13, color: accent || TS.ink, fontWeight: 700 }}>{children}</div>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800 }}>词库后台 <span style={{ fontSize: 13, fontWeight: 600, color: TS.sub }}>· 运营端</span></h1>
        <p style={{ fontSize: 13, color: TS.sub, marginTop: 3 }}>违禁词库由运营在后台维护，前台检测实时调用 — 这页演示前后台如何打通</p>
      </div>

      {/* 架构原理 */}
      <CC pad={18} style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 14 }}>🔗 前后台实现原理</div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 10 }}>
          <Box label="① 前台 · 用户">博主粘贴文案<br />选择赛道</Box>
          <Arrow />
          <Box label="② 检测引擎" accent={TS.redDark}>分词扫描 + 别名归一<br />四级判定 + 评分</Box>
          <Arrow />
          <Box label="③ 词库（核心）" accent="#2E7CF6">内置词库 + 赛道词库<br />+ 自定义词库</Box>
          <Arrow />
          <Box label="④ 返回结果">命中 + 出处<br />法规条款 + 改写</Box>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14, padding: '10px 14px', background: '#FBF7F8', borderRadius: 11 }}>
          <span style={{ fontSize: 12.5, fontWeight: 800, color: TS.sub }}>后台运营 ↻</span>
          <span style={{ fontSize: 12.5, color: '#5A5253' }}>新增/下架词条 · 配置等级与出处 · 跟进平台规则更新 · 处理误报反馈 — 改动实时同步给前台引擎</span>
        </div>
      </CC>

      {/* 数据看板 */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <Box label="词条总数">{lex.length} 条主词</Box>
        <Box label="含别名变体">{totalForms} 个匹配形</Box>
        <Box label="词库分类">{Object.keys(catCount).length} 类</Box>
        <Box label="法规来源" accent="#2E7CF6">广告法 / 化妆品条例 / 平台公约</Box>
      </div>

      {/* 词条管理表 */}
      <CC pad={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 18px', borderBottom: `1px solid ${TS.line}` }}>
          <span style={{ fontSize: 14, fontWeight: 800 }}>词条管理</span>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="搜索词 / 来源…"
            style={{ ...inp, width: 220, marginLeft: 'auto' }} />
          <BB kind="primary" size="sm">+ 新增词条</BB>
        </div>
        <div style={{ display: 'flex', padding: '10px 18px', background: '#FCFAFA', borderBottom: `1px solid ${TS.line}`, fontSize: 12, fontWeight: 800, color: TS.sub }}>
          <span style={{ width: 110 }}>词</span><span style={{ width: 64 }}>等级</span><span style={{ width: 92 }}>分类</span>
          <span style={{ flex: 1 }}>出处依据</span><span style={{ width: 130 }}>别名变体</span>
        </div>
        <div style={{ maxHeight: 340, overflow: 'auto' }}>
          {filtered.map((it, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '11px 18px', borderBottom: `1px solid ${TS.line}`, fontSize: 13 }}>
              <span style={{ width: 110, fontWeight: 700, color: TS.ink }}>{it.word}</span>
              <span style={{ width: 64 }}><window.LevelDot level={it.level} /></span>
              <span style={{ width: 92, color: '#5A5253' }}>{(window.CATS[it.cat] || {}).name}</span>
              <span style={{ flex: 1, color: '#5A5253', fontSize: 12.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: 10 }}>{it.law}</span>
              <span style={{ width: 130, color: TS.sub, fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(it.aliases || []).join('、') || '—'}</span>
            </div>
          ))}
        </div>
      </CC>
    </div>
  );
}
function Arrow() { return <div style={{ display: 'flex', alignItems: 'center', color: TS.sub, fontSize: 17 }}>→</div>; }

Object.assign(window, { SEED_HISTORY, SEED_CUSTOM, HistoryView, LibraryView, PricingView, AdminView });
