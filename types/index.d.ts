/**
 * Invokes the `fvttdev` CLI with args programmatically. Deletes any environment variables loaded from before to after
 * execution.
 *
 * @param {string[]} args - args to pass to CLI.
 *
 * @returns {Promise<void>}
 */
declare function fvttdev(args: string[]): Promise<void>;

export default fvttdev;
