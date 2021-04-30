import { Flags }                 from '@oclif/core';
import { DynamicCommandFlags }   from '@typhonjs-oclif/core';

import BetterErrors              from '@typhonjs-utils/better-ajv-errors';
import ValidateManifest          from '@typhonjs-fvtt/validate-manifest/ValidateManifest';

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

   await globalThis.$$pluginManager.add({ name: '@typhonjs-node-utils/better-ajv-errors', instance: BetterErrors });
   await globalThis.$$pluginManager.add({ name: '@typhonjs-fvtt/validate-manifest', instance: ValidateManifest });

   const flagOptions = {
      ...DynamicCommandFlags.flags,

      loose: Flags.boolean({
         'description': `Perform loose validation / check types only.`,
         'default': false
      }),

      plus: Flags.boolean({
         'description': `Validate against manifest+ specification.`,
         'default': false
      }),
   };

   global.$$eventbus.trigger('typhonjs:oclif:system:handler:flag:add', {
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
         DynamicCommandFlags.verify(flags);
      }
   });
}
