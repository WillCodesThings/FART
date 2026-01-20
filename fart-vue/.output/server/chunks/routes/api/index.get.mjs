import { d as defineEventHandler } from '../../nitro/nitro.mjs';
import { b as getAllPrinters } from '../../_/printerStore.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';

const index_get = defineEventHandler(() => {
  return getAllPrinters();
});

export { index_get as default };
//# sourceMappingURL=index.get.mjs.map
