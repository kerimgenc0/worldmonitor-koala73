/**
 * Build-time script: reads overlay config (with @/ path resolution via tsx) and writes
 * server/worldmonitor/map/v1/static-overlays.generated.json so the map API handler can
 * import that JSON only — avoiding @/ in the Vercel edge bundle.
 *
 * Run before build: npm run generate-overlays
 */

import { writeFile, mkdir } from 'fs/promises';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Some config modules read VITE_VARIANT; set for build-time script.
if (!process.env.VITE_VARIANT) process.env.VITE_VARIANT = 'full';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = `${__dirname}/../server/worldmonitor/map/v1/static-overlays.generated.json`;

async function main() {
  const [
    geo,
    pipelines,
    aiDatacenters,
    mapLayerDefs,
  ] = await Promise.all([
    import('../src/config/geo.ts'),
    import('../src/config/pipelines.ts'),
    import('../src/config/ai-datacenters.ts'),
    import('../src/config/map-layer-definitions.ts'),
  ]);

  const overlays = {
    hotspots: geo.INTEL_HOTSPOTS,
    conflictZones: geo.CONFLICT_ZONES,
    cables: geo.UNDERSEA_CABLES,
    pipelines: pipelines.PIPELINES,
    bases: geo.MILITARY_BASES,
    nuclear: geo.NUCLEAR_FACILITIES,
    spaceports: geo.SPACEPORTS,
    economicCenters: geo.ECONOMIC_CENTERS,
    waterways: geo.STRATEGIC_WATERWAYS,
    minerals: geo.CRITICAL_MINERALS,
    datacenters: aiDatacenters.AI_DATA_CENTERS,
  };

  const staticOverlaysJson = JSON.stringify(overlays);

  const layerCatalog: Array<{ key: string; fallbackLabel: string; icon: string; premium: string }> = [];
  for (const [key, def] of Object.entries(mapLayerDefs.LAYER_REGISTRY)) {
    layerCatalog.push({
      key,
      fallbackLabel: def.fallbackLabel,
      icon: def.icon,
      premium: def.premium ?? '',
    });
  }

  const VARIANT_KEYS = ['full', 'tech', 'finance', 'happy', 'commodity'] as const;
  const variantLayerOrder = VARIANT_KEYS.map((variant) => ({
    variant,
    layerKeys: (mapLayerDefs.VARIANT_LAYER_ORDER[variant] ?? []).slice(),
    svgOnlyKeys: (mapLayerDefs.SVG_ONLY_LAYERS[variant] ?? []).slice(),
  }));

  const payload = {
    staticOverlaysJson,
    layerCatalog,
    variantLayerOrder,
  };

  await mkdir(dirname(OUT_PATH), { recursive: true });
  await writeFile(OUT_PATH, JSON.stringify(payload, null, 0), 'utf8');
  console.log('Wrote', OUT_PATH);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
