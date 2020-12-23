const path           = require('path');

const { flags }      = require('@oclif/command');

const Events         = require('backbone-esnext-events');
const PluginManager  = require('typhonjs-plugin-manager');

const FlagHandler    = require('../../lib/FlagHandler');

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
      global.$$bundler_origCWD = process.cwd();

      process.eventbus = new Events();

      s_SET_VERSION();

      process.pluginManager = new PluginManager({ eventbus: process.eventbus });

      // Adds color logger plugin
      process.pluginManager.add(
      {
         name: 'typhonjs-color-logger',
         // options: {
         //    filterConfigs: [{ type: 'exclusive', name: 'oclif', filterString: '@oclif' }]
         // }
      });

      process.pluginManager.add({ name: 'oclif-flaghandler', instance: new FlagHandler() });

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
 * Adds flags for various built in commands like `build`.
 *
 * @param {string} command - ID of the command being run.
 */
function s_ADD_FLAGS(command)
{
   switch (command)
   {
      // Add all built in flags for the build command.
      case 'build':
         process.eventbus.trigger('oclif:system:flaghandler:add', {
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
            }
         });
         break;
   }
}

/**
 * Sets the global version number for fvttdev in `global.$$fvttdev_version` and creates an event callback
 * on the eventbus for getting the version number -> `fvttdev:data:version:get`
 */
function s_SET_VERSION()
{
   global.$$bundler_name = 'fvttdev';

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
