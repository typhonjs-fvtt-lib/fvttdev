import fs from 'fs';

const packageVersion = JSON.parse(fs.readFileSync('./package.json', 'utf-8')).version;

export default packageVersion;
