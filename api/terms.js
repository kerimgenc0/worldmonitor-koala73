/**
 * Terms of Use page — served at /terms via rewrite.
 * Returns full HTML so /terms works even when static files aren't at root.
 */
const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Terms of Use — World Monitor</title>
  <style>
    * { box-sizing: border-box; }
    body { background: #0a0f0a; color: #e0e0e0; font-family: system-ui, -apple-system, sans-serif;
           line-height: 1.6; max-width: 720px; margin: 0 auto; padding: 2rem 1.5rem; }
    h1 { font-size: 1.75rem; margin-bottom: 0.5rem; color: #fff; }
    .updated { color: #888; font-size: 0.875rem; margin-bottom: 2rem; }
    h2 { font-size: 1.1rem; margin-top: 1.75rem; margin-bottom: 0.5rem; color: #c0e0c0; }
    p, li { color: #b0b0b0; margin-bottom: 0.75rem; }
    ul { padding-left: 1.25rem; }
    a { color: #4ade80; text-decoration: none; }
    a:hover { text-decoration: underline; }
    footer { margin-top: 2.5rem; padding-top: 1rem; border-top: 1px solid #2a3a2a; font-size: 0.875rem; color: #888; }
  </style>
</head>
<body>
  <h1>Terms of Use</h1>
  <p class="updated">Last updated: October 8, 2026</p>

  <p>These terms govern your use of World Monitor — the iOS app, the website and related services (“the service”) operated by Kerim Genç. By downloading, installing or using the service you agree to them. If you do not agree, do not use the service.</p>

  <h2>1. What the service is</h2>
  <p>World Monitor aggregates publicly available information and presents it on an interactive map and in feeds: news headlines from many outlets, conflict and natural-event layers, infrastructure and cyber-threat layers, public-safety incident reports built from dispatch radio, military aircraft positions from open ADS-B data, regional intelligence briefs, live television channels and other indicators. We do not create the underlying data and we do not verify it.</p>

  <h2>2. Information only — not for emergencies</h2>
  <p>Everything in the service is provided for general information. It is not professional, military, security, financial, legal or investment advice, and you must not rely on it as the sole basis for any decision. <strong>The service is not an emergency service.</strong> It is not monitored by emergency personnel, may be delayed, incomplete or wrong, and must never be used instead of contacting your local emergency services. If you are in danger, contact them directly.</p>

  <h2>3. AI-generated content</h2>
  <p>Incident headlines, reports and radio transcripts, article analyses, regional briefs and weekly digests are generated automatically by artificial intelligence. They are marked as such in the app. AI output can be inaccurate, incomplete or misleading, is not an official record of any event, and may describe a situation differently from how it actually happened. Locations shown for incidents are approximate. Verify with official or primary sources before acting on anything you read in the service.</p>

  <h2>4. Data sources and third-party content</h2>
  <ul>
    <li><strong>Dispatch radio.</strong> Incident audio and transcripts come from publicly broadcast public-safety radio, captured and transcribed by a third-party incident data provider. It is shown as received and is not an official record. You may not use this content to interfere with, impersonate or obstruct emergency operations.</li>
    <li><strong>News.</strong> We show headlines, short excerpts and AI-written summaries and link to the original articles. Articles remain the property of their publishers and are subject to the publishers' own terms.</li>
    <li><strong>Maps.</strong> Map data © Mapbox and © OpenStreetMap contributors, used under their terms.</li>
    <li><strong>Flights.</strong> Aircraft positions come from open ADS-B networks and may be delayed, filtered or missing; they are not an air-traffic-control feed.</li>
    <li><strong>Live TV.</strong> Channels are third-party streams embedded from their providers and subject to those providers' terms; availability can change at any time.</li>
  </ul>
  <p>We do not control, endorse or take responsibility for third-party content, and the availability and accuracy of all data depend on external providers.</p>

  <h2>5. Subscriptions and purchases</h2>
  <p>World Monitor is free to use with a daily reading limit. Premium unlocks unlimited stories, full AI analysis, regional briefs, incident radio audio and scene photos. Premium is available as an auto-renewing subscription or a one-time lifetime purchase, sold through Apple. Payment is charged to your Apple Account at confirmation of purchase. Subscriptions renew automatically unless cancelled at least 24 hours before the end of the current period; manage or cancel them in your App Store account settings. Prices may vary by region and can change with notice. Refunds are handled by Apple under its policies. We do not store your payment information.</p>

  <h2>6. Acceptable use</h2>
  <p>You may use the service for lawful personal or internal business purposes. You agree not to:</p>
  <ul>
    <li>use the service for any unlawful purpose or in a way that could endanger anyone;</li>
    <li>scrape, record, redistribute or resell the service's data, audio, transcripts or AI output;</li>
    <li>abuse, overload or attempt to compromise our systems or circumvent technical limits;</li>
    <li>reverse-engineer, decompile or tamper with the app; or</li>
    <li>remove or alter any copyright, trademark or attribution notices.</li>
  </ul>

  <h2>7. Intellectual property</h2>
  <p>The World Monitor name, branding and the design of the service are our property. Third-party data displayed in the service remains the property of its respective owners. Parts of the underlying web software may be subject to open-source licences as indicated in the project.</p>

  <h2>8. No warranty</h2>
  <p>The service and all content are provided “as is” and “as available”, without warranties of any kind, express or implied, including accuracy, completeness, timeliness, fitness for a particular purpose and uninterrupted availability. You use the service at your own risk.</p>

  <h2>9. Limitation of liability</h2>
  <p>To the fullest extent permitted by law, we are not liable for any indirect, incidental, special, consequential or punitive damages, or any loss of data, profit or safety, arising from your use of or inability to use the service or any content in it. Where liability cannot be excluded, it is limited to the amount you paid us in the twelve months before the claim.</p>

  <h2>10. Service changes and termination</h2>
  <p>We may modify, suspend or discontinue any part of the service at any time, and may restrict access for breach of these terms. Data layers and third-party sources may be added or removed as providers change.</p>

  <h2>11. Apple</h2>
  <p>The app is distributed through the App Store. These terms are between you and us, not Apple; Apple is not responsible for the app or its content and has no obligation to provide support. Apple's standard <a href="https://www.apple.com/legal/internet-services/itunes/dev/stdeula/">End User License Agreement</a> also applies, and Apple is a third-party beneficiary of these terms with the right to enforce them against you.</p>

  <h2>12. Changes</h2>
  <p>We may update these terms; the date above changes when we do. Continued use after a change constitutes acceptance. For material changes we will provide notice where feasible.</p>

  <h2>13. Contact</h2>
  <p>Questions about these terms: <a href="mailto:kerim@world-monitor.net">kerim@world-monitor.net</a>.</p>

  <footer>World Monitor · <a href="/privacy">Privacy Policy</a></footer>
</body>
</html>`;

export const config = { runtime: 'edge' };

export default function handler(req) {
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
