/**
 * Receives all flags from the various Oclif plugins allowing dynamic flag association for the plugin to a specific
 * build command.
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
    * @param {object} newEntry - object defining command name, plugin name, and associated flags
    * @param {string} newEntry.command - The command name to store the flags.
    * @param {string} newEntry.plugin - new flags to add.
    * @param {object} newEntry.flags - new flags to add.
    */
   addFlags(newEntry = {})
   {
      if (typeof newEntry !== 'object')
      {
         throw new Error(`FlagHandler addFlags: 'newEntry' is not an 'object'.`);
      }

      if (typeof newEntry.command !== 'string')
      {
         throw new Error(`FlagHandler addFlags: 'newEntry.command' is not a 'string'.`);
      }

      if (typeof newEntry.plugin !== 'string')
      {
         throw new Error(`FlagHandler addFlags: 'newEntry.plugin' is not a 'string'.`);
      }

      if (typeof newEntry.flags !== 'object')
      {
         throw new Error(`FlagHandler addFlags: 'newEntry.flags' is not an 'object'.`);
      }

      const commandName = newEntry.command;
      const pluginName = newEntry.plugin;
      const newFlags = newEntry.flags;

      // Check for any existing flag conflicts for a given command. An error messages will be thrown if there are
      // conflicts.
      this._checkFlagConflict(commandName, pluginName, newFlags);

      // Retrieve existing command object or create new.
      const commandFlags = this._flags[commandName] || {};

      // Assign copied flags by plugin name to command object.
      commandFlags[pluginName] = Object.assign(newFlags, {});

      // Store command name object.
      this._flags[commandName] = commandFlags;
   }

   /**
    * Checks if there are existing command / plugin flags that conflict with new flags being added.
    *
    * @param {string}   commandName - the name of the command
    * @param {string}   newPluginName - the name of the plugin for new flags attempting to be added.
    * @param {object}   newPluginFlags - new plugin flags to add.
    *
    * @throws {Error}   Throws an Error if conflict is detected
    * @private
    */
   _checkFlagConflict(commandName, newPluginName, newPluginFlags)
   {
      let flagConflictMsg = '';

      // Retrieve the object for the particular command name or create a new one.
      const commandFlags = this._flags[commandName] || {};

      const pluginNames = Object.keys(commandFlags);

      // Verify that an entry for the new plugin hasn't already been made.
      if (pluginNames.includes(newPluginName))
      {
         throw new Error(`flags have already been added for a plugin named '${newPluginName}.'`);
      }

      // The keys of the new flags to add - this is the long name for the flag.
      const newFlags = Object.keys(newPluginFlags);

      // Check all flags across all plugin names against new flags to add.
      for (const newFlag of newFlags)
      {
         // Store any alias for the new flag if defined.
         const newFlagChar = typeof newPluginFlags[newFlag].char === 'string' ? newPluginFlags[newFlag].char : null;

         // Iterate over all existing plugins and verify that the long flag name is not already defined.
         for (const pluginName of pluginNames)
         {
            const pluginFlags = commandFlags[pluginName] || {};

            // Verify that long hand flag is not already in plugin flags.
            if (newFlag in pluginFlags)
            {
               flagConflictMsg += `Flag '${newFlag}' from '${newPluginName}' already defined by `
                + `'${pluginName}' plugin for '${commandName}' command.\n`;
            }

            // If an alias is defined for the new flag then iterate over all existing plugin flags to check
            // alias conflicts w/ shorthand flag values.
            if (newFlagChar)
            {
               const pluginFlagKeys = Object.keys(pluginFlags);

               // Iterate over plugin flag entry data.
               for (const pluginFlagKey of pluginFlagKeys)
               {
                  const pluginFlagEntry = pluginFlags[pluginFlagKey];

                  // An alias conflict is potentially found.
                  if (typeof pluginFlagEntry.char === 'string' && pluginFlagEntry.char === newFlagChar)
                  {
                     flagConflictMsg += `Alias '${newFlagChar}' of flag '${newFlag}' from '${newPluginName}' already `
                     + `defined by '${pluginFlagKey}' flag in '${pluginName}' for '${commandName}' command.\n`;
                  }
               }
            }
         }
      }

      if (flagConflictMsg !== '')
      {
         throw new Error(`FlagHandler Error - The following conflicts are detected:\n${flagConflictMsg}`);
      }
   }

   /**
    * Gets associated flags for a particular command name.
    *
    * @param {string}   commandName - Retrieve flags for this command name.
    *
    * @returns {*|{}}
    */
   getFlags(commandName)
   {
      if (typeof commandName !== 'string')
      {
         throw new Error(`FlagHandler getFlags: 'commandName' is not a 'string'.`);
      }

      // Retrieve existing command object or create new.
      const commandFlags = this._flags[commandName] || {};

      const pluginNames = Object.keys(commandFlags);

      let allFlags = {};

      // Combine all flags across all plugin names.
      for (const name of pluginNames)
      {
         allFlags = Object.assign(allFlags, commandFlags[name]);
      }

      return allFlags;
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

      eventbus.on(`oclif:system:flaghandler:add`, this.addFlags, this);
      eventbus.on(`oclif:system:flaghandler:get`, this.getFlags, this);
   }
}

module.exports = FlagHandler;