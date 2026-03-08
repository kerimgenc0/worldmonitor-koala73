import type { MapServiceHandler } from '../../../../src/generated/server/worldmonitor/map/v1/service_server';

import { getStaticOverlays } from './get-static-overlays';

export const mapHandler: MapServiceHandler = {
  getStaticOverlays,
};
