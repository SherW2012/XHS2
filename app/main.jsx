// ============================================================
// 易闻查词 · 应用入口（Vite）
// 取代原 index.html 里的 CDN React + 浏览器内 Babel 方案。
// 为兼容既有「window 全局」架构，这里先把 React/主题挂到 window，
// 再按依赖顺序动态加载各模块（它们仍以 window.X 互相引用）。
// ============================================================
import React from 'react';
import { createRoot } from 'react-dom/client';

// —— 暴露给沿用 window 全局风格的各业务模块 ——
window.React = React;
window.ReactDOM = { createRoot };

// —— 全局主题（原内联于 index.html）——
window.T = {
  red: '#FF2442', redDark: '#E11D36', redSoft: '#FFEEF0',
  bg: '#FFF9F8', card: '#FFFFFF', ink: '#1F1A1B', sub: '#9A9092', line: '#F0E7E8',
  LV: {
    ban:  { key: 'ban',  label: '禁用',   short: '禁', color: '#FB2C44', bg: '#FFEEF0', line: '#FB2C44', text: '#C81E2E', hint: '直接限流/处罚' },
    high: { key: 'high', label: '高危',   short: '危', color: '#FB7A1E', bg: '#FFF2E6', line: '#FB7A1E', text: '#C15A10', hint: '高概率限流' },
    warn: { key: 'warn', label: '提醒',   short: '提', color: '#E0A100', bg: '#FFF8E0', line: '#E8AE00', text: '#937100', hint: '营销话术建议改' },
    qual: { key: 'qual', label: '需资质', short: '资', color: '#2E7CF6', bg: '#EAF1FE', line: '#2E7CF6', text: '#1C5BC4', hint: '持证可用' },
  },
};

const { useState, useEffect } = React;
const T = window.T;

const NAV = [
  { key: 'detect',  label: '检测工作台', icon: '🔍' },
  { key: 'history', label: '历史复盘',   icon: '🗂️' },
  { key: 'library', label: '我的词库',   icon: '📚' },
  { key: 'pricing', label: '会员',       icon: '👑' },
  { key: 'admin',   label: '词库后台',   icon: '⚙️' },
];

function loadLS(key, fb) { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fb; } catch { return fb; } }
function saveLS(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch {} }

// —— 词库运行时加载：优先 data/lexicon.json（可在 CDN 上独立更新），
//    失败则回退到 data.jsx 内嵌词库 ——
async function loadLexicon() {
  try {
    const res = await fetch('data/lexicon.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    if (data && Array.isArray(data.entries) && data.entries.length) {
      window.LEXICON = window.hydrateLexicon ? window.hydrateLexicon(data.entries) : data.entries;
      window.LEXICON_META = { version: data.version, updated: data.updated, count: data.entries.length, source: 'remote' };
      window.resetIndex && window.resetIndex();
      return;
    }
  } catch (e) {
    console.warn('[易闻] 远程词库加载失败，已回退内置词库：', e.message);
  }
  window.LEXICON_META = { version: '内置', updated: '—', count: (window.LEXICON || []).length, source: 'embedded' };
}

function App() {
  const [nav, setNav] = useState(loadLS('yw_nav', 'detect'));
  const [isVip, setIsVip] = useState(loadLS('yw_vip', false));
  const [history, setHistory] = useState(loadLS('yw_hist', window.SEED_HISTORY || []));
  const [customWords, setCustomWords] = useState(loadLS('yw_cw', window.SEED_CUSTOM || []));
  const [detectState, setDetectState] = useState({
    title: '', body: '', track: 'auto',
    enabledCats: Object.keys(window.CATS),
    selected: null, view: 'list', tab: 'edit', modal: null, toast: null,
  });

  useEffect(() => saveLS('yw_nav', nav), [nav]);
  useEffect(() => saveLS('yw_vip', isVip), [isVip]);
  useEffect(() => saveLS('yw_hist', history), [history]);
  useEffect(() => { saveLS('yw_cw', customWords); window.resetIndex && window.resetIndex(); }, [customWords]);

  function addHistory(rec) { setHistory((h) => [rec, ...h].slice(0, 50)); }

  function openHistoryItem(rec) {
    setDetectState((s) => ({ ...s, title: rec.title === '无标题笔记' ? '' : rec.title, body: rec.body,
      track: rec.track, selected: null, view: 'list', tab: 'result' }));
    setNav('detect');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,249,248,.86)',
        backdropFilter: 'blur(12px)', borderBottom: `1px solid ${T.line}`, padding: '0 26px', height: 62,
        display: 'flex', alignItems: 'center', gap: 26 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: T.red, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800,
            boxShadow: '0 3px 10px rgba(255,36,66,.35)' }}>易</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: .5 }}>易闻查词</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: -1 }}>小红书违禁词工作台</div>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 2 }}>
          {NAV.map((n) => {
            const on = nav === n.key;
            return (
              <div key={n.key} onClick={() => setNav(n.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, cursor: 'pointer',
                  fontSize: 14, fontWeight: on ? 800 : 600, color: on ? T.redDark : '#6B6264',
                  background: on ? T.redSoft : 'transparent' }}>
                <span style={{ fontSize: 14 }}>{n.icon}</span>{n.label}
              </div>
            );
          })}
        </nav>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          {isVip
            ? <span style={{ fontSize: 12.5, fontWeight: 800, color: '#9A6A00', background: 'linear-gradient(90deg,#FFE9A8,#FFD36B)',
                padding: '6px 13px', borderRadius: 999 }}>👑 年度会员</span>
            : <window.Btn kind="dark" size="sm" onClick={() => setNav('pricing')}>开通会员</window.Btn>}
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#FFB3BE,#FF7088)' }} />
        </div>
      </header>

      <main key={nav} className="fadein" style={{ flex: 1, padding: '20px 26px 60px', maxWidth: 1360, width: '100%', margin: '0 auto' }}>
        {nav === 'detect' && <window.DetectView state={detectState} set={setDetectState} addHistory={addHistory}
          customWords={customWords} goPricing={() => setNav('pricing')} />}
        {nav === 'history' && <window.HistoryView history={history} onOpen={openHistoryItem}
          onClear={() => setHistory([])} onDelete={(ts) => setHistory((h) => h.filter((r) => r.ts !== ts))} />}
        {nav === 'library' && <window.LibraryView customWords={customWords} setCustomWords={setCustomWords} isVip={isVip} goPricing={() => setNav('pricing')} />}
        {nav === 'pricing' && <window.PricingView isVip={isVip} onSubscribe={() => setIsVip(true)} onCancel={() => setIsVip(false)} />}
        {nav === 'admin' && <window.AdminView />}
      </main>
    </div>
  );
}

// —— 按依赖顺序加载各模块（保持 window 全局架构，无需重写）后再渲染 ——
(async () => {
  await import('./core.js');       // window.YWCore
  await import('./data.jsx');      // window.LEXICON / TRACKS / CATS / SAMPLE...
  await import('./engine.jsx');    // window.scan / rewrite / resetIndex
  await import('./ui.jsx');        // window.Btn / Card / ScoreRing...
  await import('./workspace.jsx'); // window.Highlighted / IssueList / DetailCard
  await import('./modals.jsx');    // window.RewriteModal / PreviewModal
  await import('./detect.jsx');    // window.DetectView
  await import('./screens.jsx');   // window.HistoryView / LibraryView / ...
  await loadLexicon();
  createRoot(document.getElementById('root')).render(<App />);
})();
