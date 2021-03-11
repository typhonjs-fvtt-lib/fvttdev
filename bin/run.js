#!/usr/bin/env node
import { createRequire }   from 'module';

import errorHandler        from '@typhonjs-oclif/core/errorHandler';

const require              = createRequire(import.meta.url);

const { Errors }           = require('@oclif/core');

const messageFVTTDev = 'An uncaught fatal error has been detected with the FVTTDev CLI.\n'
 + 'Please report this error to the issues forum after checking if a similar report already exists:\n';

const oclifModule = 'An uncaught fatal error has been detected with a TyphonJS Oclif module.\n'
 + 'Please report this error to the issues forum after checking if a similar report already exists:\n'

require('@oclif/core/lib/main').run()
.then(require('@oclif/core/flush'))
.catch((error) =>
{
   errorHandler({
      error,
      Errors,
      match: {
         'fvttdev': {
            regex: /^.*\((\/.*\/fvttdev\/)src/g,
            bugsURL: 'https://github.com/typhonjs-fvtt/fvttdev/issues',
            message: messageFVTTDev
         },
         'typhonjs-node-rollup': {
            regex: /^.*\((\/.*(\/typhonjs-node-rollup\/.*\/))src/g,
            bugsURL: 'https://github.com/typhonjs-node-rollup/issues/issues',
            message: oclifModule
         }
      }
   });
});
