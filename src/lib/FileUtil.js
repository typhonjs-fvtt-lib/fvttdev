const fs    = require("fs");
const path  = require("path");

/**
 * Provides a few utility functions to walk the local file tree.
 */
class FileUtil
{
   /**
    * Returns an array of all files found from walking the directory tree provided.
    *
    * @param {string}   dir - Directory to walk.
    *
    * @returns {Promise<Array>}
    */
   static async getFileList(dir = '.')
   {
      const results = [];

      for await (const p of FileUtil.walkDir(dir))
      {
         results.push(p);
      }

      return results;
   }

   /**
    * A generator function that walks the local file tree.
    *
    * @param {string}   dir - The directory to start walking.
    * @param {Array}    skipDir - An array of directory names to skip walking.
    *
    * @returns {any}
    */
   static async * walkDir(dir, skipDir = ['deploy', 'dist', 'node_modules'])
   {
      const skipDirMap = new Map(skipDir.map((entry) => { return [entry, 1]; }));

      for await (const d of await fs.promises.opendir(dir))
      {
         // Skip directories in `skipMap` or any hidden directories (starts w/ `.`).
         if (d.isDirectory() && (skipDirMap.has(d.name) || d.name.startsWith('.')))
         {
            continue;
         }

         const entry = path.join(dir, d.name);

         if (d.isDirectory())
         {
            yield* FileUtil.walkDir(entry);
         }
         else if (d.isFile())
         {
            yield entry;
         }
      }
   }
}

module.exports = FileUtil;