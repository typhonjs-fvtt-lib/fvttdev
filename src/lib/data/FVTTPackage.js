const fs             = require('fs');
const path           = require('path');

const BundleData     = require('./BundleData');
const FVTTData       = require('./FVTTData');

const BundlePackage  = require('./BundlePackage');

const FileUtil       = require('../FileUtil');

const s_MODULE_REGEX = /(.*)\/module\.json?/;
const s_SYSTEM_REGEX = /(.*)\/system\.json?/;

/**
 * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
 * `system.json` is found that particular directory is considered the root of the module / system. A file list
 * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
 * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
 * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
 */
class FVVTPackage extends BundlePackage
{
   /**
    * @param {object}   packageData - A parsed representation of the FVTT repo.
    * @param {object}    bundleData - Rollup Runner specific data for multiple bundle generation.
    */
   constructor(packageData, bundleData)
   {
      super(bundleData);

      this._packageData = packageData;
   }

   /**
    * @returns {string[]}
    */
   get allDirs()
   {
      return this._packageData.allDirs;
   }

   /**
    * @returns {string[]}
    */
   get allFiles()
   {
      return this._packageData.allFiles;
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
    * @param {string}   [baseDir] - The root directory to parse.
    *
    * @private
    */
   static async parse(cliFlags, baseDir = global.$$bundler_baseCWD)
   {
      const allDirs = await FileUtil.getDirList(baseDir);
      const allFiles = await FileUtil.getFileList(baseDir);

      const packageData = new FVTTData(allDirs, allFiles, baseDir);
      const bundleData = new BundleData(cliFlags);

      s_PARSE_FILES(packageData, bundleData);

      s_PARSE_NPM_BUNDLES(packageData, bundleData);

      s_PARSE_MAIN_BUNDLES(packageData, bundleData);

      const fvttPackage = new FVVTPackage(packageData, bundleData);

      // Allow any plugins to potentially process package & bundle data.
      await global.$$eventbus.triggerAsync('typhonjs:oclif:bundle:data:parse', fvttPackage);

      return fvttPackage;
   }
}

/**
 * @param {FVTTData}    packageData -
 * @param {BundleData}  bundleData -
 */
function s_PARSE_FILES(packageData, bundleData)
{
   let rootPath = null;
   let jsonPath = null;
   let packageType = null;

   // Search through all file paths checking the module & system regex against file paths to find the root path
   // of the module / system and the associated *.json file.
   for (const filePath of packageData.allFiles)
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
       `FVTTPackage - could not find a Foundry VTT module or system in file path: '${packageData.baseDir}'.`);

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

   // The npm file path which by convention is the root path + `npm`.
   const npmFilePath = `${rootPath}${path.sep}npm`;

   packageData.jsonData = jsonData;
   packageData.jsonFilename = jsonFilename;
   packageData.jsonPath = jsonPath;
   packageData.newJsonFilepath = `${bundleData.deployDir}${path.sep}${jsonFilename}`;
   packageData.packageType = packageType;
   packageData.rootPath = rootPath;
   packageData.npmFilePath = npmFilePath;

   for (const dirPath of packageData.allDirs)
   {
      if (dirPath.startsWith(rootPath) && !dirPath.startsWith(npmFilePath))
      {
         packageData.dirs.push(dirPath);
      }
   }

   // Parse all file and store NPM files first before checking if the root path matches the detected module / system.
   for (const filePath of packageData.allFiles)
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
}

/**
 * @param {FVTTData}    packageData -
 * @param {BundleData}  bundleData -
 */
function s_PARSE_MAIN_BUNDLES(packageData, bundleData)
{
   // Load all data for esmodules referenced
   // TODO: TYPESCRIPT SUPPORT
   for (const esmodule of packageData.jsonData.esmodules)
   {
      const inputPath = `${packageData.rootPath}${path.sep}${esmodule}`;

      // Verify that the esmodule file could be found.
      if (!fs.existsSync(inputPath))
      {
         const esmError = new Error(`FVTTPackage - parse error - could not find esmodule:\n${inputPath}`);

         // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
         esmError.$$bundler_fatal = false;

         throw esmError;
      }

      const inputBasename = path.basename(esmodule, '.js');

      const outputCSSFilename = `${inputBasename}.css`;

      bundleData.entries.push({
         format: 'es',
         inputBasename,
         inputExt: path.extname(esmodule),
         inputFilename: esmodule,
         inputPath: `${packageData.rootPath}${path.sep}${esmodule}`,
         outputPath: `${bundleData.deployDir}${path.sep}${esmodule}`,
         outputCSSFilename,
         outputCSSFilepath: `${bundleData.deployDir}${path.sep}${outputCSSFilename}`,
         reverseRelativePath: path.relative(bundleData.deployDir, packageData.rootPath),
         type: 'main',
         watchFiles: []
      });
   }
}

/**
 * @param {FVTTData}    packageData -
 * @param {BundleData}  bundleData -
 */
function s_PARSE_NPM_BUNDLES(packageData, bundleData)
{
   // Load all data for npm files / bundles referenced
   if (packageData.npmFiles.length > 0)
   {
      // TODO: TYPESCRIPT SUPPORT
      for (const npmFile of packageData.npmFiles)
      {
         const inputPath = npmFile;
         const inputFilename = path.basename(npmFile);
         const outputPath = `${bundleData.deployDir}${path.sep}npm${path.sep}${inputFilename}`;

         // Add a regex and escape it for the name of the file / NPM module to external.
         const regex = `${path.sep}npm${path.sep}${inputFilename}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

         bundleData.cliFlags.external.push(new RegExp(regex));

         // Verify that the file could be found.
         if (!fs.existsSync(inputPath))
         {
            const npmError = new Error(`FVTTPackage - parse error - could not find npm file:\n${inputPath}`);

            // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
            npmError.$$bundler_fatal = false;

            throw npmError;
         }

         // Note: Consider that reverseRelativePath has `..${path.sep}` hard coded before the path relative
         // calculation. This likely is necessary as the source path is generated from ./npm/ so Rollup uses
         // ../../node_modules for two levels of indirection. We want ./node_modules/xxxx as a result so prepend
         // `../` and get `./node_modules/xxx` as a result. Seems to work, but beware.

         bundleData.entries.push({
            format: 'es',
            inputFilename,
            inputPath,
            outputPath,
            outputCSSFilename: null,
            outputCSSFilepath: null,
            reverseRelativePath: `..${path.sep}${path.relative(bundleData.deployDir, packageData.baseDir)}`,
            type: 'npm',
            watchFiles: []
         });
      }
   }
}

module.exports = FVVTPackage;