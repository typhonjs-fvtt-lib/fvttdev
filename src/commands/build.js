const { Command, flags }   = require('@oclif/command');
const RollupRunner         = require('../lib/RollupRunner');

/**
 * Provides the main Oclif `build` command that uses Rollup to bundle an FVTT module / system.
 */
class BuildCommand extends Command
{
   /**
    * The main Oclif entry point to run the command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      const test = process.eventbus.triggerSync('test');
      this.log(`test: ${test}`);

      const { flags } = this.parse(BuildCommand);

      // TODO: need to load *.env file here then reparse flags?

      const name = flags.name || 'world';
      this.log(`build ${name} from ./src/commands/build.js`);
   }
}

BuildCommand.description = `Describe the command here
...
Extra documentation goes here
`;

BuildCommand.flags = (function()
{
   return {
      name: flags.string({ 'char': 'b', 'description': 'name to print' })
   };
})();

module.exports = BuildCommand;
