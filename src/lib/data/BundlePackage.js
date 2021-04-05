/**
 *
 */
export default class BundlePackage
{
   /**
    * @param {object}   bundleData - RollupRunner specific data for multiple bundle generation.
    */
   constructor(bundleData)
   {
      this._allWatchFiles = [];
      this._bundleData = bundleData;
   }

   /**
    * @returns {string[]} -
    */
   get allWatchFiles()
   {
      return this._allWatchFiles;
   }

   /**
    * @returns {{ cssFilename: string, inputFilename: string, inputPath: string, outputPath: string, type: string }} -
    */
   get bundleEntries()
   {
      return this._bundleData.entries;
   }

   /**
    * @returns {object} -
    */
   get cliFlags()
   {
      return this._bundleData.cliFlags;
   }

   /**
    * @returns {string} -
    */
   get deployDir()
   {
      return this._bundleData.deployDir;
   }

   /**
    * @returns {string} -
    */
   get reverseRelativePath()
   {
      return this._bundleData.reverseRelativePath;
   }

   /**
    * Resets any transitory data.
    */
   reset()
   {

   }
}
