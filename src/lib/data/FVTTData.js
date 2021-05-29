import path from 'path';

/**
 *
 */
export default class FVTTData
{
   /**
    * @param {string[]} allDirs -
    * @param {string[]} allFiles -
    * @param {string}   baseDir -
    */
   constructor(allDirs, allFiles, baseDir)
   {
      this.allDirs = allDirs;
      this.allFiles = allFiles;
      this.baseDir = baseDir;
      this.baseDirPath = path.resolve(baseDir);
      this.copyMap = new Map();
      this.dirs =  [];
      this.files = [];

      /**
       * Stores the generated regex for NPM bundle exclusion. Must not be included in NPM bundles.
       *
       * @type {RegExp[]}
       */
      this.npmExternal = [];

      /**
       * Stores all cliFlags external array and npmExternal which is combined after parsing.
       *
       * @type {*[]}
       */
      this.allExternal = [];

      this.manifestData = null;
      this.manifestFilename = null;
      this.manifestPath = null;
      this.manifestPathRelative = null;

      this.newManifestFilepath = null;
      this.newManifestData = {};

      this.npmFiles = [];

      this.manifestType = null;
      this.rootPath = null;

      this.npmModulePath = null;
   }
}
