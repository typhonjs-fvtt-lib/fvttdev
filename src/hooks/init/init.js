import RollupRunner      from '../../lib/RollupRunner.js';
import FVTTRepo          from '../../lib/data/FVTTRepo.js';

/**
 * @param {object} opts - options of the CLI action.
 *
 * @returns {Promise<void>}
 */
export default async function(opts)
{
   try
   {
      globalThis.$$eventbus.trigger('log:debug', `fvttdev init hook running '${opts.id}'.`);

      globalThis.$$pluginManager.add({ name: '@typhonjs-fvtt/fvttrepo', instance: FVTTRepo });

      globalThis.$$pluginManager.add({ name: '@typhonjs-node-rollup/rollup-runner', instance: new RollupRunner() });

      // Add a filter to exclude any errors generating from Babel so the calling code is highlighted.
      globalThis.$$eventbus.trigger('log:filter:add', {
         type: 'exclusive',
         name: '@babel',
         filterString: '@babel'
      });
   }
   catch (error)
   {
      this.error(error);
   }
}
