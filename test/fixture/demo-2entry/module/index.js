import alias    from 'foo';

import testHTML from './templates/test.html';
import testJSON from './json/json2/json3/test.json';

import './sass/dialog.scss';

const FOO = 'BAR';

/**
 * My super simple program test
 */
export default class HelloRollup
{
   /**
    */
   constructor()
   {
      console.log(testJSON.some);
      console.log(testHTML);
      console.log(alias);
   }

   /**
    */
   static hello() { console.log(`Hello ${FOO}`); }
}