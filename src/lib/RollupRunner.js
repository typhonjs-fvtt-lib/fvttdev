const { rollup } = require('rollup');

/**
 * Encapsulates interacting w/ Rollup.
 */
class RollupRunner
{
   /**
    * Runs `rollup` for all bundle entries in `bundleData`.
    *
    * @param {object}   bundleData - Data structure defining a set of bundle entries.
    *
    * @returns {Promise<void>}
    */
   async rollupAll(bundleData)
   {
      for (const bundleEntry of bundleData.bundleEntries)
      {
         bundleData.currentBundle = bundleEntry;
         await this.rollup(bundleData);
      }
   }

   /**
    * @param {object}   bundleData - Data structure defining a set of bundle entries.
    *
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

      // TODO Add sanity check for currentBundle.inputPath and currentBundle.outputPath/format

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
         else { inputPlugins = remoteInputPlugins.flat().filter((entry) => entry !== void 0); }
      }

      // Log a debug statement
      // TODO global.$$eventbus.trigger('log:debug:compact', `RollupRunner rollup - INPUT PLUGINS:`, inputPlugins);

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
         else { outputPlugins = remoteOutputPlugins.flat().filter((entry) => entry !== void 0); }
      }

      // Log a debug statement
      // TODO global.$$eventbus.trigger('log:debug:compact', `RollupRunner rollup - OUTPUT PLUGINS: `, outputPlugins,
      // '-----------------------------------------------------');

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

      eventbus.on(`typhonjs:node:bundle:runner:run`, this.rollup, this);
      eventbus.on(`typhonjs:node:bundle:runner:run:all`, this.rollupAll, this);
   }
}

module.exports = RollupRunner;
