/**
 * Landing page for World Monitor — shown at / when not in dashboard.
 * Renders into #app: hero, features, CTA to /monitor-world, footer (Terms, Privacy, Support).
 * Uses existing design tokens (--bg, --text, --accent) for consistency.
 */

const FEATURES = [
  'Real-time conflict tracking and geopolitical monitoring',
  'Military ADS-B flight and maritime AIS ship tracking',
  'Live news, markets, and AI-powered intelligence briefs',
  '435+ sources, 45 map layers, 21 languages',
];

function getStyles(): string {
  return `
.landing { min-height: 100vh; display: flex; flex-direction: column; background: var(--bg, #0a0f0a); color: var(--text, #e8e8e8); font-family: var(--font-mono, system-ui, sans-serif); }
.landing a { color: var(--accent, #4ade80); text-decoration: none; }
.landing a:hover { text-decoration: underline; }
.landing-header { padding: 1rem 1.5rem; border-bottom: 1px solid var(--border, #2a2a2a); display: flex; align-items: center; justify-content: space-between; flex-shrink: 0; }
.landing-logo { font-weight: 700; font-size: 1.1rem; letter-spacing: 0.02em; color: var(--text); }
.landing-hero { padding: 3rem 1.5rem 4rem; text-align: center; max-width: 720px; margin: 0 auto; }
.landing-hero h1 { font-size: clamp(1.75rem, 4vw, 2.25rem); font-weight: 700; margin-bottom: 0.75rem; line-height: 1.2; }
.landing-hero p { font-size: 1.05rem; color: var(--text-secondary, #ccc); line-height: 1.6; margin-bottom: 0; }
.landing-features { padding: 0 1.5rem 3rem; max-width: 560px; margin: 0 auto; }
.landing-features h2 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; color: var(--text-secondary); }
.landing-features ul { list-style: none; }
.landing-features li { padding: 0.4rem 0; padding-left: 1.25rem; position: relative; color: var(--text-secondary); font-size: 0.95rem; }
.landing-features li::before { content: ''; position: absolute; left: 0; top: 0.65rem; width: 6px; height: 6px; border-radius: 50%; background: var(--accent, #4ade80); }
.landing-footer { margin-top: auto; padding: 1.5rem; border-top: 1px solid var(--border, #2a2a2a); text-align: center; font-size: 0.9rem; color: var(--text-dim, #888); }
.landing-footer a { margin: 0 0.5rem; }
`;
}

function buildLandingHTML(): string {
  const featuresList = FEATURES.map(
    (f) => `<li>${escapeHtml(f)}</li>`
  ).join('');
  return `
<div class="landing">
  <header class="landing-header">
    <span class="landing-logo">World Monitor</span>
  </header>
  <main class="landing-hero">
    <h1>Real-Time Global Intelligence Dashboard</h1>
    <p>AI-powered situation awareness: live news, conflict tracking, military and maritime monitoring, markets, and geopolitical data in one view. Used by 2M+ people across 190+ countries.</p>
  </main>
  <section class="landing-features">
    <h2>Highlights</h2>
    <ul>${featuresList}</ul>
  </section>
  <footer class="landing-footer">
    <a href="/terms">Terms</a>
    <a href="/privacy">Privacy</a>
    <a href="/support">Support</a>
  </footer>
</div>
`;
}

function escapeHtml(s: string): string {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}

/**
 * Renders the landing page into the given container (e.g. #app).
 * Clears the container first, injects scoped styles and markup.
 */
export function renderLanding(containerId: string): void {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = '';
  const style = document.createElement('style');
  style.textContent = getStyles();
  style.setAttribute('data-landing', 'true');
  el.appendChild(style);

  const wrap = document.createElement('div');
  wrap.innerHTML = buildLandingHTML();
  el.appendChild(wrap);
}
