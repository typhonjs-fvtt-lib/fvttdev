import url     from 'url';

import { run } from '@oclif/core';

/**
 * Invokes CLI with args.
 *
 * @param {string[]} args - args to pass to CLI.
 *
 * @returns {Promise<void>}
 */
export default function runCLI(args)
{
   return run(args, url.fileURLToPath(import.meta.url));
}
