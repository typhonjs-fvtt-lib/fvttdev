// Capture path from stdout the generated log location.
import fs         from 'fs';
import { assert } from 'chai';

const s_REGEX = /\[I\] Writing metafile logs to:\s(.*)$/gm;

export default function testMetafile(output)
{
   const match = s_REGEX.exec(output.stdout);

   assert.exists(match, 'regex match found');

   const filepath = match[1];
   assert.isTrue(fs.existsSync(filepath), 'log archive exists');

   const stats = fs.statSync(filepath);
   assert.isAbove(stats.size, 100, 'log archive has data');
}

