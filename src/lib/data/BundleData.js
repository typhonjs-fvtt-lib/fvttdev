/**
 *
 */
class BundleData
{
   /**
    * @param {object}   cliFlags - The CLI flags.
    */
   constructor(cliFlags)
   {
      this.cliFlags = cliFlags;
      this.entries = [];
      this.deployDir = cliFlags.deploy;
      this.reverseRelativePath = null;

      // reverseRelativePath: path.relative(deployDir, rootPath)
   }
}

module.exports = BundleData;