const fs             = require('fs');
const path           = require('path');

const BundleData     = require('./BundleData');
const FVTTData       = require('./FVTTData');

const FVTTPackage    = require('./FVTTPackage');

const FileUtil       = require('../FileUtil');
const NonFatalError  = require('../NonFatalError');

const s_MODULE_REGEX = /(.*)\/module\.json?/;
const s_SYSTEM_REGEX = /(.*)\/system\.json?/;

/**
 * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
 * `system.json` is found that particular directory is considered the root of the module / system. A file list
 * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
 * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
 * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
 */
class FVTTRepo
{
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

      const fvttPackage = new FVTTPackage(packageData, bundleData);

      // Allow any plugins to potentially process package & bundle data.
      await global.$$eventbus.triggerAsync('typhonjs:oclif:bundle:data:parse', fvttPackage);

      return fvttPackage;
   }
}

module.exports = FVTTRepo;

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
      throw new NonFatalError(
         `FVTTPackage - could not find a Foundry VTT module or system in file path: '${packageData.baseDir}'.`);
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
      throw new NonFatalError(`Could not locate 'esmodules' entry in: ${jsonPath}.`);
   }

   const jsonFilename = `${packageType}.json`;

   // The npm file path which by convention is the root path + `npm`.
   const npmModulePath = `${rootPath}${path.sep}npm`;

   packageData.jsonData = jsonData;
   packageData.jsonFilename = jsonFilename;
   packageData.jsonPath = jsonPath;
   packageData.newJsonFilepath = `${bundleData.deployDir}${path.sep}${jsonFilename}`;
   packageData.packageType = packageType;
   packageData.rootPath = rootPath;
   packageData.npmModulePath = npmModulePath;

   for (const dirPath of packageData.allDirs)
   {
      if (dirPath.startsWith(rootPath) && !dirPath.startsWith(npmModulePath))
      {
         packageData.dirs.push(dirPath);
      }
   }

   // Parse all file and store NPM files first before checking if the root path matches the detected module / system.
   for (const filePath of packageData.allFiles)
   {
      if (filePath.startsWith(npmModulePath))
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
   for (const esmodule of packageData.jsonData.esmodules)
   {
      // s_RESOLVE_ESMODULE attempts to load a JS file then attempts to load a Typescript file.
      const { inputPath, inputExt, inputBasename, inputType } = s_RESOLVE_ESMODULE(esmodule, packageData);

      const outputCSSFilename = `${inputBasename}.css`;

      bundleData.entries.push({
         format: 'es',
         inputBasename,
         inputExt,
         inputFilename: esmodule,
         inputPath,
         inputType,
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
            throw new NonFatalError(`FVTTPackage - parse error - could not find npm file:\n${inputPath}`);
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

/**
 * Returns whether the given filename is a Javascript or Typescript file.
 *
 * @param {string}   esmodule - file name to test.
 * @param {object}   packageData - absolute file path.
 *
 * @returns {{inputBasename: string, inputExt: string, inputPath: string, inputType: string}}
 * @throws NonFatalError
 */
function s_RESOLVE_ESMODULE(esmodule, packageData)
{
   const extension = path.extname(esmodule);

   // The entry in esmodules attribute is not a JS file.
   if (!FileUtil.isJS(extension))
   {
      throw new NonFatalError(
       `Detected a non JS module filename '${esmodule}' in 'esmodules' entry in '${packageData.jsonFilename}':\n`
        + `${packageData.jsonPath}`);
   }

   const inputParsed = path.parse(esmodule);

   const inputPathBase = `${packageData.rootPath}${path.sep}${inputParsed.dir}${path.sep}${inputParsed.name}`;

   const inputPathJS = `${inputPathBase}${inputParsed.ext}`;

   // Verify that the esmodule file could be found / a valid JS file has been found.
   if (fs.existsSync(inputPathJS))
   {
      return {
         inputBasename: inputParsed.base,
         inputExt: inputParsed.ext,
         inputPath: inputPathJS,
         inputType: 'javascript'
      };
   }

   // Next try to load a `.ts` or `.tsx` file.
   const inputPathTS = `${inputPathBase}.ts`;

   if (fs.existsSync(inputPathTS))
   {
      return {
         inputBasename: inputParsed.base,
         inputExt: '.ts',
         inputPath: inputPathTS,
         inputType: 'typescript'
      };
   }

   const inputPathTSX = `${inputPathBase}.tsx`;

   if (fs.existsSync(inputPathTSX))
   {
      return {
         inputBasename: inputParsed.base,
         inputExt: '.tsx',
         inputPath: inputPathTSX,
         inputType: 'typescript'
      };
   }

   // Could not locate any JS or TS file to load.

   throw new NonFatalError(
    `Could not load filename '${inputParsed.dir}${path.sep}${inputParsed.name}(${inputParsed.ext}|.ts|.tsx)' `
     + ` in 'esmodules' entry in '${packageData.jsonFilename}': \n${packageData.jsonPath}`);
}