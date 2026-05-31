// Step 1 — issue picker.
function Step1({ theme, sel, setSel, onContinue }) {
  const { c, acc, r, iconStyle, tint, headFont, headWeight, headLS, sans } = theme;

  function tile(it, selected) {
    const base = { width: 42, height: 42, borderRadius: Math.max(8, r - 2), display: 'grid', placeItems: 'center', flexShrink: 0 };
    if (iconStyle === 'Tinted tile') return <div style={{ ...base, background: selected ? acc : tint }}><Icon n={it.icon} color={selected ? '#fff' : acc} /></div>;
    if (iconStyle === 'Hairline') return <div style={{ ...base, border: `1.5px solid ${selected ? acc : c.border}` }}><Icon n={it.icon} color={selected ? acc : c.ink} /></div>;
    return <div style={{ ...base, width: 28, height: 28 }}><Icon n={it.icon} sz={24} color={selected ? acc : c.ink} /></div>;
  }

  return (
    <div style={{ padding: '24px 24px 28px' }}>
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: c.muted, marginBottom: 12 }}>Lambeth Council</div>
      <h1 style={{ fontFamily: headFont, fontWeight: headWeight, fontSize: 34, lineHeight: 1.04, letterSpacing: headLS, color: c.ink, margin: '0 0 12px' }}>Report a problem.</h1>
      <p style={{ fontSize: 15, lineHeight: 1.55, color: c.muted, margin: '0 0 22px', maxWidth: 330 }}>Choose what you’d like to report. We’ll route it to the right team and write the email for you.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.ink, whiteSpace: 'nowrap' }}>Step 1 of 3</span>
        <div style={{ flex: 1, display: 'flex', gap: 5 }}>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: c.track }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: c.track }}></span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11 }}>
        {ISSUES.map((it) => {
          const selected = sel === it.key;
          return (
            <button key={it.key} onClick={() => setSel(it.key)} style={{
              textAlign: 'left', cursor: 'pointer', fontFamily: sans,
              background: selected ? tint : c.surface, border: `1.5px solid ${selected ? acc : c.border}`,
              borderRadius: r, padding: '15px 14px 16px', display: 'flex', flexDirection: 'column', gap: 12, position: 'relative',
              transition: 'border-color .15s, background .15s',
            }}>
              {selected && (
                <span style={{ position: 'absolute', top: 12, right: 12, width: 18, height: 18, borderRadius: '50%', background: acc, display: 'grid', placeItems: 'center' }}>
                  <Icon n="check" sz={12} color="#fff" />
                </span>
              )}
              {tile(it, selected)}
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: c.ink, lineHeight: 1.2, letterSpacing: '-0.01em' }}>{it.label}</div>
                <div style={{ fontSize: 11.5, color: c.muted, marginTop: 3, fontWeight: 500 }}>{it.team}</div>
              </div>
            </button>
          );
        })}
      </div>

      <button onClick={onContinue} style={{ width: '100%', marginTop: 20, background: acc, color: '#fff', border: 'none', borderRadius: r, padding: '15px', fontFamily: sans, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Continue <Icon n="arrow-right" sz={17} color="#fff" />
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 18, paddingTop: 16, borderTop: `1px solid ${c.border}`, fontSize: 12, color: c.muted, fontWeight: 500 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon n="user-round-x" sz={14} /> No account</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon n="languages" sz={14} /> 5 languages</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Icon n="clock" sz={14} /> ~1 min</span>
      </div>
    </div>
  );
}
Object.assign(window, { Step1 });
