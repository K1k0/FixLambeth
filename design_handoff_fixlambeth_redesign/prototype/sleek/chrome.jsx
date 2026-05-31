// Phone chrome: status bar, app header, bottom nav, and the PhoneShell wrapper.
// Exports to window: PhoneShell.

function StatusBar({ theme }) {
  const { c } = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 28px 8px', fontSize: 14, fontWeight: 600, color: c.ink }}>
      <span>9:41</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width="17" height="11" viewBox="0 0 17 11" fill={c.ink}><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>
        <svg width="16" height="11" viewBox="0 0 16 12" fill="none" stroke={c.ink} strokeWidth="1.6" strokeLinecap="round"><path d="M1 4.2a11 11 0 0 1 14 0"/><path d="M3.4 6.8a7.2 7.2 0 0 1 9.2 0"/><circle cx="8" cy="9.6" r="1.1" fill={c.ink} stroke="none"/></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3" stroke={c.ink} strokeOpacity="0.4"/><rect x="2.2" y="2.2" width="16" height="7.6" rx="1.6" fill={c.ink}/><rect x="23" y="3.5" width="2" height="5" rx="1" fill={c.ink} fillOpacity="0.4"/></svg>
      </div>
    </div>
  );
}

function AppHeader({ theme }) {
  const { c, acc } = theme;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 24px 14px', borderBottom: `1px solid ${c.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: acc, display: 'grid', placeItems: 'center' }}>
          <div style={{ width: 9, height: 9, borderRadius: 2, background: '#fff', transform: 'rotate(45deg)' }}></div>
        </div>
        <span style={{ fontSize: 16.5, fontWeight: 700, color: c.ink, letterSpacing: '-0.02em' }}>Fix Lambeth</span>
      </div>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: c.muted, border: `1px solid ${c.border}`, borderRadius: 100, padding: '6px 11px' }}>
        <Icon n="globe" sz={14} /> EN
      </span>
    </div>
  );
}

function BottomNav({ theme, tab, setTab }) {
  const { c, acc } = theme;
  const items = [{ k: 'report', label: 'Report', icon: 'circle-plus' }, { k: 'map', label: 'Map', icon: 'map' }];
  return (
    <div style={{ display: 'flex', borderTop: `1px solid ${c.border}`, background: c.surface, paddingBottom: 8 }}>
      {items.map((it) => {
        const on = tab === it.k;
        return (
          <button key={it.k} onClick={() => setTab(it.k)} style={{
            flex: 1, background: 'none', border: 'none', cursor: 'pointer',
            padding: '12px 0 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
            color: on ? acc : c.faint, fontFamily: theme.sans,
          }}>
            <Icon n={it.icon} sz={22} color={on ? acc : c.faint} />
            <span style={{ fontSize: 11.5, fontWeight: on ? 700 : 600 }}>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function PhoneShell({ theme, tab, setTab, children }) {
  const { c } = theme;
  return (
    <div style={{ width: 414, height: 880, background: '#0a0a0a', borderRadius: 52, padding: 11, boxShadow: '0 50px 90px -30px rgba(20,25,40,0.42)', flexShrink: 0 }}>
      <div style={{ width: '100%', height: '100%', background: c.surface, borderRadius: 42, overflow: 'hidden', display: 'flex', flexDirection: 'column', fontFamily: theme.sans }}>
        <StatusBar theme={theme} />
        <AppHeader theme={theme} />
        <div id="mainscroll" className="scr" style={{ flex: 1, overflowY: 'auto', background: c.surface }}>
          {children}
        </div>
        <BottomNav theme={theme} tab={tab} setTab={setTab} />
      </div>
    </div>
  );
}

Object.assign(window, { PhoneShell });
