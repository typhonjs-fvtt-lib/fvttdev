import fs             from 'fs';
import path           from 'path';

import jetpack        from 'fs-jetpack';

// TODO Eventually - enable module loading of DynamicCommand
// import DynamicCommand from '@typhonjs-node-bundle/oclif-commons';

import DynamicCommand from '../lib/DynamicCommand.js';

// eslint-disable-next-line no-useless-escape
const s_DIR_REL_REGEX = /\.\.[\\\/](.*)/;  // TODO VERIFY WINDOWS - make sure this regex works; it should.

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
      // Run custom hook for all Oclif bundle plugins to load respective bundler plugins.
      await this.config.runHook('bundle:load:plugins', this.config);

      // Initialize the dynamic flags from all Oclif plugins & inspect FVTT module / system via FVTTRepo.
      await super.initialize({ commands: ['bundle'], event: 'typhonjs:fvttdev:system:fvttrepo:parse' });

      await this._bundle(this.commandData);

      // Finalize any actions for DynamicCommand; used for logging with `--metafile` flag.
      await super.finalize();
   }

   /**
    * Invokes Rollup Runner to make one or more bundles from the generated bundle data for the package.
    * All temporary data is reset at the start of the process.
    *
    * @param {object}   fvttPackage - The bundle data defining the FVTT package.
    *
    * @returns {Promise<void>}
    * @private
    */
   async _bundle(fvttPackage)
   {
      fvttPackage.reset();

      // TODO REMOVE - TEST
      // this.log(`Bundle command - run - bundle data: \n${JSON.stringify(fvttPackage, null, 3)}`);

      // Fire off RollupRunner and have it perform all bundling.
      await global.$$eventbus.triggerAsync('typhonjs:node:bundle:runner:run:all', fvttPackage);

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

      // Store any README.md file to be copied.
      const templatePath = `${bundleData.rootPath}${path.sep}template.json`;
      if (fs.existsSync(templatePath))
      {
         bundleData.copyMap.set(templatePath, `${bundleData.deployDir}${path.sep}template.json`);
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
            // Add to existing styles entry if not already included or create new array entry.
            if (Array.isArray(bundleData.newManifestData.styles) &&
             !bundleData.newManifestData.styles.includes(bundleEntry.outputCSSFilename))
            {
               bundleData.newManifestData.styles.push(bundleEntry.outputCSSFilename);
            }
            else
            {
               bundleData.newManifestData.styles = [bundleEntry.outputCSSFilename];
            }
         }
      }

      jetpack.write(bundleData.newManifestFilepath, bundleData.newManifestData);
   }

   /**
    * Return specific information regarding the bundle command.
    *
    * @returns {string}
    */
   toStringNoop()
   {
      let results = '';

      for (const entry of this.commandData.bundleEntries)
      {
         results += `${entry.toStringNoop()}\n`;
      }

      results += `deploy directory: ${this.commandData.deployDir}\n`;

      return results;
   }
}

// On help / run have all Oclif bundle plugins load any respective bundler plugins.
BundleCommand._initHook = 'bundle:load:plugins';

// On help / run load the following command flags.
BundleCommand._flagCommands = ['bundle'];

BundleCommand.description = `Bundles a module or system
...
Extra documentation goes here
`;

export default BundleCommand;
