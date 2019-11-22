import { writeConfig } from '@utils/utils';
const NAMESPACE = 'bezier';
const initialState: IBezier.model = {
  list: new Array(9).fill(0).map((v, i) => ({
    name: `default_${i + 1}`,
    info: [],
  })),
};
const ACTION_HANDLERS = {
  update(state, action) {
    const newState = { ...state, ...action.payload };
    writeConfig({ bezier: newState });
    return newState;
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
