const NAMESPACE = 'user';
const initialState = {
  info: {},
  loginStatus: {},
};
const ACTION_HANDLERS = {
  update(state, action) {
    return { ...state, ...action.payload };
  },
  changeInfo(state, action) {
    return { ...state, info: action.payload };
  },
  changeLoginStatus(state, action) {
    return { ...state, loginStatus: action.payload };
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
