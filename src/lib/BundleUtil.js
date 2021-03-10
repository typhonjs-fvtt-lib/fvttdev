import fs                  from 'fs';
import path                from 'path';

import { Flags }           from '@oclif/core';

import { NonFatalError }   from '@typhonjs-node-bundle/oclif-commons';

const s_DEFAULT_LOG_LEVEL = 'trace';  // TODO DEFAULT SHOULD BE INFO

/**
 */
export default class BundleUtil
{
   /**
    * Adds built in flags for the bundle command. An array of string keys may be provided to disable one or more flags.
    *
    *
    * Added flags include:
    * `--cwd`       -      - Use an alternative working directory.      - default: `'.'`     - env: {prefix}_CWD
    * `--deploy`    - `-d` - Directory to deploy build files into.      - default: `'./dist' - env: {prefix}_DEPLOY_PATH
    * `--entry`     - `-i` - Explicit entry module(s).
    * `--env`       - `-e` - Name of *.env file to load from `./env`.
    * `--external`  -      - Specifies external imports that are ignored.                    - env: {prefix}_EXTERNAL
    * `--ignore-local-config` - Ignores all local configuration files.  - default: `false`
    * `--loglevel`  -      - Sets log level.                            - default: `'info'`  - env: {prefix}_LOG_LEVEL
    * `--noop`      -      - Prints essential bundling info and exits.  - default: `false`   -
    * {prefix}_LOG_LEVEL
    * `--sourcemap  -      - Generate source maps.                      - default: `true`    - env: {prefix}_SOURCEMAP
    * `--watch`     -      - Continually bundle to deploy directory.    - default: `false`
    *
    * @param {object} options - The name of the registering plugin / source.
    * @param {string} options.pluginName - The name of the registering plugin / source.
    * @param {string[]} [options.disableKeys] - An array of keys to disable from standard bundle flags above.
    */
   static addFlags(options = {})
   {
      if (typeof options !== 'object')
      {
         throw new TypeError(`BundleUtil - addFlags - expected 'options' to be a 'object'.`);
      }

      if (typeof options.pluginName !== 'string')
      {
         throw new TypeError(`BundleUtil - addFlags - expected 'options.pluginName' to be a 'string'.`);
      }

      if (options.disableKeys && !Array.isArray(options.disableKeys))
      {
         throw new TypeError(`BundleUtil - addFlags - expected 'options.disableKeys' to be an 'array'.`);
      }

      const envVarPrefix = globalThis.$$flag_env_prefix;

      const flagOptions = {
         'cwd': Flags.string({
            'description': 'Use an alternative working directory.',
            'default': function(context)
            {
               const envVars = context === null ? {} : process.env;
               const envVar = `${envVarPrefix}_CWD`;

               if (typeof envVars[envVar] === 'string') { return envVars[envVar]; }

               return '.';
            }
         }),

         'deploy': Flags.string({
            'char': 'd',
            'description': 'Directory to deploy build files into.',
            'default': './dist',
            'env': `${envVarPrefix}_DEPLOY_PATH`
         }),

         'entry': Flags.string({ 'char': 'i', 'description': 'Explicit entry module(s).' }),

         'env': Flags.string({ 'char': 'e', 'description': 'Name of *.env file to load from `./env`.' }),

         // Specifies external imports that are ignored; see Rollup config input.external
         'external': Flags.string({
            'description': 'Specifies external import references which are ignored.',
            'multiple': true,
            'default': function(context)
            {
               const envVars = context === null ? {} : process.env;
               const envVar = `${envVarPrefix}_EXTERNAL`;

               if (typeof envVars[envVar] === 'string')
               {
                  let result = void 0;

                  // Treat it as a JSON array.
                  try { result = JSON.parse(envVars[envVar]); }
                  catch (error)
                  {
                     throw new NonFatalError(`Could not parse '${envVar}' as a JSON array;\n${error.message}`);
                  }

                  // Verify that the JSON result loaded is an actual array otherwise quit with and error...
                  if (!Array.isArray(result))
                  {
                     throw new NonFatalError(`Please format '${envVar}' as a JSON array.`);
                  }

                  // TODO: consider adding verification that the loaded array from JSON contains all strings.

                  return result;
               }

               return [];
            }
         }),

         'ignore-local-config': Flags.boolean({
            'description': 'Ignores all local configuration files using the provided defaults.',
            'default': false
         }),

         'loglevel': Flags.string({
            'description': 'Sets log level (off, fatal, error, warn, info, verbose, debug, trace, all).',
            'default': function(context)
            {
               const envVars = context === null ? {} : process.env;
               const envVar = `${envVarPrefix}_LOG_LEVEL`;

               if (typeof envVars[envVar] === 'string') { return envVars[envVar]; }

               return s_DEFAULT_LOG_LEVEL;
            }
         }),

         'metafile': Flags.boolean({
            'description': `Archives CLI runtime metafiles in: ${globalThis.$$cli_log_dir}.`,
            'default': false
         }),

         'noop': Flags.boolean({
            'description': 'Prints info on any FVTT module / system detected and exits w/ no operation.',
            'default': false
         }),

         // By default sourcemap is set to true, but if the environment variable `DEPLOY_SOURCEMAP` is defined as
         // 'true' or 'false' that will determine the setting for sourcemap.
         'sourcemap': Flags.boolean({
            'description': '[default: true] Generate source maps.',
            'allowNo': true,
            'default': function(context)
            {
               const envVars = context === null ? {} : process.env;
               const envVar = `${envVarPrefix}_SOURCEMAP`;

               let defaultValue = true;

               if (envVar in envVars && envVars[envVar] !== 'true')
               {
                  defaultValue = false;
               }

               return defaultValue;
            }
         }),

         'watch': Flags.boolean({
            'description': 'Continually build / bundle source to deploy directory.',
            'default': false
         }),
      };

      if (options.disableKeys)
      {
         for (const disableKey of options.disableKeys)
         {
            delete flagOptions[disableKey];
         }
      }

      globalThis.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
         command: 'bundle',
         pluginName: options.pluginName,
         flags: flagOptions,

         /**
          * Verifies the `cwd` flag and sets the new base directory if applicable.
          *
          * @param {object}   flags - The CLI flags to verify.
          */
         verify: function(flags)
         {
            if (typeof flags.loglevel === 'string')
            {
               const logLevels = ['off', 'fatal', 'error', 'warn', 'info', 'verbose', 'debug', 'trace', 'all'];

               // Log a warning if requested log level is unknown.
               if (!logLevels.includes(flags.loglevel))
               {
                  globalThis.$$eventbus.trigger('log:warn', `Unknown log level: '${flags.loglevel}'.`);
               }
               else
               {
                  globalThis.$$eventbus.trigger('log:level:set', flags.loglevel);
               }
            }

            // Notify that the current working directory is being changed and verify that the new directory exists.
            if (typeof flags.cwd === 'string' && flags.cwd !== '.')
            {
               // Perform any initialization after initial flags have been loaded. Handle defining `cwd` and verify.
               const origCWD = globalThis.$$bundler_baseCWD;
               const newCWD = path.resolve(globalThis.$$bundler_origCWD, flags.cwd);

               if (newCWD !== globalThis.$$bundler_baseCWD)
               {
                  globalThis.$$bundler_baseCWD = newCWD;

                  // Only log absolute path if the CWD location is outside of the original path.
                  globalThis.$$bundler_logCWD = newCWD.startsWith(origCWD) ? path.relative(origCWD, newCWD) : newCWD;

                  globalThis.$$eventbus.trigger('log:verbose',
                   `New current working directory set: \n${globalThis.$$bundler_logCWD}`);

                  if (!fs.existsSync(globalThis.$$bundler_baseCWD))
                  {
                     throw new NonFatalError(`New current working directory does not exist.`);
                  }
               }
            }
         }
      });
   }
}
