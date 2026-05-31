// Step 2 — details form.
function Step2({ theme, issue, form, setForm, onBack, onContinue }) {
  const { c, acc, r, headFont, headWeight, headLS, sans, tint } = theme;
  const [focus, setFocus] = React.useState(null);
  const [touched, setTouched] = React.useState(false);
  const fileRef = React.useRef(null);

  const pcOk = !form.postcode || /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(form.postcode.trim());
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const labelStyle = { display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.muted, marginBottom: 7 };
  const inputStyle = (name, ok = true) => ({
    width: '100%', boxSizing: 'border-box', background: c.surface, color: c.ink,
    border: `1.5px solid ${!ok ? '#c0533f' : focus === name ? acc : c.border}`,
    borderRadius: r, padding: '12px 14px', fontFamily: sans, fontSize: 15, outline: 'none',
    transition: 'border-color .15s', resize: 'vertical',
  });

  function Field({ label, name, children }) {
    return <div style={{ marginBottom: 16 }}><label style={labelStyle}>{label}</label>{children}</div>;
  }

  function onContinueClick() {
    setTouched(true);
    if (!pcOk) return;
    onContinue();
  }

  function onPhoto(e) {
    const file = e.target.files && e.target.files[0];
    if (file) setForm({ ...form, photo: file.name, photoUrl: URL.createObjectURL(file) });
  }

  return (
    <div style={{ padding: '20px 24px 28px' }}>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', color: c.muted, fontFamily: sans, fontSize: 13.5, fontWeight: 600, padding: 0, marginBottom: 16 }}>
        <Icon n="arrow-left" sz={16} color={c.muted} /> Back
      </button>

      {/* selected issue chip */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: tint, border: `1px solid ${acc}33`, borderRadius: 100, padding: '6px 12px 6px 8px', marginBottom: 18 }}>
        <span style={{ width: 24, height: 24, borderRadius: '50%', background: acc, display: 'grid', placeItems: 'center' }}><Icon n={issue.icon} sz={14} color="#fff" /></span>
        <span style={{ fontSize: 13, fontWeight: 700, color: acc }}>{issue.label}</span>
      </div>

      <h1 style={{ fontFamily: headFont, fontWeight: headWeight, fontSize: 27, lineHeight: 1.08, letterSpacing: headLS, color: c.ink, margin: '0 0 6px' }}>Where and what?</h1>
      <p style={{ fontSize: 14.5, lineHeight: 1.5, color: c.muted, margin: '0 0 20px' }}>Add the details so the {issue.team} team can act quickly.</p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: c.ink, whiteSpace: 'nowrap' }}>Step 2 of 3</span>
        <div style={{ flex: 1, display: 'flex', gap: 5 }}>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: acc }}></span>
          <span style={{ flex: 1, height: 4, borderRadius: 100, background: c.track }}></span>
        </div>
      </div>

      <Field label="Street address" name="location">
        <input style={inputStyle('location')} value={form.location} onChange={set('location')} onFocus={() => setFocus('location')} onBlur={() => setFocus(null)} placeholder="e.g. 42 Brixton Road" />
      </Field>

      <Field label="Postcode" name="postcode">
        <input style={inputStyle('postcode', !(touched && !pcOk))} value={form.postcode} onChange={set('postcode')} onFocus={() => setFocus('postcode')} onBlur={() => setFocus(null)} placeholder="e.g. SW9 8DN" autoCapitalize="characters" />
        {touched && !pcOk && <span style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#c0533f', fontSize: 12, fontWeight: 600, marginTop: 6 }}><Icon n="circle-alert" sz={13} color="#c0533f" /> Enter a valid UK postcode</span>}
      </Field>

      <Field label="Describe the issue" name="desc">
        <textarea rows={4} style={inputStyle('desc')} value={form.desc} onChange={set('desc')} onFocus={() => setFocus('desc')} onBlur={() => setFocus(null)} placeholder="Size, exact spot, how long it's been there, any safety risk…" />
      </Field>

      <Field label="When did you notice it?" name="when">
        <input style={inputStyle('when')} value={form.when} onChange={set('when')} onFocus={() => setFocus('when')} onBlur={() => setFocus(null)} placeholder="e.g. This morning, last week…" />
      </Field>

      <Field label="Your name" name="name">
        <input style={inputStyle('name')} value={form.name} onChange={set('name')} onFocus={() => setFocus('name')} onBlur={() => setFocus(null)} placeholder="e.g. Sarah Jones" />
      </Field>

      <Field label="Photo (optional)" name="photo">
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onPhoto} />
        {form.photoUrl ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, border: `1.5px solid ${c.border}`, borderRadius: r, padding: 10 }}>
            <img src={form.photoUrl} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
            <span style={{ flex: 1, fontSize: 13, color: c.ink, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.photo}</span>
            <button onClick={() => setForm({ ...form, photo: '', photoUrl: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><Icon n="x" sz={16} color={c.muted} /></button>
          </div>
        ) : (
          <button onClick={() => fileRef.current && fileRef.current.click()} style={{ width: '100%', background: c.soft, border: `1.5px dashed ${c.border}`, borderRadius: r, padding: '18px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, fontFamily: sans }}>
            <Icon n="camera" sz={22} color={c.muted} />
            <span style={{ fontSize: 13, color: c.muted, fontWeight: 600 }}>Add a photo</span>
          </button>
        )}
      </Field>

      <button onClick={onContinueClick} style={{ width: '100%', marginTop: 6, background: acc, color: '#fff', border: 'none', borderRadius: r, padding: '15px', fontFamily: sans, fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.01em', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        Prepare my report <Icon n="arrow-right" sz={17} color="#fff" />
      </button>
    </div>
  );
}
Object.assign(window, { Step2 });
