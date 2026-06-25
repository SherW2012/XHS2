// ============================================================
// 易闻查词 · 检测视图（组装工作台）
// ============================================================
const T3 = window.T;
const RB = React;
const { Btn: B3, ScoreRing: SR, RiskLegend: RL, Card: C3, NotePreview: NP } = window;

function DetectView({ state, set, addHistory, customWords, goPricing }) {
  const { title, body, track, enabledCats, selected, view, modal } = state;
  const result = RB.useMemo(
    () => window.scan(body, track, customWords, enabledCats),
    [body, track, customWords, enabledCats]
  );

  const selMatch = selected != null && result.matches[selected];

  function edit(patch) { set({ ...state, ...patch }); }
  function onSelect(i) { edit({ selected: i, view: 'detail', tab: 'result' }); }
  function applyFix(match, f) {
    const nb = body.slice(0, match.start) + f + body.slice(match.end);
    edit({ body: nb, selected: null, view: 'list' });
  }
  function oneClickRewrite() {
    edit({ body: window.rewrite(body, track, customWords, enabledCats), selected: null, view: 'list', modal: null });
  }
  function loadSample() { edit({ title: window.SAMPLE_TITLE, body: window.SAMPLE_NOTE, selected: null, view: 'list', tab: 'edit' }); }
  function clearAll() { edit({ title: '', body: '', selected: null, view: 'list', tab: 'edit' }); }
  function saveHistory() {
    if (!body.trim()) return;
    addHistory({ title: title || '无标题笔记', body, track, score: result.score, grade: result.grade,
      gradeColor: result.gradeColor, count: result.matches.length, ts: Date.now(), byLevel: result.byLevel });
    edit({ toast: '已存入历史复盘' });
    setTimeout(() => edit({ toast: null }), 1600);
  }

  const tab = state.tab || (body ? 'result' : 'edit');
  const tracks = window.TRACKS;
  const curTrack = tracks.find((t) => t.key === track) || tracks[0];

  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      {/* 左栏：赛道 + 词库 + 图例 */}
      <div style={{ width: 226, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
        <C3 pad={15}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T3.sub, letterSpacing: .5, marginBottom: 11 }}>检测赛道</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            {tracks.map((t) => {
              const on = t.key === track;
              return (
                <div key={t.key} onClick={() => edit({ track: t.key })}
                  style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 11, cursor: 'pointer',
                    border: `1px solid ${on ? T3.red : T3.line}`, background: on ? T3.redSoft : '#fff' }}>
                  <span style={{ fontSize: 16 }}>{t.icon}</span>
                  <span style={{ fontSize: 13.5, fontWeight: on ? 800 : 600, color: on ? T3.redDark : T3.ink }}>{t.name}</span>
                  {t.key === 'auto' && <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, color: on ? T3.red : T3.sub,
                    border: `1px solid ${on ? T3.red : T3.line}`, borderRadius: 5, padding: '1px 5px' }}>默认</span>}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 11.5, color: T3.sub, lineHeight: 1.6, marginTop: 11,
            background: '#FBF7F8', borderRadius: 10, padding: '9px 11px' }}>{curTrack.desc}</div>
        </C3>

        <C3 pad={15}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T3.sub, letterSpacing: .5, marginBottom: 11 }}>词库开关</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.values(window.CATS).map((c) => {
              const on = enabledCats.includes(c.key);
              return (
                <div key={c.key} onClick={() => edit({ enabledCats: on ? enabledCats.filter((x) => x !== c.key) : [...enabledCats, c.key] })}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <span style={{ width: 34, height: 19, borderRadius: 999, background: on ? T3.red : '#E3DBDC', position: 'relative', transition: 'background .15s', flexShrink: 0 }}>
                    <span style={{ position: 'absolute', top: 2, left: on ? 17 : 2, width: 15, height: 15, borderRadius: '50%', background: '#fff', transition: 'left .15s', boxShadow: '0 1px 2px rgba(0,0,0,.2)' }} />
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: on ? T3.ink : T3.sub }}>{c.name}</span>
                </div>
              );
            })}
          </div>
        </C3>

        <C3 pad={15}>
          <div style={{ fontSize: 12.5, fontWeight: 800, color: T3.sub, letterSpacing: .5, marginBottom: 11 }}>风险分级</div>
          <RL />
        </C3>
      </div>

      {/* 中栏：编辑器 / 结果 */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <C3 pad={0} style={{ overflow: 'hidden' }}>
          {/* 顶部工具条 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${T3.line}` }}>
            <div style={{ display: 'flex', background: '#F4EEEF', borderRadius: 10, padding: 3 }}>
              {[['edit', '✍️ 编辑'], ['result', '🔍 检测结果']].map(([k, lb]) => (
                <div key={k} onClick={() => edit({ tab: k })}
                  style={{ fontSize: 13, fontWeight: 700, padding: '6px 14px', borderRadius: 8, cursor: 'pointer',
                    background: tab === k ? '#fff' : 'transparent', color: tab === k ? T3.ink : T3.sub,
                    boxShadow: tab === k ? '0 1px 3px rgba(0,0,0,.08)' : 'none' }}>{lb}</div>
              ))}
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <B3 kind="ghost" size="sm" onClick={loadSample}>示例文案</B3>
              <B3 kind="ghost" size="sm" onClick={clearAll}>清空</B3>
            </div>
          </div>

          {/* 主体 */}
          <div style={{ padding: 16, minHeight: 360 }}>
            {tab === 'edit' ? (
              <div>
                <input value={title} onChange={(e) => edit({ title: e.target.value })} placeholder="笔记标题（建议 ≤20 字，含 emoji 更吸睛）"
                  style={{ width: '100%', border: 'none', outline: 'none', fontSize: 18, fontWeight: 700, color: T3.ink,
                    padding: '4px 0 10px', borderBottom: `1px solid ${T3.line}`, fontFamily: 'inherit', background: 'transparent' }} />
                <textarea value={body} onChange={(e) => edit({ body: e.target.value, selected: null, view: 'list' })}
                  placeholder="把你的小红书正文粘贴到这里，发布前先排雷～"
                  style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', minHeight: 300, marginTop: 12,
                    fontSize: 15.5, lineHeight: 2, color: '#2A2425', fontFamily: 'inherit', background: 'transparent' }} />
              </div>
            ) : (
              <div>
                {title && <div style={{ fontSize: 18, fontWeight: 700, color: T3.ink, marginBottom: 14 }}>{title}</div>}
                <window.Highlighted tokens={result.tokens} selected={selected} onSelect={onSelect} />
              </div>
            )}
          </div>

          {/* 底部动作条 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '12px 16px', borderTop: `1px solid ${T3.line}`, background: '#FCFAFA' }}>
            <span style={{ fontSize: 12.5, color: T3.sub }}>{body.length} 字 · 命中 {result.matches.length} 处</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 9 }}>
              <B3 kind="ghost" size="sm" onClick={saveHistory}>存入复盘</B3>
              <B3 kind="soft" size="sm" onClick={() => edit({ modal: 'preview' })} disabled={!body}>发布预览</B3>
              <B3 kind="primary" size="sm" onClick={() => edit({ modal: 'rewrite' })} disabled={!result.matches.length}>✨ AI 一键改写</B3>
            </div>
          </div>
        </C3>
      </div>

      {/* 右栏：评分 + 问题/详情 */}
      <div style={{ width: 388, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 16 }}>
        <C3 pad={16}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <SR score={result.score} color={result.gradeColor} grade={result.grade} size={104} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#3A3334', lineHeight: 1.6, marginBottom: 10 }}>{result.verdict}</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['ban', 'high', 'warn', 'qual'].map((k) => (
                  <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700,
                    color: T3.LV[k].text, background: T3.LV[k].bg, borderRadius: 8, padding: '4px 8px' }}>
                    {T3.LV[k].label} {result.byLevel[k] || 0}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </C3>

        <C3 pad={16} style={{ minHeight: 320 }}>
          {view === 'detail' && selMatch
            ? <window.DetailCard match={selMatch} track={track} onBack={() => edit({ view: 'list', selected: null })} onApplyFix={applyFix} />
            : (<div>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 800, color: T3.ink }}>问题清单</span>
                  <span style={{ marginLeft: 8, fontSize: 12, color: T3.sub }}>共 {result.matches.length} 处 · 点击看出处</span>
                </div>
                <window.IssueList result={result} onSelect={onSelect} selected={selected} />
              </div>)}
        </C3>
      </div>

      {modal === 'rewrite' && <window.RewriteModal result={result} body={body} title={title} track={track} customWords={customWords}
        onClose={() => edit({ modal: null })} onApply={oneClickRewrite} />}
      {modal === 'preview' && <window.PreviewModal result={result} title={title} onClose={() => edit({ modal: null })}
        onRewrite={() => edit({ modal: 'rewrite' })} />}

      {state.toast && <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', zIndex: 60,
        background: T3.ink, color: '#fff', padding: '11px 22px', borderRadius: 999, fontSize: 14, fontWeight: 600,
        boxShadow: '0 8px 30px rgba(0,0,0,.25)' }}>✓ {state.toast}</div>}
    </div>
  );
}

window.DetectView = DetectView;
