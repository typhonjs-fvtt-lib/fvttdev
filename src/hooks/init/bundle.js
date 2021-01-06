const BundleUtil  = require('../../lib/BundleUtil');

/**
 * Note: This is defined as an explicit init function so that it executes before all plugin init functions.
 * As things go an init method of the command itself will run after all plugin init methods which is not desirable.
 * We want to explicitly set all bundle command flags before plugins initialize.
 *
 * @param {object} options - Oclif CLI options.
 *
 * @returns {Promise<void>}
 */
module.exports = async function(options)
{
   global.$$eventbus.trigger('log:debug', `explicit bundle command init hook running '${options.id}'.`);

   BundleUtil.addFlags({ pluginName: 'fvttdev', disableKeys: ['entry'] });
};
