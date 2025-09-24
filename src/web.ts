import { WebPlugin } from '@capacitor/core';

import type { MuxPlayerPlugin } from './definitions';

export class MuxPlayerWeb extends WebPlugin implements MuxPlayerPlugin {
  async echo(options: { value: string }): Promise<{ value: string }> {
    console.log('ECHO', options);
    return options;
  }
}
