import {
  call,
  fork,
  cancel,
  cancelled,
  put,
  takeEvery,
  takeLatest,
  take,
  all,
  select,
} from 'redux-saga/effects';

import * as projSaga from './project';

function* watchLog() {
  while (true) {
    const action = yield take('*');
    const state = yield select();
    console.group(action.type);
    console.info('dispatching', action);
    console.log('next state', state);
    console.groupEnd();
  }
}

export default function* rootSaga() {
  yield all([watchLog(),...Object.keys(projSaga).map(k=>projSaga[k]())]);
}
