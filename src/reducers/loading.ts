const NAMESPACE = 'loading';
const initialState = {};
const ACTION_HANDLERS = {
  open(state, action) {
    return { ...state, ...{ [action.name]: true } };
  },
  close(state, action) {
    return { ...state, ...{ [action.name]: false } };
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
