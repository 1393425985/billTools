import $ from 'jquery';
import _ from 'lodash';
import moment from 'moment';
import 'moment/locale/zh-cn';

moment.locale('zh-cn');

declare global {
  interface Window {
    $: typeof $;
    _: typeof _;
    moment: typeof moment;
    // require: any;
  }
}
window.$ = $;
window._ = _;
window.moment = moment;
