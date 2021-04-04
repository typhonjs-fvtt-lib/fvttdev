import fs                  from 'fs';

import { assert, expect }  from 'chai';

import { fancy }           from 'fancy-test';

import { NonFatalError }   from '@typhonjs-oclif/errors';

import runCLI              from '../../utils/runCLI.js';
import packageVersion      from '../../utils/packageVersion.js';

const s_WIN_REGEX = /\\/g;

describe('command - bundle', () =>
{
   it('(rejected / NonFatalError) bundle --cwd=./test/fixture/demo-0', async () =>
   {
      await expect(runCLI(['bundle', '--cwd=./test/fixture/demo-0'])).to.be.rejectedWith(NonFatalError,
       'Could not find a Foundry VTT module or system in file path: \n./test/fixture/demo-0');
   });

   fancy
      .stdout()
      .do(async () => await runCLI(['bundle', '-e', 'test', '--cwd=./test/fixture/demo-1entry', '--metafile']))
      .it('(created log archive) bundle -e test --cwd=./test/fixture/demo-1entry --metafile', output => {

         // Capture path from stdout the generatad log location.
         const s_REGEX = /\[I\] Writing metafile logs to:\s(.*)$/gm;

         const match = s_REGEX.exec(output.stdout);

         assert.exists(match, 'regex match found');

         const filepath = match[1];
         assert.isTrue(fs.existsSync(filepath), 'log archive exists');

         const stats = fs.statSync(filepath);
         assert.isAbove(stats.size, 100, 'log archive has data');
      })

   it('(rejected / NonFatalError / noop info) bundle -e test --cwd=./test/fixture/demo-1entry --noop', (done) =>
   {
      runCLI(['bundle', '-e', 'test', '--cwd=./test/fixture/demo-1entry', '--noop']).catch((err) =>
      {
         expect(err).to.be.an.instanceof(NonFatalError);

         // Do any replacement necessary for Windows paths.
         const errMessage = err.message.replace(s_WIN_REGEX, '/');
         assert.strictEqual(errMessage, s_DATA_NOOP);
         done();
      })
   });
});

const s_DATA_NOOP = `-----------------------------------
fvttdev (${packageVersion}) running: 'bundle' - detected a module
name: demo-fvttdev-module
title: Demo FVTTDev Module
description: Provides an example using FVTTDev zero config CLI to create a FVTT module.
author: typhonrt
version: 1.1.0
minimumCoreVersion: 0.7.5
compatibleCoreVersion: 1.0.0
url: https://github.com/typhonjs-fvtt/demo-fvttdev-module
manifest path: ./test/fixture/demo-1entry/module/module.json

bundle type: main
input path: ./test/fixture/demo-1entry/module/src/index.js
output path: ./test/deploy/demo-1entry/src/index.js

deploy directory: ./test/deploy/demo-1entry
-----------------------------------`;
