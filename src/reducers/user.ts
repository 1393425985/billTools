const NAMESPACE = 'user';
const initialState: IUser.Model = {
  info: undefined,
  loginInfo: {
    status: false,
    msg: '',
  },
  collapsed: false,
  isOnline: navigator.onLine
};
const ACTION_HANDLERS = {
  update(state, action) {
    return { ...state, ...action.payload };
  },
  changeInfo(state, action) {
    return { ...state, info: action.payload };
  },
  changeLoginInfo(state, action) {
    return { ...state, loginInfo: action.payload };
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
