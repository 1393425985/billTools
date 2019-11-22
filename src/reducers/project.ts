import {writeConfig} from '@utils/utils';
const NAMESPACE = 'project';
const initialState: IProject.model = {
  packageCode: 'yarn',
  svnDays: 7,
  patchPath: undefined,
  list: [],
};
const ACTION_HANDLERS = {
  update(state, action) {
    const newState = { ...state, ...action.payload };
    writeConfig({project:newState});
    return newState;
  },
};
export default function appreducer(state = initialState, action) {
  const regExp = new RegExp(`^${NAMESPACE}/`);
  const type = action.type.replace(regExp, '');
  const handler = ACTION_HANDLERS[type];
  return handler ? handler(state, action) : state;
}
