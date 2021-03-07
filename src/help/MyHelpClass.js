import { Help } from '@oclif/plugin-help';

/**
 */
export default class MyHelpClass extends Help
{
   /**
    * @param command
    */
   async showCommandHelp(command)
   {
      // Load the command class.
      const CommandClass = await command.load();

      // Must instantiate the class to invoke `loadDynamicFlags`.
      command.flags = await new CommandClass([], this.config).loadDynamicFlags();

      super.showCommandHelp(command);
   }
}
