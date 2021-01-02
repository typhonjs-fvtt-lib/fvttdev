const fs             = require('fs');
const path           = require('path');

const jetpack        = require('fs-jetpack');

const DynamicCommand = require('../lib/DynamicCommand');
const FVTTPackage    = require('../lib/data/FVTTPackage');

const s_DIR_REL_REGEX = /\.\.\/(.*)/;  // TODO VERIFY WINDOWS - make sure this regex works; it should.

/**
 * Provides the main Oclif `bundle` command that uses Rollup to bundle a FVTT module / system.
 */
class BundleCommand extends DynamicCommand
{
   /**
    * The main Oclif entry point to run the `build` command.
    *
    * @returns {Promise<void>}
    */
   async run()
   {
      // Initialize the dynamic flags from all Oclif plugins.
      const flags = super._initializeFlags(BundleCommand, 'bundle');

      // Inspect FVTT module / system and determine bundle data.
      const fvttPackage = await FVTTPackage.parse(flags);

      await this._bundle(fvttPackage);
   }

   /**
    * Invokes Rollup Runner to make one or more bundles from the generated bundle data for the package.
    * All temporary data is reset at the start of the process.
    *
    * @param {FVTTPackage}   fvttPackage - The bundle data defining the FVTT package.
    *
    * @returns {Promise<void>}
    * @private
    */
   async _bundle(fvttPackage)
   {
      fvttPackage.reset();

      // Fire off RollupRunner and have it perform all bundling.
      await global.$$eventbus.triggerAsync('typhonjs:node:rollup:runner:run:all', fvttPackage);

      // TODO REMOVE - TEST
      this.log(`Bundle command - run - bundle data: \n${JSON.stringify(fvttPackage, null, 3)}`);

      // Copy all top most directories not included in bundling process, module / system json, and
      // any LICENSE or README.md file.
      this._copyNonBundleFiles(fvttPackage);

      // Rewrites the module.json / system.json primarily for any generated CSS / styles.
      this._rewritePackageJson(fvttPackage);
   }

   /**
    * Copies all top most directories from package root path that do not contain any files included
    * in the bundling process. These directories and considered as containing assets.
    *
    * @param {object}   bundleData - The bundle data defining the FVTT package.
    *
    * @private
    */
   _copyNonBundleFiles(bundleData)
   {
      // Store any LICENSE file to be copied.
      const licensePath = `${bundleData.rootPath}${path.sep}LICENSE`;
      if (fs.existsSync(licensePath))
      {
         bundleData.copyMap.set(licensePath, `${bundleData.deployDir}${path.sep}LICENSE`);
      }

      // Store any README.md file to be copied.
      const readmePath = `${bundleData.rootPath}${path.sep}README.md`;
      if (fs.existsSync(readmePath))
      {
         bundleData.copyMap.set(readmePath, `${bundleData.deployDir}${path.sep}README.md`);
      }

      // Create a map structure from `bundleData.dirs` for easier / quicker deletions.
      const dirCopyMap = new Map(bundleData.dirs.map((entry) => { return [entry, 1]; }));

      // Always remove the package root path.
      dirCopyMap.delete(bundleData.rootPath);

      // Always remove the npm folder.
      dirCopyMap.delete(`${bundleData.rootPath}${path.sep}npm`);

      // Remove any directories that are not top most in the module root path.
      for (const dirPath of dirCopyMap.keys())
      {
         if (path.relative(dirPath, bundleData.rootPath) !== '..')
         {
            dirCopyMap.delete(dirPath);
         }
      }

      // Remove all top most directories referenced by files that have been bundled. The top most
      // directory is determined even if the bundled file is nested in subdirectories.
      for (const entry of bundleData.allWatchFiles)
      {
         // Get the directory where the source file is located.
         let dirPath = path.dirname(entry);

         // Get the relative path from the package root.
         const relPath = path.relative(dirPath, bundleData.rootPath);

         // Perform the relative regex match group test.
         const match = s_DIR_REL_REGEX.exec(relPath);

         // If there is a match then further resolve the directory path to the top most above the package root.
         if (match !== null)
         {
            dirPath = path.resolve(dirPath, match[1]);
         }

         dirCopyMap.delete(dirPath);
      }

      // Store all top most directories from package root path to be copied that are not in any of the bundles.
      for (const sourcePath of dirCopyMap.keys())
      {
         const relativePath = path.relative(bundleData.rootPath, sourcePath);
         const destPath = `${bundleData.deployDir}${path.sep}${relativePath}`;

         bundleData.copyMap.set(sourcePath, destPath);
      }

      // Copy all the files / directories to deploy directory.
      for (const sourcePath of bundleData.copyMap.keys())
      {
         const destPath = bundleData.copyMap.get(sourcePath);

         // TODO REMOVE
         // this.log(`copy: ${sourcePath}\nto: ${destPath}\n`);

         jetpack.copy(sourcePath, destPath, { overwrite: true });
      }
   }

   /**
    * Rewrites the module.json / system.json file with any generated css file; modifies / creates the `styles`
    * entry.
    *
    * @param {object}   bundleData - The bundle data defining the FVTT package.
    *
    * @private
    */
   _rewritePackageJson(bundleData)
   {
      for (const bundleEntry of bundleData.bundleEntries)
      {
         if (bundleEntry.outputCSSFilepath !== null && fs.existsSync(bundleEntry.outputCSSFilepath))
         {
            // Add to existing styles entry or create new array entry.
            if (Array.isArray(bundleData.newJsonData.styles))
            {
               bundleData.newJsonData.styles.push(bundleEntry.outputCSSFilename);
            }
            else
            {
               bundleData.newJsonData.styles = [bundleEntry.outputCSSFilename];
            }
         }
      }

      jetpack.write(bundleData.newJsonFilepath, bundleData.newJsonData);
   }
}

BundleCommand.description = `Bundles a module or system
...
Extra documentation goes here
`;

module.exports = BundleCommand;
