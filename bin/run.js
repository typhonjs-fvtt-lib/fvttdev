#!/usr/bin/env node
import oclif            from '@oclif/core';
import { errorHandler } from '@typhonjs-oclif/core';

oclif.run(void 0, import.meta.url)
.then(oclif.flush)
.catch(errorHandler);
