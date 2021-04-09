#!/usr/bin/env node
import url           from 'url';

import { run }          from '@oclif/core';
import flush            from '@oclif/core/flush.js';
import { errorHandler } from '@typhonjs-oclif/core';

run(void 0, url.fileURLToPath(import.meta.url))
.then(flush)
.catch(errorHandler);
