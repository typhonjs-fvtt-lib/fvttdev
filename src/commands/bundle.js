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

      await eventbus.triggerAsync('typhonjs:node:rollup:runner:run', bundleData);

      // TODO REMOVE - TEST
      this.log(`Bundle command - run - bundle data: \n${JSON.stringify(bundleData, null, 3)}`);
   }
}

BundleCommand.description = `Bundles a module or system
...
Extra documentation goes here
`;

module.exports = BundleCommand;
