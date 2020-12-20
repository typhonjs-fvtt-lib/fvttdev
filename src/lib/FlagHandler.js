const { bold } = require('kleur');

/**
 * Receives all flags from plugins for the given build action.
 */
class FlagHandler
{
   /**
    *
    */
   constructor()
   {
      this._flags = {};
   }

   /**
    * Adds new flags, but posts warnings if there are existing flags w/ the same name.
    *
    * @param {object} newFlags - new flags to add.
    */
   add(newFlags = {})
   {
      process.stdout.write(bold().red('THIS IS AN ERROR MESSAGE STYLED'));

      // const keys = Object.keys(newFlags);
      //
      // for (const key of keys)
      // {
      //    if (this._flags.contains(key))
      //    {
      //    }
      // }
   }
}

module.exports = FlagHandler;