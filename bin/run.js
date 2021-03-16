#!/usr/bin/env node
import { createRequire }   from 'module';

import errorHandler        from '@typhonjs-oclif/core/ErrorHandler';

const require              = createRequire(import.meta.url);

const { Errors }           = require('@oclif/core');

require('@oclif/core/lib/main').run()
.then(require('@oclif/core/flush'))
.catch((error) => { errorHandler.handle(error, Errors); });
