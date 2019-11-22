import { isUrl } from '@utils/utils';

export interface IMenuItem {
  name: string;
  icon?: string;
  path: string;
  hideInMenu?: boolean;
  children?: IMenuItem[];
  offline?: boolean;
}

const menuData: IMenuItem[] = [
  {
    name: '启动器',
    icon: 'desktop',
    path: 'project',
    offline: true,
  },
  {
    name: '颜色',
    icon: 'pie-chart',
    path: 'color',
  },
  {
    name: '贝塞尔',
    icon: 'inbox',
    path: 'bessel',
  },
  {
    name: '国际化',
    icon: 'desktop',
    path: 'i18n',
  },
  {
    name: '图表',
    icon: 'desktop',
    path: 'chart',
  },
  {
    name: '设置',
    icon: 'setting',
    path: 'config',
    offline: true,
  },
  {
    name: '结果页',
    icon: 'check-circle-o',
    path: 'result',
    children: [
      {
        name: '成功',
        path: 'success',
      },
      {
        name: '失败',
        path: 'fail',
      },
    ],
    hideInMenu: true,
  },
  {
    name: '异常页',
    icon: 'warning',
    path: 'exception',
    children: [
      {
        name: '403',
        path: '403',
      },
      {
        name: '404',
        path: '404',
      },
      {
        name: '500',
        path: '500',
      },
    ],
    hideInMenu: true,
  },
  {
    name: '账户',
    icon: 'user',
    path: 'user',
    children: [
      {
        name: '登录',
        path: 'login',
      },
      {
        name: '注册',
        path: 'register',
      },
      {
        name: '注册结果',
        path: 'register-result',
      },
    ],
    hideInMenu: true,
  },
];

function formatter(data: IMenuItem[], parentPath: string = '/') {
  return data.map(item => {
    let { path } = item;
    if (!isUrl(path)) {
      path = parentPath + item.path;
    }
    const result = {
      ...item,
      path,
    };
    if (item.children) {
      result.children = formatter(item.children, `${parentPath}${item.path}/`);
    }
    return result;
  });
}

export const getMenuData = () => formatter(menuData);
