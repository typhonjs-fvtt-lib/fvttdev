/**
 *
 */
class BundleData
{
   /**
    * @param {Array}    bundleData - RollupRunner specific data for multiple bundle generation.
    */
   constructor(bundleData)
   {
      this._allWatchFiles = [];
      this._bundleData = bundleData;
   }

   /**
    * @returns {[]}
    */
   get allWatchFiles()
   {
      return this._allWatchFiles;
   }

   /**
    * @returns {{ cssFilename: string, inputFilename: string, inputPath: string, outputPath: string, type: string }}
    */
   get bundleEntries()
   {
      return this._bundleData.entries;
   }

   /**
    * @returns {Object|*}
    */
   get cliFlags()
   {
      return this._bundleData.cliFlags;
   }

   /**
    * @returns {string}
    */
   get deployDir()
   {
      return this._bundleData.deployDir;
   }

   /**
    * Resets any transitory data.
    */
   reset()
   {

   }
}

module.exports = BundleData;