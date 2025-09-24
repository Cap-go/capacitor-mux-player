import { registerPlugin } from '@capacitor/core';

import type { MuxPlayerPlugin } from './definitions';

const MuxPlayer = registerPlugin<MuxPlayerPlugin>('MuxPlayer', {
  web: () => import('./web').then((m) => new m.MuxPlayerWeb()),
});

export * from './definitions';
export { MuxPlayer };
