const NAMESPACE = 'bezier';
const initialState: BezierTypes.model = {
  list:[{
      name:'default',
      info:[]
  }]
};
const ACTION_HANDLERS = {
  update(state, action) {
    const newState = { ...state, ...action.payload };
    return newState;
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
