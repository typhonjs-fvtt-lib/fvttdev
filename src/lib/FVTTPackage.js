const fs             = require('fs');
const path           = require('path');

const BundleData     = require('./BundleData');
const FileUtil       = require('./FileUtil');

const s_MODULE_REGEX = /(.*)\/module\.json?/;
const s_SYSTEM_REGEX = /(.*)\/system\.json?/;

/**
 * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
 * `system.json` is found that particular directory is considered the root of the module / system. A file list
 * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
 * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
 * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
 */
class FVVTPackage extends BundleData
{
   /**
    * @param {object}   packageData - A parsed representation of the FVTT repo.
    * @param {Array}    bundleData - Rollup Runner specific data for multiple bundle generation.
    */
   constructor(packageData, bundleData)
   {
      super(bundleData);

      this._packageData = packageData;
   }

   /**
    * @returns {string}
    */
   get baseDir()
   {
      return this._packageData.baseDir;
   }

   /**
    * @returns {string}
    */
   get baseDirPath()
   {
      return this._packageData.baseDirPath;
   }

   /**
    * @returns {Map}
    */
   get copyMap()
   {
      return this._packageData.copyMap;
   }

   /**
    * @returns {string[]}
    */
   get dirs()
   {
      return this._packageData.dirs;
   }

   /**
    * @returns {string[]}
    */
   get files()
   {
      return this._packageData.files;
   }

   /**
    * @returns {object}
    */
   get jsonData()
   {
      return this._packageData.jsonData;
   }

   /**
    * @returns {string}
    */
   get jsonFilename()
   {
      return this._packageData.jsonFilename;
   }

   /**
    * @returns {string}
    */
   get jsonPath()
   {
      return this._packageData.jsonPath;
   }

   /**
    * @returns {object}
    */
   get newJsonData()
   {
      return this._packageData.newJsonData;
   }

   /**
    * @returns {string}
    */
   get newJsonFilepath()
   {
      return this._packageData.newJsonFilepath;
   }

   /**
    * @returns {string[]}
    */
   get npmFiles()
   {
      return this._packageData.npmFiles;
   }

   /**
    * @returns {string}
    */
   get packageType()
   {
      return this._packageData.packageType;
   }

   /**
    * @returns {string}
    */
   get rootPath()
   {
      return this._packageData.rootPath;
   }

   /**
    * Resets the transient state between the bundling process.
    */
   reset()
   {
      super.reset();

      // Clear the map of files / directories to copy.
      this.copyMap.clear();

      // Create a new instance of the original module.json / system.json file.
      this._packageData.newJsonData = Object.assign(this.jsonData, {});
   }

   /**
    * Performs initialization / parsing of the FVTT repo being parsed.
    *
    * @param {object}   cliFlags - The CLI runtime flags.
    * @param {string}   [dir] - The root directory to parse.
    *
    * @private
    */
   static async parse(cliFlags, dir = global.$$bundler_baseCWD)
   {
      const allDirs = await FileUtil.getDirList(dir);
      const allFiles = await FileUtil.getFileList(dir);

      let rootPath = null;
      let jsonPath = null;
      let packageType = null;

      // Search through all file paths checking the module & system regex against file paths to find the root path
      // of the module / system and the associated *.json file.
      for (const filePath of allFiles)
      {
         let matches = s_MODULE_REGEX.exec(filePath);
         if (matches !== null)
         {
            jsonPath = matches[0];
            rootPath = matches[1];
            packageType = 'module';
            break;
         }

         matches = s_SYSTEM_REGEX.exec(filePath);
         if (matches !== null)
         {
            jsonPath = matches[0];
            rootPath = matches[1];
            packageType = 'system';
            break;
         }
      }

      // Throw a control flow error.
      if (packageType === null)
      {
         const error = new Error(
          `FileUtil - getBundleList - could not find a Foundry VTT module or system in file path: '${dir}'.`);

         // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
         error.$$bundler_fatal = false;

         throw error;
      }

      let jsonData;

      try
      {
         jsonData = require(jsonPath);
      }
      catch (err)
      {
         // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
         err.$$bundler_fatal = false;
         throw err;
      }

      // Verify that the module / system.json file has an esmodules entry.
      if (!Array.isArray(jsonData.esmodules))
      {
         const error = new Error(`Could not locate 'esmodules' entry in: ${jsonPath}.`);

         // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
         error.$$bundler_fatal = false;

         throw error;
      }

      const jsonFilename = `${packageType}.json`;

      // Defines the data required for RollupRunner.
      const bundleData = {
         cliFlags,
         entries: [],
         deployDir: cliFlags.deploy
      };

      // The results of the bundle file query.
      const packageData = {
         baseDir: dir,
         baseDirPath: path.resolve(dir),
         copyMap: new Map(),
         dirs: [],
         files: [],
         jsonData,
         jsonFilename,
         jsonPath,
         newJsonData: {},
         newJsonFilepath: `${cliFlags.deploy}${path.sep}${jsonFilename}`,
         npmFiles: [],
         packageType,
         rootPath
      };

      // Load all data for esmodules referenced
      // TODO: TYPESCRIPT SUPPORT
      for (const esmodule of jsonData.esmodules)
      {
         const inputPath = `${rootPath}${path.sep}${esmodule}`;

         // Verify that the esmodule file could be found.
         if (!fs.existsSync(inputPath))
         {
            const esmError = new Error(`FVTTPackage - parse error - could not find esmodule:\n${inputPath}`);

            // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
            esmError.$$bundler_fatal = false;

            throw esmError;
         }

         const cssFilename = `${path.basename(esmodule, '.js')}.css`;

         bundleData.entries.push({
            cssFilename,
            cssFilepath: `${cliFlags.deploy}${path.sep}${cssFilename}`,
            format: 'es',
            inputFilename: esmodule,
            inputPath: `${rootPath}${path.sep}${esmodule}`,
            outputPath: `${cliFlags.deploy}${path.sep}${esmodule}`,
            type: 'main',
            watchFiles: []
         });
      }

      // The npm file path which by convention is the root path + `npm`.
      const npmFilePath = `${rootPath}${path.sep}npm`;

      for (const dirPath of allDirs)
      {
         if (dirPath.startsWith(rootPath) && !dirPath.startsWith(npmFilePath))
         {
            packageData.dirs.push(dirPath);
         }
      }

      // Parse all file and store NPM files first before checking if the root path matches the detected module / system.
      for (const filePath of allFiles)
      {
         if (filePath.startsWith(npmFilePath))
         {
            packageData.npmFiles.push(filePath);
         }
         else if (filePath.startsWith(rootPath))
         {
            packageData.files.push(filePath);
         }
      }

      return new FVVTPackage(packageData, bundleData);
   }
}

module.exports = FVVTPackage;