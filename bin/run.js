#!/usr/bin/env node
import url              from 'url';
import errorHandler     from '@typhonjs-oclif/core/ErrorHandler';

import flush            from '@oclif/core/flush.js';
import { run, Errors }  from '@oclif/core';

run(void 0, url.fileURLToPath(import.meta.url))
.then(flush)
.catch((error) => { errorHandler.handle(error, Errors); });


