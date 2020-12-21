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
   addFlags(newFlags = {})
   {
      const keys = Object.keys(newFlags);

      for (const key of keys)
      {
         if (!(key in this._flags))
         {
            this._flags[key] = newFlags[key];
         }
         else
         {
            process.eventbus.trigger('log:warn', `add: skipping key '${key}' as already managed.\n`);
         }
      }
   }

   /**
    * Gets the flags.
    *
    * @returns {*|{}}
    */
   getFlags()
   {
      return this._flags;
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

      let eventPrepend = '';

      const options = ev.pluginOptions;

      // Apply any plugin options.
      if (typeof options === 'object')
      {
         // If `eventPrepend` is defined then it is prepended before all event bindings.
         if (typeof options.eventPrepend === 'string') { eventPrepend = `${options.eventPrepend}:`; }
      }

      eventbus.on(`${eventPrepend}oclif:flaghandler:add`, this.addFlags, this);
      eventbus.on(`${eventPrepend}oclif:flaghandler:get`, this.getFlags, this);
   }
}

module.exports = FlagHandler;