![@typhonjs-fvtt/fvttdev](https://i.imgur.com/mMmh2fL.png)

[![NPM](https://img.shields.io/npm/v/@typhonjs-fvtt/fvttdev.svg?label=npm)](https://www.npmjs.com/package/@typhonjs-fvtt/fvttdev)
[![Code Style](https://img.shields.io/badge/code%20style-allman-yellowgreen.svg?style=flat)](https://en.wikipedia.org/wiki/Indent_style#Allman_style)
[![License](https://img.shields.io/badge/license-MPLv2-yellowgreen.svg?style=flat)](https://github.com/typhonjs-fvtt/fvttdev/blob/main/LICENSE)

[![Build Status](https://github.com/typhonjs-fvtt/fvttdev/workflows/CI/CD/badge.svg)](#)
[![Coverage](https://img.shields.io/codecov/c/github/typhonjs-fvtt/fvttdev.svg)](https://codecov.io/github/typhonjs-fvtt/fvttdev)
[![Dependency Status](https://david-dm.org/typhonjs-fvtt/fvttdev.svg)](https://david-dm.org/typhonjs-fvtt/fvttdev)

### Why?
`@typhonjs-fvtt/fvttdev` provides a zero config build & bundle CLI tool for [Foundry VTT](https://foundryvtt.com/) 
based on Rollup and Oclif.

The aim is to create a development tool that aids all Foundry VTT developers in developing new 3rd party extensions 
(modules & game systems) for this fantastic virtual tabletop which can be used for all sorts of role-playing games. 
Foundry VTT embraces modern web technologies and 

So far only the `bundle` command is implemented and provides zero config bundling for JS and Typescript development. 
CSS / Sass / Less / Stylus setup with PostCSS and more. Several more commands useful for Foundry VTT development are 
planned for future release.

### Roadmap

(05/28/21): I just got significant ES Module support into Oclif v2 which is still in beta, but powers `fvttdev`. 
`fvttdev` is the first non-trivial ESM Oclif CLI. So with ESM support now mainline in the latest Oclif v2 beta I 
look forward to rapid progress in the coming months. Outside of a beta launch likely mid-summer longer term goals
aim to support the unbundle dev cycle w/ hot module replacement (HMR) in addition to already solid production 
bundling.

All build tooling is current as of `05.28.21` including Typescript (4.3.2), Babel (7.14.3) and PostCSS / Sass / Less / 
Stylus.

### Warning
This an alpha stage project, but a stable release on NPM is available. The bundle command works really well, but docs, 
tutorials, and more information and final polish plus other commands are forthcoming soon. 

### Install and usage (very abbreviated!)

In `package.json`:

Add to devDependencies: `"@typhonjs-fvtt/fvttdev": "0.0.18"`

Note: If you have already installed a previous version delete node_modules and any `package-lock.json` file before 
updating and reinstall all modules as a precautionary measure since `fvttdev` just switched to the mainline Oclif v2 
release. 

Add an NPM script: `"bundle-dev": "fvttdev bundle"`

This will find your Foundry VTT package manifest and proceed to bundle your module / system to `./dist`.

You might have to make small modifications to your codebase to support Sass / Less / Stylus. The way it works is that
you must import the appropriate style file into the source code associated with it and `fvttdev` via Rollup & PostCSS 
will build the style file and automatically adjust the output package manifest.

You can get help options for fvttdev via running `"bundle-help": "fvttdev bundle --help"` as there are various command 
line options available. However, there also is a more convenient environment variable loading system available. To 
learn a bit more about that and general usage with a full example of bundling a module please refer to the demo repo:

https://github.com/typhonjs-fvtt/demo-fvttdev-module
