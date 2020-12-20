const Events        = require('backbone-esnext-events');
const PluginManager = require('typhonjs-plugin-manager');

const FlagHandler   = require('../../lib/FlagHandler');

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

//   const flagHandler = new FlagHandler();

 //  flagHandler.add();

//   process.pluginManager.add({ name: 'oclif-flaghandler', instance: flagHandler });

   // TODO REMOVE
   process.stdout.write(`fvttdev eventbus init hook running ${opts.id}\n`);
};