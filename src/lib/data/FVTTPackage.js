const BundlePackage  = require('./BundlePackage');

/**
 */
class FVTTPackage extends BundlePackage
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
}

module.exports = FVTTPackage;