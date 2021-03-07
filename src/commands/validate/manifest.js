import { flags }      from "@oclif/command";

import DynamicCommand from '../../lib/DynamicCommand.js';

/**
 * Provides the main Oclif `validate:manifest` command that runs validation on the FVTT package manifest.
 */
class ValidateManifestCommand extends DynamicCommand
{
   /**
    * The main Oclif entry point to run the `validate:manifest` command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
console.log(`!!!!!!! VALIDATION SOON!`);
      // Initialize the dynamic flags from all Oclif plugins & inspect FVTT module / system via FVTTRepo.
      await super.initialize({ commands: ['validate:manifest'], event: 'typhonjs:fvttdev:system:fvttrepo:parse' });

      // Finalize any actions for DynamicCommand; used for logging with `--metafile` flag.
      await super.finalize();
   }
}

// On help / run load the following command flags.
ValidateManifestCommand._flagCommands = ['validate:manifest'];

ValidateManifestCommand.flags = {
   name: flags.string({ 'char': 'n', 'description': 'name to print' }),
};

ValidateManifestCommand.description = `Validates a Foundry VTT package manifest
...
Extra documentation goes here
`;

export default ValidateManifestCommand;
