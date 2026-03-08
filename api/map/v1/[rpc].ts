export const config = { runtime: 'edge' };

import { createDomainGateway, serverOptions } from '../../../server/gateway';
import { createMapServiceRoutes } from '../../../src/generated/server/worldmonitor/map/v1/service_server';
import { mapHandler } from '../../../server/worldmonitor/map/v1/handler';

export default createDomainGateway(
  createMapServiceRoutes(mapHandler, serverOptions),
);
