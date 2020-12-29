const fs             = require('fs');
const path           = require('path');

const { flags }      = require('@oclif/command');

const Events         = require('backbone-esnext-events');
const PluginManager  = require('typhonjs-plugin-manager');

const FlagHandler    = require('../../lib/FlagHandler');
const RollupRunner   = require('../../lib/RollupRunner');

/**
 * Creates a plugin manager instance.
 * Attaches the backbone-esnext eventbus to `process`.
 *
 * @param {object} opts - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
module.exports = async function(opts)
{
   try
   {
      // Save base executing path immediately before anything else occurs w/ CLI / Oclif.
      global.$$bundler_baseCWD = global.$$bundler_origCWD = process.cwd();

      // Save the global eventbus.
      global.$$eventbus = new Events();

      s_SET_VERSION();

      // Save the global plugin manager
      global.$$pluginManager = new PluginManager({ eventbus: global.$$eventbus });

      // Adds color logger plugin
      global.$$pluginManager.add(
      {
         name: 'typhonjs-color-logger',
         options: {
            // Adds an exclusive filter which removes `FlagHandler` from stack trace / being a source of an error.
            filterConfigs: [{ type: 'exclusive', name: 'FlagHandler', filterString: 'src/lib/FlagHandler.js' }]
         }
      });

      // Add '@typhonjs-node-bundle/oclif-flaghandler'
      global.$$pluginManager.add({ name: '@typhonjs-node-bundle/oclif-flaghandler', instance: new FlagHandler() });

      // Add '@typhonjs-node-bundle/rollup-runnner'
      global.$$pluginManager.add({ name: '@typhonjs-node-bundle/rollup-runner', instance: new RollupRunner() });

      // Adds flags for various built in commands like `build`.
      s_ADD_FLAGS(opts.id);

      // TODO REMOVE
      process.stdout.write(`fvttdev init hook running ${opts.id}\n`);
   }
   catch (error)
   {
      this.error(error);
   }
};

/**
 * Adds flags for various built in commands for `build` action.
 *
 * Added flags include:
 * `--cwd`       -      - Use an alternative working directory.      - default: `'.'`
 * `--deploy`    - `-d` - Directory to deploy build files into.      - default: `'./dist' - env: DEPLOY_PATH
 * `--entry`     - `-i` - Explicit entry module(s).
 * `--env`       - `-e` - Name of *.env file to load from `./env`.
 * `--sourcemap  -      - Generate source maps.                      - default: `true`    - env: DEPLOY_SOURCEMAP
 * `--watch`     -      - Continually build / bundle source to deploy directory. - default: `false`
 *
 * @param {string} command - ID of the command being run.
 */
function s_ADD_FLAGS(command)
{
   switch (command)
   {
      // Add all built in flags for the build command.
      case 'build':
         global.$$eventbus.trigger('typhonjs:oclif:system:flaghandler:add', {
            command,
            plugin: 'fvttdev',
            flags: {
               cwd: flags.string({ 'description': 'Use an alternative working directory.', 'default': '.' }),

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
         break;
   }
}

/**
 * Sets the global name and version number for `fvttdev` in `global.$$bundler_name` & `global.$$bundler_version`. Also
 * provides a convenience name + package version string in `global.$$bundler_name_version`.
 */
function s_SET_VERSION()
{
   global.$$bundler_name = 'fvttdev';

   // Retrieve the local package path to pull the version number for `fvttdev`
   const packagePath = path.resolve(__dirname, '../../../package.json');

   try
   {
      const packageObj = require(packagePath);

      if (packageObj)
      {
         global.$$bundler_version = packageObj.version;
         global.$$bundler_name_version = `fvttdev (${packageObj.version})`;
      }
   }
   catch (err) { /* nop */ }
}
