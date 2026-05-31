// Shared design tokens, theme builder, icon helper, data + email generator.
// Exports to window: WARMTH, ISSUES, buildTheme, Icon, buildEmail, RECENT.

const WARMTH = {
  Warm:    { bg: '#f3f1ea', surface: '#ffffff', soft: '#faf9f5', ink: '#1c1a16', muted: '#6f695e', faint: '#9a948a', border: '#e7e2d7', track: '#e7e2d7' },
  Neutral: { bg: '#f4f4f5', surface: '#ffffff', soft: '#fafafa',  ink: '#18181b', muted: '#71717a', faint: '#a1a1aa', border: '#e6e6e9', track: '#e6e6e9' },
  Cool:    { bg: '#eef1f6', surface: '#ffffff', soft: '#f7f9fc',  ink: '#15191f', muted: '#69707e', faint: '#9aa0ad', border: '#e1e5ec', track: '#e1e5ec' },
};

const ISSUES = [
  { key: 'flytipping',  label: 'Fly-tipping',           icon: 'trash-2',      team: 'Environment', email: 'environment@lambeth.gov.uk' },
  { key: 'pothole',     label: 'Pothole / Pavement',    icon: 'traffic-cone', team: 'Highways',    email: 'highways@lambeth.gov.uk' },
  { key: 'streetlight', label: 'Broken streetlight',    icon: 'lightbulb',    team: 'Highways',    email: 'highways@lambeth.gov.uk' },
  { key: 'graffiti',    label: 'Graffiti',              icon: 'spray-can',    team: 'Environment', email: 'environment@lambeth.gov.uk' },
  { key: 'noise',       label: 'Noise nuisance',        icon: 'volume-2',     team: 'Noise team',  email: 'noise@lambeth.gov.uk' },
  { key: 'drain',       label: 'Blocked drain',         icon: 'droplets',     team: 'Highways',    email: 'highways@lambeth.gov.uk' },
  { key: 'tree',        label: 'Tree / Overgrowth',     icon: 'trees',        team: 'Parks',       email: 'parks@lambeth.gov.uk' },
  { key: 'asb',         label: 'Anti-social behaviour', icon: 'shield-alert', team: 'Safer comms', email: 'ppars@lambeth.gov.uk' },
];

// Recent reports for the map view (demo data).
const RECENT = [
  { key: 'flytipping',  where: 'Coldharbour Lane, SW9',  ago: '2h ago',  cat: 'env',   x: 38, y: 30 },
  { key: 'pothole',     where: 'Brixton Road, SW9',      ago: '5h ago',  cat: 'road',  x: 62, y: 44 },
  { key: 'graffiti',    where: 'Acre Lane, SW2',         ago: 'Today',   cat: 'env',   x: 25, y: 58 },
  { key: 'streetlight', where: 'Clapham Park Rd, SW4',   ago: 'Yesterday', cat: 'road', x: 72, y: 66 },
  { key: 'tree',        where: 'Kennington Park, SE11',  ago: '2 days',  cat: 'parks', x: 54, y: 22 },
  { key: 'noise',       where: 'Stockwell Road, SW9',    ago: '3 days',  cat: 'asb',   x: 46, y: 74 },
];

const CAT_COLORS = { env: '#c2683f', road: '#3f4d7a', parks: '#4f7a5e', asb: '#9a7a3f' };

function buildTheme(t) {
  const c = WARMTH[t.warmth] || WARMTH.Cool;
  const acc = t.accent;
  const headFont = t.headline === 'Serif' ? "'Newsreader', Georgia, serif" : "'Hanken Grotesk', system-ui, sans-serif";
  return {
    c, acc, r: t.radius, iconStyle: t.iconStyle,
    headFont, headWeight: t.headline === 'Serif' ? 500 : 700,
    headLS: t.headline === 'Serif' ? '-0.01em' : '-0.03em',
    sans: "'Public Sans', system-ui, sans-serif",
    tint: `color-mix(in srgb, ${acc} 8%, ${c.surface})`,
    tintStrong: `color-mix(in srgb, ${acc} 14%, ${c.surface})`,
    accSoft: `color-mix(in srgb, ${acc} 10%, ${c.surface})`,
  };
}

function Icon({ n, sz = 22, color, strokeW }) {
  return <span className="icowrap" style={{ width: sz, height: sz, color, display: 'block', strokeWidth: strokeW }} key={n + '-' + color}><i data-lucide={n}></i></span>;
}

function buildEmail(issue, f) {
  const to = issue.email;
  const subject = `${issue.label} report — ${f.location || 'Lambeth'}`;
  const body =
`Dear ${issue.team} team,

I would like to report a ${issue.label.toLowerCase()} issue in Lambeth.

Location: ${f.location || '—'}
Postcode: ${f.postcode || '—'}
When noticed: ${f.when || '—'}

Details:
${f.desc || '—'}

${f.photo ? 'A photo is attached to this email.' : ''}
Please could the relevant team look into this.

Kind regards,
${f.name || 'A Lambeth resident'}`;
  return { to, subject, body };
}

Object.assign(window, { WARMTH, ISSUES, RECENT, CAT_COLORS, buildTheme, Icon, buildEmail });
