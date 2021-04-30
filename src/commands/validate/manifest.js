import fs                  from 'fs';

import { DynamicCommand }  from '@typhonjs-oclif/core';

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
      this.validateManifest(this.commandData);
   }

   /**
    * Validates an FVTT Package.
    *
    * @param {object} fvttPackage - (FVTTPackage) to validate.
    */
   validateManifest(fvttPackage)
   {
      const isPlus = this.cliFlags.plus ? 'plus:' : '';
      const isStrict = this.cliFlags.loose ? '' : ':strict';

      // Constructs the validate manifest event with partials from flags `plus`, `loose` and `manifestType`.
      const event = `typhonjs:fvtt:validate:manifest:${isPlus}${fvttPackage.manifestType}${isStrict}`;

      globalThis.$$eventbus.trigger('log:debug', `validate:manifest event - ${event}`);

      globalThis.$$eventbus.trigger('log:info', `Validating Manifest: ${fvttPackage.manifestPathRelative}`);

      const result = globalThis.$$eventbus.triggerSync(event, fvttPackage.manifestData);

      // globalThis.$$eventbus.trigger('log:debug', `validate:manifest result - ${JSON.stringify(result)}`);

      if (result && !result.valid)
      {
         const file = fs.readFileSync(fvttPackage.manifestPath, 'utf-8');

         const print = globalThis.$$eventbus.triggerSync('typhonjs:utils:better:ajv:errors:as:string', result.errors,
          { file });

         console.log(print);
      }
   }
}

ValidateManifestCommand._dynamicCommand =
{
   flagCommands: ['validate:manifest'],
   eventData: 'typhonjs:fvttdev:system:fvttrepo:parse'
};

ValidateManifestCommand.description = `Validates a Foundry VTT package manifest

...
Extra documentation goes here
`;

export default ValidateManifestCommand;
