# fvttdev

### Why?
Provides a zero config build & bundle CLI tool for Foundry VTT based on Rollup and Oclif.

So far only the `bundle` command is implemented and provides zero config for JS and Typescript development. 
CSS / Sass / Less / Stylus setup with PostCSS and more.

### Warning
Seriously super pre-alpha release. The bundle command works well, but docs, tutorials, and more information and final 
polish plus other commands are forthcoming soon. Presently `fvttdev` is built with an experimental fork of Oclif v2 
that supports ES Modules. 

### Install and usage (very abbreviated!)

In `package.json`:

Add to devDependencies: `"@typhonjs-fvtt/fvttdev": "0.0.8"`
Add an NPM script: `"bundle-dev": "fvttdev bundle"`

This will find your Foundry package manifest and proceed to bundle your module / system to `./dist`.

You might have to make small modifications to your codebase to support Sass / Less / Stylus. The way it works is that
you must import the appropriate style file into the source code associated with it and `fvttdev` via Rollup & PostCSS 
will build the style file and automatically adjust the output package manifest.

You can get help options for fvttdev via running `"bundle-help": "fvttdev bundle --help"` as there are various command 
line options available. However, there also is a more convenient environment variable loading system available. To 
learn a bit more about that and general usage with a full example of bundling a module please refer to the demo repo:

https://github.com/typhonjs-fvtt/demo-fvttdev-module
