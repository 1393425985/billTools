import { writeConfig } from '@utils/utils';
const NAMESPACE = 'color';
const temp = [
  '#F44336',
  '#E91E63',
  '#9C27B0',
  '#673AB7',
  '#3F51B5',
  '#2196F3',
  '#03A9F4',
  '#00BCD4',
  '#009688',
  '#4CAF50',
  '#8BC34A',
  '#CDDC39',
  '#FFEB3B',
  '#FFC107',
  '#FF9800',
  '#FF5722',
  '#795548',
  '#607D8B',
];
const initialState: ColorTypes.model = {
  list: [
    { color: '#f5222d', name: '薄暮' },
    { color: '#fa541c', name: '火山' },
    { color: '#fa8c16', name: '日暮' },
    { color: '#faad14', name: '金盏花' },
    { color: '#fadb14', name: '日出' },
    { color: '#a0d911', name: '青柠' },
    { color: '#52c41a', name: '极光绿' },
    { color: '#13c2c2', name: '明青' },
    { color: '#1890ff', name: '拂晓蓝' },
    { color: '#2f54eb', name: '极客蓝' },
    { color: '#722ed1', name: '酱紫' },
    { color: '#eb2f96', name: '法式洋红' },
    { color: '#bfbfbf', name: '灰' },
    ...temp.map((v, i) => ({
      color: v,
      name: `custom_${i + 13}`,
    })),
  ],
};
const ACTION_HANDLERS = {
  update(state, action) {
    const newState = { ...state, ...action.payload };
    writeConfig({ color: newState });
    return newState;
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
