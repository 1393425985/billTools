import moment from 'moment';
const fs = require('fs');

import { CONFIG_PATH } from './enum';

export const writeConfig: (
  config: Partial<ICache.model>,
) => Promise<Partial<ICache.model>> = async function(config) {
  return new Promise(async (resolve, reject) => {
    let oldConfig = await getConfig();
    const newConfig = Object.assign(oldConfig || {}, config);
    fs.writeFile(CONFIG_PATH, JSON.stringify(newConfig), err => {
      if (err) {
        reject();
        throw err;
      } else {
        resolve(newConfig);
      }
    });
  });
};
export const getConfig: () => Promise<ICache.model> = async function() {
  return new Promise((resolve, reject) => {
    fs.exists(CONFIG_PATH, async isE => {
      if (isE) {
        fs.readFile(CONFIG_PATH, 'utf-8', (err, data) => {
          if (err) {
            reject();
            throw err;
          }
          resolve(JSON.parse(data));
        });
      } else {
        resolve(undefined);
      }
    });
  });
};

export const getFile: (filePath: string) => Promise<string> = async function(
  filePath,
) {
  return new Promise((resolve, reject) => {
    fs.exists(filePath, async isE => {
      if (isE) {
        fs.readFile(filePath, 'utf-8', (err, data) => {
          if (err) {
            reject();
            throw err;
          }
          resolve(data);
        });
      } else {
        reject();
      }
    });
  });
};

export const writeFile: (
  filePath: string,
  text: string,
) => Promise<boolean> = async function(filePath, text) {
  return new Promise(async (resolve, reject) => {
    fs.writeFile(filePath, text, err => {
      if (err) {
        reject(false);
        throw err;
      } else {
        resolve(true);
      }
    });
  });
};

export function fixedZero(val) {
  return val * 1 < 10 ? `0${val}` : val;
}

export function getTimeDistance(type) {
  const now = new Date();
  const oneDay = 1000 * 60 * 60 * 24;

  if (type === 'today') {
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);
    return [moment(now), moment(now.getTime() + (oneDay - 1000))];
  }

  if (type === 'week') {
    let day = now.getDay();
    now.setHours(0);
    now.setMinutes(0);
    now.setSeconds(0);

    if (day === 0) {
      day = 6;
    } else {
      day -= 1;
    }

    const beginTime = now.getTime() - day * oneDay;

    return [moment(beginTime), moment(beginTime + (7 * oneDay - 1000))];
  }

  if (type === 'month') {
    const year = now.getFullYear();
    const month = now.getMonth();
    const nextDate = moment(now).add(1, 'months');
    const nextYear = nextDate.year();
    const nextMonth = nextDate.month();

    return [
      moment(`${year}-${fixedZero(month + 1)}-01 00:00:00`),
      moment(
        moment(
          `${nextYear}-${fixedZero(nextMonth + 1)}-01 00:00:00`,
        ).valueOf() - 1000,
      ),
    ];
  }

  if (type === 'year') {
    const year = now.getFullYear();

    return [moment(`${year}-01-01 00:00:00`), moment(`${year}-12-31 23:59:59`)];
  }
}

export function getPlainNode(nodeList, parentPath = '') {
  const arr = [];
  nodeList.forEach(node => {
    const item = node;
    item.path = `${parentPath}/${item.path || ''}`.replace(/\/+/g, '/');
    item.exact = true;
    if (item.children && !item.component) {
      arr.push(...getPlainNode(item.children, item.path));
    } else {
      if (item.children && item.component) {
        item.exact = false;
      }
      arr.push(item);
    }
  });
  return arr;
}

export function digitUppercase(n) {
  const fraction = ['角', '分'];
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖'];
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']];
  let num = Math.abs(n);
  let s = '';
  fraction.forEach((item, index) => {
    s += (digit[Math.floor(num * 10 * 10 ** index) % 10] + item).replace(
      /零./,
      '',
    );
  });
  s = s || '整';
  num = Math.floor(num);
  for (let i = 0; i < unit[0].length && num > 0; i += 1) {
    let p = '';
    for (let j = 0; j < unit[1].length && num > 0; j += 1) {
      p = digit[num % 10] + unit[1][j] + p;
      num = Math.floor(num / 10);
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s;
  }

  return s
    .replace(/(零.)*零元/, '元')
    .replace(/(零.)+/g, '零')
    .replace(/^整$/, '零元整');
}

function getRelation(str1, str2) {
  if (str1 === str2) {
    console.warn('Two path are equal!'); // eslint-disable-line
  }
  const arr1 = str1.split('/');
  const arr2 = str2.split('/');
  if (arr2.every((item, index) => item === arr1[index])) {
    return 1;
  } else if (arr1.every((item, index) => item === arr2[index])) {
    return 2;
  }
  return 3;
}

function getRenderArr(routes) {
  let renderArr = [];
  renderArr.push(routes[0]);
  for (let i = 1; i < routes.length; i += 1) {
    let isAdd = false;
    // 是否包含
    isAdd = renderArr.every(item => getRelation(item, routes[i]) === 3);
    // 去重
    renderArr = renderArr.filter(item => getRelation(item, routes[i]) !== 1);
    if (isAdd) {
      renderArr.push(routes[i]);
    }
  }
  return renderArr;
}

/**
 * Get router routing configuration
 * { path:{name,...param}}=>Array<{name,path ...param}>
 * @param {string} path
 * @param {routerData} routerData
 */
export function getRoutes(path, routerData) {
  let routes = Object.keys(routerData).filter(
    routePath => routePath.indexOf(path) === 0 && routePath !== path,
  );
  // Replace path to '' eg. path='user' /user/name => name
  routes = routes.map(item => item.replace(path, ''));
  // Get the route to be rendered to remove the deep rendering
  const renderArr = getRenderArr(routes);
  // Conversion and stitching parameters
  const renderRoutes = renderArr.map(item => {
    const exact = !routes.some(
      route => route !== item && getRelation(route, item) === 1,
    );
    return {
      exact,
      ...routerData[`${path}${item}`],
      key: `${path}${item}`,
      path: `${path}${item}`,
    };
  });
  return renderRoutes;
}

/* eslint no-useless-escape:0 */
const reg = /(((^https?:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[\w]*))?)$/g;

export function isUrl(path) {
  return reg.test(path);
}

/* 检测浏览器及系统信息 start */
export function getBrowserInfo() {
  const unknown = '-';

  // screen
  let screenSize = '';
  if (screen.width) {
    const width = screen.width ? screen.width : '';
    const height = screen.height ? screen.height : '';
    screenSize += `${width} x ${height}`;
  }

  // browser
  const nVer = navigator.appVersion;
  const nAgt = navigator.userAgent;
  let browser = navigator.appName;
  let version = `${parseFloat(navigator.appVersion)}`;
  let majorVersion = parseInt(navigator.appVersion, 10);
  let nameOffset;
  let verOffset;
  let ix;

  // Opera
  if ((verOffset = nAgt.indexOf('Opera')) !== -1) {
    browser = 'Opera';
    version = nAgt.substring(verOffset + 6);
    if ((verOffset = nAgt.indexOf('Version')) !== -1) {
      version = nAgt.substring(verOffset + 8);
    }
  } else if ((verOffset = nAgt.indexOf('MSIE')) !== -1) {
    // MSIE
    browser = 'Microsoft Internet Explorer';
    version = nAgt.substring(verOffset + 5);
  } else if ((verOffset = nAgt.indexOf('Chrome')) !== -1) {
    // Chrome
    browser = 'Chrome';
    version = nAgt.substring(verOffset + 7);
  } else if ((verOffset = nAgt.indexOf('Safari')) !== -1) {
    // Safari
    browser = 'Safari';
    version = nAgt.substring(verOffset + 7);
    if ((verOffset = nAgt.indexOf('Version')) !== -1) {
      version = nAgt.substring(verOffset + 8);
    }
  } else if ((verOffset = nAgt.indexOf('Firefox')) !== -1) {
    // Firefox
    browser = 'Firefox';
    version = nAgt.substring(verOffset + 8);
  } else if (nAgt.indexOf('Trident/') !== -1) {
    // MSIE 11+
    browser = 'Microsoft Internet Explorer';
    version = nAgt.substring(nAgt.indexOf('rv:') + 3);
  } else if (
    (nameOffset = nAgt.lastIndexOf(' ') + 1) <
    (verOffset = nAgt.lastIndexOf('/'))
  ) {
    // Other browsers
    browser = nAgt.substring(nameOffset, verOffset);
    version = nAgt.substring(verOffset + 1);
    if (browser.toLowerCase() === browser.toUpperCase()) {
      browser = navigator.appName;
    }
  }
  // trim the version string
  if ((ix = version.indexOf(';')) !== -1) version = version.substring(0, ix);
  if ((ix = version.indexOf(' ')) !== -1) version = version.substring(0, ix);
  if ((ix = version.indexOf(')')) !== -1) version = version.substring(0, ix);

  majorVersion = parseInt(`${version}`, 10);
  if (isNaN(majorVersion)) {
    version = `${parseFloat(navigator.appVersion)}`;
    majorVersion = parseInt(navigator.appVersion, 10);
  }

  // core version
  const mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);

  // cookie
  let cookieEnabled = !!navigator.cookieEnabled;

  if (typeof navigator.cookieEnabled === 'undefined' && !cookieEnabled) {
    document.cookie = 'testcookie';
    cookieEnabled = document.cookie.indexOf('testcookie') !== -1;
  }

  // system
  let os = unknown;
  const clientStrings = [
    { s: 'Windows 3.11', r: /Win16/ },
    { s: 'Windows 95', r: /(Windows 95|Win95|Windows_95)/ },
    { s: 'Windows ME', r: /(Win 9x 4.90|Windows ME)/ },
    { s: 'Windows 98', r: /(Windows 98|Win98)/ },
    { s: 'Windows CE', r: /Windows CE/ },
    { s: 'Windows 2000', r: /(Windows NT 5.0|Windows 2000)/ },
    { s: 'Windows XP', r: /(Windows NT 5.1|Windows XP)/ },
    { s: 'Windows Server 2003', r: /Windows NT 5.2/ },
    { s: 'Windows Vista', r: /Windows NT 6.0/ },
    { s: 'Windows 7', r: /(Windows 7|Windows NT 6.1)/ },
    { s: 'Windows 8.1', r: /(Windows 8.1|Windows NT 6.3)/ },
    { s: 'Windows 8', r: /(Windows 8|Windows NT 6.2)/ },
    { s: 'Windows NT 4.0', r: /(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/ },
    { s: 'Windows ME', r: /Windows ME/ },
    { s: 'Android', r: /Android/ },
    { s: 'Open BSD', r: /OpenBSD/ },
    { s: 'Sun OS', r: /SunOS/ },
    { s: 'Linux', r: /(Linux|X11)/ },
    { s: 'iOS', r: /(iPhone|iPad|iPod)/ },
    { s: 'Mac OS X', r: /Mac OS X/ },
    { s: 'Mac OS', r: /(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/ },
    { s: 'QNX', r: /QNX/ },
    { s: 'UNIX', r: /UNIX/ },
    { s: 'BeOS', r: /BeOS/ },
    { s: 'OS/2', r: /OS\/2/ },
    {
      s: 'Search Bot',
      r: /(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/,
    },
  ];
  Object.keys(clientStrings).forEach(id => {
    if (clientStrings[id].r.test(nAgt)) {
      os = clientStrings[id].s;
    }
  });

  let osVersion: any = unknown;

  if (/Windows/.test(os)) {
    osVersion = /Windows (.*)/.exec(os);
    os = 'Windows';
  }

  switch (os) {
    case 'Mac OS X':
      osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt);
      break;

    case 'Android':
      osVersion = /Android ([\.\_\d]+)/.exec(nAgt);
      break;

    case 'iOS':
      osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
      osVersion = [`${osVersion[1]}.${osVersion[2]}.${osVersion[3] | 0}`];
      break;
    default:
      break;
  }
  return {
    screen: screenSize,
    browser,
    browserVersion: version,
    mobile,
    os,
    osVersion: osVersion[1],
    cookies: cookieEnabled,
  };
}
export function getCookie(name) {
  let arr;
  const regStr = new RegExp(`(^| )${name}=([^;]*)(;|$)`);
  if ((arr = document.cookie.match(regStr))) return unescape(arr[2]);
  else return null;
}
export function getURLRequest(location = window.location, name) {
  const url = location.search; // 获取url中"?"符后的字串
  const theRequest = {};
  if (url.indexOf('?') !== -1) {
    const str = url.substr(1);
    const strs = str.split('&');
    for (let i = 0; i < strs.length; i += 1) {
      theRequest[strs[i].split('=')[0]] = unescape(strs[i].split('=')[1]);
    }
  }
  if (name) {
    return theRequest[name];
  }
  return theRequest;
}
export function setURLRequest(params = {}) {
  const rs = window.location.href.split('?')[0];
  const arr = Object.keys(params).map(k => `${k}=${params[k]}`);
  return rs + (arr.length ? `?${arr.join('&')}` : '');
}
