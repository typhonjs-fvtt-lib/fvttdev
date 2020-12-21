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
      // Dynamically load flags for the command from oclif-flaghandler.
      BuildCommand.flags = process.eventbus.triggerSync('oclif:flaghandler:get');

      const { flags } = this.parse(BuildCommand);

      this.log(`build - run - flags ${JSON.stringify(flags)}`);

      // TODO: need to load *.env file here then reparse flags?

      const name = flags.name || 'world';
      this.log(`build ${name} from ./src/commands/build.js`);
   }
}

BuildCommand.description = `Builds a module or system
...
Extra documentation goes here
`;

module.exports = BuildCommand;
