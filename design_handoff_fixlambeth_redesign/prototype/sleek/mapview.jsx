// Map view — community reports (stylised map + recent list).
function MapView({ theme }) {
  const { c, acc, r, headFont, headWeight, headLS, sans } = theme;
  const issueOf = (k) => ISSUES.find((i) => i.key === k);
  const legend = [
    { c: CAT_COLORS.env, label: 'Environment' },
    { c: CAT_COLORS.road, label: 'Roads & drains' },
    { c: CAT_COLORS.parks, label: 'Trees & parks' },
    { c: CAT_COLORS.asb, label: 'Noise & ASB' },
  ];

  const mapBg = {
    position: 'relative', height: 280, borderRadius: r, overflow: 'hidden',
    border: `1px solid ${c.border}`, background: c.soft,
    backgroundImage:
      `linear-gradient(${c.border}99 1px, transparent 1px), linear-gradient(90deg, ${c.border}99 1px, transparent 1px)`,
    backgroundSize: '38px 38px',
  };

  return (
    <div style={{ padding: '24px 24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.muted }}>Community</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: theme.tint, color: acc, borderRadius: 100, padding: '6px 12px', fontSize: 12.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
          <Icon n="trending-up" sz={14} color={acc} /> 248 this month
        </span>
      </div>
      <h1 style={{ fontFamily: headFont, fontWeight: headWeight, fontSize: 30, lineHeight: 1.04, letterSpacing: headLS, color: c.ink, margin: '0 0 18px' }}>Reports nearby.</h1>

      {/* stylised map */}
      <div style={mapBg}>
        {/* a couple of "roads" */}
        <div style={{ position: 'absolute', inset: 0 }}>
          <div style={{ position: 'absolute', top: '46%', left: '-10%', width: '120%', height: 14, background: c.surface, transform: 'rotate(-8deg)', opacity: 0.9 }}></div>
          <div style={{ position: 'absolute', top: '-10%', left: '58%', width: 12, height: '120%', background: c.surface, transform: 'rotate(6deg)', opacity: 0.9 }}></div>
          {/* river */}
          <div style={{ position: 'absolute', top: '64%', left: '-10%', width: '120%', height: 26, background: `color-mix(in srgb, ${CAT_COLORS.road} 18%, ${c.soft})`, transform: 'rotate(-14deg)' }}></div>
        </div>
        {RECENT.map((rp, i) => (
          <div key={i} style={{ position: 'absolute', left: `${rp.x}%`, top: `${rp.y}%`, transform: 'translate(-50%,-50%)', display: 'grid', placeItems: 'center' }}>
            <span style={{ position: 'absolute', width: 26, height: 26, borderRadius: '50%', background: `${CAT_COLORS[rp.cat]}22` }}></span>
            <span style={{ width: 14, height: 14, borderRadius: '50%', background: CAT_COLORS[rp.cat], border: '2.5px solid #fff', boxShadow: '0 2px 5px rgba(0,0,0,0.22)' }}></span>
          </div>
        ))}
        <div style={{ position: 'absolute', bottom: 10, right: 10, background: c.surface, borderRadius: 8, padding: '5px 9px', fontSize: 11, fontWeight: 700, color: c.muted, display: 'flex', alignItems: 'center', gap: 5, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <Icon n="navigation" sz={12} color={acc} /> Brixton
        </div>
      </div>

      {/* legend */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', margin: '14px 0 22px' }}>
        {legend.map((l) => (
          <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: c.muted }}>
            <span style={{ width: 9, height: 9, borderRadius: '50%', background: l.c }}></span> {l.label}
          </span>
        ))}
      </div>

      {/* recent list */}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: c.faint, marginBottom: 10 }}>Recent reports</div>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {RECENT.map((rp, i) => {
          const it = issueOf(rp.key);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 2px', borderBottom: i < RECENT.length - 1 ? `1px solid ${c.border}` : 'none' }}>
              <span style={{ width: 36, height: 36, borderRadius: Math.max(8, r - 3), background: theme.tint, display: 'grid', placeItems: 'center', flexShrink: 0 }}><Icon n={it.icon} sz={18} color={acc} /></span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: c.ink, letterSpacing: '-0.01em' }}>{it.label}</div>
                <div style={{ fontSize: 12, color: c.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{rp.where}</div>
              </div>
              <span style={{ fontSize: 11.5, color: c.faint, fontWeight: 600, whiteSpace: 'nowrap' }}>{rp.ago}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
Object.assign(window, { MapView });
