// ============================================================
// 易闻查词 · 检测工作台（核心）+ 标红出处详情面板
// ============================================================
const T2 = window.T;
const { useState: uS, useMemo: uM, useRef: uR } = React;

// 高亮结果（可点击）
function Highlighted({ tokens, selected, onSelect }) {
  if (!tokens.length) {
    return <div style={{ color: T2.sub, fontSize: 15, lineHeight: 1.9 }}>在左侧粘贴或输入你的小红书文案，这里会实时标出风险词并给出处与理由。</div>;
  }
  let hitIdx = -1;
  return (
    <div style={{ fontSize: 15.5, lineHeight: 2.05, color: '#2A2425', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
      {tokens.map((t, i) => {
        if (t.type === 'text') return <span key={i}>{t.text}</span>;
        hitIdx++;
        const idx = hitIdx;
        const L = T2.LV[t.match.item.level];
        const isSel = selected === idx;
        return (
          <span key={i} onClick={() => onSelect(idx)}
            style={{ background: isSel ? L.color : L.bg, color: isSel ? '#fff' : L.text,
              borderRadius: 5, padding: '1px 3px', margin: '0 1px', cursor: 'pointer', fontWeight: 600,
              boxShadow: isSel ? `0 2px 8px ${L.color}66` : `inset 0 -2px 0 ${L.line}`,
              transition: 'all .12s' }}
            title="点击查看出处与理由">{t.text}</span>
        );
      })}
    </div>
  );
}

// 问题清单（按等级分组）
function IssueList({ result, onSelect, selected }) {
  if (!result.matches.length) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 10px', color: T2.sub }}>
        <div style={{ fontSize: 42, marginBottom: 10 }}>🎉</div>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#16B364' }}>没有检出违禁词</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>这篇笔记可以放心发布啦</div>
      </div>
    );
  }
  // 保持出现顺序，但加等级标记
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {result.matches.map((m, i) => {
        const L = T2.LV[m.item.level];
        const isSel = selected === i;
        return (
          <div key={i} onClick={() => onSelect(i)}
            style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '11px 13px', borderRadius: 13,
              border: `1px solid ${isSel ? L.color : T2.line}`, background: isSel ? L.bg : '#fff', cursor: 'pointer',
              transition: 'all .12s' }}>
            <span style={{ width: 22, height: 22, borderRadius: 7, background: L.color, color: '#fff', flexShrink: 0,
              fontSize: 12, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{L.short}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: T2.ink }}>{m.hit}
                {m.isAlias && <span style={{ fontSize: 11, color: T2.sub, fontWeight: 500, marginLeft: 6 }}>≈ {m.item.word}</span>}
              </div>
              <div style={{ fontSize: 12, color: T2.sub, marginTop: 2 }}>{m.custom ? '自定义词库' : (window.CATS[m.item.cat] || {}).name} · {m.item.platform}</div>
            </div>
            <span style={{ color: T2.sub, fontSize: 18 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}

// 出处详情卡 —— 核心差异点
function DetailCard({ match, track, onBack, onApplyFix }) {
  const item = match.item;
  const L = T2.LV[item.level];
  const cat = window.CATS[item.cat] || { name: item.cat, tag: '' };
  const Row = ({ icon, label, children, accent }) => (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: accent || T2.sub, letterSpacing: .3, whiteSpace: 'nowrap' }}>{label}</span>
      </div>
      <div style={{ paddingLeft: 21 }}>{children}</div>
    </div>
  );
  return (
    <div>
      <div onClick={onBack} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13,
        color: T2.sub, cursor: 'pointer', marginBottom: 14, fontWeight: 600 }}>‹ 返回问题清单</div>

      {/* 词头 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
        <span style={{ fontSize: 23, fontWeight: 800, color: T2.ink }}>{match.hit}</span>
        <span style={{ padding: '4px 11px', borderRadius: 999, background: L.color, color: '#fff',
          fontSize: 12.5, fontWeight: 700 }}>{L.label}</span>
      </div>
      <div style={{ fontSize: 12.5, color: T2.sub, marginBottom: 18 }}>
        分类：{cat.name} · {cat.tag}{match.isAlias && ` · 命中变体「${match.hit}」归一到「${item.word}」`}
      </div>

      <Row icon="❗" label="为什么标红" accent={L.text}>
        <div style={{ fontSize: 14, color: '#2A2425', lineHeight: 1.75 }}>{item.why}</div>
      </Row>

      <Row icon="📖" label="出处 · 依据">
        <div style={{ background: '#FBF7F8', border: `1px solid ${T2.line}`, borderRadius: 12, padding: '12px 14px' }}>
          <div style={{ display: 'inline-block', fontSize: 11.5, fontWeight: 700, color: '#fff', background: T2.ink,
            padding: '3px 9px', borderRadius: 6, marginBottom: 8 }}>{item.platform}</div>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: T2.ink, marginBottom: 4 }}>{item.law}</div>
          <div style={{ fontSize: 13, color: '#5A5253', lineHeight: 1.7 }}>「{item.clause}」</div>
        </div>
      </Row>

      <Row icon="🎯" label="你的赛道能不能用">
        <div style={{ fontSize: 14, color: '#2A2425', lineHeight: 1.75 }}>{item.trackNote}</div>
      </Row>

      <Row icon="⚖️" label="真实案例 / 后果">
        <div style={{ fontSize: 13, color: '#6A6263', lineHeight: 1.7, fontStyle: 'normal' }}>{item.example}</div>
      </Row>

      <Row icon="✍️" label="建议改成">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(item.fix || []).map((f, i) => (
            <span key={i} onClick={() => onApplyFix && onApplyFix(match, f)}
              style={{ fontSize: 13, fontWeight: 600, color: '#16785A', background: '#E8F8F0',
                border: '1px solid #CDEFDF', borderRadius: 999, padding: '7px 13px', cursor: 'pointer' }}
              title="点击替换原文">{f}</span>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: T2.sub, marginTop: 8 }}>点击词条即可替换原文中的这一处</div>
      </Row>
    </div>
  );
}

Object.assign(window, { Highlighted, IssueList, DetailCard });
