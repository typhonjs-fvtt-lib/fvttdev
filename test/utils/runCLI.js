import url     from 'url';

import { run } from '@oclif/core';

/**
 * Invokes CLI with args. Deletes any environment variables loaded from before to after execution.
 *
 * @param {string[]} args - args to pass to CLI.
 *
 * @returns {Promise<void>}
 */
export default async function runCLI(args)
{
   const beforeEnvKeys = Object.keys(process.env);

   return run(args, url.fileURLToPath(import.meta.url)).finally(() =>
   {
      const afterEnvKeys = Object.keys(process.env);
      const diffEnvKeys = afterEnvKeys.filter((x) => !beforeEnvKeys.includes(x));

      diffEnvKeys.forEach((entry) => delete process.env[entry]);
   });
}
