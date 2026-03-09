import { getCorsHeaders, isDisallowedOrigin } from './_cors.js';
import { validateApiKey } from './_api-key.js';

export const config = { runtime: 'edge' };

const BOOTSTRAP_CACHE_KEYS = {
  earthquakes:      'seismology:earthquakes:v1',
  outages:          'infra:outages:v1',
  serviceStatuses:  'infra:service-statuses:v1',
  marketQuotes:     'market:stocks-bootstrap:v1',
  commodityQuotes:  'market:commodities-bootstrap:v1',
  sectors:          'market:sectors:v1',
  etfFlows:         'market:etf-flows:v1',
  macroSignals:     'economic:macro-signals:v1',
  bisPolicy:        'economic:bis:policy:v1',
  bisExchange:      'economic:bis:eer:v1',
  bisCredit:        'economic:bis:credit:v1',
  shippingRates:    'supply_chain:shipping:v2',
  chokepoints:      'supply_chain:chokepoints:v2',
  minerals:         'supply_chain:minerals:v2',
  giving:           'giving:summary:v1',
  climateAnomalies: 'climate:anomalies:v1',
  wildfires:        'wildfire:fires:v1',
  cyberThreats:     'cyber:threats-bootstrap:v2',
  techReadiness:    'economic:worldbank-techreadiness:v1',
  progressData:     'economic:worldbank-progress:v1',
  renewableEnergy:  'economic:worldbank-renewable:v1',
  positiveGeoEvents: 'positive-events:geo-bootstrap:v1',
  theaterPosture: 'theater-posture:sebuf:stale:v1',
  riskScores: 'risk:scores:sebuf:stale:v1',
  naturalEvents: 'natural:events:v1',
  flightDelays: 'aviation:delays-bootstrap:v1',
  insights: 'news:insights:v1',
  predictions: 'prediction:markets-bootstrap:v1',
  cryptoQuotes: 'market:crypto:v1',
  gulfQuotes: 'market:gulf-quotes:v1',
  stablecoinMarkets: 'market:stablecoins:v1',
  unrestEvents: 'unrest:events:v1',
  iranEvents: 'conflict:iran-events:v1',
  ucdpEvents: 'conflict:ucdp-events:v1',
  temporalAnomalies: 'temporal:anomalies:v1',
  weatherAlerts:     'weather:alerts:v1',
  spending:          'economic:spending:v1',
};

const SLOW_KEYS = new Set([
  'bisPolicy', 'bisExchange', 'bisCredit', 'minerals', 'giving',
  'sectors', 'etfFlows', 'shippingRates', 'wildfires', 'climateAnomalies',
  'cyberThreats', 'techReadiness', 'progressData', 'renewableEnergy',
  'theaterPosture', 'naturalEvents',
  'cryptoQuotes', 'gulfQuotes', 'stablecoinMarkets', 'unrestEvents', 'ucdpEvents',
]);
const FAST_KEYS = new Set([
  'earthquakes', 'outages', 'serviceStatuses', 'macroSignals', 'chokepoints',
  'marketQuotes', 'commodityQuotes', 'positiveGeoEvents', 'riskScores', 'flightDelays','insights', 'predictions',
  'iranEvents', 'temporalAnomalies', 'weatherAlerts', 'spending',
]);

const TIER_CACHE = {
  slow: 'public, s-maxage=3600, stale-while-revalidate=600, stale-if-error=3600',
  fast: 'public, s-maxage=600, stale-while-revalidate=120, stale-if-error=900',
};
const TIER_CDN_CACHE = {
  slow: 'public, s-maxage=7200, stale-while-revalidate=1800, stale-if-error=7200',
  fast: 'public, s-maxage=1200, stale-while-revalidate=300, stale-if-error=1800',
};

const NEG_SENTINEL = '__WM_NEG__';
const INSIGHTS_LKG_KEY = 'news:insights:lkg:v1';

const INSIGHTS_STALE_MS = 60 * 60 * 1000; // 1 hour — trigger background refresh when older

function isInsightsStaleOrMissing(names, data) {
  if (!names.includes('insights')) return false;
  const insights = data?.insights;
  if (!insights) return true;
  const generatedAt = insights.generatedAt;
  if (!generatedAt) return true;
  return Date.now() - new Date(generatedAt).getTime() > INSIGHTS_STALE_MS;
}

async function getCachedJsonBatch(keys) {
  const result = new Map();
  if (keys.length === 0) return result;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  const hasUrl = Boolean(url);
  const hasToken = Boolean(token);
  if (!hasUrl || !hasToken) {
    console.warn('[bootstrap] Redis env missing: hasUrl=%s hasToken=%s keysRequested=%s', hasUrl, hasToken, keys.join(','));
    return result;
  }

  // Always read unprefixed keys — bootstrap is a read-only consumer of
  // production cache data. Preview/branch deploys don't run handlers that
  // populate prefixed keys, so prefixing would always miss.
  const pipeline = keys.map((k) => ['GET', k]);
  const resp = await fetch(`${url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(pipeline),
    signal: AbortSignal.timeout(3000),
  });

  if (!resp.ok) {
    const bodyPreview = (await resp.text()).slice(0, 200);
    console.warn('[bootstrap] Redis pipeline failed: status=%s keys=%s bodyPreview=%s', resp.status, keys.join(','), bodyPreview);
    return result;
  }

  const data = await resp.json();
  const isArray = Array.isArray(data);
  console.warn('[bootstrap] Redis pipeline response: isArray=%s length=%s keys=%s', isArray, isArray ? data.length : 'n/a', keys.join(','));

  for (let i = 0; i < keys.length; i++) {
    const item = data[i];
    const raw = item?.result;
    const hasError = item && 'error' in item;
    if (hasError) {
      console.warn('[bootstrap] Redis key %s error: %s', keys[i], item.error);
      continue;
    }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed !== NEG_SENTINEL) result.set(keys[i], parsed);
      } catch (parseErr) {
        console.warn('[bootstrap] Redis key %s JSON.parse failed: %s', keys[i], parseErr?.message || parseErr);
      }
    } else {
      console.warn('[bootstrap] Redis key %s: no result (item=%s)', keys[i], typeof item);
    }
  }
  return result;
}

async function getCachedJson(key) {
  const map = await getCachedJsonBatch([key]);
  return map.get(key);
}

export default async function handler(req) {
  if (isDisallowedOrigin(req))
    return new Response('Forbidden', { status: 403 });

  const cors = getCorsHeaders(req);
  if (req.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors });

  const apiKeyResult = validateApiKey(req);
  if (apiKeyResult.required && !apiKeyResult.valid)
    return new Response(JSON.stringify({ error: apiKeyResult.error }), {
      status: 401, headers: { ...cors, 'Content-Type': 'application/json' },
    });

  const url = new URL(req.url);
  const tier = url.searchParams.get('tier');
  let registry;
  if (tier === 'slow' || tier === 'fast') {
    const tierSet = tier === 'slow' ? SLOW_KEYS : FAST_KEYS;
    registry = Object.fromEntries(Object.entries(BOOTSTRAP_CACHE_KEYS).filter(([k]) => tierSet.has(k)));
  } else {
    const requested = url.searchParams.get('keys')?.split(',').filter(Boolean).sort();
    registry = requested
      ? Object.fromEntries(Object.entries(BOOTSTRAP_CACHE_KEYS).filter(([k]) => requested.includes(k)))
      : BOOTSTRAP_CACHE_KEYS;
  }

  const keys = Object.values(registry);
  const names = Object.keys(registry);
  const isInsightsOnlyRequest = names.length === 1 && names[0] === 'insights';

  let cached;
  try {
    cached = await getCachedJsonBatch(keys);
  } catch {
    return new Response(JSON.stringify({ data: {}, missing: names }), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/json',
        'Cache-Control': isInsightsOnlyRequest ? 'no-store' : 'no-cache',
        'CDN-Cache-Control': isInsightsOnlyRequest ? 'no-store' : 'no-cache',
      },
    });
  }

  const data = {};
  const missing = [];
  for (let i = 0; i < names.length; i++) {
    const val = cached.get(keys[i]);
    if (val !== undefined) data[names[i]] = val;
    else missing.push(names[i]);
  }

  // LKG fallback: if canonical insights key is temporarily missing, try backup key.
  if (names.includes('insights') && missing.includes('insights')) {
    try {
      const lkg = await getCachedJson(INSIGHTS_LKG_KEY);
      if (lkg !== undefined) {
        data.insights = lkg;
        const idx = missing.indexOf('insights');
        if (idx !== -1) missing.splice(idx, 1);
      }
    } catch (_) { /* ignore */ }
  }

  // On-demand insights refresh: if insights requested and missing or older than 1h,
  // trigger background refresh (fire-and-forget). Response returns immediately with stale or empty insights.
  if (isInsightsStaleOrMissing(names, data)) {
    try {
      const refreshUrl = new URL('/api/refresh-insights', url.origin).href;
      fetch(refreshUrl, { method: 'POST', signal: AbortSignal.timeout(200) }).catch(() => {});
    } catch (_) { /* ignore */ }
  }

  const insightsMissing = isInsightsOnlyRequest && missing.includes('insights');
  const cacheControl = insightsMissing
    ? 'no-store'
    : (tier && TIER_CACHE[tier]) || 'public, s-maxage=600, stale-while-revalidate=120, stale-if-error=900';
  const cdnCacheControl = insightsMissing
    ? 'no-store'
    : (tier && TIER_CDN_CACHE[tier]) || TIER_CDN_CACHE.fast;

  return new Response(JSON.stringify({ data, missing }), {
    status: 200,
    headers: {
      ...cors,
      'Content-Type': 'application/json',
      'Cache-Control': cacheControl,
      'CDN-Cache-Control': cdnCacheControl,
    },
  });
}
