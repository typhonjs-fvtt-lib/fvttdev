const fs                   = require('fs');
const path                 = require('path');

const { Command }          = require('@oclif/command');
const dotenv               = require('dotenv');

const PS = path.sep;

/**
 * Provides the main Oclif `build` command that uses Rollup to bundle an FVTT module / system.
 */
class BuildCommand extends Command
{
   /**
    * Attempts to load environment variables from a *.env file w/ `dotenv`. Many flags have defaults, but also can be
    * set with environment variables and this is a convenient way to load many different configurations.
    *
    * Note: If an environment file is loaded by `dotenv` the flags are parsed again below via
    * `this.parse(BuildCommand)`.
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

      // Check to see if the `env` flag has been set; if so attempt to load the *.env file and parse the flags again.
      if (typeof existingFlags.env === 'string')
      {
         // By default the environment variables will always be stored in `./env`
         const envFilePath = `${global.$$bundler_baseCWD}${path.sep}env${path.sep}${existingFlags.env}.env`;

         // Exit gracefully if the environment file could not be found.
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
    * Performs all initialization, loading of flags from *.env file via dotenv and verification of flags.
    *
    * @return {object} Parsed and verified flags.
    *
    * @private
    */
   _initializeFlags()
   {
      // Dynamically load flags for the command from oclif-flaghandler.
      BuildCommand.flags = global.$$eventbus.triggerSync('typhonjs:oclif:system:flaghandler:get', { command: 'build' });

      // Perform the first stage of parsing flags. This is
      let { flags } = this.parse(BuildCommand);

      // Perform any initialization after initial flags have been loaded. Handle defining `cwd` and verify.
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

      // Attempt to parse any environment variables via dotenv if applicable and reload / update flags accordingly.
      flags = this._loadEnvFile(flags);

      // Verify flags given any plugin provided verify functions in FlagHandler.
      global.$$eventbus.triggerSync('typhonjs:oclif:system:flaghandler:verify', { command: 'build', flags });

      return flags;
   }

   /**
    * The main Oclif entry point to run the command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      const eventbus = global.$$eventbus;

      // Initialize all flags / distributed flags from plugins.
      const flags = this._initializeFlags();

      const remoteInputPlugins = await eventbus.triggerAsync('typhonjs:oclif:rollup:plugins:input:get', { flags });

      let inputPlugins = [];

      if (remoteInputPlugins !== void 0)
      {
         if (!Array.isArray(remoteInputPlugins)) { inputPlugins.push(remoteInputPlugins); }
         else { inputPlugins = remoteInputPlugins; }
      }

      // TODO REMOVE
      this.log(`INPUT PLUGINS: ${JSON.stringify(inputPlugins)}`);

      // Simple test input config.
      const configInput = {
         input: './test/fixture/demo/src/index.js',
         plugins: inputPlugins
      };

      // Output ---------------------------------------------------------------------

      const remoteOutputPlugins = await eventbus.triggerAsync('typhonjs:oclif:rollup:plugins:output:get', { flags });

      let outputPlugins = [];

      if (remoteOutputPlugins !== void 0)
      {
         if (!Array.isArray(remoteOutputPlugins)) { outputPlugins.push(remoteOutputPlugins); }
         else { outputPlugins = remoteOutputPlugins; }
      }

      // TODO REMOVE
      this.log(`OUTPUT PLUGINS: ${JSON.stringify(outputPlugins)}`);

      // Simple test output config.
      const configOutput = {
         file: `${flags.deploy}${PS}demo-rollup-module.js`,
         format: 'es',
         plugins: outputPlugins,
         sourcemap: flags.sourcemap,
//            sourcemapPathTransform: (sourcePath) => sourcePath.replace(relativePath, `.`)
      };

      // TODO REMOVE - TEST
      this.log(`\nbuild command - run - flags:\n${JSON.stringify(flags, null, 3)}`);

      const bundle = await global.$$eventbus.triggerAsync('typhonjs:node:bundle:rollup:run', configInput);

      await bundle.write(configOutput);
   }
}

BuildCommand.description = `Builds a module or system
...
Extra documentation goes here
`;

module.exports = BuildCommand;
