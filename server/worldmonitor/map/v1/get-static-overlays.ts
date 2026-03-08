/**
 * GetStaticOverlays RPC — returns static map overlay data and layer metadata for clients (e.g. iOS).
 * Data is sourced from the same config used by the web app so the backend drives the layer list and overlays.
 */

import type {
  ServerContext,
  GetStaticOverlaysRequest,
  GetStaticOverlaysResponse,
  LayerDefinition,
  VariantLayerOrder,
} from '../../../../src/generated/server/worldmonitor/map/v1/service_server';

import {
  INTEL_HOTSPOTS,
  CONFLICT_ZONES,
  UNDERSEA_CABLES,
  MILITARY_BASES,
  NUCLEAR_FACILITIES,
  SPACEPORTS,
  ECONOMIC_CENTERS,
  STRATEGIC_WATERWAYS,
  CRITICAL_MINERALS,
} from '../../../../src/config/geo';
import { PIPELINES } from '../../../../src/config/pipelines';
import { AI_DATA_CENTERS } from '../../../../src/config/ai-datacenters';
import {
  LAYER_REGISTRY,
  VARIANT_LAYER_ORDER,
  SVG_ONLY_LAYERS,
  type MapVariant,
} from '../../../../src/config/map-layer-definitions';

const VARIANT_KEYS: MapVariant[] = ['full', 'tech', 'finance', 'happy', 'commodity'];

function buildStaticOverlaysJson(): string {
  const overlays = {
    hotspots: INTEL_HOTSPOTS,
    conflictZones: CONFLICT_ZONES,
    cables: UNDERSEA_CABLES,
    pipelines: PIPELINES,
    bases: MILITARY_BASES,
    nuclear: NUCLEAR_FACILITIES,
    spaceports: SPACEPORTS,
    economicCenters: ECONOMIC_CENTERS,
    waterways: STRATEGIC_WATERWAYS,
    minerals: CRITICAL_MINERALS,
    datacenters: AI_DATA_CENTERS,
  };
  return JSON.stringify(overlays);
}

function buildLayerCatalog(): LayerDefinition[] {
  const catalog: LayerDefinition[] = [];
  for (const [key, def] of Object.entries(LAYER_REGISTRY)) {
    catalog.push({
      key,
      fallbackLabel: def.fallbackLabel,
      icon: def.icon,
      premium: def.premium ?? '',
    });
  }
  return catalog;
}

function buildVariantLayerOrder(): VariantLayerOrder[] {
  return VARIANT_KEYS.map((variant) => ({
    variant,
    layerKeys: (VARIANT_LAYER_ORDER[variant] ?? []).slice(),
    svgOnlyKeys: (SVG_ONLY_LAYERS[variant] ?? []).slice(),
  }));
}

export async function getStaticOverlays(
  _ctx: ServerContext,
  _req: GetStaticOverlaysRequest,
): Promise<GetStaticOverlaysResponse> {
  return {
    staticOverlaysJson: buildStaticOverlaysJson(),
    layerCatalog: buildLayerCatalog(),
    variantLayerOrder: buildVariantLayerOrder(),
  };
}
