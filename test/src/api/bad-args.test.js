import { expect }          from 'chai';

import { Errors }          from '@oclif/core';
import { NonFatalError }   from '@typhonjs-oclif/errors';

import runCLI     from '../../utils/runCLI.js';

describe('API', () =>
{
   it('(rejected / CLIError) unknown-command', async () =>
   {
      await expect(runCLI(['unknown-command'])).to.be.rejectedWith(Errors.CLIError,
       'command unknown-command not found');
   });

   // TODO: this will change when we address DynamicCommand flags / args handling.
   it('(rejected / CLIError) bad argument', async () =>
   {
      await expect(runCLI(['validate:manifest' ,'--ABC'])).to.be.rejectedWith(Errors.CLIError,
       'Unexpected argument: --ABC');
   });

   it('(rejected / NonFatalError) bad cwd', async () =>
   {
      await expect(runCLI(['validate:manifest', '--cwd=baddirectory'])).to.be.rejectedWith(NonFatalError,
       'New current working directory does not exist.');
   });
});
