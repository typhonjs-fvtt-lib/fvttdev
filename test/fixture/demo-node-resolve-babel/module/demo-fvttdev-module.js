import DemoDialog from './src/dialog/DemoDialog.js';

// Show that you can use non named imports to link via ESM for bundling purposes.
import './src/hooks/index.js';

let a = 0;
const b = 1;
a ||= b;

const c = 1_2;

class Test
{
   // Public Fields
   instanceProperty = "bork";

   static staticProperty = "babelIsCool";

   // Private Fields
   #xValue = 'private_field';

   printXValue() { console.log(`Test().#xValue: ${this.#xValue}`)}
}


const s_REPLACE_TEXT = 'THIS WILL BE REPLACED WITH - YO!';  // This text will be replaced with 'YO!'

/**
 * Shows DemoDialog when the game is ready. Please note that hooks are not asynchronous, but this is a simple demo
 * and we want to await for the dialog result. The throw an error button is meant to test stack trace reversal of
 * minimized / mangled code using NPM module stacktracify - https://www.npmjs.com/package/stacktracify
 */
Hooks.once('ready', async () =>
{
   console.log(`a ||= b: ${a}`);
   console.log(`c: ${c}`);
   console.log(`Test.staticProperty: ${Test.staticProperty}`);
   console.log(`new Test().instanceProperty: ${new Test().instanceProperty}`);
   new Test().printXValue();

   console.log('Hello world from demo-fvttdev-module!');

   console.log(`Just showing that you can do text replacement with a rollup plugin: ${s_REPLACE_TEXT}`);

   const result = await DemoDialog.show();

   console.log(`Result from dialog: ${result}`);
});

/**
 * Add window listeners to catch errors so we can print out the stack trace.
 */
window.addEventListener('error', (event) => { s_ERROR_HANDLER(event.error); });
window.addEventListener('unhandledrejection', (event) => { s_ERROR_HANDLER(event.reason); });

/**
 * Just a convenience to print out the full stack trace in order to be able to use NPM module stacktracify to
 * reverse it against a private source map.
 *
 * @param {Error} error - An error!
 */
const s_ERROR_HANDLER = (error) =>
{
   if (typeof error.stack !== 'string') { return; }

   // Only print out stack trace if it includes `demo-rollup-module`.
   if (error.stack.includes('demo-rollup-module'))
   {
      console.log(`Let's get the stack trace / use Chrome dev tools if shipping source maps or stacktracify:`);

      const lines = error.stack.split('\n');
      lines.splice(0, 1);
      console.log(lines.join('\r\n'));
   }
};
