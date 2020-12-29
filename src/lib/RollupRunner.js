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
      if (typeof config !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'config' is not an 'object'.`);
      }

      if (typeof config.flags !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'config.flags' is not an 'object'.`);
      }

      if (typeof config.type !== 'string')
      {
         throw new Error(`RollupRunner rollup: 'config.type' is not an 'object'.`);
      }

      if (typeof config.input !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'config.input' is not an 'object'.`);
      }

      if (typeof config.output !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'config.output' is not an 'object'.`);
      }

      // TODO Add sanity check for config.input.input and config.output.file/format

      const eventbus = global.$$eventbus;

      // Retrieve configured input plugins from Oclif plugins based on passed in `config.flags`.

      const remoteInputPlugins = await eventbus.triggerAsync(
       `typhonjs:oclif:rollup:plugins:${config.type}:input:get`, config);

      let inputPlugins = [];

      // Make sure remote input plugins is structured as an array.
      if (remoteInputPlugins !== void 0)
      {
         if (!Array.isArray(remoteInputPlugins)) { inputPlugins.push(remoteInputPlugins); }
         else { inputPlugins = remoteInputPlugins; }
      }

      // TODO REMOVE
      process.stderr.write(`RollupRunner rollup - INPUT PLUGINS: ${JSON.stringify(inputPlugins)}\n`);

      // Add input plugins.
      config.input.plugins = inputPlugins;

      // Output ---------------------------------------------------------------------

      const remoteOutputPlugins = await eventbus.triggerAsync(
       `typhonjs:oclif:rollup:plugins:${config.type}:output:get`, config);

      let outputPlugins = [];

      // Make sure remote input plugins is structured as an array.
      if (remoteOutputPlugins !== void 0)
      {
         if (!Array.isArray(remoteOutputPlugins)) { outputPlugins.push(remoteOutputPlugins); }
         else { outputPlugins = remoteOutputPlugins; }
      }

      // TODO REMOVE
      process.stderr.write(`RollupRunner rollup - OUTPUT PLUGINS: ${JSON.stringify(outputPlugins)}\n`);

      // Simple test output config.
      config.output.plugins = outputPlugins;
      config.output.sourcemap = config.flags.sourcemap || false;
//      config.output.sourcemapPathTransform = (sourcePath) => sourcePath.replace(relativePath, `.`);

      const bundle = await rollup(config.input);

      await bundle.write(config.output);

      return bundle;
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