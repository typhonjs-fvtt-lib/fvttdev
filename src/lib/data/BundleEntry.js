/**
 * Defines a bundle entry.
 */
export default class BundleEntry
{
   /**
    * @param {object}   data - The bundle entry data.
    */
   constructor(data = {})
   {
      this._data = data;
   }

   /**
    * @returns {string}
    */
   get format()
   {
      return this._data.format;
   }

   /**
    * @returns {string}
    */
   get inputBaseName()
   {
      return this._data.format;
   }

   /**
    * @returns {string}
    */
   get inputExt()
   {
      return this._data.inputExt;
   }

   /**
    * @returns {string}
    */
   get inputFilename()
   {
      return this._data.inputFilename;
   }

   /**
    * @returns {string}
    */
   get inputPath()
   {
      return this._data.inputPath;
   }

   /**
    * @returns {string}
    */
   get inputPathRelative()
   {
      return this._data.inputPathRelative;
   }

   /**
    * @returns {string}
    */
   get inputType()
   {
      return this._data.inputType;
   }

   /**
    * @returns {string}
    */
   get outputPath()
   {
      return this._data.outputPath;
   }

   /**
    * @returns {string}
    */
   get outputCSSFilename()
   {
      return this._data.outputCSSFilename;
   }

   /**
    * @returns {string}
    */
   get outputCSSFilepath()
   {
      return this._data.outputCSSFilepath;
   }

   /**
    * @returns {string}
    */
   get reverseRelativePath()
   {
      return this._data.reverseRelativePath;
   }

   /**
    * @returns {string}
    */
   get type()
   {
      return this._data.type;
   }

   /**
    * @returns {string[]}
    */
   get watchFiles()
   {
      return this._data.watchFiles;
   }

   /**
    * Creates a limited string output of the BundleEntry data.
    *
    * @returns {string}
    */
   toStringNoop()
   {
      let results = `bundle type: ${this.type}\n`;
      results += `input path: ${this.inputPathRelative}\n`;
      results += `output path: ${this.outputPath}\n`;

      return results;
   }
}
