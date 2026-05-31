// Step 3 — confirm & generated email.
function Step3({ theme, issue, form, onRestart, goMap }) {
  const { c, acc, r, headFont, headWeight, headLS, sans, tint, soft } = theme;
  const { to, subject, body } = buildEmail(issue, form);
  const [copied, setCopied] = React.useState(false);
  const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  function copy() {
    const text = `To: ${to}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard && navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div style={{ padding: '24px 24px 28px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.ink, whiteSpace: 'nowrap' }}>Step 3 of 3</span>
        <div style={{ flex: 1, display: 'flex', gap: 5 }}>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
        </div>
      </div>

      <div style={{ width: 48, height: 48, borderRadius: '50%', background: tint, display: 'grid', placeItems: 'center', marginBottom: 16 }}>
        <Icon n="check" sz={26} color={acc} />
      </div>
      <h1 style={{ fontFamily: headFont, fontWeight: headWeight, fontSize: 27, lineHeight: 1.08, letterSpacing: headLS, color: c.ink, margin: '0 0 6px' }}>Your report is ready.</h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.5, color: c.muted, margin: '0 0 20px' }}>We’ve written it for you. Open your email app and just hit send — nothing else to fill in.</p>

      {/* email preview card */}
      <div style={{ border: `1px solid ${c.border}`, borderRadius: r, overflow: 'hidden', marginBottom: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${c.border}`, background: c.soft }}>
          <div style={{ display: 'flex', gap: 8, fontSize: 13, marginBottom: 4 }}><span style={{ color: c.faint, fontWeight: 600, width: 52 }}>To</span><span style={{ color: c.ink, fontWeight: 600 }}>{to}</span></div>
          <div style={{ display: 'flex', gap: 8, fontSize: 13 }}><span style={{ color: c.faint, fontWeight: 600, width: 52 }}>Subject</span><span style={{ color: c.ink, fontWeight: 600 }}>{subject}</span></div>
        </div>
        <div style={{ padding: '14px 16px', fontSize: 12.5, lineHeight: 1.6, color: c.muted, whiteSpace: 'pre-wrap', maxHeight: 168, overflowY: 'auto', fontFamily: sans }} className="scr">{body}</div>
      </div>

      <a href={mailto} style={{ width: '100%', boxSizing: 'border-box', background: acc, color: '#fff', borderRadius: r, padding: '15px', fontFamily: sans, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, textDecoration: 'none' }}>
        <Icon n="mail" sz={17} color="#fff" /> Open email app to send
      </a>

      <button onClick={copy} style={{ width: '100%', marginTop: 10, background: 'none', color: c.ink, border: `1.5px solid ${c.border}`, borderRadius: r, padding: '12px', fontFamily: sans, fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <Icon n={copied ? 'check' : 'copy'} sz={15} color={copied ? acc : c.ink} /> {copied ? 'Copied to clipboard' : 'Button not working? Copy the text'}
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18, padding: '12px 14px', background: c.soft, borderRadius: r, fontSize: 12.5, color: c.muted, lineHeight: 1.45 }}>
        <Icon n="map-pin" sz={16} color={acc} />
        <span>Your report has been added to the <b style={{ color: c.ink, fontWeight: 700 }}>Lambeth reports map</b> so neighbours can see it too.</span>
      </div>

      <button onClick={onRestart} style={{ width: '100%', marginTop: 16, background: 'none', border: 'none', cursor: 'pointer', color: c.muted, fontFamily: sans, fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        <Icon n="rotate-ccw" sz={15} color={c.muted} /> Report another issue
      </button>
    </div>
  );
}
Object.assign(window, { Step3 });
