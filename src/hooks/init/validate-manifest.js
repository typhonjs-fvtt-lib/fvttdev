import { Flags } from '@oclif/core';

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

   const envVarPrefix = globalThis.$$cli_env_prefix;

   const flagOptions = {
      'no-color': Flags.boolean({
         'description': 'Output with no color.',
         'default': function(context)
         {
            const envVars = context === null ? {} : process.env;
            const envVar = `${envVarPrefix}_NO_COLOR`;

            return typeof envVars[envVar] === 'string';
         }
      }),
   };

   global.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
      command: 'validate:manifest',
      pluginName: 'fvttdev',
      flags: flagOptions,

      // /**
      //  * Verifies the `cwd` flag and sets the new base directory if applicable.
      //  *
      //  * @param {object}   flags - The CLI flags to verify.
      //  */
      // verify: function(flags)
      // {
      // }
   });
}
