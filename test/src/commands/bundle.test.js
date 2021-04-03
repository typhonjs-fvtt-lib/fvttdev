import url        from 'url';

import { expect } from 'chai';
import { run }    from '@oclif/core';

const runCLI = (args) =>
{
   return run(args, url.fileURLToPath(import.meta.url));
}

describe('command - bundle', () =>
{
   it('bundle --cwd=./test/fixture/demo-0 (throws)', async () =>
   {
      await expect(runCLI(['bundle', '--cwd=./test/fixture/demo-0'])).to.be.rejectedWith(
       'Could not find a Foundry VTT module or system in file path: \n./test/fixture/demo-0');
   });
});
