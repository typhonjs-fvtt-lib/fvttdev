const fs             = require('fs');
const path           = require('path');

const { Command }    = require('@oclif/command');
const dotenv         = require('dotenv');

const { NonFatalError } = require('@typhonjs-node-bundle/oclif-commons');

/**
 * Provides default handling for TyphonJS dynamic command initialization of flags from Oclif plugins.
 */
class DynamicCommand extends Command
{
   /**
    * Attempts to load environment variables from a *.env file w/ `dotenv`. Many flags have defaults, but also can be
    * set with environment variables and this is a convenient way to load many different configurations.
    *
    * Note: If an environment file is loaded by `dotenv` the flags are parsed again below via
    * `this.parse(BuildCommand)`.
    *
    * @param {object}   existingFlags - parsed flags from command.
    * @param {object}   CommandClass - The actual child command class.
    *
    * @returns {object} Either the existing flags if there is no .env file to load or the new flags after new
    * environment variables have been loaded.
    *
    * @private
    */
   _loadEnvFile(existingFlags = {}, CommandClass)
   {
      let output = existingFlags;

      // Check to see if the `env` flag has been set; if so attempt to load the *.env file and parse the flags again.
      if (typeof existingFlags.env === 'string')
      {
         // By default the environment variables will always be stored in `./env`
         const envFilePath = `${global.$$bundler_baseCWD}${path.sep}env${path.sep}${existingFlags.env}.env`;

         const logEnvFilePath = `${global.$$bundler_logCWD}${path.sep}env${path.sep}${existingFlags.env}.env`;

         // Exit gracefully if the environment file could not be found.
         if (!fs.existsSync(envFilePath))
         {
            this.error(`Could not find specified environment file: \n'${logEnvFilePath}'`);
            this.exit(1);
         }
         else
         {
            global.$$eventbus.trigger('log:verbose', `Loading environment variables from: \n${logEnvFilePath}`);

            // Potentially load environment variables from a *.env file.
            const env = dotenv.config({ path: envFilePath });
            if (env.error)
            {
               this.error(`An error occurred with 'dotenv' when loading environment file: \n${env.error.message}`);
               this.exit(1);
            }

            // Parse flags again after environment variables have been loaded.
            const { flags } = this.parse(CommandClass);
            output = flags;
         }
      }

      return output;
   }

   /**
    * Performs all initialization, loading of flags from *.env file via dotenv and verification of flags.
    *
    * @param {object}   CommandClass - The actual child command class.
    * @param {string}   command - The actual command name.
    *
    * @return {object} Parsed and verified flags.
    *
    * @private
    */
   _initializeFlags(CommandClass, command)
   {
      const eventbus = global.$$eventbus;

      // Dynamically load flags for the command from oclif-flaghandler.
      CommandClass.flags = eventbus.triggerSync('typhonjs:oclif:system:flaghandler:get', { command });

      // Perform the first stage of parsing flags. This is
      let { flags } = this.parse(CommandClass);

      // Notify that the current working directory is being changed and verify that the new directory exists.
      if (typeof flags.cwd === 'string' && flags.cwd !== '.')
      {
         const origCWD = global.$$bundler_baseCWD;
         const newCWD = flags.cwd;

         // Perform any initialization after initial flags have been loaded. Handle defining `cwd` and verify.
         global.$$bundler_baseCWD = path.resolve(global.$$bundler_origCWD, newCWD);

         // Only log absolute path if the CWD location is outside of the original path.
         global.$$bundler_logCWD = newCWD.startsWith(origCWD) ? path.relative(origCWD, newCWD) : newCWD;

         global.$$eventbus.trigger('log:verbose', `New current working directory set: \n${global.$$bundler_logCWD}`);

         if (!fs.existsSync(global.$$bundler_baseCWD))
         {
            throw new NonFatalError(`New current working directory does not exist.`);
         }
      }

      // Attempt to parse any environment variables via dotenv if applicable and reload / update flags accordingly.
      flags = this._loadEnvFile(flags, CommandClass);

      // Verify flags given any plugin provided verify functions in FlagHandler.
      eventbus.triggerSync('typhonjs:oclif:system:flaghandler:verify', { command, flags });

      return flags;
   }
}

module.exports = DynamicCommand;