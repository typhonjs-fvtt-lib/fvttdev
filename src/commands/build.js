const path                 = require('path');

const BundleUtil           = require('../lib/BundleUtil');
const DynamicCommand       = require('../lib/DynamicCommand');

const PS = path.sep;

/**
 * Provides the main Oclif `build` command that uses Rollup to bundle an FVTT module / system.
 */
class BuildCommand extends DynamicCommand
{
   /**
    * The main Oclif entry point to run the `build` command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      const eventbus = global.$$eventbus;

      const flags = super._initializeFlags(BuildCommand, 'build');

      const bundleData = await BundleUtil.getBundle();

      this.log(`Build - run - bundle data: \n${JSON.stringify(bundleData, null, 3)}`);

      // Create main RollupRunner config.
      const config = {
         flags,
         type: 'main',
         input: {
            input: bundleData.mainInputPath,
         },
         output: {
            file: `${flags.deploy}${PS}${bundleData.mainInput}`,
            format: 'es'
         }
      };

      // TODO REMOVE - TEST
      this.log(`\nbuild command - run - flags:\n${JSON.stringify(config.flags, null, 3)}`);

      await eventbus.triggerAsync('typhonjs:node:bundle:rollup:run', config);
   }
}

BuildCommand.description = `Builds a module or system
...
Extra documentation goes here
`;

module.exports = BuildCommand;
