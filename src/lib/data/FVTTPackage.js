import BundlePackage from './BundlePackage.js';

/**
 * Defines keys to print from the manifest data.
 *
 * @type {string[]}
 */
const s_TO_STRING_NOOP_KEYS = ['name', 'title', 'description', 'author', 'version', 'minimumCoreVersion',
   'compatibleCoreVersion', 'url'];

/**
 */
export default class FVTTPackage extends BundlePackage
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
   get manifestData()
   {
      return this._packageData.manifestData;
   }

   /**
    * @returns {string}
    */
   get manifestFilename()
   {
      return this._packageData.manifestFilename;
   }

   /**
    * @returns {string}
    */
   get manifestPath()
   {
      return this._packageData.manifestPath;
   }

   /**
    * @returns {string}
    */
   get manifestPathRelative()
   {
      return this._packageData.manifestPathRelative;
   }

   /**
    * @returns {string}
    */
   get manifestType()
   {
      return this._packageData.manifestType;
   }

   /**
    * @returns {object}
    */
   get newManifestData()
   {
      return this._packageData.newManifestData;
   }

   /**
    * @returns {string}
    */
   get newManifestFilepath()
   {
      return this._packageData.newManifestFilepath;
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
   get npmModulePath()
   {
      return this._packageData.npmModulePath;
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
      this._packageData.newManifestData = Object.assign(this.manifestData, {});
   }

   /**
    * Construct the high level overview of this FVTT package.
    *
    * @returns {string}
    */
   toStringNoop()
   {
      const md = this.manifestData;

      let results = `detected a ${this.manifestType}\n`;

      for (const key of s_TO_STRING_NOOP_KEYS)
      {
         if (md[key]) { results += `${key}: ${md[key]}\n`; }
      }

      results += `manifest path: ${this.manifestPathRelative}\n`;

      return results;
   }
}
