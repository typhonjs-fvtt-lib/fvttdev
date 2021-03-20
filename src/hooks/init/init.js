import RollupRunner      from '../../lib/RollupRunner.js';
import FVTTRepo          from '../../lib/data/FVTTRepo.js';

/**
 * @param {object} options - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
export default async function(options)
{
   try
   {
      globalThis.$$eventbus.trigger('log:debug', `fvttdev init hook running '${options.id}'.`);

      globalThis.$$pluginManager.add({ name: '@typhonjs-fvtt/fvttrepo', instance: FVTTRepo });

      globalThis.$$pluginManager.add({ name: '@typhonjs-node-rollup/rollup-runner', instance: new RollupRunner() });
   }
   catch (error)
   {
      this.error(error);
   }
}
