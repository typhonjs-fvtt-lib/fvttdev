const { rollup } = require('rollup');

/**
 * Encapsulates interacting w/ Rollup.
 */
class RollupRunner
{
   async rollupAll(bundleData)
   {
      for (const bundleEntry of bundleData.bundleEntries)
      {
         bundleData.currentBundle = bundleEntry;
         await this.rollup(bundleData);
      }
   }

   /**
    * @param {object}   config - Valid rollup config.
    * @returns {Promise<object>}
    */
   async rollup(bundleData)
   {
      if (typeof bundleData !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'bundleData' is not an 'object'.`);
      }

      if (typeof bundleData.cliFlags !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'bundleData.cliFlags' is not an 'object'.`);
      }

      if (typeof bundleData.currentBundle !== 'object')
      {
         throw new Error(`RollupRunner rollup: 'bundleData.currentBundle' is not an 'object'.`);
      }

      const currentBundle = bundleData.currentBundle;

      // TODO Add sanity check for config.input.input and config.output.file/format

      const eventbus = global.$$eventbus;

      // Create RollupRunner config.
      const config = {
         input: {
            input: currentBundle.inputPath,
            external: bundleData.cliFlags.external
         },
         output: {
            file: currentBundle.outputPath,
            format: currentBundle.format
         }
      };

      // Retrieve configured input plugins from Oclif plugins based on passed in `config.flags`.

      const remoteInputPlugins = await eventbus.triggerAsync(
       `typhonjs:oclif:bundle:plugins:${currentBundle.type}:input:get`, bundleData, currentBundle);

      let inputPlugins = [];

      // Make sure remote input plugins is structured as an array.
      if (remoteInputPlugins !== void 0)
      {
         if (!Array.isArray(remoteInputPlugins)) { inputPlugins.push(remoteInputPlugins); }
         else { inputPlugins = remoteInputPlugins.flat(); }
      }

      // TODO REMOVE
      process.stderr.write(`RollupRunner rollup - INPUT PLUGINS: ${JSON.stringify(inputPlugins)}\n`);

      // Add input plugins.
      config.input.plugins = inputPlugins;

      // Output ---------------------------------------------------------------------

      const remoteOutputPlugins = await eventbus.triggerAsync(
       `typhonjs:oclif:bundle:plugins:${currentBundle.type}:output:get`, bundleData, currentBundle);

      let outputPlugins = [];

      // Make sure remote input plugins is structured as an array.
      if (remoteOutputPlugins !== void 0)
      {
         if (!Array.isArray(remoteOutputPlugins)) { outputPlugins.push(remoteOutputPlugins); }
         else { outputPlugins = remoteOutputPlugins.flat(); }
      }

      // TODO REMOVE
      process.stderr.write(`RollupRunner rollup - OUTPUT PLUGINS: ${JSON.stringify(outputPlugins)}\n`);

      // Simple test output config.
      config.output.plugins = outputPlugins;
      config.output.sourcemap = bundleData.cliFlags.sourcemap || false;
      config.output.sourcemapPathTransform = (sourcePath) => sourcePath.replace(currentBundle.reverseRelativePath, `.`);

      const bundle = await rollup(config.input);

      // Store all watch files for later processing. Since multiple bundles may be generated make sure there are
      // no duplicate watch files added to the bundle data.
      if (currentBundle.type === 'main')
      {
         for (const entry of bundle.watchFiles)
         {
            currentBundle.watchFiles.push(entry);

            if (!bundleData.allWatchFiles.includes(entry))
            {
               bundleData.allWatchFiles.push(entry);
            }
         }
      }

      await bundle.write(config.output);

      // closes the bundle
      await bundle.close();

      return bundleData;
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

      eventbus.on(`typhonjs:node:rollup:runner:run`, this.rollup, this);
      eventbus.on(`typhonjs:node:rollup:runner:run:all`, this.rollupAll, this);
   }
}

module.exports = RollupRunner;