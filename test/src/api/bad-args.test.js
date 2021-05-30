import { expect }          from 'chai';

import oclif               from '@oclif/core';
import { NonFatalError }   from '@typhonjs-oclif/errors';

import fvttdev             from '../../../src/index.js';

describe('API', () =>
{
   it('(rejected / CLIError) unknown-command', async () =>
   {
      await expect(fvttdev('unknown-command')).to.be.rejectedWith(oclif.Errors.CLIError,
       'command unknown-command not found');
   });

   // TODO: this will change when we address DynamicCommand flags / args handling.
   it('(rejected / CLIError) bad argument', async () =>
   {
      await expect(fvttdev('validate:manifest' ,'--ABC')).to.be.rejectedWith(oclif.Errors.CLIError,
       'Unexpected argument: --ABC');
   });

   it('(rejected / NonFatalError) bad cwd', async () =>
   {
      await expect(fvttdev('validate:manifest', '--cwd=baddirectory')).to.be.rejectedWith(NonFatalError,
       'New current working directory does not exist:\nbaddirectory');
   });
});
