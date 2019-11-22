const NAMESPACE = 'version';
const initialState: IVersion.model = {
  step: 0,
  progress: undefined,
};
const ACTION_HANDLERS = {
  update(state, action) {
    const newState = { ...state, progress: undefined, ...action.payload };
    return newState;
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
