/**
 * Creates a non fatal error which doesn't trigger the CLI fatal error handling.
 */
class NonFatalError extends Error
{
   /**
    * @param {string}   message - Error message
    */
   constructor(message)
   {
      super(message);

      this.$$bundler_fatal = false;
   }
}

module.exports = NonFatalError;