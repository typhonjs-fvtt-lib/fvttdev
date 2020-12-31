const fs       = require('fs');
const path     = require('path');

const FileUtil = require('./FileUtil');

const s_MODULE_REGEX = /(.*)\/module\.json?/;
const s_SYSTEM_REGEX = /(.*)\/system\.json?/;

/**
 * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
 * `system.json` is found that particular directory is considered the root of the module / system. A file list
 * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
 * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
 * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
 */
class FVVTPackage
{
   /**
    * @param {object}   data - A parsed representation of the FVTT repo w/ bundle definitions.
    */
   constructor(data)
   {
      this._data = data;
   }

   /**
    * @returns {string[]}
    */
   get allWatchFiles()
   {
      return this._data.allWatchFiles;
   }

   /**
    * @returns {string}
    */
   get baseDir()
   {
      return this._data.baseDir;
   }

   /**
    * @returns {string}
    */
   get baseDirPath()
   {
      return this._data.baseDirPath;
   }

   /**
    * @returns {{ cssFilename: string, inputFilename: string, inputPath: string, outputPath: string, type: string }}
    */
   get bundleEntries()
   {
      return this._data.bundleEntries;
   }

   /**
    * @returns {Map}
    */
   get copyMap()
   {
      return this._data.copyMap;
   }

   /**
    * @returns {string}
    */
   get cssFilename()
   {
      return this._data.cssFilename;
   }

   /**
    * @returns {string[]}
    */
   get dirs()
   {
      return this._data.dirs;
   }

   /**
    * @returns {string[]}
    */
   get files()
   {
      return this._data.files;
   }

   /**
    * @returns {object}
    */
   get flags()
   {
      return this._data.flags;
   }

   /**
    * @returns {string}
    * TODO: REMOVE
    */
   // get inputPath()
   // {
   //    return this._data.inputPath;
   // }

   /**
    * @returns {object}
    */
   get jsonData()
   {
      return this._data.jsonData;
   }

   /**
    * @returns {string}
    */
   get jsonFilename()
   {
      return this._data.jsonFilename;
   }

   /**
    * @returns {string}
    */
   get jsonPath()
   {
      return this._data.jsonPath;
   }

   /**
    * @returns {object}
    */
   get newJsonData()
   {
      return this._data.newJsonData;
   }

   /**
    * @returns {string}
    */
   get newJsonFilepath()
   {
      return this._data.newJsonFilepath;
   }

   /**
    * @returns {string[]}
    */
   get npmFiles()
   {
      return this._data.npmFiles;
   }

   /**
    * @returns {string}
    */
   // get outputPath()
   // {
   //    return this._data.outputPath;
   // }

   /**
    * @returns {string}
    */
   get packageType()
   {
      return this._data.packageType;
   }

   /**
    * @returns {string}
    */
   get rootPath()
   {
      return this._data.rootPath;
   }

   /**
    * @returns {string[]}
    */
   // get watchFiles()
   // {
   //    return this._data.watchFiles;
   // }

   /**
    * Resets the transient state between the bundling process.
    */
   reset()
   {
      // Clear the map of files / directories to copy.
      this.copyMap.clear();

      // Create a new instance of the original module.json / system.json file.
      this._data.newJsonData = Object.assign(this.jsonData, {});
   }

   /**
    * Performs initialization / parsing of the FVTT repo being parsed.
    *
    * @param {object}   flags - The CLI runtime flags.
    * @param {string}   [dir] - The root directory to parse.
    *
    * @private
    */
   static async parse(flags, dir = global.$$bundler_baseCWD)
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

      // Verify that the module / system.json file has an esmodules entry.
      // TODO REMOVE
      // if (jsonData.esmodules.length !== 1)
      // {
      //    const error = new Error(
      //       `Presently only one entry point in 'esmodules' is supported. None or more specified in: ${jsonPath}.`);
      //
      //    // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
      //    error.$$bundler_fatal = false;
      //
      //    throw error;
      // }

      const jsonFilename = `${packageType}.json`;

      // The results of the bundle file query.
      const data = {
         allWatchFiles: [],
         flags,
         packageType,
         jsonFilename,
         jsonPath,
         rootPath,
         baseDir: dir,
         baseDirPath: path.resolve(dir),
         bundleEntries: [],
         dirs: [],
         files: [],
         npmFiles: [],
         jsonData,
         newJsonData: {},
         newJsonFilepath: `${flags.deploy}${path.sep}${jsonFilename}`,
         watchFiles: [],
         copyMap: new Map()
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

         data.bundleEntries.push({
            cssFilename,
            cssFilepath: `${flags.deploy}${path.sep}${cssFilename}`,
            format: 'es',
            inputFilename: esmodule,
            inputPath: `${rootPath}${path.sep}${esmodule}`,
            outputPath: `${flags.deploy}${path.sep}${esmodule}`,
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
            data.dirs.push(dirPath);
         }
      }

      // Parse all file and store NPM files first before checking if the root path matches the detected module / system.
      for (const filePath of allFiles)
      {
         if (filePath.startsWith(npmFilePath))
         {
            data.npmFiles.push(filePath);
         }
         else if (filePath.startsWith(rootPath))
         {
            data.files.push(filePath);
         }
      }

      return new FVVTPackage(data);
   }
}

module.exports = FVVTPackage;