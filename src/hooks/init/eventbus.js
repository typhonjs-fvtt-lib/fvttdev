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

//   process.stdout.write(`fvttdev eventbus init hook opts ${JSON.stringify(opts)}\n`);


   switch (opts.id)
   {
/*
'--env, -e' - a name of the *.env file to load from ./env directory.
'--entry, -i' - specific entry point though we are going to parse module.json for them
'--output, -o' - 'Directory to place build files into' / also use *.env files
'--cwd', 'Use an alternative working directory' - default: '.'
'--sourcemap' - 'Generate source map' - default: true
 */

      // Add all built in flags for the build command.
      case 'build':
         process.eventbus.trigger('oclif:flaghandler:add', {
            cwd: flags.string({ 'description': 'Use an alternative working directory', 'default': '.' }),

            entry: flags.string({ 'char': 'i', 'description': 'Explicit entry module(s)' }),

            env: flags.string({ 'char': 'e', 'description': 'Name of *.env file to load from ./env' }),

            output: flags.string({
             'char': 'o', 'description': 'Directory to place build files into.', 'default': './dist' }),

            sourcemap: flags.boolean({ 'description': 'Generate source map.', 'default': true }),

            watch: flags.boolean({
             'description': 'Continually build / bundle source to output directory', 'default': false }),

            // TODO REMOVE
            name: flags.string({ 'char': 'b', 'description': 'name to print' })
         });
         break;
   }

   // TODO REMOVE
   process.stdout.write(`fvttdev eventbus init hook running ${opts.id}\n`);
};