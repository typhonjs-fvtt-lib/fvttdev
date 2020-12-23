const fs                   = require('fs');
const path                 = require('path');

const { Command }          = require('@oclif/command');
const dotenv               = require('dotenv');

const RollupRunner         = require('../lib/RollupRunner');

/**
 * Provides the main Oclif `build` command that uses Rollup to bundle an FVTT module / system.
 */
class BuildCommand extends Command
{
   /**
    * Attempts to load environment variables from a *.env file w/ `dot-env`. Many flags have defaults, but also can be
    * set with environment variables and this is a convenient way to load many different configurations.
    *
    * @param {object}   existingFlags - parsed flags from command.
    *
    * @returns {object} Either the existing flags if there is no .env file to load or the new flags after new
    * environment variables have been loaded.
    *
    * @private
    */
   _loadEnvFile(existingFlags = {})
   {
      let output = existingFlags;

      if (typeof existingFlags.env === 'string')
      {
         const envFilePath = `${global.$$bundler_baseCWD}${path.sep}env${path.sep}${existingFlags.env}.env`;

         if (!fs.existsSync(envFilePath))
         {
            this.error(`Could not find specified environment file: \n'${envFilePath}'`);
            this.exit(1);
         }
         else
         {
            this.log(`Loading environment variables from: \n${envFilePath}`);

            // Potentially load environment variables from a *.env file.
            const env = dotenv.config({ path: envFilePath });
            if (env.error)
            {
               this.error(`An error occurred with 'dotenv' when loading environment file: \n${env.error.message}`);
               this.exit(1);
            }

            // Parse flags again after environment variables have been loaded.
            const { flags } = this.parse(BuildCommand);
            output = flags;
         }
      }

      return output;
   }

   /**
    * Performs any additional initialization after initial flags have been set.
    *
    * @param {object}   flags - initial flags set for build command.
    */
   initialize(flags)
   {
      global.$$bundler_baseCWD = path.resolve(global.$$bundler_origCWD, flags.cwd);

      // Notify that the current working directory is being changed and verify that the new directory exists.
      if (flags.cwd !== '.')
      {
         this.log(`New current working directory set: \n${global.$$bundler_baseCWD}`);

         if (!fs.existsSync(global.$$bundler_baseCWD))
         {
            this.error(`New current working directory does not exist.`);
            this.exit(1);
         }
      }
   }

   /**
    * The main Oclif entry point to run the command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      // Dynamically load flags for the command from oclif-flaghandler.
      BuildCommand.flags = process.eventbus.triggerSync('oclif:system:flaghandler:get', 'build');

      let { flags } = this.parse(BuildCommand);

      // Perform any initialization after initial flags have been loaded.
      this.initialize(flags);

      // Attempt to parse any environment variables via dot-env if applicable and reload / update flags accordingly.
      flags = this._loadEnvFile(flags);

      // TODO REMOVE - TEST
      this.log(`\nbuild command - run - flags:\n${JSON.stringify(flags, null, 3)}`);
   }
}

BuildCommand.description = `Builds a module or system
...
Extra documentation goes here
`;

module.exports = BuildCommand;
