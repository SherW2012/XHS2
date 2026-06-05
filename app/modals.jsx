// ============================================================
// 易闻查词 · 弹窗：AI 一键改写对比 / 小红书发布预览 + 合规评分
// ============================================================
const T4 = window.T;
const { Btn: B4, ScoreRing: SR4, NotePreview: NP4 } = window;

function Overlay({ children, onClose, width }) {
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(31,20,22,.42)',
      backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: '#FFF9F8', borderRadius: 22, width: width || 920,
        maxWidth: '96vw', maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.32)',
        display: 'flex', flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

function ModalHead({ title, sub, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '16px 22px', borderBottom: `1px solid ${T4.line}`, background: '#fff' }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 800, color: T4.ink }}>{title}</div>
        {sub && <div style={{ fontSize: 12.5, color: T4.sub, marginTop: 2 }}>{sub}</div>}
      </div>
      <div onClick={onClose} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: T4.sub, background: '#F4EEEF' }}>✕</div>
    </div>
  );
}

// —— AI 改写对比 ——
function RewriteModal({ result, body, title, track, customWords, onClose, onApply }) {
  const enabledCats = undefined;
  const afterText = window.rewrite(body, track, customWords);
  const afterResult = window.scan(afterText, track, customWords);
  const [copied, setCopied] = React.useState(false);

  // 改写后渲染：把原命中替换为绿色 fix
  const afterNodes = result.tokens.map((t, i) => {
    if (t.type === 'text') return <span key={i}>{t.text}</span>;
    const fix = (t.match.item.fix || [])[0] || t.text;
    return <span key={i} style={{ background: '#E8F8F0', color: '#16785A', borderRadius: 5, padding: '1px 3px',
      boxShadow: 'inset 0 -2px 0 #7DD3A8', fontWeight: 600 }}>{fix}</span>;
  });

  function copy() { navigator.clipboard?.writeText((title ? title + '\n\n' : '') + afterText); setCopied(true); setTimeout(() => setCopied(false), 1500); }

  return (
    <Overlay onClose={onClose} width={940}>
      <ModalHead title="✨ AI 一键改写" sub="保留你的语气和 emoji，只替换风险词 — 改写依据每个词条的合规建议生成" onClose={onClose} />
      <div style={{ padding: 22, overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {/* 原文 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: T4.ink }}>原文</span>
              <span style={{ fontSize: 12, color: '#fff', background: result.gradeColor, borderRadius: 999, padding: '2px 9px', fontWeight: 700 }}>{result.score} 分 · {result.grade}</span>
            </div>
            <div style={{ background: '#fff', border: `1px solid ${T4.line}`, borderRadius: 14, padding: 16, fontSize: 14.5, lineHeight: 2,
              color: '#2A2425', whiteSpace: 'pre-wrap', minHeight: 240, maxHeight: 360, overflow: 'auto' }}>
              {result.tokens.map((t, i) => t.type === 'text' ? <span key={i}>{t.text}</span>
                : <span key={i} style={{ background: T4.LV[t.match.item.level].bg, color: T4.LV[t.match.item.level].text,
                    borderRadius: 5, padding: '1px 3px', boxShadow: `inset 0 -2px 0 ${T4.LV[t.match.item.level].line}`, fontWeight: 600 }}>{t.text}</span>)}
            </div>
          </div>
          {/* 箭头 */}
          <div style={{ display: 'flex', alignItems: 'center', color: T4.red, fontSize: 22, fontWeight: 800 }}>→</div>
          {/* 改写后 */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 13.5, fontWeight: 800, color: T4.ink }}>AI 改写后</span>
              <span style={{ fontSize: 12, color: '#fff', background: afterResult.gradeColor, borderRadius: 999, padding: '2px 9px', fontWeight: 700 }}>{afterResult.score} 分 · {afterResult.grade}</span>
              <span style={{ fontSize: 12, color: '#16785A', fontWeight: 700 }}>↑ {afterResult.score - result.score}</span>
            </div>
            <div style={{ background: '#fff', border: '1px solid #CDEFDF', borderRadius: 14, padding: 16, fontSize: 14.5, lineHeight: 2,
              color: '#2A2425', whiteSpace: 'pre-wrap', minHeight: 240, maxHeight: 360, overflow: 'auto' }}>{afterNodes}</div>
          </div>
        </div>
        <div style={{ fontSize: 12, color: T4.sub, marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          🟩 绿色为已替换的安全表达，共改写 {result.matches.length} 处。改写仅供参考，请结合你的真实体验润色。
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, padding: '14px 22px', borderTop: `1px solid ${T4.line}`, background: '#fff' }}>
        <B4 kind="ghost" onClick={copy}>{copied ? '✓ 已复制' : '复制改写结果'}</B4>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          <B4 kind="ghost" onClick={onClose}>取消</B4>
          <B4 kind="primary" onClick={onApply}>应用改写到原文</B4>
        </div>
      </div>
    </Overlay>
  );
}

// —— 发布预览 + 合规评分 + 发布建议 ——
function PreviewModal({ result, title, onClose, onRewrite }) {
  const checks = [
    { ok: (result.byLevel.ban || 0) === 0 && (result.byLevel.high || 0) === 0,
      label: '违禁词', good: '禁用/高危词已清零', bad: `还有 ${(result.byLevel.ban || 0) + (result.byLevel.high || 0)} 处禁用/高危词` },
    { ok: title && title.length >= 4 && title.length <= 20,
      label: '标题长度', good: `${(title || '').length} 字，长度合适`, bad: title ? `${title.length} 字，建议 4–20 字` : '建议补一个吸睛标题' },
    { ok: result.bodyLen == null ? true : true, hide: true },
  ].filter((c) => !c.hide);

  const canPublish = (result.byLevel.ban || 0) === 0;

  return (
    <Overlay onClose={onClose} width={840}>
      <ModalHead title="发布预览 · 合规评分" sub="预览这篇笔记在小红书的样子，并给出发布前的最后建议" onClose={onClose} />
      <div style={{ display: 'flex', gap: 0, overflow: 'auto' }}>
        {/* 左：手机预览 */}
        <div style={{ padding: 24, background: '#F6EEF0', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
          <NP4 title={title} tokens={result.tokens} result={result} />
        </div>
        {/* 右：评分 + 建议 */}
        <div style={{ flex: 1, minWidth: 0, padding: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <SR4 score={result.score} color={result.gradeColor} grade={result.grade} size={96} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: result.gradeColor, marginBottom: 4 }}>
                {canPublish ? '可以发布' : '不建议直接发布'}</div>
              <div style={{ fontSize: 13, color: '#3A3334', lineHeight: 1.6 }}>{result.verdict}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, fontWeight: 800, color: T4.sub, marginBottom: 10, letterSpacing: .4 }}>发布前检查</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 18 }}>
            {checks.map((c, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                <span style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, color: '#fff', fontSize: 12, fontWeight: 800,
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: c.ok ? '#16B364' : '#FB7A1E' }}>{c.ok ? '✓' : '!'}</span>
                <span style={{ fontWeight: 700, color: T4.ink, width: 72 }}>{c.label}</span>
                <span style={{ color: c.ok ? '#3A3334' : '#C85F12' }}>{c.ok ? c.good : c.bad}</span>
              </div>
            ))}
          </div>

          <div style={{ background: '#fff', border: `1px solid ${T4.line}`, borderRadius: 14, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: T4.ink, marginBottom: 8 }}>💡 发布建议</div>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: '#5A5253', lineHeight: 1.9 }}>
              <li>正文末尾带 3–5 个精准话题标签，利于进入垂类推荐池</li>
              <li>护肤类内容晚 8–10 点发布互动更高</li>
              <li>真实体验 + 对比图比纯文案更易被收藏</li>
            </ul>
          </div>

          {!canPublish && <B4 kind="primary" onClick={onRewrite} style={{ width: '100%' }}>先 AI 一键改写再发布 →</B4>}
          {canPublish && <B4 kind="primary" onClick={onClose} style={{ width: '100%' }}>✓ 复制并去发布</B4>}
        </div>
      </div>
    </Overlay>
  );
}

Object.assign(window, { RewriteModal, PreviewModal });
