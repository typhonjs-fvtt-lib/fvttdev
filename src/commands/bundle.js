const path           = require('path');

const BundleUtil     = require('../lib/BundleUtil');
const DynamicCommand = require('../lib/DynamicCommand');

const PS = path.sep;

/**
 * Provides the main Oclif `bundle` command that uses Rollup to bundle a FVTT module / system.
 */
class BundleCommand extends DynamicCommand
{
   /**
    * The main Oclif entry point to run the `build` command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      const eventbus = global.$$eventbus;

      const flags = super._initializeFlags(BundleCommand, 'bundle');

      const bundleData = await BundleUtil.getBundle('.', flags);

      // // Create main RollupRunner config.
      // const config = {
      //    // flags: flags,
      //    // type: 'main',
      //    input: {
      //       input: bundleData.mainInputPath,
      //    },
      //    output: {
      //       file: `${flags.deploy}${PS}${bundleData.mainInput}`,
      //       format: 'es'
      //    }
      // };

      // TODO REMOVE - TEST
      this.log(`Bundle command - run - bundle data: \n${JSON.stringify(bundleData, null, 3)}`);

      await eventbus.triggerAsync('typhonjs:node:rollup:runner:run', bundleData);

      // Determine the directories in the module / system root which don't have any dependencies in the bundles. We
      // will consider those "asset" directories and copy them to the deploy location.
      for (const entry of bundleData.rollupWatch)
      {
         process.stderr.write(`!!! RW - entry: ${path.dirname(entry)}\n`);
      }

   }
}

BundleCommand.description = `Bundles a module or system
...
Extra documentation goes here
`;

module.exports = BundleCommand;
