// ============================================================
// 易闻查词 · 共享 UI 基元 + 评分环 + 风险图例 + 小红书笔记预览
// ============================================================
const T = window.T;
const { useState, useMemo, useEffect, useRef } = React;

// 通用按钮
function Btn({ children, onClick, kind = 'ghost', size = 'md', disabled, style }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7, justifyContent: 'center',
    fontFamily: 'inherit', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent', borderRadius: 999, transition: 'all .15s ease',
    fontSize: size === 'sm' ? 13 : 14, padding: size === 'sm' ? '7px 14px' : '10px 20px',
    opacity: disabled ? 0.5 : 1, whiteSpace: 'nowrap', lineHeight: 1.1,
  };
  const kinds = {
    primary: { background: T.red, color: '#fff', boxShadow: '0 4px 14px rgba(255,36,66,.28)' },
    soft:    { background: T.redSoft, color: T.redDark, border: `1px solid ${T.redSoft}` },
    ghost:   { background: '#fff', color: T.ink, border: `1px solid ${T.line}` },
    dark:    { background: T.ink, color: '#fff' },
  };
  return (
    <button onClick={disabled ? undefined : onClick} style={{ ...base, ...kinds[kind], ...style }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.filter = 'brightness(0.96)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}>
      {children}
    </button>
  );
}

// 风险等级小徽标
function LevelDot({ level, withLabel }) {
  const L = T.LV[level];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
      <span style={{ width: 16, height: 16, borderRadius: 5, background: L.color, color: '#fff',
        fontSize: 10, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{L.short}</span>
      {withLabel && <span style={{ fontSize: 12.5, color: L.text, fontWeight: 600 }}>{L.label}</span>}
    </span>
  );
}

// 合规评分环
function ScoreRing({ score, color, grade, size = 116 }) {
  const r = size / 2 - 9;
  const c = 2 * Math.PI * r;
  const off = c * (1 - score / 100);
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F2ECED" strokeWidth="9" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="9"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.4,0,.2,1), stroke .3s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: size * 0.3, fontWeight: 800, color: T.ink, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{score}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color, marginTop: 3 }}>{grade}</div>
      </div>
    </div>
  );
}

// 风险图例
function RiskLegend() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {Object.values(T.LV).map((L) => (
        <div key={L.key} style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 18, height: 18, borderRadius: 6, background: L.color, color: '#fff',
            fontSize: 11, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{L.short}</span>
          <span style={{ fontSize: 13, color: T.ink, fontWeight: 600 }}>{L.label}</span>
          <span style={{ fontSize: 11, color: T.sub, marginLeft: 'auto', whiteSpace: 'nowrap' }}>{L.hint}</span>
        </div>
      ))}
    </div>
  );
}

// 卡片容器
function Card({ children, style, pad = 18 }) {
  return (
    <div style={{ background: '#fff', borderRadius: 18, border: `1px solid ${T.line}`,
      padding: pad, boxShadow: '0 1px 2px rgba(31,26,27,.03)', ...style }}>{children}</div>
  );
}

// 小红书笔记预览卡（手机笔记样式）
function NotePreview({ title, tokens, result, plain }) {
  return (
    <div style={{ width: 340, background: '#fff', borderRadius: 22, overflow: 'hidden',
      border: `1px solid ${T.line}`, boxShadow: '0 18px 50px rgba(31,26,27,.16)' }}>
      {/* 封面占位 */}
      <div style={{ height: 300, position: 'relative',
        background: 'repeating-linear-gradient(135deg,#FBEFF0,#FBEFF0 12px,#F7E6E8 12px,#F7E6E8 24px)' }}>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, color: '#C99', letterSpacing: 1 }}>cover · 封面图占位</span>
          <span style={{ fontFamily: 'ui-monospace,monospace', fontSize: 11, color: '#D9B5B8' }}>1242 × 1660</span>
        </div>
        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,.45)', color: '#fff',
          fontSize: 11, padding: '3px 9px', borderRadius: 999 }}>1/4</div>
      </div>
      <div style={{ padding: '14px 16px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, lineHeight: 1.4, marginBottom: 8 }}>{title || '无标题'}</div>
        <div style={{ fontSize: 14, color: '#3A3334', lineHeight: 1.85, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {plain ? (tokens.map((t) => t.text).join('')) :
            tokens.map((t, i) => t.type === 'text'
              ? <span key={i}>{t.text}</span>
              : <span key={i} style={{ background: T.LV[t.match.item.level].bg, color: T.LV[t.match.item.level].text,
                  borderRadius: 4, padding: '0 1px', boxShadow: `inset 0 -2px 0 ${T.LV[t.match.item.level].line}` }}>{t.text}</span>)}
        </div>
        {/* 话题 */}
        <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {['#护肤分享', '#精华推荐', '#敏感肌'].map((tag) => (
            <span key={tag} style={{ fontSize: 13, color: '#3A6EA5', fontWeight: 500 }}>{tag}</span>
          ))}
        </div>
        {/* 作者行 */}
        <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.line}`,
          display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#FFB3BE,#FF7088)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>易闻小测号</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, color: T.sub, fontSize: 13, alignItems: 'center' }}>
            <span>♡ 1.2k</span><span>☆ 860</span><span>💬 73</span>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Btn, LevelDot, ScoreRing, RiskLegend, Card, NotePreview });
