import fs                from 'fs';
import path              from 'path';

import { FileUtil }      from '@typhonjs-oclif/core';
import { NonFatalError } from '@typhonjs-oclif/errors';

import BundleData        from './BundleData.js';
import BundleEntry       from './BundleEntry.js';
import FVTTData          from './FVTTData.js';

import FVTTPackage       from './FVTTPackage.js';

/* eslint-disable no-useless-escape */
const s_MODULE_REGEX    = /(.*)[\\\/]module\.json?/;
const s_SYSTEM_REGEX    = /(.*)[\\\/]system\.json?/;
/* eslint-enable no-useless-escape */

const s_SKIP_DIRS = ['deploy', 'dist', 'node_modules'];

/**
 * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
 * `system.json` is found that particular directory is considered the root of the module / system. A file list
 * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
 * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
 * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
 */
export default class FVTTRepo
{
   /**
    * Performs initialization / parsing of the FVTT repo being parsed.
    *
    * @param {object}   cliFlags - The CLI runtime flags.
    * @param {string}   [baseDir] - The root directory to parse.
    * @param {string}   [origCWD] - The original CWD.
    *
    * @returns {FVTTPackage} A parsed FVTTPackage.
    */
   static async parse(cliFlags, baseDir = '.', origCWD = '.')
   {
      const eventbus = globalThis.$$eventbus;
      const allDirs = await FileUtil.getDirList({ dir: baseDir, skipDir: s_SKIP_DIRS });
      const allFiles = await FileUtil.getFileList({ dir: baseDir, skipDir: s_SKIP_DIRS });

      const packageData = new FVTTData(allDirs, allFiles, baseDir);
      const bundleData = new BundleData(cliFlags);

      s_PARSE_FILES(packageData, bundleData, origCWD);

      s_PARSE_NPM_BUNDLES(packageData, bundleData, origCWD);

      s_PARSE_MAIN_BUNDLES(packageData, bundleData, origCWD);

      const fvttPackage = new FVTTPackage(packageData, bundleData);

      // Allow any plugins to potentially process package & bundle data.
      if (eventbus !== void 0)
      {
         await eventbus.triggerAsync('typhonjs:oclif:data:bundle:parse', fvttPackage);
      }

      return fvttPackage;
   }

   /**
    * Wires up FVTTRepo on the plugin eventbus.
    *
    * @param {object} ev - PluginEvent - The plugin event.
    *
    * @see https://www.npmjs.com/package/typhonjs-plugin-manager
    *
    * @ignore
    */
   static onPluginLoad(ev)
   {
      ev.eventbus.on(`typhonjs:fvttdev:system:fvttrepo:parse`, FVTTRepo.parse, FVTTRepo);
   }
}

/**
 * @param {FVTTData}    packageData -
 * @param {BundleData}  bundleData -
 * @param {string}      origCWD -
 */
function s_PARSE_FILES(packageData, bundleData, origCWD)
{
   let rootPath = null;
   let manifestPath = null;
   let manifestType = null;

   // Search through all file paths checking the module & system regex against file paths to find the root path
   // of the module / system and the associated *.json file.
   for (const filePath of packageData.allFiles)
   {
      let matches = s_MODULE_REGEX.exec(filePath);
      if (matches !== null)
      {
         manifestPath = matches[0];
         rootPath = matches[1];
         manifestType = 'module';
         break;
      }

      matches = s_SYSTEM_REGEX.exec(filePath);
      if (matches !== null)
      {
         manifestPath = matches[0];
         rootPath = matches[1];
         manifestType = 'system';
         break;
      }
   }

   // Throw a control flow error.
   if (manifestType === null)
   {
      throw new NonFatalError(
       `Could not find a Foundry VTT module or system in file path: \n${globalThis.$$cli_logCWD}`);
   }

   let manifestData;

   try
   {
      manifestData = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
   }
   catch (err)
   {
      throw new NonFatalError(`${err.message}\nFailed to load manifest at path:\n${manifestPath}`);
   }

   // Verify that the module / system.json file has an esmodules entry.
   if (!Array.isArray(manifestData.esmodules))
   {
      throw new NonFatalError(`Could not locate 'esmodules' entry in: \n${manifestPath}`);
   }

   const manifestFilename = `${manifestType}.json`;

   // The npm file path which by convention is the root path + `npm`.
   const npmModulePath = `${rootPath}${path.sep}npm`;

   packageData.manifestData = manifestData;
   packageData.manifestFilename = manifestFilename;
   packageData.manifestPath = manifestPath;
   packageData.manifestPathRelative = FileUtil.getRelativePath(origCWD, manifestPath);
   packageData.manifestType = manifestType;
   packageData.newManifestFilepath = `${bundleData.deployDir}${path.sep}${manifestFilename}`;
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
 * @param {string}      origCWD -
 */
function s_PARSE_MAIN_BUNDLES(packageData, bundleData, origCWD)
{
   // Load all data for esmodules referenced
   for (const esmodule of packageData.manifestData.esmodules)
   {
      // s_RESOLVE_ESMODULE attempts to load a JS file then attempts to load a Typescript file.
      const { inputPath, inputExt, inputFilename, inputBasename, inputType } =
         s_RESOLVE_ESMODULE(esmodule, packageData);

      const outputCSSFilename = `${inputBasename}.css`;

      bundleData.entries.push(new BundleEntry({
         format: 'es',
         inputBasename,
         inputExt,
         inputFilename,
         inputPath,
         inputPathRelative: FileUtil.getRelativePath(origCWD, inputPath),
         inputType,
         outputPath: `${bundleData.deployDir}${path.sep}${esmodule}`,
         outputCSSFilename,
         outputCSSFilepath: `${bundleData.deployDir}${path.sep}${outputCSSFilename}`,
         reverseRelativePath: path.relative(bundleData.deployDir, packageData.rootPath),
         type: 'main',
         watchFiles: []
      }));
   }
}

/**
 * @param {FVTTData}    packageData -
 * @param {BundleData}  bundleData -
 * @param {string}      origCWD -
 */
function s_PARSE_NPM_BUNDLES(packageData, bundleData, origCWD)
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
            throw new NonFatalError(`Could not find npm source file:\n${inputPath}`);
         }

         // Note: Consider that reverseRelativePath has `..${path.sep}` hard coded before the path relative
         // calculation. This likely is necessary as the source path is generated from ./npm/ so Rollup uses
         // ../../node_modules for two levels of indirection. We want ./node_modules/xxxx as a result so prepend
         // `../` and get `./node_modules/xxx` as a result. Seems to work, but beware.

         bundleData.entries.push(new BundleEntry({
            format: 'es',
            inputFilename,
            inputPath,
            inputPathRelative: FileUtil.getRelativePath(origCWD, inputPath),
            outputPath,
            outputCSSFilename: null,
            outputCSSFilepath: null,
            reverseRelativePath: `..${path.sep}${path.relative(bundleData.deployDir, packageData.baseDir)}`,
            type: 'npm',
            watchFiles: []
         }));
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
       `Detected a non JS module filename '${esmodule}' in 'esmodules' entry in '${packageData.manifestFilename}':\n` +
        `${packageData.manifestPath}`);
   }

   const inputParsed = path.parse(esmodule);

   const inputPathBase =
    `${packageData.rootPath}${path.sep}${inputParsed.dir}${inputParsed.dir !== '' ? path.sep : ''}${inputParsed.name}`;

   const esmoduleBase = `${inputParsed.dir}${inputParsed.dir !== '' ? path.sep : ''}${inputParsed.name}`;

   const inputPathJS = `${inputPathBase}${inputParsed.ext}`;

   // Verify that the esmodule file could be found / a valid JS file has been found.
   if (fs.existsSync(inputPathJS))
   {
      return {
         inputBasename: inputParsed.name,
         inputExt: inputParsed.ext,
         inputFilename: esmodule,
         inputPath: inputPathJS,
         inputType: 'javascript'
      };
   }

   // Next try to load a `.ts` or `.tsx` file.
   const inputPathTS = `${inputPathBase}.ts`;

   if (fs.existsSync(inputPathTS))
   {
      return {
         inputBasename: inputParsed.name,
         inputExt: '.ts',
         inputFilename: `${esmoduleBase}.ts`,
         inputPath: inputPathTS,
         inputType: 'typescript'
      };
   }

   const inputPathTSX = `${inputPathBase}.tsx`;

   if (fs.existsSync(inputPathTSX))
   {
      return {
         inputBasename: inputParsed.name,
         inputExt: '.tsx',
         inputFilename: `${esmoduleBase}.tsx`,
         inputPath: inputPathTSX,
         inputType: 'typescript'
      };
   }

   // Could not locate any JS or TS file to load.

   throw new NonFatalError(
    `Could not load filename '${inputParsed.dir}${path.sep}${inputParsed.name}(${inputParsed.ext}|.ts|.tsx)' ` +
     ` in 'esmodules' entry in '${packageData.manifestFilename}': \n${packageData.manifestPath}`);
}
