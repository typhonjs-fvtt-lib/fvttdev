import { expect } from 'chai';

import runCLI     from '../../utils/runCLI.js';

describe('API', () =>
{
   it('unknown-command (throws)', async () =>
   {
      await expect(runCLI(['unknown-command'])).to.be.rejectedWith('command unknown-command not found');
   });

   // TODO: this will change when we address DynamicCommand flags / args handling.
   it('bad argument (throws)', async () =>
   {
      await expect(runCLI(['validate:manifest' ,'--ABC'])).to.be.rejectedWith('Unexpected argument: --ABC');
   });
});
