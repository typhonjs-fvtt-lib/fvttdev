import url                 from 'url';

import { run }             from '@oclif/core';
import { finallyHandler }  from '@typhonjs-oclif/core';

/**
 * Invokes CLI with args programmatically. Deletes any environment variables loaded from before to after execution.
 *
 * @param {string[]} args - args to pass to CLI.
 *
 * @returns {Promise<void>}
 */
export default async function fvttdev(args)
{
   return run(args, url.fileURLToPath(import.meta.url)).finally(finallyHandler);
}
