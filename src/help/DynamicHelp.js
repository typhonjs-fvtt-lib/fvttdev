import Help from '@typhonjs-oclif/helpbase';

/**
 * Provides functionality to load flags from DynamicCommand asynchronously so that they appear in help.
 */
export default class DynamicHelp extends Help
{
   /**
    * @param {Command.Config} command - The command config to be loaded.
    */
   async showCommandHelp(command)
   {
      // Load the command class.
      const CommandClass = await command.load();

      // Must instantiate the class to invoke `loadDynamicFlags`.
      command.flags = await new CommandClass([], this.config).loadDynamicFlags();

      await super.showCommandHelp(command);
   }
}
