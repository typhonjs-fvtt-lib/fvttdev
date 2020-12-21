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
   // Save base executing path immediately before anything else occurs w/ CLI / Oclif.
   // TODO RECONSIDER: TAKE INTO ACCOUNT `cwd` flag
   process.__baseName = process.cwd();

   process.eventbus = new Events();
   process.pluginManager = new PluginManager({ eventbus: process.eventbus });

   // Adds color logger plugin
   process.pluginManager.add(
   {
      name: 'typhonjs-color-logger',
      // options: {
      //    filterConfigs: [{ type: 'exclusive', name: 'jquery', filterString: 'jquery.min.js' }]
      // }
   });

   process.pluginManager.add({ name: 'oclif-flaghandler', instance: new FlagHandler() });

   // Adds flags for various built in commands like `build`.
   s_ADD_FLAGS(opts.id);

   // TODO REMOVE
   process.stdout.write(`fvttdev eventbus init hook running ${opts.id}\n`);
};

/**
 * Adds flags for various built in commands like `build`.
 *
 * @param {string} commandID - ID of the command being run.
 */
function s_ADD_FLAGS(commandID)
{
   switch (commandID)
   {
      // Add all built in flags for the build command.
      case 'build':
         process.eventbus.trigger('oclif:flaghandler:add', {
            cwd: flags.string({ 'description': 'Use an alternative working directory', 'default': '.' }),

            entry: flags.string({ 'char': 'i', 'description': 'Explicit entry module(s)' }),

            env: flags.string({ 'char': 'e', 'description': 'Name of *.env file to load from ./env' }),

            deploy: flags.string({
               'char': 'd',
               'description': 'Directory to deploy build files into.',
               'default': './dist',
               'env': 'DEPLOY_PATH'
            }),

            // By default sourcemap is set to true, but if the environment variable `DEPLOY_SOURCEMAP` is defined as
            // 'true' or 'false' that will determine the setting for sourcemap.
            sourcemap: flags.boolean({
               'description': 'Generate source map.', 'default': function()
               {
                  if (process.env.DEPLOY_SOURCEMAP === 'true') { return true; }

                  return process.env.DEPLOY_SOURCEMAP !== 'false';
               }
            }),

            watch: flags.boolean({
               'description': 'Continually build / bundle source to output directory', 'default': false }),
         });
         break;
   }
}