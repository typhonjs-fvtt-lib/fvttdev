const path = require('path');

/**
 *
 */
class FVTTData
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

      this.manifestData = null;
      this.manifestFilename = null;
      this.manifestPath = null;

      this.newManifestFilepath = null;
      this.newManifestData = {};

      this.npmFiles = [];

      this.manifestType = null;
      this.rootPath = null;

      this.npmModulePath = null;
   }
}

module.exports = FVTTData;