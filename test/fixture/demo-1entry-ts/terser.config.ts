// Mock TS usage for config loading test w/ TS.

interface TerserConfig {
   compress: {
      booleans_as_integers: boolean,
      passes: number
   },
   mangle: {
     toplevel: boolean
   },
   ecma: number,
   module: boolean
}

const config: TerserConfig = {
  compress: {
    booleans_as_integers: true,
    passes: 3
  },

  mangle: {
    toplevel: true
  },

  ecma: 2020,

  module: true
};

export default config;