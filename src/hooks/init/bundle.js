const fs          = require('fs');
const path        = require('path');

const { flags }   = require('@oclif/command');

/**
 * Adds built in flags for the bundle command.
 *
 * Note: This is defined as an explicit init function so that it executes before all plugin init functions.
 * As things go an init method of the command itself will run after all plugin init methods which is not desirable.
 * We want to explicitly set all bundle command flags before plugins initialize.
 *
 * Added flags include:
 * `--cwd`       -      - Use an alternative working directory.      - default: `'.'`
 * `--deploy`    - `-d` - Directory to deploy build files into.      - default: `'./dist' - env: DEPLOY_PATH
 * `--entry`     - `-i` - Explicit entry module(s).
 * `--env`       - `-e` - Name of *.env file to load from `./env`.
 * `--sourcemap  -      - Generate source maps.                      - default: `true`    - env: DEPLOY_SOURCEMAP
 * `--watch`     -      - Continually build / bundle source to deploy directory. - default: `false`
 *
 * @returns {Promise<void>}
 */
module.exports = async function()
{
   // TODO REMOVE
   process.stdout.write(`explicit bundle command init hook running\n`);

   global.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
      command: 'bundle',
      plugin: 'fvttdev',
      flags: {
         cwd: flags.string({
            'description': 'Use an alternative working directory.',
            'default': function()
            {
               if (typeof process.env.DEPLOY_CWD === 'string') { return process.env.DEPLOY_CWD; }

               return '.';
            }
         }),

         entry: flags.string({ 'char': 'i', 'description': 'Explicit entry module(s).' }),

         env: flags.string({ 'char': 'e', 'description': 'Name of *.env file to load from `./env`.' }),

         deploy: flags.string({
            'char': 'd',
            'description': 'Directory to deploy build files into.',
            'default': './dist',
            'env': 'DEPLOY_PATH'
         }),

         // By default sourcemap is set to true, but if the environment variable `DEPLOY_SOURCEMAP` is defined as
         // 'true' or 'false' that will determine the setting for sourcemap.
         sourcemap: flags.boolean({
            'description': '[default: true] Generate source maps.',
            'allowNo': true,
            'default': function()
            {
               if (process.env.DEPLOY_SOURCEMAP === 'true') { return true; }

               return process.env.DEPLOY_SOURCEMAP !== 'false';
            }
         }),

         watch: flags.boolean({
            'description': 'Continually build / bundle source to deploy directory.',
            'default': false
         }),
      },

      /**
       * Verifies the `cwd` flag and sets the new base directory if applicable.
       *
       * @param {object}   flags - The CLI flags to verify.
       */
      verify: function(flags)
      {
         // Notify that the current working directory is being changed and verify that the new directory exists.
         if (typeof flags.cwd === 'string' && flags.cwd !== '.')
         {
            // Perform any initialization after initial flags have been loaded. Handle defining `cwd` and verify.
            global.$$bundler_baseCWD = path.resolve(global.$$bundler_origCWD, flags.cwd);

            // TODO Change to typhonjs-color-logger
            process.stdout.write(`New current working directory set: \n${global.$$bundler_baseCWD}\n`);

            if (!fs.existsSync(global.$$bundler_baseCWD))
            {
               const error = new Error(`New current working directory does not exist.`);

               // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
               error.$$bundler_fatal = false;

               throw error;
            }
         }
      }
   });
};
