import oclif               from '@oclif/core';
import { finallyHandler }  from '@typhonjs-oclif/core';

/**
 * Invokes the `fvttdev` CLI with args programmatically. Deletes any environment variables loaded from before to after
 * execution.
 *
 * @param {string[]} args - args to pass to CLI.
 *
 * @returns {Promise<void>}
 */
export default async function fvttdev(args)
{
   return oclif.run(args, import.meta.url).finally(finallyHandler);
}
