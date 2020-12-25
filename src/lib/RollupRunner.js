const { rollup, watch } = require('rollup');

/**
 * Encapsulates interacting w/ Rollup.
 */
class RollupRunner
{
   /**
    * @param {object}   config - Valid rollup config.
    * @returns {Promise<RollupBuild>}
    */
   async rollup(config)
   {
      return rollup(config);
   }

   /**
    * Wires up FlagHandler on the plugin eventbus.
    *
    * @param {PluginEvent} ev - The plugin event.
    *
    * @see https://www.npmjs.com/package/typhonjs-plugin-manager
    *
    * @ignore
    */
   onPluginLoad(ev)
   {
      const eventbus = ev.eventbus;

      eventbus.on(`typhonjs:node:bundle:rollup:run`, this.rollup, this);
   }
}

module.exports = RollupRunner;