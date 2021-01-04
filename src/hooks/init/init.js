const path              = require('path');

const Events            = require('backbone-esnext-events');
const PluginManager     = require('typhonjs-plugin-manager');

const { FlagHandler }   = require('@typhonjs-node-bundle/oclif-commons');

const RollupRunner      = require('../../lib/RollupRunner');

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

      // A short version of CWD which has the relative path if CWD is the base or subdirectory otherwise absolute.
      global.$$bundler_logCWD = '.';

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
            filterConfigs: [
               { type: 'exclusive', name: 'FlagHandler', filterString:
                '@typhonjs-node-bundle/oclif-commons/src/util/FlagHandler.js' },
               { type: 'exclusive', name: '@babel', filterString: '@babel' }
            ],
            showInfo: false
         }
      });

      // TODO CHANGE TO INFO LOG LEVEL FOR DEFAULT
      global.$$eventbus.trigger('log:level:set', 'debug');

      // Add '@typhonjs-node-bundle/oclif-flaghandler'
      global.$$pluginManager.add({ name: '@typhonjs-node-bundle/oclif-flaghandler', instance: new FlagHandler() });

      // Add '@typhonjs-node-bundle/rollup-runner'
      global.$$pluginManager.add({ name: '@typhonjs-node-bundle/rollup-runner', instance: new RollupRunner() });

      global.$$eventbus.trigger('log:debug', `fvttdev init hook running '${opts.id}'.`);
   }
   catch (error)
   {
      this.error(error);
   }
};

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
