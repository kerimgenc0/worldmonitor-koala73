/**
 * On-demand insights refresh: acquire a short-lived lock, then run the insights
 * seed (digest warm + clustering + LLM + write to news:insights:v1).
 * Called by bootstrap when insights are missing or older than 1 hour.
 * Node runtime required to import and run the seed script.
 */
export const config = { runtime: 'nodejs', maxDuration: 60 };

const LOCK_KEY = 'lock:insights:refresh';
const LOCK_TTL_SEC = 600; // 10 min — only one refresh at a time (single runner)

async function tryAcquireRefreshLock() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return false;
  const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const setUrl = `${url}/set/${encodeURIComponent(LOCK_KEY)}/${encodeURIComponent(runId)}/NX/EX/${LOCK_TTL_SEC}`;
  const resp = await fetch(setUrl, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(5_000),
  });
  if (!resp.ok) return false;
  const data = await resp.json();
  return data?.result === 'OK';
}

export default async function handler(req) {
  if (req.method !== 'POST' && req.method !== 'GET') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const locked = await tryAcquireRefreshLock();
  if (!locked) {
    return new Response(JSON.stringify({ ok: true, refreshed: false, reason: 'lock_not_acquired' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { runSeedAsync } = await import('../scripts/_seed-utils.mjs');
    const { fetchInsights } = await import('../scripts/seed-insights.mjs');

    const CANONICAL_KEY = 'news:insights:v1';
    const LKG_KEY = 'news:insights:lkg:v1';
    const CACHE_TTL = 86400;
    const LKG_TTL = 86400 * 7;

    function validate(data) {
      return Array.isArray(data?.topStories) && data.topStories.length >= 1;
    }

    await runSeedAsync('news', 'insights', CANONICAL_KEY, fetchInsights, {
      validateFn: validate,
      ttlSeconds: CACHE_TTL,
      extraKeys: [{ key: LKG_KEY, transform: (data) => data, ttl: LKG_TTL }],
      sourceVersion: 'digest-clustering-v1',
    });

    return new Response(JSON.stringify({ ok: true, refreshed: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[refresh-insights]', err?.message || err);
    return new Response(
      JSON.stringify({ ok: false, error: err?.message || 'Seed failed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
