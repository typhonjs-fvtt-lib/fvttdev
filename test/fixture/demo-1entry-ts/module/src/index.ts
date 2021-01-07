// @ts-ignore
import alias    from 'foo';

// @ts-ignore
import testHTML from '../templates/test.html';

// @ts-ignore
import testJSON from '../json/json2/json3/test.json';

import '../less/dialog.less';
import '../sass/dialog.scss';
import '../stylus/dialog.styl';

const num: number = 3;

const FOO: string = 'BAR';

import './hooks'

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
      console.log(HelloRollup.hello());
      console.log(num);
   }

   /**
    */
   static hello() { console.log(`Hello ${FOO}`); }
}