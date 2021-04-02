import { Flags }        from '@oclif/core';

import BetterErrors     from '@typhonjs-node-utils/better-ajv-errors';
import ValidateManifest from '@typhonjs-fvtt/validate-manifest/ValidateManifest';

import StandardFlags    from '../../flags/StandardFlags.js';

/**
 * Note: This is defined as an explicit init function so that it executes before all plugin init functions.
 * As things go an init method of the command itself will run after all plugin init methods which is not desirable.
 * We want to explicitly set all bundle command flags before plugins initialize.
 *
 * @param {object} options - Oclif CLI options.
 *
 * @returns {Promise<void>}
 */
export default async function(options)
{
   globalThis.$$eventbus.trigger('log:debug', `explicit validate:manifest command init hook running '${options.id}'.`);

   globalThis.$$pluginManager.add({ name: '@typhonjs-node-utils/better-ajv-errors', instance: BetterErrors });
   globalThis.$$pluginManager.add({ name: '@typhonjs-fvtt/validate-manifest', instance: ValidateManifest });

   const flagOptions = {
      ...StandardFlags.flags,

      loose: Flags.boolean({
         'description': `Perform loose validation / check types only.`,
         'default': false
      }),

      plus: Flags.boolean({
         'description': `Validate against manifest+ specification.`,
         'default': false
      }),
   };

   global.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
      command: 'validate:manifest',
      pluginName: 'fvttdev',
      flags: flagOptions,

      /**
       * Verifies the `cwd` flag and sets the new base directory if applicable.
       *
       * @param {object}   flags - The CLI flags to verify.
       */
      verify: function(flags)
      {
         StandardFlags.verify(flags);
      }
   });
}
