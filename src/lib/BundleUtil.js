const path     = require("path");

const FileUtil = require('./FileUtil');

const s_MODULE_REGEX = /(.*)\/module\.json?/;
const s_SYSTEM_REGEX = /(.*)\/system\.json?/;

/**
 * Provides directory / file parsing to locate a Foundry VTT module or system.
 */
class BundleUtil
{
   /**
    * Searches for a Foundry VTT module or system in the root directory provided. Once either `module.json` or
    * `system.json` is found that particular directory is considered the root of the module / system. A file list
    * will be generated of all files under that root. By convention the `rootPath/npm` directory will have all files
    * separated as they will be treated as separate bundles. The main entry point of the main module / system bundle is
    * parsed from module or system.json / `esmodules`. For now only one main source file may be specified.
    *
    * @param {string}   dir - The root directory to parse.
    * @param {object}   flags - The CLI runtime flags.
    *
    * @returns {Promise<{baseDir: string, mainInput: string, jsonData: *, files: [], jsonPath: null, rootPath: null, npmFiles: [], type: null}>}
    */
   static async getBundle(dir = '.', flags)
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
      if (jsonData.esmodules.length !== 1)
      {
         const error = new Error(
          `Presently only one entry point in 'esmodules' is supported. None or more specified in: ${jsonPath}.`);

         // Set magic boolean for global CLI error handler to skip treating this as a fatal error.
         error.$$bundler_fatal = false;

         throw error;
      }

      // The results of the bundle file query.
      const result = {
         flags,
         bundleType: 'main',
         packageType,
         jsonPath,
         rootPath,
         baseDir: dir,
         baseDirPath: path.resolve(dir),
         mainInput: jsonData.esmodules[0],
         mainInputPath: `${rootPath}${path.sep}${jsonData.esmodules[0]}`,
         outputPath: `${flags.deploy}${path.sep}${jsonData.esmodules[0]}`,
         dirs: [],
         files: [],
         npmFiles: [],
         jsonData,
         watchFiles: []
      };

      // The npm file path which by convention is the root path + `npm`.
      const npmFilePath = `${rootPath}${path.sep}npm`;

      for (const dirPath of allDirs)
      {
         if (dirPath.startsWith(rootPath) && !dirPath.startsWith(npmFilePath))
         {
            result.dirs.push(dirPath);
         }
      }

      // Parse all file and store NPM files first before checking if the root path matches the detected module / system.
      for (const filePath of allFiles)
      {
         if (filePath.startsWith(npmFilePath))
         {
            result.npmFiles.push(filePath);
         }
         else if (filePath.startsWith(rootPath))
         {
            result.files.push(filePath);
         }
      }

      return result;
   }
}

module.exports = BundleUtil;